import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversionJob, ConversionRequest } from './conversionService';
import logger from '../config/logger';
import { query } from '../config/database';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorHandler';
import { YouTubeMp3ApiService, VideoInfo, ConversionResult } from './youtubeMp3ApiService';

export class SimpleConversionService {
  private downloadsDir: string;
  private apiService: YouTubeMp3ApiService;

  constructor() {
    this.downloadsDir = process.env.DOWNLOADS_DIR || '../downloads';
    this.apiService = new YouTubeMp3ApiService();
    this.ensureDownloadsDir();
  }

  private async ensureDownloadsDir(): Promise<void> {
    try {
      await fs.mkdir(this.downloadsDir, { recursive: true });
      logger.info(`📁 Downloads directory ensured: ${this.downloadsDir}`);
    } catch (error) {
      logger.error(`❌ Failed to create downloads directory: ${error}`);
      throw error;
    }
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  private extractVideoId(url: string): string | null {
    const patterns = [
      // Standard YouTube URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      
      // Short URLs
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      
      // Mobile URLs
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Gaming URLs
      /(?:https?:\/\/)?(?:www\.)?gaming\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Just the video ID (11 characters)
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        logger.info(`🎯 Extracted video ID: ${match[1]} from URL: ${url}`);
        return match[1];
      }
    }
    
    logger.warn(`❌ Could not extract video ID from URL: ${url}`);
    return null;
  }

  /**
   * Check if URL is blacklisted
   */
  private isBlacklisted(url: string): boolean {
    const blacklistedPatterns = [
      /porn/i,
      /adult/i,
      /xxx/i,
      /sex/i,
      /nude/i,
      /explicit/i
    ];

    return blacklistedPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Validate YouTube URL
   */
  private validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    if (this.isBlacklisted(url)) {
      return { isValid: false, error: 'Content not allowed' };
    }

    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return { isValid: false, error: 'Invalid YouTube URL format' };
    }

    return { isValid: true };
  }

  /**
   * Get video information
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      logger.info(`🔍 Getting video info for: ${url}`);
      
      const validation = this.validateUrl(url);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const videoInfo = await this.apiService.getVideoInfo(url);
      logger.info(`✅ Video info retrieved: ${videoInfo.title}`);
      
      return videoInfo;
    } catch (error) {
      logger.error(`❌ Failed to get video info: ${error}`);
      throw getUserFriendlyError(error);
    }
  }

  /**
   * Convert video to MP3
   */
  async convertToMp3(request: ConversionRequest): Promise<ConversionJob> {
    try {
      logger.info(`🎵 Starting conversion for: ${request.url}`);
      
      const validation = this.validateUrl(request.url);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const videoId = this.extractVideoId(request.url);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }

      // Create conversion job
      const jobId = uuidv4();
      const job: ConversionJob = {
        id: jobId,
        youtube_url: request.url,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
        quality: request.quality || 'high',
        trim_start: request.trimStart || undefined,
        trim_duration: request.trimDuration || undefined,
        file_size: undefined
      };

      // Save job to database
      await query(
        `INSERT INTO conversions (
          id, youtube_url, status, created_at, updated_at,
          quality, trim_start, trim_duration
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          job.id, job.youtube_url, job.status, job.created_at, job.updated_at,
          job.quality, job.trim_start, job.trim_duration
        ]
      );

      // Start conversion process
      this.processConversion(job).catch(error => {
        logger.error(`❌ Conversion failed for job ${jobId}:`, error);
      });

      logger.info(`✅ Conversion job created: ${jobId}`);
      return job;

    } catch (error) {
      logger.error(`❌ Failed to start conversion: ${error}`);
      throw new Error(this.getUserFriendlyErrorMessage(error as Error));
    }
  }

  /**
   * Process the conversion
   */
  private async processConversion(job: ConversionJob): Promise<void> {
    try {
      logger.info(`🔄 Processing conversion job: ${job.id}`);

      // Update job status to processing
      await query(
        'UPDATE conversions SET status = $1, updated_at = $2 WHERE id = $3',
        ['processing', new Date(), job.id]
      );

      // Convert video to MP3 (this gets both download URL and video title)
      const conversionResult = await this.apiService.convertToMp3(
        job.youtube_url,
        job.quality || 'high'
      );

      if (!conversionResult.success) {
        throw new Error(conversionResult.error || 'Conversion failed');
      }

      // Generate filename using title from conversion result
      const filename = this.generateFilename(conversionResult.title || 'Unknown', job.quality || 'high');
      const filePath = path.join(this.downloadsDir, filename);

      // Download file immediately while URL is still valid (URLs expire in seconds)
      if (conversionResult.downloadUrl) {
        logger.info(`📥 Downloading file immediately from: ${conversionResult.downloadUrl}`);
        await this.downloadFileImmediately(conversionResult.downloadUrl, filePath);
        
        // Get file size
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;
        
        // Update job with local file path
        await query(
          `UPDATE conversions SET 
            status = $1, 
            mp3_filename = $2, 
            processed_path = $3,
            file_size = $4, 
            updated_at = $5
          WHERE id = $6`,
          [
            'completed',
            filename,
            filePath, // Store the local file path
            fileSize,
            new Date(),
            job.id
          ]
        );
        } else {
        throw new Error('No download URL received from conversion service');
      }

      logger.info(`🎉 Conversion completed successfully: ${job.id}`);

    } catch (error) {
      logger.error(`❌ Conversion failed for job ${job.id}:`, error);
      
      // Convert technical error to user-friendly message
      const userFriendlyError = this.getUserFriendlyErrorMessage(error as Error);
      
      // Update job with user-friendly error message
      await query(
        'UPDATE conversions SET status = $1, error_message = $2, updated_at = $3 WHERE id = $4',
        ['failed', userFriendlyError, new Date(), job.id]
      );
    }
  }

  /**
   * Download file immediately from URL (for URLs that expire quickly)
   */
  private async downloadFileImmediately(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const file = require('fs').createWriteStream(filePath);
      
      logger.info(`📥 Downloading file immediately from: ${url}`);
      
      const request = https.get(url, (response: any) => {
        if (response.statusCode === 200) {
          let downloadedBytes = 0;
          
          response.on('data', (chunk: Buffer) => {
            downloadedBytes += chunk.length;
          });
          
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            logger.info(`✅ File downloaded successfully: ${filePath} (${downloadedBytes} bytes)`);
            resolve();
          });
          
          file.on('error', (error: Error) => {
            logger.error(`❌ File write error: ${error.message}`);
            fs.unlink(filePath).catch(() => {}); // Clean up on error
            reject(error);
          });
        } else if (response.statusCode === 404) {
          logger.error(`❌ Download URL expired (404): ${url}`);
          reject(new Error('Download URL has expired. Please try again.'));
        } else {
          logger.error(`❌ Download failed with status: ${response.statusCode}`);
          reject(new Error(`Download failed with status: ${response.statusCode}`));
        }
      });
      
      request.on('error', (error: Error) => {
        logger.error(`❌ Download request error: ${error.message}`);
        reject(error);
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout - URL may have expired'));
      });
    });
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyErrorMessage(error: Error): string {
    const errorMessage = error.message.toLowerCase();
    
    // File system errors
    if (errorMessage.includes('enoent') || errorMessage.includes('no such file')) {
      return 'The conversion file could not be found. Please try again.';
    }
    
    if (errorMessage.includes('eacces') || errorMessage.includes('permission denied')) {
      return 'Permission denied. Please try again.';
    }
    
    if (errorMessage.includes('enospc') || errorMessage.includes('no space')) {
      return 'Server storage is full. Please try again later.';
    }
    
    // Network errors
    if (errorMessage.includes('timeout') || errorMessage.includes('etimedout')) {
      return 'The request timed out. Please try again.';
    }
    
    if (errorMessage.includes('econnreset') || errorMessage.includes('connection reset')) {
      return 'Connection was reset. Please try again.';
    }
    
    if (errorMessage.includes('enotfound') || errorMessage.includes('dns')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // API errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    
    if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
      return 'Access denied. Please try again later.';
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'Video not found. Please check the URL and try again.';
    }
    
    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('sql')) {
      return 'Database error. Please try again.';
    }
    
    // Generic fallback
    return 'Something went wrong. Please try again.';
  }

  /**
   * Generate filename from video title
   */
  private generateFilename(title: string, quality: string): string {
    // Clean title for filename
    const cleanTitle = title
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length

    const timestamp = Date.now();
    return `${cleanTitle}_${quality}_${timestamp}.mp3`;
  }

  /**
   * Get conversion job status
   */
  async getJobStatus(jobId: string): Promise<ConversionJob | null> {
    try {
      const result = await query(
        'SELECT * FROM conversions WHERE id = $1',
        [jobId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as ConversionJob;
    } catch (error) {
      logger.error(`❌ Failed to get job status: ${error}`);
      throw error;
    }
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string, limit: number = 10): Promise<ConversionJob[]> {
    try {
      const result = await query(
        'SELECT * FROM conversions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      );

      return result.rows as ConversionJob[];
    } catch (error) {
      logger.error(`❌ Failed to get user jobs: ${error}`);
      throw error;
    }
  }

  /**
   * Clean up old files
   */
  async cleanupOldFiles(): Promise<void> {
    try {
      logger.info('🧹 Starting cleanup of old files...');

      // Get expired jobs
      const result = await query(
        'SELECT * FROM conversions WHERE created_at < NOW() - INTERVAL \'24 hours\' AND mp3_filename IS NOT NULL'
      );

      const expiredJobs = result.rows;
      logger.info(`🗑️ Found ${expiredJobs.length} expired files to clean up`);

      for (const job of expiredJobs) {
        if (job.mp3_filename) {
    const filePath = path.join(this.downloadsDir, job.mp3_filename);
    try {
            await fs.unlink(filePath);
            logger.info(`🗑️ Deleted expired file: ${filePath}`);
    } catch (error) {
            logger.warn(`Failed to delete file ${filePath}:`, error);
          }
        }

        // Update job to mark as cleaned
        await query(
          'UPDATE conversions SET mp3_filename = NULL, file_size = NULL WHERE id = $1',
          [job.id]
        );
      }

      logger.info('✅ Cleanup completed');
    } catch (error) {
      logger.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Get conversion statistics
   */
  async getStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
  }> {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing
        FROM conversions
      `);

      const stats = result.rows[0];
      return {
        total: parseInt(stats.total),
        completed: parseInt(stats.completed),
        failed: parseInt(stats.failed),
        pending: parseInt(stats.pending),
        processing: parseInt(stats.processing)
      };
    } catch (error) {
      logger.error('❌ Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Create a new conversion job
   */
  async createJob(request: ConversionRequest): Promise<string> {
    try {
      logger.info(`🎵 Creating conversion job for: ${request.url}`);
      
      const job = await this.convertToMp3(request);
      return job.id;
          } catch (error) {
      logger.error(`❌ Failed to create job: ${error}`);
      throw new Error(this.getUserFriendlyErrorMessage(error as Error));
    }
  }

  /**
   * Refresh download URL for a job
   */
  async refreshDownloadUrl(jobId: string): Promise<string | null> {
    try {
      logger.info(`🔄 Refreshing download URL for job: ${jobId}`);
      
      const job = await this.getJobStatus(jobId);
      if (!job) {
        logger.warn(`❌ Job not found: ${jobId}`);
        return null;
      }

      if (job.status !== 'completed' || !job.mp3_filename) {
        logger.warn(`❌ Job not completed or no file: ${jobId}`);
        return null;
      }

      // Return the file path as download URL
      const filePath = path.join(this.downloadsDir, job.mp3_filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
        logger.info(`✅ Download URL refreshed for job: ${jobId}`);
        return filePath;
      } catch (error) {
        logger.error(`❌ File not found: ${filePath}`);
        return null;
      }
    } catch (error) {
      logger.error(`❌ Failed to refresh download URL: ${error}`);
      return null;
    }
  }
}