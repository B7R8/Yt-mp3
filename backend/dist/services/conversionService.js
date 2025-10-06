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
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
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
    /**
     * Download audio from YouTube using yt-dlp
     * Returns path to the downloaded audio file
     */
    async downloadAudio(url, outputPath) {
        return new Promise((resolve, reject) => {
            const ytdlpArgs = [
                '-m', 'yt_dlp',
                '-f', 'bestaudio[ext=m4a]/bestaudio', // Prefer m4a for faster processing
                '--extract-audio',
                '--audio-format', 'mp3',
                '--output', outputPath,
                '--no-playlist',
                '--no-warnings', // Reduce output noise
                '--no-check-certificates', // Skip SSL verification for speed
                '--no-call-home', // Don't check for updates
                '--no-cache-dir', // Don't use cache
                '--socket-timeout', '30', // 30 second socket timeout
                '--extractor-retries', '2', // 2 retries for reliability
                '--fragment-retries', '2', // 2 fragment retries
                '--retries', '3', // 3 total retries
                '--http-chunk-size', '10485760', // 10MB chunks for faster processing
                '--concurrent-fragments', '4', // 4 concurrent fragments
                '--extractor-args', 'youtube:player_client=android', // Use mobile client for faster access
                url
            ];
            logger_1.default.info(`Downloading audio with yt-dlp: ${ytdlpArgs.join(' ')}`);
            const ytdlp = (0, child_process_1.spawn)('python', ytdlpArgs);
            let errorOutput = '';
            let stdOutput = '';
            ytdlp.stdout.on('data', (data) => {
                stdOutput += data.toString();
                logger_1.default.debug(`yt-dlp stdout: ${data}`);
            });
            ytdlp.stderr.on('data', (data) => {
                errorOutput += data.toString();
                logger_1.default.debug(`yt-dlp stderr: ${data}`);
            });
            ytdlp.on('close', async (code) => {
                if (code === 0) {
                    // Check if file was created
                    try {
                        await fs_1.promises.access(outputPath);
                        logger_1.default.info(`Audio downloaded successfully to: ${outputPath}`);
                        resolve(outputPath);
                    }
                    catch (error) {
                        // Log technical error in background
                        logger_1.default.error('Download output file not created:', {
                            outputPath,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            timestamp: new Date().toISOString()
                        });
                        reject(new Error('Download failed. Please try again.'));
                    }
                }
                else {
                    // Log technical error in background
                    logger_1.default.error('yt-dlp download failed:', {
                        code,
                        errorOutput,
                        url,
                        timestamp: new Date().toISOString()
                    });
                    reject(new Error('Unable to download video. Please check the URL and try again.'));
                }
            });
            ytdlp.on('error', (error) => {
                reject(new Error(`yt-dlp process error: ${error.message}`));
            });
        });
    }
    /**
     * Convert time string (HH:mm:ss) to seconds
     */
    timeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(p => parseInt(p, 10));
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        else {
            return parts[0];
        }
    }
    /**
     * Process audio with ffmpeg: trim and set bitrate
     */
    async processAudioWithFFmpeg(inputPath, outputPath, bitrate, startTime, endTime) {
        return new Promise((resolve, reject) => {
            logger_1.default.info(`Processing audio with FFmpeg: input=${inputPath}, output=${outputPath}, bitrate=${bitrate}k`);
            const command = (0, fluent_ffmpeg_1.default)(inputPath);
            // Set start time if provided
            if (startTime) {
                command.setStartTime(startTime);
                logger_1.default.info(`Setting start time: ${startTime}`);
            }
            // Calculate duration if both start and end times are provided
            if (startTime && endTime) {
                const startSeconds = this.timeToSeconds(startTime);
                const endSeconds = this.timeToSeconds(endTime);
                const duration = endSeconds - startSeconds;
                if (duration > 0) {
                    command.setDuration(duration);
                    logger_1.default.info(`Setting duration: ${duration} seconds (${startTime} to ${endTime})`);
                }
            }
            // Set audio bitrate and format with performance optimizations
            command
                .audioBitrate(bitrate)
                .toFormat('mp3')
                .audioCodec('libmp3lame') // Use libmp3lame for better performance
                .audioChannels(2) // Stereo
                .audioFrequency(44100) // Standard sample rate
                .addOption('-threads', '0') // Use all available CPU cores
                .addOption('-preset', 'fast') // Fast encoding preset
                .addOption('-q:a', '2') // High quality audio
                .output(outputPath)
                .on('start', (commandLine) => {
                logger_1.default.info(`FFmpeg command: ${commandLine}`);
            })
                .on('progress', (progress) => {
                logger_1.default.debug(`Processing: ${JSON.stringify(progress)}`);
            })
                .on('end', () => {
                logger_1.default.info(`FFmpeg processing completed: ${outputPath}`);
                resolve();
            })
                .on('error', (error, stdout, stderr) => {
                // Log technical error in background
                logger_1.default.error('FFmpeg processing error:', {
                    error: error.message,
                    stderr,
                    inputPath,
                    outputPath,
                    bitrate,
                    startTime,
                    endTime,
                    timestamp: new Date().toISOString()
                });
                reject(new Error('Audio processing failed. Please try again.'));
            })
                .run();
        });
    }
    async processConversion(jobId, request) {
        let tempAudioPath = null;
        try {
            await this.updateJobStatus(jobId, 'processing');
            const mp3Filename = `${jobId}.mp3`;
            const tempFilename = `${jobId}_temp.mp3`;
            const outputPath = path_1.default.join(this.downloadsDir, mp3Filename);
            tempAudioPath = path_1.default.join(this.downloadsDir, tempFilename);
            // Step 1: Download audio using yt-dlp
            logger_1.default.info(`[Job ${jobId}] Step 1: Downloading audio from ${request.url}`);
            await this.downloadAudio(request.url, tempAudioPath);
            // Step 2: Process with FFmpeg (trim + bitrate)
            const bitrate = request.quality ? parseInt(request.quality.replace('k', '')) : 192;
            if (request.trim_start && request.trim_end) {
                logger_1.default.info(`[Job ${jobId}] Step 2: Processing with FFmpeg (trim: ${request.trim_start} to ${request.trim_end}, bitrate: ${bitrate}k)`);
                await this.processAudioWithFFmpeg(tempAudioPath, outputPath, bitrate, request.trim_start, request.trim_end);
            }
            else {
                logger_1.default.info(`[Job ${jobId}] Step 2: Processing with FFmpeg (bitrate: ${bitrate}k, no trimming)`);
                await this.processAudioWithFFmpeg(tempAudioPath, outputPath, bitrate);
            }
            // Step 3: Cleanup temporary file
            try {
                await fs_1.promises.unlink(tempAudioPath);
                logger_1.default.info(`[Job ${jobId}] Cleaned up temporary file: ${tempAudioPath}`);
            }
            catch (error) {
                logger_1.default.warn(`[Job ${jobId}] Failed to cleanup temp file:`, error);
            }
            // Step 4: Mark as completed
            await this.updateJobStatus(jobId, 'completed', mp3Filename);
            logger_1.default.info(`[Job ${jobId}] Conversion completed successfully`);
        }
        catch (error) {
            logger_1.default.error(`[Job ${jobId}] Conversion failed:`, error);
            // Cleanup temp file on error
            if (tempAudioPath) {
                try {
                    await fs_1.promises.unlink(tempAudioPath);
                }
                catch (cleanupError) {
                    logger_1.default.warn(`[Job ${jobId}] Failed to cleanup temp file on error:`, cleanupError);
                }
            }
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