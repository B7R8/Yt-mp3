"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectConversionService = void 0;
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../config/logger"));
const database_1 = require("../config/database");
const directApiService_1 = require("./directApiService");
class DirectConversionService {
    constructor() {
        this.apiService = new directApiService_1.DirectApiService();
    }
    /**
     * Extract video ID from YouTube URL (private method)
     */
    extractVideoIdPrivate(url) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }
    /**
     * Create a new conversion job
     */
    async createJob(request) {
        const jobId = (0, uuid_1.v4)();
        const videoId = this.extractVideoIdPrivate(request.url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }
        logger_1.default.info(`🎵 Creating direct conversion job: ${jobId} for video: ${videoId}`);
        try {
            // Get video information first
            const videoInfo = await this.apiService.getVideoInfo(request.url);
            // Create job in database
            await (0, database_1.query)(`INSERT INTO conversions (
          id, youtube_url, video_title, status, quality, 
          mp3_filename, created_at, updated_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                jobId,
                request.url,
                videoInfo.title,
                'pending',
                request.quality || '128k',
                `${videoInfo.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.mp3`,
                new Date(),
                new Date(),
                new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            ]);
            // Start processing immediately
            this.processConversion(jobId, request).catch(error => {
                logger_1.default.error(`❌ Error processing job ${jobId}:`, error);
            });
            return jobId;
        }
        catch (error) {
            logger_1.default.error(`❌ Failed to create job ${jobId}:`, error);
            throw error;
        }
    }
    /**
     * Process the conversion using direct API
     */
    async processConversion(jobId, request) {
        try {
            logger_1.default.info(`🔄 Processing direct conversion job: ${jobId}`);
            // Update job status to processing
            await (0, database_1.query)('UPDATE conversions SET status = $1, updated_at = $2 WHERE id = $3', ['processing', new Date(), jobId]);
            // Convert using direct API
            const conversionResult = await this.apiService.convertToMp3(request.url, request.quality || '192');
            if (!conversionResult.success) {
                throw new Error(conversionResult.error || 'Conversion failed');
            }
            // Update job with direct download URL
            await (0, database_1.query)(`UPDATE conversions SET 
          status = $1, 
          direct_download_url = $2,
          updated_at = $3
        WHERE id = $4`, [
                'completed',
                conversionResult.downloadUrl,
                new Date(),
                jobId
            ]);
            logger_1.default.info(`🎉 Direct conversion completed successfully: ${jobId}`);
        }
        catch (error) {
            logger_1.default.error(`❌ Direct conversion failed for job ${jobId}:`, error);
            // Update job status to failed
            await (0, database_1.query)('UPDATE conversions SET status = $1, error_message = $2, updated_at = $3 WHERE id = $4', ['failed', error instanceof Error ? error.message : String(error), new Date(), jobId]);
        }
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId) {
        try {
            const result = await (0, database_1.query)('SELECT * FROM conversions WHERE id = $1', [jobId]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                youtube_url: row.youtube_url,
                video_title: row.video_title,
                status: row.status,
                quality: row.quality,
                mp3_filename: row.mp3_filename,
                direct_download_url: row.direct_download_url,
                error_message: row.error_message,
                created_at: row.created_at,
                updated_at: row.updated_at,
                expires_at: row.expires_at
            };
        }
        catch (error) {
            logger_1.default.error(`❌ Error getting job status for ${jobId}:`, error);
            return null;
        }
    }
    /**
     * Get video information
     */
    async getVideoInfo(url) {
        return await this.apiService.getVideoInfo(url);
    }
    /**
     * Extract video ID (public method)
     */
    extractVideoId(url) {
        return this.extractVideoIdPrivate(url);
    }
    /**
     * Cleanup old files (no-op for direct API)
     */
    async cleanupOldFiles() {
        logger_1.default.info('🧹 Direct API service - no local files to cleanup');
    }
    /**
     * Get system stats
     */
    async getStats() {
        try {
            const result = await (0, database_1.query)(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_jobs
        FROM conversions 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
            return {
                totalJobs: parseInt(result.rows[0].total_jobs),
                completedJobs: parseInt(result.rows[0].completed_jobs),
                failedJobs: parseInt(result.rows[0].failed_jobs),
                processingJobs: parseInt(result.rows[0].processing_jobs)
            };
        }
        catch (error) {
            logger_1.default.error('❌ Error getting stats:', error);
            return {
                totalJobs: 0,
                completedJobs: 0,
                failedJobs: 0,
                processingJobs: 0
            };
        }
    }
    /**
     * Refresh download URL (no-op for direct API)
     */
    async refreshDownloadUrl(jobId) {
        logger_1.default.info(`🔄 Refresh download URL requested for job ${jobId} - not supported for direct API`);
        return null;
    }
}
exports.DirectConversionService = DirectConversionService;
//# sourceMappingURL=directConversionService.js.map