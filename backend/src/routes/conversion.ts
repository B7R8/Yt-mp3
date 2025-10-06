import express, { Request, Response } from 'express';
import { ConversionService } from '../services/conversionService';
import { validateConversionRequest, validateJobId } from '../middleware/validation';
import { conversionRateLimit, statusRateLimit } from '../middleware/rateLimiter';
import logger from '../config/logger';
import { spawn } from 'child_process';
import { getUserFriendlyError, logTechnicalError, sendErrorResponse } from '../utils/errorHandler';

const router = express.Router();
const conversionService = new ConversionService();

// In-memory cache for video info (TTL: 1 hour)
interface CachedVideoInfo {
  title: string;
  duration: number;
  durationFormatted: string;
  timestamp: number;
}

const videoInfoCache = new Map<string, CachedVideoInfo>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of videoInfoCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      videoInfoCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

// POST /api/convert - Start a new conversion
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

// GET /api/status/:id - Get conversion job status
router.get('/status/:id', statusRateLimit, validateJobId, async (req: Request, res: Response) => {
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
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Get Job Status', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

// GET /api/download/:id - Download the converted MP3 file
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

    // Set proper headers for direct audio download
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Stream the file directly with proper error handling
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

// GET /api/video-info - Get video information (duration, title) - ULTRA FAST
router.get('/video-info', statusRateLimit, async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL parameter is required'
      });
    }

    // Extract video ID for caching
    const videoIdMatch = url.match(/(?:v=|\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : url;

    // Check cache first - INSTANT response if cached!
    const cached = videoInfoCache.get(videoId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info(`Cache hit for video: ${videoId}`);
      return res.json({
        success: true,
        title: cached.title,
        duration: cached.duration,
        durationFormatted: cached.durationFormatted,
        cached: true
      });
    }

    // Set longer timeout for very long videos (up to 50 hours)
    const timeout = setTimeout(() => {
      logger.warn(`Video info request timeout for: ${url}`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout - video might be unavailable or very long'
        });
      }
    }, 60000); // 60 second timeout for long videos

    // Use yt-dlp with optimized settings for long videos
    const ytdlp = spawn('python', [
      '-m', 'yt_dlp',
      '--skip-download',         // Don't download anything
      '--no-playlist',           // Single video only
      '--no-warnings',           // Reduce output
      '--no-check-certificates', // Skip SSL verification
      '--no-call-home',          // Don't check for updates
      '--no-cache-dir',          // Don't use cache
      '--socket-timeout', '30',  // 30 second socket timeout for long videos
      '--extractor-retries', '2', // 2 retries for reliability
      '--fragment-retries', '2',  // 2 fragment retries
      '--retries', '3',           // 3 total retries
      '--http-chunk-size', '10485760', // 10MB chunks for faster processing
      '--concurrent-fragments', '4',   // 4 concurrent fragments
      '-J',                       // JSON output (faster parsing)
      '--flat-playlist',          // Don't extract playlist
      '--extractor-args', 'youtube:player_client=android', // Use mobile client for faster access
      url
    ]);

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      clearTimeout(timeout);
      
      if (res.headersSent) return; // Already responded due to timeout

      if (code === 0 && output.trim()) {
        try {
          // Parse JSON output (faster than line parsing)
          const jsonData = JSON.parse(output);
          
          const title = jsonData.title || 'Unknown';
          let durationSeconds = 0;
          
          // Handle duration from JSON
          if (jsonData.duration && typeof jsonData.duration === 'number') {
            durationSeconds = Math.floor(jsonData.duration);
          } else if (jsonData.duration_string) {
            // Fallback: parse duration string
            const parts = jsonData.duration_string.split(':').map((p: string) => parseInt(p, 10));
            if (parts.length === 3) {
              durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              durationSeconds = parts[0] * 60 + parts[1];
            }
          }

          // Convert seconds to HH:MM:SS format for display
          const hours = Math.floor(durationSeconds / 3600);
          const minutes = Math.floor((durationSeconds % 3600) / 60);
          const seconds = durationSeconds % 60;
          const durationFormatted = hours > 0 
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes}:${seconds.toString().padStart(2, '0')}`;

          // Cache the result for future requests
          videoInfoCache.set(videoId, {
            title,
            duration: durationSeconds,
            durationFormatted,
            timestamp: Date.now()
          });

          logger.info(`Video info fetched and cached: ${title} (${durationSeconds}s)`);
          
          res.json({
            success: true,
            title,
            duration: durationSeconds,
            durationFormatted,
            cached: false
          });
        } catch (parseError) {
          const userMessage = getUserFriendlyError(parseError);
          logTechnicalError(parseError, 'Parse Video Info', req);
          sendErrorResponse(res, 500, userMessage, parseError);
        }
      } else {
        const error = new Error(`yt-dlp failed with code ${code}: ${errorOutput}`);
        const userMessage = getUserFriendlyError(error);
        logTechnicalError(error, 'yt-dlp Video Info', req);
        sendErrorResponse(res, 500, userMessage, error);
      }
    });

    ytdlp.on('error', (error) => {
      clearTimeout(timeout);
      if (res.headersSent) return;
      
      const userMessage = getUserFriendlyError(error);
      logTechnicalError(error, 'yt-dlp Process Error', req);
      sendErrorResponse(res, 500, userMessage, error);
    });

  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Video Info Request', req);
    if (!res.headersSent) {
      sendErrorResponse(res, 500, userMessage, error);
    }
  }
});

export default router;

