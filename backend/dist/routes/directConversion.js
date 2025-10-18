"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const directConversionService_1 = require("../services/directConversionService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = __importDefault(require("../config/logger"));
const errorHandler_1 = require("../utils/errorHandler");
const router = express_1.default.Router();
const conversionService = new directConversionService_1.DirectConversionService();
// POST /api/check-url - URL validation
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
            quality: req.body.quality || '192',
            trimStart: req.body.trimStart,
            trimDuration: req.body.trimDuration,
            userId: req.body.userId,
            userIp: req.ip
        };
        logger_1.default.info(`🎵 Creating direct conversion job for URL: ${request.url}`);
        const jobId = await conversionService.createJob(request);
        logger_1.default.info(`✅ New direct conversion job created: ${jobId} for URL: ${request.url}`);
        res.status(202).json({
            success: true,
            jobId,
            status: 'pending',
            message: 'Conversion job started successfully'
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Create Direct Conversion Job', req);
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
        const response = {
            success: true,
            jobId: job.id,
            status: job.status,
            video_title: job.video_title,
            mp3_filename: job.mp3_filename,
            error_message: job.error_message,
            created_at: job.created_at,
            updated_at: job.updated_at,
            expires_at: job.expires_at
        };
        // Add download URL if conversion is completed
        if (job.status === 'completed' && job.direct_download_url) {
            response.download_url = `/api/download/${job.id}`;
            response.download_filename = job.mp3_filename;
            response.download_type = 'direct';
            response.file_valid = true;
            response.file_size = 0; // Unknown for external URLs
            logger_1.default.info(`🔗 [Job ${job.id}] Status: Direct download URL available`);
        }
        res.json(response);
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Get Job Status', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/download/:id - Direct download from API
router.get('/download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const jobId = req.params.id;
        logger_1.default.info(`🎵 Direct download request for job: ${jobId}`);
        const job = await conversionService.getJobStatus(jobId);
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
        if (!job.direct_download_url) {
            logger_1.default.error(`❌ No direct download URL found for job: ${jobId}`);
            return res.status(404).json({
                success: false,
                message: 'Download URL not available'
            });
        }
        const filename = job.mp3_filename || 'converted.mp3';
        logger_1.default.info(`🎵 Starting direct download for: ${filename}`);
        logger_1.default.info(`🔗 Direct download URL: ${job.direct_download_url}`);
        // Set proper download headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // Check if this is a mock URL (for testing purposes)
        if (job.direct_download_url.includes('example.com')) {
            logger_1.default.error(`❌ Mock URL detected for job: ${jobId} - conversion failed`);
            res.status(500).json({
                success: false,
                message: 'Conversion failed. Please try again.'
            });
            return;
        }
        // Stream the file from the direct API URL
        const https = require('https');
        const url = require('url');
        const parsedUrl = url.parse(job.direct_download_url);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'audio/mpeg, audio/*, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        };
        const proxyReq = https.request(options, (proxyRes) => {
            logger_1.default.info(`📡 Direct API response status: ${proxyRes.statusCode} for job: ${jobId}`);
            // Handle redirects
            if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                logger_1.default.info(`🔄 Following redirect for job: ${jobId}`);
                res.redirect(proxyRes.statusCode, proxyRes.headers.location);
                return;
            }
            if (proxyRes.statusCode === 404) {
                logger_1.default.error(`❌ Direct download URL expired (404) for job: ${jobId}`);
                res.status(404).json({
                    success: false,
                    message: 'Download link has expired. Please try converting again.'
                });
                return;
            }
            if (proxyRes.statusCode !== 200) {
                logger_1.default.error(`❌ Direct download failed with status: ${proxyRes.statusCode} for job: ${jobId}`);
                res.status(proxyRes.statusCode).json({
                    success: false,
                    message: 'Download failed'
                });
                return;
            }
            // Copy relevant headers
            if (proxyRes.headers['content-length']) {
                res.setHeader('Content-Length', proxyRes.headers['content-length']);
            }
            if (proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            // Stream the file
            proxyRes.pipe(res);
            proxyRes.on('end', () => {
                logger_1.default.info(`✅ Direct download completed successfully for job: ${jobId}`);
            });
        });
        proxyReq.on('error', (error) => {
            logger_1.default.error(`❌ Direct download error for job ${jobId}:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Download failed'
                });
            }
        });
        proxyReq.setTimeout(30000, () => {
            logger_1.default.error(`⏰ Direct download timeout for job: ${jobId}`);
            proxyReq.destroy();
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Download timeout'
                });
            }
        });
        proxyReq.end();
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Direct Download File', req);
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
        // Get video info using the direct API service
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
        const stats = await conversionService.getStats();
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
exports.default = router;
//# sourceMappingURL=directConversion.js.map