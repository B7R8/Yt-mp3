import express, { Request, Response } from 'express';
import { rapidApiConversionService, ConversionRequest, IConversionService } from '../services/rapidApiConversionService';
import { validateConversionRequest, validateJobId } from '../middleware/validation';
import { conversionRateLimit, statusRateLimit } from '../middleware/rateLimiter';
import logger from '../config/logger';
import { ErrorHandler } from '../services/errorHandler';

// Use RapidAPI-only service
const activeService: IConversionService = rapidApiConversionService;
logger.info('✅ Using RapidAPI-only conversion service');

const router = express.Router();

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
      const existingJobs = await query(
        'SELECT id, status, download_url, completed_at FROM videos WHERE video_id = $1 ORDER BY requested_at DESC LIMIT 1',
        [videoId]
      );
      
      if (existingJobs.rows.length > 0) {
        const existingJob = existingJobs.rows[0];
        if (existingJob.status === 'processing') {
          return res.json({
            success: true,
            isBlacklisted: false,
            message: 'Video is already being processed',
            existingJobId: existingJob.id
          });
        }
        if (existingJob.status === 'done' && existingJob.download_url) {
          return res.json({
            success: true,
            isBlacklisted: false,
            message: 'Video already converted',
            existingJobId: existingJob.id,
            downloadUrl: existingJob.download_url
          });
        }
      }
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
    const request: ConversionRequest = {
      url: req.body.url,
      quality: req.body.quality || '128k',
      trimStart: req.body.trimStart,
      trimDuration: req.body.trimDuration,
      userId: req.body.userId,
      userIp: req.ip
    };

    logger.info(`🎵 Creating conversion job for URL: ${request.url}`, {
      quality: request.quality,
      trimStart: request.trimStart,
      trimDuration: request.trimDuration,
      userIp: request.userIp
    });

    const jobId = await activeService.createJob(request);
    
    logger.info(`✅ New conversion job created: ${jobId} for URL: ${request.url}`);
    
    // Get the job details to return current status
    const job = await activeService.getJobStatus(jobId);
    
    res.status(202).json({
      success: true,
      id: jobId,
      status: job?.status || 'pending',
      title: job?.title || 'Fetching title...',
      message: 'Conversion job started successfully'
    });
  } catch (error) {
    const userMessage = ErrorHandler.getUserFriendlyError(error);
    ErrorHandler.logTechnicalError(error, 'CREATE_CONVERSION_JOB', {
      userIp: req.ip,
      operation: 'createJob',
      additionalData: { url: req.body.url, quality: req.body.quality }
    });
    
    const { statusCode, response } = ErrorHandler.createErrorResponse(500, userMessage, error, {
      userIp: req.ip,
      operation: 'createJob'
    });
    res.status(statusCode).json(response);
  }
});

// GET /api/status/:id - Get job status
router.get('/status/:id', statusRateLimit, validateJobId, async (req: Request, res: Response) => {
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
    
    const response: any = {
      success: true,
      jobId: job.id,
      status: job.status,
      video_title: job.title,
      quality: job.quality,
      file_size: job.file_size,
      duration: job.duration,
      error_message: job.error_message,
      created_at: job.requested_at,
      updated_at: job.updated_at,
      expires_at: job.expires_at
    };

    // Add download URL if conversion is completed
    logger.info(`🔍 [Job ${job.id}] Status check: status=${job.status}, download_url=${job.download_url}`);
    
    if (job.status === 'done') {
      if (job.download_url) {
        // Direct download URL from RapidAPI
        response.download_url = job.download_url;
        response.download_filename = `${job.title || 'converted'}.mp3`;
        response.download_type = 'direct'; // Indicates this is a direct download
        response.file_valid = true;
        response.file_size = job.file_size || 0;
        logger.info(`🔗 [Job ${job.id}] Status: Direct download URL available`);
        logger.info(`🔗 [Job ${job.id}] Status Response: download_url=${response.download_url}, file_valid=${response.file_valid}`);
      } else {
        logger.warn(`⚠️ [Job ${job.id}] Status: Completed but no download URL available`);
      }
    }

    // No ffmpeg logs in RapidAPI-only mode

    res.json(response);
  } catch (error) {
    const userMessage = ErrorHandler.getUserFriendlyError(error);
    ErrorHandler.logTechnicalError(error, 'GET_JOB_STATUS', {
      jobId: req.params.id,
      userIp: req.ip,
      operation: 'getJobStatus'
    });
    
    const { statusCode, response } = ErrorHandler.createErrorResponse(500, userMessage, error, {
      jobId: req.params.id,
      userIp: req.ip,
      operation: 'getJobStatus'
    });
    res.status(statusCode).json(response);
  }
});

// GET /api/download/:id - Redirect to direct download URL
router.get('/download/:id', validateJobId, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    logger.info(`🎵 Download request for job: ${jobId}`);
    
    const job = await activeService.getJobStatus(jobId);
    if (!job) {
      logger.warn(`❌ Job not found: ${jobId}`);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (job.status !== 'done') {
      logger.warn(`⏳ Job not completed: ${jobId}, status: ${job.status}`);
      return res.status(400).json({
        success: false,
        message: `Conversion is ${job.status}. Please wait for completion.`
      });
    }
    
    // Redirect to direct download URL from RapidAPI
    if (job.download_url) {
      const filename = `${job.title || 'converted'}.mp3`;
      logger.info(`🔗 Redirecting to direct download URL: ${job.download_url}`);
      
      // Set proper download headers
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Redirect to the direct download URL
      res.redirect(302, job.download_url);
      return;
    }

    // No download URL available
    logger.error(`❌ No download URL found for job: ${jobId}`);
    return res.status(404).json({
      success: false,
      message: 'Download not available'
    });
    
  } catch (error) {
    const userMessage = ErrorHandler.getUserFriendlyError(error);
    ErrorHandler.logTechnicalError(error, 'DOWNLOAD_FILE', {
      jobId: req.params.id,
      userIp: req.ip,
      operation: 'downloadFile'
    });
    
    const { statusCode, response } = ErrorHandler.createErrorResponse(500, userMessage, error, {
      jobId: req.params.id,
      userIp: req.ip,
      operation: 'downloadFile'
    });
    res.status(statusCode).json(response);
  }
});

// GET /api/status - Get status by video_id (for frontend polling)
router.get('/status', statusRateLimit, async (req: Request, res: Response) => {
  try {
    const videoId = req.query.video_id as string;
    
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'video_id parameter is required'
      });
    }

    // Get the latest job for this video
    const { query } = require('../config/database');
    const result = await query(
      'SELECT * FROM videos WHERE video_id = $1 ORDER BY requested_at DESC LIMIT 1',
      [videoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const job = result.rows[0];
    
    // Set proper UTF-8 headers for Unicode support
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Encoding', 'utf-8');
    
    const response: any = {
      success: true,
      video_id: job.video_id,
      status: job.status,
      title: job.title,
      progress: job.progress || 0,
      download_url: job.download_url,
      error_message: job.error_message,
      requested_at: job.requested_at,
      completed_at: job.completed_at
    };

    res.json(response);
  } catch (error) {
    const userMessage = ErrorHandler.getUserFriendlyError(error);
    ErrorHandler.logTechnicalError(error, 'GET_VIDEO_STATUS', {
      videoId: req.query.video_id,
      userIp: req.ip,
      operation: 'getVideoStatus'
    });
    
    if (!res.headersSent) {
      const { statusCode, response } = ErrorHandler.createErrorResponse(500, userMessage, error, {
        videoId: req.query.video_id,
        userIp: req.ip,
        operation: 'getVideoStatus'
      });
      res.status(statusCode).json(response);
    }
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
  } catch (error) {
    const userMessage = ErrorHandler.getUserFriendlyError(error);
    ErrorHandler.logTechnicalError(error, 'VIDEO_INFO_REQUEST', {
      userIp: req.ip,
      operation: 'getVideoInfo',
      additionalData: { url: req.query.url }
    });
    
    if (!res.headersSent) {
      const { statusCode, response } = ErrorHandler.createErrorResponse(500, userMessage, error, {
        userIp: req.ip,
        operation: 'getVideoInfo'
      });
      res.status(statusCode).json(response);
    }
  }
});

// GET /api/stats - System performance statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await activeService.getStats();
    
    res.json({
      success: true,
      ...stats,
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

// POST /api/cleanup - Manual cleanup trigger
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    logger.info('Manual cleanup triggered');
    await activeService.cleanupOldFiles();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    logger.error('Manual cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed'
    });
  }
});

// GET /api/debug/files - Debug endpoint to check downloaded files
router.get('/debug/files', async (req: Request, res: Response) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    
    let files: any[] = [];
    
    try {
      const fileList = fs.readdirSync(downloadsDir);
      files = fileList.map((filename: string) => {
        const filePath = path.join(downloadsDir, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      });
    } catch (error) {
      logger.error('Error reading downloads directory:', error);
    }
    
    res.json({
      success: true,
      downloads_dir: downloadsDir,
      file_count: files.length,
      files: files
    });
  } catch (error) {
    logger.error('Debug files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get debug info'
    });
  }
});

export default router;
