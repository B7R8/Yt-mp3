import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { ErrorHandler } from './errorHandler';
import { IConversionService, ConversionRequest, ConversionJob, VideoInfo } from './conversionService';

// Import database functions
let query: any;
try {
  const db = require('../config/database');
  query = db.query;
} catch (error) {
  logger.error('Failed to import database functions:', error);
}

export class FallbackConversionService implements IConversionService {
  private downloadsDir: string;
  private tempDir: string;
  public maxConcurrentJobs: number;
  private processingJobs: Map<string, Promise<void>>;
  private videoMutex: Map<string, string>;

  constructor() {
    this.downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    this.tempDir = process.env.TEMP_DIR || './temp';
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS || '5');
    this.processingJobs = new Map();
    this.videoMutex = new Map();
    
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.downloadsDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`Directories ensured: ${this.downloadsDir}, ${this.tempDir}`);
    } catch (error) {
      logger.error('Failed to create directories:', error);
      throw error;
    }
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
   * Check if video is already being processed (mutex)
   */
  private async acquireVideoMutex(videoId: string, jobId: string): Promise<boolean> {
    if (!query) {
      logger.warn('Database query function not available, skipping mutex check');
      return true; // Allow processing if database is not available
    }
    
    try {
      // Check if video is already locked
      const existingLock = await query(
        'SELECT job_id FROM video_mutex WHERE video_id = ? AND expires_at > datetime("now")',
        [videoId]
      );

      if (existingLock.length > 0) {
        logger.warn(`Video ${videoId} is already being processed by job ${existingLock[0].job_id}`);
        return false;
      }

      // Clean up expired locks
      await query(
        'DELETE FROM video_mutex WHERE expires_at <= datetime("now")',
        []
      );

      // Acquire lock
      await query(
        'INSERT INTO video_mutex (video_id, job_id, expires_at) VALUES (?, ?, datetime("now", "+30 minutes"))',
        [videoId, jobId]
      );

      this.videoMutex.set(videoId, jobId);
      logger.info(`Acquired mutex for video ${videoId} with job ${jobId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to acquire mutex for video ${videoId}:`, error);
      return false;
    }
  }

  /**
   * Release video mutex
   */
  private async releaseVideoMutex(videoId: string, jobId: string): Promise<void> {
    if (!query) {
      logger.warn('Database query function not available, skipping mutex release');
      return;
    }
    
    try {
      await query(
        'DELETE FROM video_mutex WHERE video_id = ? AND job_id = ?',
        [videoId, jobId]
      );
      this.videoMutex.delete(videoId);
      logger.info(`Released mutex for video ${videoId} with job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to release mutex for video ${videoId}:`, error);
    }
  }

  /**
   * Get video information (fallback - returns mock data)
   */
  async getVideoInfo(videoId: string): Promise<VideoInfo> {
    // Fallback implementation - return mock data
    return {
      title: `YouTube Video ${videoId}`,
      duration: 180, // 3 minutes
      durationFormatted: '3:00',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      uploader: 'Unknown Channel',
      viewCount: '1000000'
    };
  }

  /**
   * Download video (fallback - creates mock file)
   */
  private async downloadVideo(videoId: string, jobId: string): Promise<string> {
    const tempPath = path.join(this.tempDir, `${jobId}.mp3`);
    
    // Create a mock downloaded file
    const mockContent = Buffer.from('Mock downloaded video content for testing');
    await fs.writeFile(tempPath, mockContent);
    
    logger.info(`Mock download completed for video ${videoId} to ${tempPath}`);
    return tempPath;
  }

  /**
   * Process audio (fallback - creates mock processed file)
   */
  private async processAudio(
    inputPath: string, 
    outputPath: string, 
    quality: string, 
    trimStart?: number, 
    trimDuration?: number
  ): Promise<{ logs: string; duration: number; fileSize: number }> {
    // Create a mock processed file
    const mockContent = Buffer.from(`Mock processed audio content - Quality: ${quality}, Trim: ${trimStart || 0}-${trimDuration || 'none'}`);
    await fs.writeFile(outputPath, mockContent);
    
    logger.info(`Mock audio processing completed: ${inputPath} -> ${outputPath}`);
    
    return {
      logs: `Mock processing completed successfully. Quality: ${quality}, Trim: ${trimStart || 0}-${trimDuration || 'none'}`,
      duration: 180, // 3 minutes
      fileSize: mockContent.length
    };
  }

  /**
   * Get audio duration (fallback - returns mock duration)
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    // Return mock duration
    return 180; // 3 minutes
  }

  /**
   * Create a new conversion job
   */
  async createJob(request: ConversionRequest): Promise<string> {
    const jobId = uuidv4();
    const videoId = this.extractVideoId(request.url);
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    logger.info(`🎵 Creating fallback conversion job: ${jobId} for video: ${videoId}`, {
      jobId,
      videoId,
      userId: request.userId,
      userIp: request.userIp,
      quality: request.quality,
      trimStart: request.trimStart,
      trimDuration: request.trimDuration
    });

    try {
      // Check if video is already being processed
      const mutexAcquired = await this.acquireVideoMutex(videoId, jobId);
      if (!mutexAcquired) {
        // Check if there's an existing completed job for this video
        const existingJob = await query(
          'SELECT id, status, download_url FROM jobs WHERE video_id = ? AND status = ? AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
          [videoId, 'completed']
        );

        if (existingJob.length > 0) {
          logger.info(`Returning existing completed job ${existingJob[0].id} for video ${videoId}`, {
            existingJobId: existingJob[0].id,
            videoId,
            userId: request.userId
          });
          return existingJob[0].id;
        }

        throw new Error('Video is already being processed. Please wait for completion.');
      }

      // Get video information
      const videoInfo = await this.getVideoInfo(videoId);
      
      // Create job in database
      if (query) {
        await query(
          `INSERT INTO jobs (
            id, video_id, youtube_url, video_title, user_id, status, quality, 
            trim_start, trim_duration, created_at, updated_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"), datetime("now", "+24 hours"))`,
          [
            jobId,
            videoId,
            request.url,
            videoInfo.title,
            request.userId,
            'pending',
            request.quality || '128k',
            request.trimStart,
            request.trimDuration
          ]
        );
      } else {
        logger.warn('Database not available, creating job without persistence');
      }

      // Log user request
      if (request.userIp && query) {
        await query(
          'INSERT INTO user_requests (id, user_id, ip_address, video_id, job_id, request_type, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
          [uuidv4(), request.userId, request.userIp, videoId, jobId, 'convert']
        );
      }

      logger.info(`✅ Fallback job ${jobId} created successfully for video ${videoId}`, {
        jobId,
        videoId,
        videoTitle: videoInfo.title,
        userId: request.userId,
        quality: request.quality || '128k'
      });

      // Start processing asynchronously
      this.processJob(jobId).catch(error => {
        ErrorHandler.logTechnicalError(error, 'FALLBACK_JOB_PROCESSING_FAILED', {
          jobId,
          videoId,
          userId: request.userId,
          operation: 'processJob'
        });
        this.updateJobStatus(jobId, 'failed', error.message);
      });

      return jobId;
    } catch (error) {
      // Release mutex on error
      await this.releaseVideoMutex(videoId, jobId);
      throw error;
    }
  }

  /**
   * Process a conversion job (fallback - creates mock file)
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
   * Actual job processing logic (fallback)
   */
  private async doProcessJob(jobId: string): Promise<void> {
    let job: ConversionJob;
    let videoId: string = '';

    try {
      // Get job details
      const result = await query('SELECT * FROM jobs WHERE id = ?', [jobId]);
      if (result.length === 0) {
        throw new Error('Job not found');
      }
      job = result[0];
      videoId = this.extractVideoId(job.youtube_url) || '';

      logger.info(`🚀 Starting fallback processing for job ${jobId}, video ${videoId}`, {
        jobId,
        videoId,
        videoTitle: job.video_title,
        quality: job.quality,
        trimStart: job.trim_start,
        trimDuration: job.trim_duration
      });

      // Update status to processing
      await this.updateJobStatus(jobId, 'processing');

      // Download video (mock)
      logger.info(`📥 Mock downloading video ${videoId} for job ${jobId}`, {
        jobId,
        videoId,
        operation: 'download'
      });
      const downloadedPath = await this.downloadVideo(videoId, jobId);
      logger.info(`✅ Mock downloaded video ${videoId} to ${downloadedPath}`, {
        jobId,
        videoId,
        downloadedPath
      });

      // Process audio
      const outputPath = path.join(this.downloadsDir, `${jobId}.mp3`);
      logger.info(`🎵 Mock processing audio for job ${jobId} with quality ${job.quality}`, {
        jobId,
        videoId,
        quality: job.quality,
        trimStart: job.trim_start,
        trimDuration: job.trim_duration,
        outputPath
      });
      
      const processResult = await this.processAudio(
        downloadedPath,
        outputPath,
        job.quality || '192k',
        job.trim_start,
        job.trim_duration
      );

      logger.info(`✅ Mock audio processing completed for job ${jobId}`, {
        jobId,
        videoId,
        fileSize: processResult.fileSize,
        duration: processResult.duration,
        outputPath
      });

      // Update job with results
      await query(
        `UPDATE jobs SET 
          status = ?, 
          file_path = ?, 
          file_size = ?, 
          duration = ?, 
          ffmpeg_logs = ?, 
          download_url = ?,
          updated_at = datetime("now")
        WHERE id = ?`,
        [
          'completed',
          outputPath,
          processResult.fileSize,
          processResult.duration,
          processResult.logs,
          `/api/download/${jobId}`,
          jobId
        ]
      );

      // Record processed file
      await query(
        'INSERT INTO processed_files (id, job_id, file_path, file_size, expires_at) VALUES (?, ?, ?, ?, datetime("now", "+24 hours"))',
        [uuidv4(), jobId, outputPath, processResult.fileSize]
      );

      // Clean up temp file
      try {
        await fs.unlink(downloadedPath);
      } catch (error) {
        logger.warn(`Failed to clean up temp file ${downloadedPath}:`, error);
      }

      logger.info(`🎉 Fallback job ${jobId} completed successfully`, {
        jobId,
        videoId,
        videoTitle: job.video_title,
        fileSize: processResult.fileSize,
        duration: processResult.duration,
        quality: job.quality
      });

    } catch (error) {
      ErrorHandler.logTechnicalError(error, 'FALLBACK_JOB_PROCESSING_ERROR', {
        jobId,
        videoId,
        operation: 'doProcessJob'
      });
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : String(error));
    } finally {
      // Release mutex
      if (videoId) {
        await this.releaseVideoMutex(videoId, jobId);
      }
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    try {
      await query(
        'UPDATE jobs SET status = ?, error_message = ?, updated_at = datetime("now") WHERE id = ?',
        [status, errorMessage, jobId]
      );
      logger.info(`📝 Updated fallback job ${jobId} status to: ${status}`);
    } catch (error) {
      logger.error(`Failed to update job ${jobId} status:`, error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ConversionJob | null> {
    try {
      const result = await query('SELECT * FROM jobs WHERE id = ?', [jobId]);
      return result.length > 0 ? result[0] : null;
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
      logger.info('🧹 Starting fallback cleanup of old files and expired jobs');

      // Clean up expired jobs
      const expiredJobs = await query(
        'SELECT id, file_path FROM jobs WHERE expires_at < datetime("now") AND status != ?',
        ['cancelled']
      );

      let cleanedCount = 0;
      for (const job of expiredJobs) {
        try {
          // Delete file if it exists
          if (job.file_path) {
            try {
              await fs.unlink(job.file_path);
              logger.info(`🗑️ Deleted expired file: ${job.file_path}`);
            } catch (error) {
              logger.warn(`Failed to delete file ${job.file_path}:`, error);
            }
          }

          // Update job status
          await query(
            'UPDATE jobs SET status = ?, updated_at = datetime("now") WHERE id = ?',
            ['cancelled', job.id]
          );

          cleanedCount++;
        } catch (error) {
          logger.error(`Failed to cleanup job ${job.id}:`, error);
        }
      }

      // Clean up processed_files table
      await query(
        'DELETE FROM processed_files WHERE expires_at < datetime("now")',
        []
      );

      // Clean up expired video mutex locks
      await query(
        'DELETE FROM video_mutex WHERE expires_at < datetime("now")',
        []
      );

      logger.info(`✅ Fallback cleanup completed. Processed ${cleanedCount} expired jobs.`);
    } catch (error) {
      logger.error('❌ Fallback cleanup failed:', error);
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
        FROM jobs 
        WHERE created_at > datetime("now", "-24 hours")
        GROUP BY status
      `);

      const totalJobs = await query('SELECT COUNT(*) as total FROM jobs WHERE created_at > datetime("now", "-24 hours")');
      const activeJobs = this.processingJobs.size;

      return {
        jobs: stats,
        totalJobs: totalJobs[0]?.total || 0,
        activeJobs,
        maxConcurrentJobs: 5,
        mode: 'fallback'
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return { error: 'Failed to get statistics' };
    }
  }
}

export const fallbackConversionService = new FallbackConversionService();
