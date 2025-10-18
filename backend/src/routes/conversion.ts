import express, { Request, Response } from 'express';
import { conversionService, ConversionRequest, IConversionService } from '../services/conversionService';
import { fallbackConversionService } from '../services/fallbackConversionService';
import { validateConversionRequest, validateJobId } from '../middleware/validation';
import { conversionRateLimit, statusRateLimit } from '../middleware/rateLimiter';
import logger from '../config/logger';
import { ErrorHandler } from '../services/errorHandler';

// Check which service to use
const { spawn } = require('child_process');
const checkYtDlp = () => {
  return new Promise((resolve) => {
    const ytdlp = spawn('yt-dlp', ['--version']);
    ytdlp.on('close', (code: number) => {
      resolve(code === 0);
    });
    ytdlp.on('error', () => {
      resolve(false);
    });
  });
};

// Use appropriate service based on yt-dlp availability
let activeService: IConversionService = conversionService;
checkYtDlp().then((available) => {
  if (!available) {
    activeService = fallbackConversionService;
    logger.warn('⚠️ Using fallback conversion service (yt-dlp not available)');
  } else {
    logger.info('✅ Using full conversion service (yt-dlp available)');
  }
});

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
        'SELECT id, status FROM conversions WHERE youtube_url LIKE $1 AND status IN ($2, $3) ORDER BY created_at DESC LIMIT 1',
        [`%${videoId}%`, 'pending', 'processing']
      );
      
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
    
    res.status(202).json({
      success: true,
      jobId,
      status: 'pending',
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
    logger.info(`🔍 [Job ${job.id}] Status check: status=${job.status}, processed_path=${job.processed_path}, direct_download_url=${job.direct_download_url}`);
    
    if (job.status === 'completed') {
      if (job.processed_path) {
        // Local file available - preferred method
        response.download_url = `/api/download/${job.id}`;
        response.download_filename = `${job.video_title || 'converted'}.mp3`;
        response.download_type = 'local'; // Indicates this is a local file
        response.file_valid = true;
        response.file_size = 0; // Will be determined during download
        logger.info(`📁 [Job ${job.id}] Status: Local file available at ${job.processed_path}`);
        logger.info(`🔗 [Job ${job.id}] Status Response: download_url=${response.download_url}, file_valid=${response.file_valid}`);
      } else if (job.direct_download_url) {
        // Fallback to external URL
        response.download_url = job.direct_download_url;
        response.download_filename = `${job.video_title || 'converted'}.mp3`;
        response.download_type = 'direct'; // Indicates this is a direct download
        response.file_valid = true;
        response.file_size = 0; // Unknown for external URLs
        logger.info(`🔗 [Job ${job.id}] Status: External download URL available`);
        logger.info(`🔗 [Job ${job.id}] Status Response: download_url=${response.download_url}, file_valid=${response.file_valid}`);
      } else {
        logger.warn(`⚠️ [Job ${job.id}] Status: Completed but no download URL available (processed_path: ${job.processed_path}, direct_download_url: ${job.direct_download_url})`);
      }
    }

    // Add ffmpeg logs if requested by admin (you can add admin check here)
    if (req.query.includeLogs === 'true' && job.ffmpeg_logs) {
      response.ffmpeg_logs = job.ffmpeg_logs;
    }

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

// GET /api/download/:id - Download processed file
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
    
    if (job.status !== 'completed') {
      logger.warn(`⏳ Job not completed: ${jobId}, status: ${job.status}`);
      return res.status(400).json({
        success: false,
        message: `Conversion is ${job.status}. Please wait for completion.`
      });
    }
    
    // Check if we have a local file first (preferred)
    if (job.processed_path) {
    const filename = `${job.video_title || 'converted'}.mp3`;
      logger.info(`🎵 Starting download for local file: ${filename}`);
      logger.info(`📁 Local file path: ${job.processed_path}`);

      // Set proper download headers with RFC 5987 encoding for international characters
    res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

      try {
        // Check if file exists and get its size
        const fs = require('fs');
        const stats = await fs.promises.stat(job.processed_path);
        
        if (stats.size === 0) {
          logger.error(`❌ File is empty: ${job.processed_path}, size: ${stats.size}`);
          return res.status(500).json({
            success: false,
            message: 'File is empty or corrupted'
          });
        }

        if (stats.size > 1073741824) { // 1GB limit
          logger.error(`❌ File too large: ${job.processed_path}, size: ${stats.size} bytes`);
          return res.status(500).json({
            success: false,
            message: 'File is too large'
          });
        }

        // Set content length for proper download progress
        res.setHeader('Content-Length', stats.size);
        
        // Stream the local file
        const fileStream = fs.createReadStream(job.processed_path);
        fileStream.pipe(res);
        
        fileStream.on('error', (error: Error) => {
          logger.error(`❌ Error streaming local file: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error reading file'
        });
      }
    });

        logger.info(`✅ Successfully streaming local file: ${job.processed_path}`);
        return;
        
      } catch (error) {
        logger.error(`❌ Error accessing local file: ${error}`);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'File not accessible'
          });
        }
        return;
      }
    }
    
    // Fallback to direct download URL (external API) if no local file
    if (job.direct_download_url) {
      const originalFilename = job.video_title || 'converted';
      const safeFilename = originalFilename.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const filename = `${safeFilename}.mp3`;
      logger.info(`🎵 Starting download for: ${filename}`);
      logger.info(`🔗 Direct download URL: ${job.direct_download_url}`);

      // Set proper download headers with RFC 5987 encoding for international characters
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      // Stream the file from the external URL
      const https = require('https');
      const http = require('http');
      const url = require('url');
      
      const parsedUrl = url.parse(job.direct_download_url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };

      const proxyReq = client.request(options, (proxyRes: any) => {
        logger.info(`📡 Proxy response status: ${proxyRes.statusCode} for job: ${jobId}`);
        
        if (proxyRes.statusCode === 404) {
          logger.error(`❌ Download URL expired (404) for job: ${jobId} - attempting to refresh`);
          // Mark job as failed and let the frontend handle refresh
          if (!res.headersSent) {
            res.status(410).json({
              success: false,
              message: 'Download URL expired. Please try converting again.',
              expired: true
            });
          }
          return;
        }
        
        if (proxyRes.statusCode !== 200) {
          logger.error(`❌ Download failed with status: ${proxyRes.statusCode} for job: ${jobId}`);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Download failed. Please try again.'
            });
          }
          return;
        }

        // Set content type from response if available
        if (proxyRes.headers['content-type']) {
          res.setHeader('Content-Type', proxyRes.headers['content-type']);
        }

        // Set content length if available
        if (proxyRes.headers['content-length']) {
          res.setHeader('Content-Length', proxyRes.headers['content-length']);
        }

        proxyRes.on('end', () => {
          logger.info(`✅ Download completed successfully for job: ${jobId}`);
        });

        proxyRes.on('error', (error: any) => {
          logger.error(`❌ Proxy response error for job ${jobId}:`, error);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Download stream error'
            });
          }
        });

        proxyRes.pipe(res);
      });

      proxyReq.on('error', (error: any) => {
        logger.error(`❌ Proxy request error for job ${jobId}:`, error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Download request failed'
          });
        }
      });

      proxyReq.end();
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
