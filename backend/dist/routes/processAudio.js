"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const processAudio_1 = require("../controllers/processAudio");
const logger_1 = __importDefault(require("../config/logger"));
const router = express_1.default.Router();
// Rate limiting for process endpoint (more restrictive)
const processRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: {
        success: false,
        message: 'Too many processing requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('Rate limit exceeded for process endpoint', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            success: false,
            message: 'Too many processing requests, please try again later.'
        });
    }
});
// Rate limiting for download endpoint (less restrictive)
const downloadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // Limit each IP to 50 download requests per windowMs
    message: {
        success: false,
        message: 'Too many download requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn('Rate limit exceeded for download endpoint', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.status(429).json({
            success: false,
            message: 'Too many download requests, please try again later.'
        });
    }
});
// Rate limiting for job status endpoint
const statusRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 status requests per windowMs
    message: {
        success: false,
        message: 'Too many status requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
// Validation middleware
const validateProcessRequest = (req, res, next) => {
    const { sourceUrl, action, trim, bitrate, expireMinutes } = req.body;
    // Basic validation
    if (!sourceUrl || typeof sourceUrl !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'sourceUrl is required and must be a string'
        });
    }
    if (!action || !['trim', 'reencode', 'none'].includes(action)) {
        return res.status(400).json({
            success: false,
            message: 'action is required and must be one of: trim, reencode, none'
        });
    }
    // Validate trim parameters if provided
    if (trim) {
        if (typeof trim !== 'object' ||
            typeof trim.start !== 'number' ||
            typeof trim.duration !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'trim must be an object with start and duration numbers'
            });
        }
    }
    // Validate bitrate if provided
    if (bitrate && ![64, 128, 192, 256, 320].includes(bitrate)) {
        return res.status(400).json({
            success: false,
            message: 'bitrate must be one of: 64, 128, 192, 256, 320'
        });
    }
    // Validate expireMinutes if provided
    if (expireMinutes && (typeof expireMinutes !== 'number' || expireMinutes < 1 || expireMinutes > 1440)) {
        return res.status(400).json({
            success: false,
            message: 'expireMinutes must be a number between 1 and 1440'
        });
    }
    next();
};
// Routes
/**
 * POST /api/process
 * Process audio file from URL
 */
router.post('/process', processRateLimit, validateProcessRequest, processAudio_1.processAudio);
/**
 * GET /api/download/:token
 * Download processed audio file
 */
router.get('/download/:token', downloadRateLimit, processAudio_1.downloadAudio);
/**
 * GET /api/job/:jobId
 * Get job status
 */
router.get('/job/:jobId', statusRateLimit, processAudio_1.getJobStatus);
// Health check for audio processing service
router.get('/process/health', (req, res) => {
    res.json({
        success: true,
        message: 'Audio processing service is healthy',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=processAudio.js.map