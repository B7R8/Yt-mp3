"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleConversionService = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../config/logger"));
const optimizedDatabase_1 = require("../config/optimizedDatabase");
const errorHandler_1 = require("../utils/errorHandler");
const youtubeMp3ApiService_1 = require("./youtubeMp3ApiService");
class SimpleConversionService {
    constructor() {
        this.downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
        this.apiService = new youtubeMp3ApiService_1.YouTubeMp3ApiService();
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
    /**
     * Check if URL is blacklisted
     */
    async checkBlacklist(url) {
        try {
            const database = await optimizedDatabase_1.optimizedDb;
            const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            // Check for exact URL match
            const urlMatch = await database.get('SELECT reason FROM blacklist WHERE type = ? AND value = ?', ['url', url]);
            if (urlMatch) {
                return {
                    isBlacklisted: true,
                    reason: urlMatch.reason || 'This URL has been blocked by the content owner or administrator',
                    type: 'URL'
                };
            }
            // Check for video ID match
            if (videoId) {
                const videoIdMatch = await database.get('SELECT reason FROM blacklist WHERE type = ? AND value = ?', ['video_id', videoId]);
                if (videoIdMatch) {
                    return {
                        isBlacklisted: true,
                        reason: videoIdMatch.reason || 'This video has been blocked by the content owner or administrator',
                        type: 'Video'
                    };
                }
            }
            return { isBlacklisted: false };
        }
        catch (error) {
            logger_1.default.error('Error checking blacklist:', error);
            return { isBlacklisted: false };
        }
    }
    /**
     * Create a new conversion job
     */
    async createJob(request) {
        const jobId = (0, uuid_1.v4)();
        const database = await optimizedDatabase_1.optimizedDb;
        try {
            // Validate YouTube URL
            if (!this.apiService.isValidYouTubeUrl(request.url)) {
                throw new Error('Invalid YouTube URL format');
            }
            // Check if URL is blacklisted
            const blacklistResult = await this.checkBlacklist(request.url);
            if (blacklistResult.isBlacklisted) {
                throw new Error(blacklistResult.reason || 'This content is not available for conversion');
            }
            // Get video info for job creation
            const videoInfo = await this.apiService.getVideoInfo(request.url);
            await database.run(`INSERT INTO conversions (id, youtube_url, video_title, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`, [jobId, request.url, videoInfo.title]);
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
    /**
     * Process conversion using YouTube MP3 API
     */
    async processConversion(jobId, request) {
        try {
            await this.updateJobStatus(jobId, 'processing');
            logger_1.default.info(`[Job ${jobId}] Starting conversion for URL: ${request.url}`);
            // Convert using YouTube MP3 API
            const result = await this.apiService.convertToMp3(request.url, request.quality || '192k');
            if (!result.success) {
                throw new Error(result.error || 'Conversion failed');
            }
            // Generate filename
            const filename = `${result.title?.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_') || 'converted'}.mp3`;
            const filePath = path_1.default.join(this.downloadsDir, filename);
            // Move the downloaded file to the correct location if needed
            // (The API service already downloads to the correct location)
            // Mark as completed
            await this.updateJobStatus(jobId, 'completed', filename);
            logger_1.default.info(`[Job ${jobId}] Conversion completed successfully: ${filename}`);
        }
        catch (error) {
            (0, errorHandler_1.logTechnicalError)(error, `Conversion Job ${jobId}`);
            logger_1.default.error(`[Job ${jobId}] Conversion failed:`, error);
            const userFriendlyError = (0, errorHandler_1.getUserFriendlyError)(error);
            await this.updateJobStatus(jobId, 'failed', undefined, userFriendlyError);
        }
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId) {
        const database = await optimizedDatabase_1.optimizedDb;
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
                quality_message: result.quality_message,
                created_at: new Date(result.created_at),
                updated_at: new Date(result.updated_at)
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get job status:', error);
            throw error;
        }
    }
    /**
     * Update job status
     */
    async updateJobStatus(jobId, status, mp3Filename, errorMessage, qualityMessage) {
        const database = await optimizedDatabase_1.optimizedDb;
        try {
            await database.run(`UPDATE conversions 
         SET status = ?, mp3_filename = ?, error_message = ?, quality_message = ?, updated_at = datetime('now') 
         WHERE id = ?`, [status, mp3Filename, errorMessage, qualityMessage, jobId]);
        }
        catch (error) {
            logger_1.default.error('Failed to update job status:', error);
            throw error;
        }
    }
    /**
     * Get job file path
     */
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
    /**
     * Get video information
     */
    async getVideoInfo(url) {
        if (!this.apiService.isValidYouTubeUrl(url)) {
            throw new Error('Invalid YouTube URL format');
        }
        return await this.apiService.getVideoInfo(url);
    }
    /**
     * Cleanup old files
     */
    async cleanupOldFiles() {
        const maxAgeHours = parseInt(process.env.MAX_FILE_AGE_HOURS || '1');
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        const cutoffTime = new Date(Date.now() - maxAgeMs);
        const database = await optimizedDatabase_1.optimizedDb;
        try {
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
                await database.run('UPDATE conversions SET status = ? WHERE id = ?', ['cleaned', row.id]);
            }
            logger_1.default.info(`Cleanup completed. Processed ${result.length} old jobs.`);
        }
        catch (error) {
            logger_1.default.error('Cleanup failed:', error);
        }
    }
}
exports.SimpleConversionService = SimpleConversionService;
//# sourceMappingURL=simpleConversionService.js.map