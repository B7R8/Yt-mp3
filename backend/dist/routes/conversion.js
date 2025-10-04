"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const conversionService_1 = require("../services/conversionService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = __importDefault(require("../config/logger"));
const router = express_1.default.Router();
const conversionService = new conversionService_1.ConversionService();
// POST /api/convert - Start a new conversion
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
        logger_1.default.error('Failed to create conversion job:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start conversion job'
        });
    }
});
// GET /api/status/:id - Get conversion job status
router.get('/status/:id', rateLimiter_1.statusRateLimit, validation_1.validateJobId, async (req, res) => {
    try {
        const job = await conversionService.getJobStatus(req.params.id);
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
            mp3_filename: job.mp3_filename,
            error_message: job.error_message,
            created_at: job.created_at,
            updated_at: job.updated_at
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get job status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get job status'
        });
    }
});
// GET /api/download/:id - Download the converted MP3 file
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
        res.download(filePath, filename, (error) => {
            if (error) {
                logger_1.default.error('Download error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Download failed'
                    });
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Download request failed:', error);
        res.status(500).json({
            success: false,
            message: 'Download request failed'
        });
    }
});
exports.default = router;
//# sourceMappingURL=conversion.js.map