"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionService = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../config/logger"));
const database_1 = require("../config/database");
class ConversionService {
    constructor() {
        this.downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
        this.ensureDownloadsDir();
    }
    async ensureDownloadsDir() {
        try {
            await fs_1.promises.mkdir(this.downloadsDir, { recursive: true });
        }
        catch (error) {
            logger_1.default.error('Failed to create downloads directory:', error);
        }
    }
    async extractVideoTitle(url) {
        return new Promise((resolve, reject) => {
            const ytdlp = (0, child_process_1.spawn)('python', ['-m', 'yt_dlp',
                '--get-title',
                '--no-playlist',
                url
            ]);
            let title = '';
            let errorOutput = '';
            ytdlp.stdout.on('data', (data) => {
                title += data.toString().trim();
            });
            ytdlp.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            ytdlp.on('close', (code) => {
                if (code === 0 && title) {
                    resolve(title);
                }
                else {
                    logger_1.default.warn(`Failed to extract video title for ${url}: ${errorOutput}`);
                    resolve('Unknown Video'); // Fallback title
                }
            });
            ytdlp.on('error', (error) => {
                logger_1.default.error(`Error extracting video title for ${url}:`, error);
                resolve('Unknown Video'); // Fallback title
            });
        });
    }
    async createJob(request) {
        const jobId = (0, uuid_1.v4)();
        const database = await database_1.db;
        try {
            // First, extract video title using yt-dlp
            const videoTitle = await this.extractVideoTitle(request.url);
            await database.run(`INSERT INTO conversions (id, youtube_url, video_title, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`, [jobId, request.url, videoTitle]);
            // Start conversion process asynchronously
            this.processConversion(jobId, request).catch(error => {
                logger_1.default.error(`Conversion failed for job ${jobId}:`, error);
                this.updateJobStatus(jobId, 'failed', undefined, error.message);
            });
            return jobId;
        }
        catch (error) {
            logger_1.default.error('Failed to create conversion job:', error);
            throw error;
        }
    }
    async getJobStatus(jobId) {
        const database = await database_1.db;
        try {
            const result = await database.get('SELECT * FROM conversions WHERE id = ?', [jobId]);
            if (!result) {
                return null;
            }
            return {
                id: result.id,
                youtube_url: result.youtube_url,
                video_title: result.video_title,
                status: result.status,
                mp3_filename: result.mp3_filename,
                error_message: result.error_message,
                created_at: new Date(result.created_at),
                updated_at: new Date(result.updated_at)
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get job status:', error);
            throw error;
        }
    }
    async updateJobStatus(jobId, status, mp3Filename, errorMessage) {
        const database = await database_1.db;
        try {
            await database.run(`UPDATE conversions 
         SET status = ?, mp3_filename = ?, error_message = ?, updated_at = datetime('now') 
         WHERE id = ?`, [status, mp3Filename, errorMessage, jobId]);
        }
        catch (error) {
            logger_1.default.error('Failed to update job status:', error);
            throw error;
        }
    }
    async processConversion(jobId, request) {
        try {
            await this.updateJobStatus(jobId, 'processing');
            const mp3Filename = `${jobId}.mp3`;
            const outputPath = path_1.default.join(this.downloadsDir, mp3Filename);
            // Use yt-dlp to extract audio and convert to MP3
            const ytdlpArgs = [
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', request.quality || '192k',
                '--output', outputPath.replace('.mp3', '.%(ext)s'),
                request.url
            ];
            // Add trim options if provided
            if (request.trim_start && request.trim_end) {
                ytdlpArgs.push('--postprocessor-args', `ffmpeg:-ss ${request.trim_start} -to ${request.trim_end}`);
            }
            logger_1.default.info(`Starting conversion for job ${jobId} with args:`, ytdlpArgs);
            const ytdlp = (0, child_process_1.spawn)('python', ['-m', 'yt_dlp', ...ytdlpArgs]);
            let errorOutput = '';
            ytdlp.stderr.on('data', (data) => {
                errorOutput += data.toString();
                logger_1.default.debug(`yt-dlp stderr: ${data}`);
            });
            ytdlp.on('close', async (code) => {
                if (code === 0) {
                    // Check if file was created successfully
                    try {
                        await fs_1.promises.access(outputPath);
                        await this.updateJobStatus(jobId, 'completed', mp3Filename);
                        logger_1.default.info(`Conversion completed successfully for job ${jobId}`);
                    }
                    catch (error) {
                        logger_1.default.error(`Output file not found for job ${jobId}:`, error);
                        await this.updateJobStatus(jobId, 'failed', undefined, 'Output file not created');
                    }
                }
                else {
                    logger_1.default.error(`yt-dlp process exited with code ${code}:`, errorOutput);
                    await this.updateJobStatus(jobId, 'failed', undefined, `Conversion failed: ${errorOutput}`);
                }
            });
            ytdlp.on('error', async (error) => {
                logger_1.default.error(`yt-dlp process error for job ${jobId}:`, error);
                await this.updateJobStatus(jobId, 'failed', undefined, `Process error: ${error instanceof Error ? error.message : 'Unknown process error'}`);
            });
        }
        catch (error) {
            logger_1.default.error(`Conversion process error for job ${jobId}:`, error);
            await this.updateJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
        }
    }
    async getJobFilePath(jobId) {
        const job = await this.getJobStatus(jobId);
        if (!job || job.status !== 'completed' || !job.mp3_filename) {
            return null;
        }
        const filePath = path_1.default.join(this.downloadsDir, job.mp3_filename);
        try {
            await fs_1.promises.access(filePath);
            return filePath;
        }
        catch (error) {
            logger_1.default.error(`File not found for job ${jobId}:`, error);
            return null;
        }
    }
    async cleanupOldFiles() {
        const maxAgeHours = parseInt(process.env.MAX_FILE_AGE_HOURS || '1');
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        const cutoffTime = new Date(Date.now() - maxAgeMs);
        const database = await database_1.db;
        try {
            // Get old completed jobs
            const result = await database.all(`SELECT id, mp3_filename FROM conversions 
         WHERE status = 'completed' AND created_at < ?`, [cutoffTime.toISOString()]);
            for (const row of result) {
                if (row.mp3_filename) {
                    const filePath = path_1.default.join(this.downloadsDir, row.mp3_filename);
                    try {
                        await fs_1.promises.unlink(filePath);
                        logger_1.default.info(`Deleted old file: ${filePath}`);
                    }
                    catch (error) {
                        logger_1.default.warn(`Failed to delete file ${filePath}:`, error);
                    }
                }
                // Mark job as cleaned up
                await database.run('UPDATE conversions SET status = ? WHERE id = ?', ['cleaned', row.id]);
            }
            logger_1.default.info(`Cleanup completed. Processed ${result.length} old jobs.`);
        }
        catch (error) {
            logger_1.default.error('Cleanup failed:', error);
        }
    }
}
exports.ConversionService = ConversionService;
//# sourceMappingURL=conversionService.js.map