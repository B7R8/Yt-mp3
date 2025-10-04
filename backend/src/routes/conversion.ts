import express, { Request, Response } from 'express';
import { ConversionService } from '../services/conversionService';
import { validateConversionRequest, validateJobId } from '../middleware/validation';
import { conversionRateLimit, statusRateLimit } from '../middleware/rateLimiter';
import logger from '../config/logger';

const router = express.Router();
const conversionService = new ConversionService();

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
    logger.error('Failed to create conversion job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start conversion job'
    });
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
    logger.error('Failed to get job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status'
    });
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

    res.download(filePath, filename, (error: any) => {
      if (error) {
        logger.error('Download error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Download failed'
          });
        }
      }
    });
  } catch (error) {
    logger.error('Download request failed:', error);
    res.status(500).json({
      success: false,
      message: 'Download request failed'
    });
  }
});

export default router;

