import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { SimpleConversionService } from '../services/simpleConversionService';
import { validateConversionRequest, validateJobId } from '../middleware/validation';
import { conversionRateLimit, statusRateLimit } from '../middleware/rateLimiter';
import logger from '../config/logger';
import { getUserFriendlyError, logTechnicalError, sendErrorResponse } from '../utils/errorHandler';
import crypto from 'crypto';
import { optimizedDb } from '../config/optimizedDatabase';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = express.Router();
let conversionService: SimpleConversionService | null = null;

// Lazy initialization of conversion service
function getConversionService(): SimpleConversionService {
  if (!conversionService) {
    conversionService = new SimpleConversionService();
  }
  return conversionService;
}

// Helper method to refresh download URL
async function refreshDownloadUrl(jobId: string): Promise<string | null> {
  return await getConversionService().refreshDownloadUrl(jobId);
}

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
    const jobId = await getConversionService().createJob(req.body);
    
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
    const job = await getConversionService().getJobStatus(req.params.id);
    
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
      mp3_filename: job.mp3_filename,
      error_message: job.error_message,
      quality_message: job.quality_message,
      created_at: job.created_at,
      updated_at: job.updated_at
    };

    // Add download URL if conversion is completed
    if (job.status === 'completed') {
      if (job.processed_path) {
        // Local file available - preferred method
        response.download_url = `/api/download/${job.id}`;
        response.download_filename = job.mp3_filename;
        response.download_type = 'local'; // Indicates this is a local file
        response.file_valid = true;
        response.file_size = 0; // Will be determined during download
        logger.info(`📁 [Job ${job.id}] Status: Local file available at ${job.processed_path}`);
      } else if (job.direct_download_url) {
        // Fallback to external URL
        response.download_url = job.direct_download_url; // Direct API download URL
        response.download_filename = job.mp3_filename;
        response.download_type = 'direct'; // Indicates this is a direct download
        response.file_valid = true;
        response.file_size = 0; // Unknown for external URLs
        logger.info(`🔗 [Job ${job.id}] Status: External download URL available`);
      }
    }

    res.json(response);
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Get Job Status', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

// GET /api/download/:id - Stream file with proper headers (no source domain exposure)
router.get('/download/:id', validateJobId, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    logger.info(`🎵 Download request for job: ${jobId}`);
    
    const job = await getConversionService().getJobStatus(jobId);
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
    
    const filename = job.mp3_filename || 'converted.mp3';
    
    // Priority 1: Serve local file if available
    if (job.processed_path && !job.processed_path.startsWith('http')) {
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

      const fs = require('fs');
      const path = require('path');
      
      try {
        // Use the processed_path directly (it's the server file path)
        const filePath = job.processed_path;
        
        // Check if file exists and get its size
        const stats = await fs.promises.stat(filePath);
        
        if (stats.size === 0) {
          logger.error(`❌ File is empty: ${filePath}, size: ${stats.size}`);
          return res.status(500).json({
            success: false,
            message: 'File is empty or corrupted'
          });
        }

        if (stats.size > 1073741824) { // 1GB limit
          logger.error(`❌ File too large: ${filePath}, size: ${stats.size} bytes`);
          return res.status(500).json({
            success: false,
            message: 'File is too large'
          });
        }

        // Set content length for proper download progress
        res.setHeader('Content-Length', stats.size);
        
        // Stream the local file
        const fileStream = fs.createReadStream(filePath);
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

        logger.info(`✅ Successfully streaming local file: ${filePath}`);
        return;
        
      } catch (error) {
        logger.error(`❌ Error accessing local file: ${error}`);
        // Fall through to try direct download URL
      }
    }
    
    // Priority 2: Fallback to direct download URL if no local file
    if (!job.direct_download_url) {
      logger.error(`❌ No download URL or local file found for job: ${jobId}`);
      return res.status(404).json({
        success: false,
        message: 'Download URL not available'
      });
    }

    logger.info(`🎵 Starting download for: ${filename}`);
    logger.info(`🔗 Direct download URL: ${job.direct_download_url}`);

    // Stream the file from the API URL with proper headers
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

    // Set proper download headers to hide source domain
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    const proxyReq = https.request(options, (proxyRes: any) => {
      logger.info(`📡 Proxy response status: ${proxyRes.statusCode} for job: ${jobId}`);
      
      // Handle redirects
      if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        logger.info(`🔄 Following redirect for job: ${jobId}`);
        res.redirect(proxyRes.statusCode, proxyRes.headers.location);
        return;
      }
      
      if (proxyRes.statusCode === 404) {
        logger.error(`❌ Download URL expired (404) for job: ${jobId} - attempting to refresh`);
        // Try to refresh the download URL
        refreshDownloadUrl(jobId).then((newUrl) => {
          if (newUrl) {
            logger.info(`🔄 Redirecting to refreshed URL for job: ${jobId}`);
            res.redirect(302, `/api/download/${jobId}`);
          } else {
            res.status(404).json({
              success: false,
              message: 'Download link has expired. Please try converting again.'
            });
          }
        }).catch((error) => {
          logger.error(`❌ Failed to refresh download URL for job ${jobId}:`, error);
          res.status(404).json({
            success: false,
            message: 'Download link has expired. Please try converting again.'
          });
        });
        return;
      }
      
      if (proxyRes.statusCode !== 200) {
        logger.error(`❌ Download failed with status: ${proxyRes.statusCode} for job: ${jobId}`);
        res.status(proxyRes.statusCode).json({
          success: false,
          message: 'Download failed'
        });
        return;
      }

      // Copy relevant headers (but not source domain info)
      if (proxyRes.headers['content-length']) {
        res.setHeader('Content-Length', proxyRes.headers['content-length']);
      }
      if (proxyRes.headers['content-type']) {
        res.setHeader('Content-Type', proxyRes.headers['content-type']);
      }

      // Stream the file
      proxyRes.pipe(res);
      
      proxyRes.on('end', () => {
        logger.info(`✅ Download completed successfully for job: ${jobId}`);
      });
    });

    proxyReq.on('error', (error: any) => {
      logger.error(`❌ Download error for job ${jobId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Download failed'
        });
      }
    });

    proxyReq.setTimeout(30000, () => {
      logger.error(`⏰ Download timeout for job: ${jobId}`);
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Download timeout'
        });
      }
    });

    proxyReq.end();
    
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
    const videoInfo = await getConversionService().getVideoInfo(url);
    
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

// POST /api/cleanup - Manual cleanup trigger
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    logger.info('Manual cleanup triggered');
    await getConversionService().cleanupOldFiles();
    
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

// POST /api/refresh-download/:id - Refresh download URL for a job
router.post('/refresh-download/:id', validateJobId, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    logger.info(`Manual download URL refresh triggered for job: ${jobId}`);
    
    const newUrl = await getConversionService().refreshDownloadUrl(jobId);
    
    if (newUrl) {
      res.json({
        success: true,
        message: 'Download URL refreshed successfully',
        download_url: newUrl
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to refresh download URL. The job may not exist or the conversion may have failed.'
      });
    }
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Refresh Download URL', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

// GET /api/direct-download/:id - Get direct download URL (for testing)
router.get('/direct-download/:id', validateJobId, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const job = await getConversionService().getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Conversion is ${job.status}. Please wait for completion.`
      });
    }
    
    if (!job.direct_download_url) {
      return res.status(404).json({
        success: false,
        message: 'Direct download URL not available'
      });
    }
    
    res.json({
      success: true,
      download_url: job.direct_download_url,
      filename: job.mp3_filename,
      title: job.video_title
    });
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Direct Download URL', req);
    sendErrorResponse(res, 500, userMessage, error);
  }
});

// GET /api/test-download/:id - Test download functionality
router.get('/test-download/:id', validateJobId, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const job = await getConversionService().getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Conversion is ${job.status}. Please wait for completion.`
      });
    }
    
    if (!job.direct_download_url) {
      return res.status(404).json({
        success: false,
        message: 'Direct download URL not available'
      });
    }
    
    // Return HTML page that tests the download
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Download Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
            button { padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .info { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>Download Test Page</h1>
        
        <div class="info">
            <h3>Job Information:</h3>
            <p><strong>Job ID:</strong> ${jobId}</p>
            <p><strong>Title:</strong> ${job.video_title || 'N/A'}</p>
            <p><strong>Filename:</strong> ${job.mp3_filename || 'N/A'}</p>
            <p><strong>Direct Download URL:</strong> <a href="${job.direct_download_url}" target="_blank">${job.direct_download_url}</a></p>
        </div>
        
        <div class="test-section">
            <h3>Test 1: Direct Link</h3>
            <p>Click this button to test direct download:</p>
            <button onclick="window.open('${job.direct_download_url}', '_blank')">Download Direct</button>
        </div>
        
        <div class="test-section">
            <h3>Test 2: Redirect Link</h3>
            <p>Click this button to test redirect download:</p>
            <button onclick="window.open('/api/download/${jobId}', '_blank')">Download via Redirect</button>
        </div>
        
        <div class="test-section">
            <h3>Test 3: Hidden Link</h3>
            <p>Click this button to test hidden link download:</p>
            <button onclick="testHiddenDownload()">Download via Hidden Link</button>
        </div>
        
        <script>
            function testHiddenDownload() {
                const link = document.createElement('a');
                link.href = '/api/download/${jobId}';
                link.download = '${job.mp3_filename || 'test.mp3'}';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        </script>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Test Download', req);
    sendErrorResponse(res, 500, userMessage, error);
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
        const jobId = await getConversionService().createJob({
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
