import express from 'express';
import rateLimit from 'express-rate-limit';
import { processAudio, downloadAudio, getJobStatus } from '../controllers/processAudio';
import logger from '../config/logger';

const router = express.Router();

// Rate limiting for process endpoint (more restrictive)
const processRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many processing requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for process endpoint', {
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
const downloadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 download requests per windowMs
  message: {
    success: false,
    message: 'Too many download requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for download endpoint', {
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
const statusRateLimit = rateLimit({
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
const validateProcessRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
router.post('/process', processRateLimit, validateProcessRequest, processAudio);

/**
 * GET /api/download/:token
 * Download processed audio file
 */
router.get('/download/:token', downloadRateLimit, downloadAudio);

/**
 * GET /api/job/:jobId
 * Get job status
 */
router.get('/job/:jobId', statusRateLimit, getJobStatus);

// Health check for audio processing service
router.get('/process/health', (req, res) => {
  res.json({
    success: true,
    message: 'Audio processing service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
