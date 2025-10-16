import express, { Request, Response } from 'express';
import { SimpleConversionService } from '../services/simpleConversionService';
import { validateConversionRequest, validateJobId } from '../middleware/validation';
import { conversionRateLimit, statusRateLimit } from '../middleware/rateLimiter';
import logger from '../config/logger';
import { getUserFriendlyError, logTechnicalError, sendErrorResponse } from '../utils/errorHandler';
import crypto from 'crypto';
import { optimizedDb } from '../config/optimizedDatabase';

const router = express.Router();
const conversionService = new SimpleConversionService();

// POST /api/check-url - URL validation with blacklist check
router.post('/check-url', async (req: Request, res: Response) => {
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
    const urlHash = crypto.createHash('sha256').update(url).digest('hex');
    const cached = await optimizedDb.get(
      'SELECT reason, type FROM blacklist WHERE value = ? OR value = ?',
      [url, urlHash]
    );

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
  } catch (error) {
    logger.error('URL check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check URL' 
    });
  }
});

// POST /api/convert - Create conversion job
router.post('/convert', conversionRateLimit, validateConversionRequest, async (req: Request, res: Response) => {
  try {
    const jobId = await conversionService.createJob(req.body);
    
    logger.info(`New conversion job created: ${jobId} for URL: ${req.body.url}`);
    
    res.status(202).json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Conversion job started successfully'
    });
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Create Conversion Job', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

// GET /api/status/:id - Get job status
router.get('/status/:id', statusRateLimit, validateJobId, async (req: Request, res: Response) => {
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
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Get Job Status', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

// GET /api/download/:id - Download converted file
router.get('/download/:id', validateJobId, async (req: Request, res: Response) => {
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
    
    fileStream.on('error', (error: any) => {
      logger.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'File stream error'
        });
      }
    });
    
    fileStream.on('end', () => {
      logger.info(`File ${filename} sent successfully`);
    });
    
    fileStream.pipe(res);
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Download File', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

// GET /api/video-info - Get video information
router.get('/video-info', statusRateLimit, async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    
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
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Video Info Request', req);
    if (!res.headersSent) {
      sendErrorResponse(res, 500, userMessage, error);
    }
  }
});

// GET /api/stats - System performance statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const dbStats = optimizedDb.getPoolStats();
    
    res.json({
      success: true,
      database: dbStats,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    logger.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

// POST /api/batch-convert - Batch conversion for multiple URLs
router.post('/batch-convert', conversionRateLimit, async (req: Request, res: Response) => {
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

    const jobIds: string[] = [];
    
    // Process URLs in parallel
    const promises = urls.map(async (url: string) => {
      try {
        const jobId = await conversionService.createJob({
          url,
          quality: quality || '192k'
        });
        return { success: true, url, jobId };
      } catch (error) {
        return { success: false, url, error: error instanceof Error ? error.message : String(error) };
      }
    });

    const results = await Promise.all(promises);
    
    res.json({
      success: true,
      results,
      message: `Batch conversion started for ${results.length} URLs`
    });
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Batch Convert', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

export default router;
