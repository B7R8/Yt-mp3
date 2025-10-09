"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const streamingService_1 = require("../services/streamingService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = __importDefault(require("../config/logger"));
const errorHandler_1 = require("../utils/errorHandler");
const router = express_1.default.Router();
const streamingService = new streamingService_1.StreamingService();
// POST /api/stream-convert - Direct streaming conversion (YouTube -> FFmpeg -> Response)
router.post('/stream-convert', rateLimiter_1.conversionRateLimit, validation_1.validateConversionRequest, async (req, res) => {
    try {
        const request = {
            url: req.body.url,
            quality: req.body.quality || '192k',
            trim: req.body.trim ? {
                start: req.body.trim.start,
                end: req.body.trim.end
            } : undefined
        };
        logger_1.default.info(`Starting direct streaming conversion for URL: ${request.url}, quality: ${request.quality}`);
        // Stream audio directly to client using the piping pipeline
        const result = await streamingService.streamAudioToClient(request.url, res, request);
        // If we get here, the streaming completed successfully
        // The response has already been sent to the client
        if (result.message) {
            logger_1.default.info(`Streaming completed with message: ${result.message}`);
        }
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Direct Streaming Conversion', req);
        if (!res.headersSent) {
            (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
        }
        else {
            logger_1.default.error('Error occurred after response headers were sent:', error);
        }
    }
});
// POST /api/stream-info - Get conversion info before streaming
router.post('/stream-info', rateLimiter_1.conversionRateLimit, validation_1.validateConversionRequest, async (req, res) => {
    try {
        const request = {
            url: req.body.url,
            quality: req.body.quality || '192k',
            trim: req.body.trim ? {
                start: req.body.trim.start,
                end: req.body.trim.end
            } : undefined
        };
        logger_1.default.info(`Getting streaming info for URL: ${request.url}`);
        // Get video metadata
        const metadata = await streamingService.getVideoMetadata(request.url);
        // Determine quality based on video duration
        const isLongVideo = metadata.duration > (3 * 60 * 60); // 3 hours
        const finalQuality = isLongVideo ? '128k' : request.quality;
        const message = isLongVideo ?
            'Note: For videos longer than 3 hours, audio quality is automatically set to 128k for faster processing.' :
            undefined;
        // Create job record for tracking
        const jobId = await streamingService.createJob(request);
        res.json({
            success: true,
            jobId,
            metadata: {
                title: metadata.title,
                duration: metadata.duration,
                durationFormatted: metadata.durationFormatted
            },
            quality: finalQuality,
            message,
            streamingUrl: `/api/stream-convert`
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Get Streaming Info', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/stream-status/:id - Get streaming job status
router.get('/stream-status/:id', async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await streamingService.getJobStatus(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        res.json({
            success: true,
            jobId: job.id,
            status: job.status,
            video_title: job.video_title,
            error_message: job.error_message,
            created_at: job.created_at,
            updated_at: job.updated_at
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Get Streaming Job Status', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
exports.default = router;
//# sourceMappingURL=streaming.js.map