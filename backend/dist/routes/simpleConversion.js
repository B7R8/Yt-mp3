"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const simpleConversionService_1 = require("../services/simpleConversionService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = __importDefault(require("../config/logger"));
const errorHandler_1 = require("../utils/errorHandler");
const crypto_1 = __importDefault(require("crypto"));
const optimizedDatabase_1 = require("../config/optimizedDatabase");
const router = express_1.default.Router();
const conversionService = new simpleConversionService_1.SimpleConversionService();
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
        // Enhanced URL validation
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/;
        if (!youtubeRegex.test(url)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid YouTube URL'
            });
        }
        // Check cache first for blacklist status
        const urlHash = crypto_1.default.createHash('sha256').update(url).digest('hex');
        const cached = await optimizedDatabase_1.optimizedDb.get('SELECT reason, type FROM blacklist WHERE value = ? OR value = ?', [url, urlHash]);
        if (cached) {
            return res.json({
                success: false,
                isBlacklisted: true,
                message: cached.reason || 'This content is not available for conversion',
                type: cached.type || 'Content'
            });
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
        const jobId = await conversionService.createJob(req.body);
        logger_1.default.info(`New conversion job created: ${jobId} for URL: ${req.body.url}`);
        res.status(202).json({
            success: true,
            jobId,
            status: 'pending',
            message: 'Conversion job started successfully'
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Create Conversion Job', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/status/:id - Get job status
router.get('/status/:id', rateLimiter_1.statusRateLimit, validation_1.validateJobId, async (req, res) => {
    try {
        const job = await conversionService.getJobStatus(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        // Set proper UTF-8 headers for Unicode support
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'utf-8');
        res.json({
            success: true,
            jobId: job.id,
            status: job.status,
            video_title: job.video_title,
            mp3_filename: job.mp3_filename,
            error_message: job.error_message,
            quality_message: job.quality_message,
            created_at: job.created_at,
            updated_at: job.updated_at
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Get Job Status', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/download/:id - Download converted file
router.get('/download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const filePath = await conversionService.getJobFilePath(req.params.id);
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: 'File not found or conversion not completed'
            });
        }
        const job = await conversionService.getJobStatus(req.params.id);
        const filename = job?.mp3_filename || 'converted.mp3';
        // Set proper headers for direct audio download with caching
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Download-Options', 'noopen');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        // Stream the file with proper error handling
        const fs = require('fs');
        const fileStream = fs.createReadStream(filePath);
        // Set content length for proper download
        const stats = fs.statSync(filePath);
        res.setHeader('Content-Length', stats.size);
        fileStream.on('error', (error) => {
            logger_1.default.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'File stream error'
                });
            }
        });
        fileStream.on('end', () => {
            logger_1.default.info(`File ${filename} sent successfully`);
        });
        fileStream.pipe(res);
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Download File', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
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
        // Get video info using the new API service
        const videoInfo = await conversionService.getVideoInfo(url);
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
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Video Info Request', req);
        if (!res.headersSent) {
            (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
        }
    }
});
// GET /api/stats - System performance statistics
router.get('/stats', async (req, res) => {
    try {
        const dbStats = optimizedDatabase_1.optimizedDb.getPoolStats();
        res.json({
            success: true,
            database: dbStats,
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
// POST /api/batch-convert - Batch conversion for multiple URLs
router.post('/batch-convert', rateLimiter_1.conversionRateLimit, async (req, res) => {
    try {
        const { urls, quality } = req.body;
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'URLs array is required'
            });
        }
        if (urls.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 URLs allowed per batch'
            });
        }
        const jobIds = [];
        // Process URLs in parallel
        const promises = urls.map(async (url) => {
            try {
                const jobId = await conversionService.createJob({
                    url,
                    quality: quality || '192k'
                });
                return { success: true, url, jobId };
            }
            catch (error) {
                return { success: false, url, error: error instanceof Error ? error.message : String(error) };
            }
        });
        const results = await Promise.all(promises);
        res.json({
            success: true,
            results,
            message: `Batch conversion started for ${results.length} URLs`
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Batch Convert', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
exports.default = router;
//# sourceMappingURL=simpleConversion.js.map