"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const conversionService_1 = require("../services/conversionService");
const fallbackConversionService_1 = require("../services/fallbackConversionService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = __importDefault(require("../config/logger"));
const errorHandler_1 = require("../services/errorHandler");
// Check which service to use
const { spawn } = require('child_process');
const checkYtDlp = () => {
    return new Promise((resolve) => {
        const ytdlp = spawn('yt-dlp', ['--version']);
        ytdlp.on('close', (code) => {
            resolve(code === 0);
        });
        ytdlp.on('error', () => {
            resolve(false);
        });
    });
};
// Use appropriate service based on yt-dlp availability
let activeService = conversionService_1.conversionService;
checkYtDlp().then((available) => {
    if (!available) {
        activeService = fallbackConversionService_1.fallbackConversionService;
        logger_1.default.warn('⚠️ Using fallback conversion service (yt-dlp not available)');
    }
    else {
        logger_1.default.info('✅ Using full conversion service (yt-dlp available)');
    }
});
const router = express_1.default.Router();
// POST /api/check-url - URL validation with blacklist check
router.post('/check-url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'YouTube URL is required'
            });
        }
        // Enhanced URL validation - supports all YouTube URL formats
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|m\.youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=|gaming\.youtube\.com\/watch\?v=)[\w-]+/;
        if (!youtubeRegex.test(url)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid YouTube URL (supports youtube.com, youtu.be, and all YouTube variants)'
            });
        }
        // Check if video is already being processed
        const videoId = activeService['extractVideoId'](url);
        if (videoId) {
            // Check for existing processing jobs for this video
            const { query } = require('../config/database');
            const existingJobs = await query('SELECT id, status FROM jobs WHERE video_id = $1 AND status IN ($2, $3) AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1', [videoId, 'pending', 'processing']);
            if (existingJobs.rows.length > 0) {
                const existingJob = existingJobs.rows[0];
                return res.json({
                    success: true,
                    isBlacklisted: false,
                    message: 'Video is already being processed',
                    existingJobId: existingJob.id
                });
            }
        }
        res.json({
            success: true,
            isBlacklisted: false,
            message: 'URL is available for conversion'
        });
    }
    catch (error) {
        logger_1.default.error('URL check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check URL'
        });
    }
});
// POST /api/convert - Create conversion job
router.post('/convert', rateLimiter_1.conversionRateLimit, validation_1.validateConversionRequest, async (req, res) => {
    try {
        const request = {
            url: req.body.url,
            quality: req.body.quality || '128k',
            trimStart: req.body.trimStart,
            trimDuration: req.body.trimDuration,
            userId: req.body.userId,
            userIp: req.ip
        };
        logger_1.default.info(`🎵 Creating conversion job for URL: ${request.url}`, {
            quality: request.quality,
            trimStart: request.trimStart,
            trimDuration: request.trimDuration,
            userIp: request.userIp
        });
        const jobId = await activeService.createJob(request);
        logger_1.default.info(`✅ New conversion job created: ${jobId} for URL: ${request.url}`);
        res.status(202).json({
            success: true,
            jobId,
            status: 'pending',
            message: 'Conversion job started successfully'
        });
    }
    catch (error) {
        const userMessage = errorHandler_1.ErrorHandler.getUserFriendlyError(error);
        errorHandler_1.ErrorHandler.logTechnicalError(error, 'CREATE_CONVERSION_JOB', {
            userIp: req.ip,
            operation: 'createJob',
            additionalData: { url: req.body.url, quality: req.body.quality }
        });
        const { statusCode, response } = errorHandler_1.ErrorHandler.createErrorResponse(500, userMessage, error, {
            userIp: req.ip,
            operation: 'createJob'
        });
        res.status(statusCode).json(response);
    }
});
// GET /api/status/:id - Get job status
router.get('/status/:id', rateLimiter_1.statusRateLimit, validation_1.validateJobId, async (req, res) => {
    try {
        const job = await activeService.getJobStatus(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        // Set proper UTF-8 headers for Unicode support
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'utf-8');
        const response = {
            success: true,
            jobId: job.id,
            status: job.status,
            video_title: job.video_title,
            quality: job.quality,
            trim_start: job.trim_start,
            trim_duration: job.trim_duration,
            file_size: job.file_size,
            duration: job.duration,
            error_message: job.error_message,
            created_at: job.created_at,
            updated_at: job.updated_at,
            expires_at: job.expires_at
        };
        // Add download URL if conversion is completed
        if (job.status === 'completed' && job.download_url) {
            response.download_url = job.download_url;
            response.download_filename = `${job.video_title || 'converted'}.mp3`;
            response.download_type = 'server'; // Indicates this is a server-processed file
            // Validate file before providing download URL
            if (job.file_path) {
                const fs = require('fs');
                try {
                    if (fs.existsSync(job.file_path)) {
                        const stats = fs.statSync(job.file_path);
                        response.file_size = stats.size;
                        // More reasonable validation: file should be > 0 bytes and < 1GB
                        response.file_valid = stats.size > 0 && stats.size < 1073741824; // 1GB limit
                        if (!response.file_valid) {
                            if (stats.size <= 0) {
                                logger_1.default.warn(`⚠️ File validation failed for job ${req.params.id}: file is empty (${stats.size} bytes)`);
                            }
                            else if (stats.size >= 1073741824) {
                                logger_1.default.warn(`⚠️ File validation failed for job ${req.params.id}: file too large (${stats.size} bytes)`);
                            }
                        }
                        else {
                            logger_1.default.info(`✅ File validation passed for job ${req.params.id}: ${stats.size} bytes`);
                        }
                    }
                    else {
                        response.file_valid = false;
                        logger_1.default.warn(`⚠️ File not found for completed job ${req.params.id}: ${job.file_path}`);
                    }
                }
                catch (error) {
                    response.file_valid = false;
                    logger_1.default.error(`❌ File validation error for job ${req.params.id}:`, error);
                }
            }
            else {
                // No file path available - mark as invalid
                response.file_valid = false;
                logger_1.default.warn(`⚠️ No file path available for completed job ${req.params.id}`);
            }
        }
        // Add ffmpeg logs if requested by admin (you can add admin check here)
        if (req.query.includeLogs === 'true' && job.ffmpeg_logs) {
            response.ffmpeg_logs = job.ffmpeg_logs;
        }
        res.json(response);
    }
    catch (error) {
        const userMessage = errorHandler_1.ErrorHandler.getUserFriendlyError(error);
        errorHandler_1.ErrorHandler.logTechnicalError(error, 'GET_JOB_STATUS', {
            jobId: req.params.id,
            userIp: req.ip,
            operation: 'getJobStatus'
        });
        const { statusCode, response } = errorHandler_1.ErrorHandler.createErrorResponse(500, userMessage, error, {
            jobId: req.params.id,
            userIp: req.ip,
            operation: 'getJobStatus'
        });
        res.status(statusCode).json(response);
    }
});
// GET /api/download/:id - Download processed file
router.get('/download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const jobId = req.params.id;
        logger_1.default.info(`🎵 Download request for job: ${jobId}`);
        const job = await activeService.getJobStatus(jobId);
        if (!job) {
            logger_1.default.warn(`❌ Job not found: ${jobId}`);
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        if (job.status !== 'completed') {
            logger_1.default.warn(`⏳ Job not completed: ${jobId}, status: ${job.status}`);
            return res.status(400).json({
                success: false,
                message: `Conversion is ${job.status}. Please wait for completion.`
            });
        }
        if (!job.file_path) {
            logger_1.default.error(`❌ File path not found for job: ${jobId}`);
            return res.status(404).json({
                success: false,
                message: 'Processed file not found'
            });
        }
        // Check if file exists and validate it
        const fs = require('fs');
        if (!fs.existsSync(job.file_path)) {
            logger_1.default.error(`❌ File does not exist: ${job.file_path}`);
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }
        // Validate file size and integrity
        const stats = fs.statSync(job.file_path);
        if (stats.size <= 0) {
            logger_1.default.error(`❌ File is empty: ${job.file_path}, size: ${stats.size}`);
            return res.status(400).json({
                success: false,
                message: 'File appears to be empty. Please try converting again.'
            });
        }
        // Validate file size (should be reasonable for an MP3 - between 1 byte and 1GB)
        if (stats.size >= 1073741824) { // 1GB limit
            logger_1.default.error(`❌ File too large: ${job.file_path}, size: ${stats.size} bytes`);
            return res.status(400).json({
                success: false,
                message: 'File appears to be too large. Please try converting again.'
            });
        }
        const filename = `${job.video_title || 'converted'}.mp3`;
        logger_1.default.info(`🎵 Starting download for: ${filename} (${stats.size} bytes)`);
        // Set proper download headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // Stream the file
        const fileStream = fs.createReadStream(job.file_path);
        fileStream.on('end', () => {
            logger_1.default.info(`✅ Download completed successfully for job: ${jobId}`);
        });
        fileStream.on('error', (error) => {
            logger_1.default.error(`❌ File stream error for job ${jobId}:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error reading file'
                });
            }
        });
        fileStream.pipe(res);
    }
    catch (error) {
        const userMessage = errorHandler_1.ErrorHandler.getUserFriendlyError(error);
        errorHandler_1.ErrorHandler.logTechnicalError(error, 'DOWNLOAD_FILE', {
            jobId: req.params.id,
            userIp: req.ip,
            operation: 'downloadFile'
        });
        const { statusCode, response } = errorHandler_1.ErrorHandler.createErrorResponse(500, userMessage, error, {
            jobId: req.params.id,
            userIp: req.ip,
            operation: 'downloadFile'
        });
        res.status(statusCode).json(response);
    }
});
// GET /api/video-info - Get video information
router.get('/video-info', rateLimiter_1.statusRateLimit, async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL parameter is required'
            });
        }
        // Extract video ID
        const videoId = activeService['extractVideoId'](url);
        if (!videoId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid YouTube URL'
            });
        }
        // Get video info using the service
        const videoInfo = await activeService['getVideoInfo'](videoId);
        // Set proper UTF-8 headers for Unicode support
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'utf-8');
        res.json({
            success: true,
            title: videoInfo.title,
            duration: videoInfo.duration,
            durationFormatted: videoInfo.durationFormatted,
            thumbnail: videoInfo.thumbnail,
            uploader: videoInfo.uploader,
            viewCount: videoInfo.viewCount,
            cached: false
        });
    }
    catch (error) {
        const userMessage = errorHandler_1.ErrorHandler.getUserFriendlyError(error);
        errorHandler_1.ErrorHandler.logTechnicalError(error, 'VIDEO_INFO_REQUEST', {
            userIp: req.ip,
            operation: 'getVideoInfo',
            additionalData: { url: req.query.url }
        });
        if (!res.headersSent) {
            const { statusCode, response } = errorHandler_1.ErrorHandler.createErrorResponse(500, userMessage, error, {
                userIp: req.ip,
                operation: 'getVideoInfo'
            });
            res.status(statusCode).json(response);
        }
    }
});
// GET /api/stats - System performance statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await activeService.getStats();
        res.json({
            success: true,
            ...stats,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    }
    catch (error) {
        logger_1.default.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats'
        });
    }
});
// POST /api/cleanup - Manual cleanup trigger
router.post('/cleanup', async (req, res) => {
    try {
        logger_1.default.info('Manual cleanup triggered');
        await activeService.cleanupOldFiles();
        res.json({
            success: true,
            message: 'Cleanup completed successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Manual cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Cleanup failed'
        });
    }
});
// GET /api/debug/files - Debug endpoint to check downloaded files
router.get('/debug/files', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
        let files = [];
        try {
            const fileList = fs.readdirSync(downloadsDir);
            files = fileList.map((filename) => {
                const filePath = path.join(downloadsDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            });
        }
        catch (error) {
            logger_1.default.error('Error reading downloads directory:', error);
        }
        res.json({
            success: true,
            downloads_dir: downloadsDir,
            file_count: files.length,
            files: files
        });
    }
    catch (error) {
        logger_1.default.error('Debug files error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get debug info'
        });
    }
});
exports.default = router;
//# sourceMappingURL=conversion.js.map