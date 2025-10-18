import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { query } from '../config/database';
import { ErrorHandler } from './errorHandler';
import { YouTubeMp3ApiService } from './youtubeMp3ApiService';

export interface ConversionRequest {
  url: string;
  quality?: string;
  trimStart?: number;
  trimDuration?: number;
  userId?: string;
  userIp?: string;
}

export interface ConversionJob {
  id: number;
  video_id: string;
  title?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  progress?: number;
  download_url?: string;
  requested_at: Date;
  completed_at?: Date;
  error_message?: string;
  quality?: string;
  file_size?: number;
  duration?: number;
  user_ip?: string;
  expires_at: Date;
  updated_at: Date;
}

export interface VideoInfo {
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  viewCount: string;
}

export interface IConversionService {
  maxConcurrentJobs: number;
  createJob(request: ConversionRequest): Promise<string>;
  getJobStatus(jobId: string): Promise<ConversionJob | null>;
  cleanupOldFiles(): Promise<void>;
  getStats(): Promise<any>;
  extractVideoId(url: string): string | null;
  getVideoInfo(videoId: string): Promise<VideoInfo>;
}

export class RapidApiConversionService implements IConversionService {
  private rapidApiService: YouTubeMp3ApiService;
  public maxConcurrentJobs: number;
  private processingJobs: Map<string, Promise<void>>;
  private isPostgreSQL: boolean;

  constructor() {
    this.rapidApiService = new YouTubeMp3ApiService();
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS || '5');
    this.processingJobs = new Map();
    this.isPostgreSQL = process.env.NODE_ENV === 'production' || process.env.DB_TYPE === 'postgres';
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=|gaming\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Get video information using RapidAPI
   */
  async getVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const videoInfo = await this.rapidApiService.getVideoInfo(url);
      
      return {
        title: videoInfo.title,
        duration: videoInfo.duration,
        durationFormatted: videoInfo.durationFormatted,
        thumbnail: videoInfo.thumbnail,
        uploader: videoInfo.uploader,
        viewCount: videoInfo.viewCount.toString()
      };
    } catch (error) {
      logger.error(`Failed to get video info for ${videoId}:`, error);
      // Return fallback info
      return {
        title: `YouTube Video ${videoId}`,
        duration: 0,
        durationFormatted: '0:00',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        uploader: 'Unknown',
        viewCount: '0'
      };
    }
  }

  /**
   * Create a new conversion job with proper locking
   */
  async createJob(request: ConversionRequest): Promise<string> {
    const videoId = this.extractVideoId(request.url);
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    logger.info(`🎵 Creating RapidAPI conversion job for video: ${videoId}`, {
      videoId,
      userId: request.userId,
      userIp: request.userIp,
      quality: request.quality
    });

    try {
      // Check if video is already being processed or completed
      const existingJob = await query(
        'SELECT id, status, download_url, completed_at FROM videos WHERE video_id = $1 ORDER BY requested_at DESC LIMIT 1',
        [videoId]
      );

      if (existingJob.rows.length > 0) {
        const job = existingJob.rows[0];
        
        // If already processing, return existing job
        if (job.status === 'processing') {
          logger.info(`Video ${videoId} is already being processed by job ${job.id}`);
          return job.id.toString();
        }
        
        // If completed and still valid, return existing job
        if (job.status === 'done' && job.download_url && job.completed_at) {
          const completedAt = new Date(job.completed_at);
          const now = new Date();
          const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
          
          // If completed within last 7 days, return existing job
          if (hoursSinceCompletion < 168) { // 7 days = 168 hours
            logger.info(`Returning existing completed job ${job.id} for video ${videoId}`);
            return job.id.toString();
          }
        }
      }

      // Get video information first
      const videoInfo = await this.getVideoInfo(videoId);
      
      // Create new job in database
      const expiresAt = this.isPostgreSQL 
        ? "CURRENT_TIMESTAMP + INTERVAL '7 days'"
        : "datetime('now', '+7 days')";
        
      const result = await query(
        `INSERT INTO videos (
          video_id, title, status, quality, user_ip, requested_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, ${expiresAt})`,
        [
          videoId,
          videoInfo.title,
          'pending',
          request.quality || '128k',
          request.userIp
        ]
      );

      // Get the inserted job ID
      const jobResult = await query(
        'SELECT id FROM videos WHERE video_id = $1 ORDER BY id DESC LIMIT 1',
        [videoId]
      );
      
      const jobId = jobResult.rows[0].id.toString();

      logger.info(`✅ RapidAPI job ${jobId} created successfully for video ${videoId}`, {
        jobId,
        videoId,
        videoTitle: videoInfo.title,
        userId: request.userId,
        quality: request.quality || '128k'
      });

      // Start processing asynchronously
      this.processJob(jobId).catch(error => {
        ErrorHandler.logTechnicalError(error, 'RAPIDAPI_JOB_PROCESSING_FAILED', {
          jobId,
          videoId,
          userId: request.userId,
          operation: 'processJob'
        });
        this.updateJobStatus(jobId, 'failed', error.message);
      });

      return jobId;
    } catch (error) {
      logger.error(`Failed to create job for video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Process a conversion job using RapidAPI only
   */
  private async processJob(jobId: string): Promise<void> {
    // Check if already processing
    if (this.processingJobs.has(jobId)) {
      logger.warn(`Job ${jobId} is already being processed`);
      return;
    }

    const processingPromise = this.doProcessJob(jobId);
    this.processingJobs.set(jobId, processingPromise);

    try {
      await processingPromise;
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  /**
   * Actual job processing logic using RapidAPI
   */
  private async doProcessJob(jobId: string): Promise<void> {
    let job: ConversionJob;
    let videoId: string = '';

    try {
      // Get job details
      const result = await query('SELECT * FROM videos WHERE id = $1', [jobId]);
      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }
      job = result.rows[0];
      videoId = job.video_id;

      logger.info(`🚀 Starting RapidAPI processing for job ${jobId}, video ${videoId}`, {
        jobId,
        videoId,
        videoTitle: job.title,
        quality: job.quality
      });

      // Update status to processing
      await this.updateJobStatus(jobId, 'processing');

      // Get video info and update progress
      const videoInfo = await this.getVideoInfo(videoId);
      await this.updateJobProgress(jobId, 20);

      // Call RapidAPI to get download link
      logger.info(`🔗 Calling RapidAPI for video ${videoId}`, {
        jobId,
        videoId,
        operation: 'rapidapi_convert'
      });

      const conversionResult = await this.rapidApiService.convertToMp3(
        `https://www.youtube.com/watch?v=${videoId}`,
        job.quality || '128k'
      );

      await this.updateJobProgress(jobId, 80);

      if (!conversionResult.success || !conversionResult.downloadUrl) {
        throw new Error(conversionResult.error || 'RapidAPI conversion failed');
      }

      // Update job with results
      await query(
        `UPDATE videos SET 
          status = $1, 
          download_url = $2, 
          file_size = $3, 
          duration = $4, 
          progress = $5,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6`,
        [
          'done',
          conversionResult.downloadUrl,
          conversionResult.filesize || 0,
          conversionResult.duration || 0,
          100,
          jobId
        ]
      );

      logger.info(`🎉 RapidAPI job ${jobId} completed successfully`, {
        jobId,
        videoId,
        videoTitle: job.title,
        downloadUrl: conversionResult.downloadUrl,
        fileSize: conversionResult.filesize,
        duration: conversionResult.duration,
        quality: job.quality
      });

    } catch (error) {
      ErrorHandler.logTechnicalError(error, 'RAPIDAPI_JOB_PROCESSING_ERROR', {
        jobId,
        videoId,
        operation: 'doProcessJob'
      });
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    try {
      await query(
        'UPDATE videos SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, errorMessage, jobId]
      );
      logger.info(`📝 Updated job ${jobId} status to: ${status}`);
    } catch (error) {
      logger.error(`Failed to update job ${jobId} status:`, error);
    }
  }

  /**
   * Update job progress
   */
  private async updateJobProgress(jobId: string, progress: number): Promise<void> {
    try {
      await query(
        'UPDATE videos SET progress = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [progress, jobId]
      );
      logger.info(`📊 Updated job ${jobId} progress to: ${progress}%`);
    } catch (error) {
      logger.error(`Failed to update job ${jobId} progress:`, error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ConversionJob | null> {
    try {
      const result = await query('SELECT * FROM videos WHERE id = $1', [jobId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error(`Failed to get job status for ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Clean up old files and expired jobs
   */
  async cleanupOldFiles(): Promise<void> {
    try {
      logger.info('🧹 Starting cleanup of expired videos');

      // Clean up completed videos older than 7 days
      const completedCondition = this.isPostgreSQL 
        ? "completed_at < CURRENT_TIMESTAMP - INTERVAL '7 days'"
        : "completed_at < datetime('now', '-7 days')";
        
      const completedResult = await query(
        `DELETE FROM videos 
         WHERE status = 'done' 
         AND ${completedCondition}`
      );

      // Clean up failed jobs older than 1 day
      const failedCondition = this.isPostgreSQL 
        ? "requested_at < CURRENT_TIMESTAMP - INTERVAL '1 day'"
        : "requested_at < datetime('now', '-1 day')";
        
      const failedResult = await query(
        `DELETE FROM videos 
         WHERE status = 'failed' 
         AND ${failedCondition}`
      );

      const deletedCount = (completedResult.rowCount || 0) + (failedResult.rowCount || 0);
      logger.info(`✅ Cleanup completed. Deleted ${deletedCount} expired videos.`);
    } catch (error) {
      logger.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Get system statistics
   */
  async getStats(): Promise<any> {
    try {
      const stats = await query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM videos 
        WHERE requested_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
        GROUP BY status
      `);

      const totalJobs = await query('SELECT COUNT(*) as total FROM videos WHERE requested_at > CURRENT_TIMESTAMP - INTERVAL \'24 hours\'');
      const activeJobs = this.processingJobs.size;

      return {
        jobs: stats.rows,
        totalJobs: totalJobs.rows[0]?.total || 0,
        activeJobs,
        maxConcurrentJobs: this.maxConcurrentJobs,
        mode: 'rapidapi'
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return { error: 'Failed to get statistics' };
    }
  }
}

export const rapidApiConversionService = new RapidApiConversionService();
