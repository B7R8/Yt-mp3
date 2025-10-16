import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversionJob, ConversionRequest } from '../types';
import logger from '../config/logger';
import { optimizedDb as db } from '../config/optimizedDatabase';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorHandler';
import { YouTubeMp3ApiService, VideoInfo } from './youtubeMp3ApiService';

export class SimpleConversionService {
  private downloadsDir: string;
  private apiService: YouTubeMp3ApiService;

  constructor() {
    this.downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    this.apiService = new YouTubeMp3ApiService();
    this.ensureDownloadsDir();
  }

  private async ensureDownloadsDir(): Promise<void> {
    try {
      await fs.mkdir(this.downloadsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create downloads directory:', error);
    }
  }

  /**
   * Check if URL is blacklisted
   */
  private async checkBlacklist(url: string): Promise<{ isBlacklisted: boolean; reason?: string; type?: string }> {
    try {
      const database = await db;
      
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      // Check for exact URL match
      const urlMatch = await database.get(
        'SELECT reason FROM blacklist WHERE type = ? AND value = ?',
        ['url', url]
      );
      
      if (urlMatch) {
        return { 
          isBlacklisted: true, 
          reason: urlMatch.reason || 'This URL has been blocked by the content owner or administrator',
          type: 'URL'
        };
      }
      
      // Check for video ID match
      if (videoId) {
        const videoIdMatch = await database.get(
          'SELECT reason FROM blacklist WHERE type = ? AND value = ?',
          ['video_id', videoId]
        );
        
        if (videoIdMatch) {
          return { 
            isBlacklisted: true, 
            reason: videoIdMatch.reason || 'This video has been blocked by the content owner or administrator',
            type: 'Video'
          };
        }
      }
      
      return { isBlacklisted: false };
    } catch (error) {
      logger.error('Error checking blacklist:', error);
      return { isBlacklisted: false };
    }
  }

  /**
   * Create a new conversion job
   */
  async createJob(request: ConversionRequest): Promise<string> {
    const jobId = uuidv4();
    const database = await db;

    try {
      // Validate YouTube URL
      if (!this.apiService.isValidYouTubeUrl(request.url)) {
        throw new Error('Invalid YouTube URL format');
      }

      // Check if URL is blacklisted
      const blacklistResult = await this.checkBlacklist(request.url);
      if (blacklistResult.isBlacklisted) {
        throw new Error(blacklistResult.reason || 'This content is not available for conversion');
      }

      // Get video info for job creation
      const videoInfo = await this.apiService.getVideoInfo(request.url);
      
      await database.run(
        `INSERT INTO conversions (id, youtube_url, video_title, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        [jobId, request.url, videoInfo.title]
      );
      
      // Start conversion process asynchronously
      this.processConversion(jobId, request).catch(error => {
        logger.error(`Conversion failed for job ${jobId}:`, error);
        this.updateJobStatus(jobId, 'failed', undefined, error.message);
      });

      return jobId;
    } catch (error) {
      logger.error('Failed to create conversion job:', error);
      throw error;
    }
  }

  /**
   * Process conversion using YouTube MP3 API
   */
  private async processConversion(jobId: string, request: ConversionRequest): Promise<void> {
    try {
      await this.updateJobStatus(jobId, 'processing');
      
      logger.info(`[Job ${jobId}] Starting conversion for URL: ${request.url}`);
      
      // Convert using YouTube MP3 API
      const result = await this.apiService.convertToMp3(request.url, request.quality || '192k');
      
      if (!result.success) {
        throw new Error(result.error || 'Conversion failed');
      }

      // Generate filename
      const filename = `${result.title?.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_') || 'converted'}.mp3`;
      const filePath = path.join(this.downloadsDir, filename);

      // Move the downloaded file to the correct location if needed
      // (The API service already downloads to the correct location)
      
      // Mark as completed
      await this.updateJobStatus(jobId, 'completed', filename);
      logger.info(`[Job ${jobId}] Conversion completed successfully: ${filename}`);

    } catch (error) {
      logTechnicalError(error, `Conversion Job ${jobId}`);
      logger.error(`[Job ${jobId}] Conversion failed:`, error);
      
      const userFriendlyError = getUserFriendlyError(error);
      await this.updateJobStatus(jobId, 'failed', undefined, userFriendlyError);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ConversionJob | null> {
    const database = await db;
    
    try {
      const result = await database.get(
        'SELECT * FROM conversions WHERE id = ?',
        [jobId]
      );

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        youtube_url: result.youtube_url,
        video_title: result.video_title,
        status: result.status,
        mp3_filename: result.mp3_filename,
        error_message: result.error_message,
        quality_message: result.quality_message,
        created_at: new Date(result.created_at),
        updated_at: new Date(result.updated_at)
      };
    } catch (error) {
      logger.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(
    jobId: string, 
    status: string, 
    mp3Filename?: string, 
    errorMessage?: string,
    qualityMessage?: string
  ): Promise<void> {
    const database = await db;
    
    try {
      await database.run(
        `UPDATE conversions 
         SET status = ?, mp3_filename = ?, error_message = ?, quality_message = ?, updated_at = datetime('now') 
         WHERE id = ?`,
        [status, mp3Filename, errorMessage, qualityMessage, jobId]
      );
    } catch (error) {
      logger.error('Failed to update job status:', error);
      throw error;
    }
  }

  /**
   * Get job file path
   */
  async getJobFilePath(jobId: string): Promise<string | null> {
    const job = await this.getJobStatus(jobId);
    
    if (!job || job.status !== 'completed' || !job.mp3_filename) {
      return null;
    }

    const filePath = path.join(this.downloadsDir, job.mp3_filename);
    
    try {
      await fs.access(filePath);
      return filePath;
    } catch (error) {
      logger.error(`File not found for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get video information
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    if (!this.apiService.isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL format');
    }

    return await this.apiService.getVideoInfo(url);
  }

  /**
   * Cleanup old files
   */
  async cleanupOldFiles(): Promise<void> {
    const maxAgeHours = parseInt(process.env.MAX_FILE_AGE_HOURS || '1');
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - maxAgeMs);

    const database = await db;
    
    try {
      const result = await database.all(
        `SELECT id, mp3_filename FROM conversions 
         WHERE status = 'completed' AND created_at < ?`,
        [cutoffTime.toISOString()]
      );

      for (const row of result) {
        if (row.mp3_filename) {
          const filePath = path.join(this.downloadsDir, row.mp3_filename);
          
          try {
            await fs.unlink(filePath);
            logger.info(`Deleted old file: ${filePath}`);
          } catch (error) {
            logger.warn(`Failed to delete file ${filePath}:`, error);
          }
        }

        await database.run(
          'UPDATE conversions SET status = ? WHERE id = ?',
          ['cleaned', row.id]
        );
      }

      logger.info(`Cleanup completed. Processed ${result.length} old jobs.`);
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }
}
