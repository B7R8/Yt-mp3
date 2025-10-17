import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import logger from '../config/logger';
import { query } from '../config/database';
import { ErrorHandler } from './errorHandler';

export interface ConversionRequest {
  url: string;
  quality?: string;
  trimStart?: number;
  trimDuration?: number;
  userId?: string;
  userIp?: string;
}

export interface ConversionJob {
  id: string;
  video_id: string;
  youtube_url: string;
  video_title?: string;
  user_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  quality: string;
  trim_start?: number;
  trim_duration?: number;
  file_path?: string;
  file_size?: number;
  duration?: number;
  ffmpeg_logs?: string;
  error_message?: string;
  download_url?: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date;
}

export interface VideoInfo {
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  viewCount: string;
}

export class ConversionService {
  private downloadsDir: string;
  private tempDir: string;
  private maxConcurrentJobs: number;
  private processingJobs: Map<string, Promise<void>>;
  private videoMutex: Map<string, string>; // video_id -> job_id

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
  private extractVideoId(url: string): string | null {
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
    try {
      // Check if video is already locked
      const existingLock = await query(
        'SELECT job_id FROM video_mutex WHERE video_id = $1 AND expires_at > CURRENT_TIMESTAMP',
        [videoId]
      );

      if (existingLock.rows.length > 0) {
        logger.warn(`Video ${videoId} is already being processed by job ${existingLock.rows[0].job_id}`);
        return false;
      }

      // Clean up expired locks
      await query(
        'DELETE FROM video_mutex WHERE expires_at <= CURRENT_TIMESTAMP',
        []
      );

      // Acquire lock
      await query(
        'INSERT INTO video_mutex (video_id, job_id, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL \'30 minutes\')',
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
    try {
      await query(
        'DELETE FROM video_mutex WHERE video_id = $1 AND job_id = $2',
        [videoId, jobId]
      );
      this.videoMutex.delete(videoId);
      logger.info(`Released mutex for video ${videoId} with job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to release mutex for video ${videoId}:`, error);
    }
  }

  /**
   * Get video information using yt-dlp
   */
  private async getVideoInfo(videoId: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-download',
        `https://www.youtube.com/watch?v=${videoId}`
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
        if (code !== 0) {
          logger.error(`yt-dlp failed for video ${videoId}: ${errorOutput}`);
          reject(new Error(`Failed to get video info: ${errorOutput}`));
          return;
        }

        try {
          const info = JSON.parse(output);
          const duration = info.duration || 0;
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const seconds = Math.floor(duration % 60);
          
          const durationFormatted = hours > 0 
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes}:${seconds.toString().padStart(2, '0')}`;

          resolve({
            title: info.title || 'Unknown Title',
            duration,
            durationFormatted,
            thumbnail: info.thumbnail || '',
            uploader: info.uploader || 'Unknown',
            viewCount: info.view_count ? info.view_count.toString() : '0'
          });
        } catch (error) {
          logger.error(`Failed to parse video info for ${videoId}:`, error);
          reject(new Error('Failed to parse video information'));
        }
      });
    });
  }

  /**
   * Download video using yt-dlp
   */
  private async downloadVideo(videoId: string, jobId: string): Promise<string> {
    const tempPath = path.join(this.tempDir, `${jobId}.%(ext)s`);
    
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0', // Best quality
        '--output', tempPath,
        '--no-playlist',
        `https://www.youtube.com/watch?v=${videoId}`
      ]);

      let errorOutput = '';

      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ytdlp.on('close', async (code) => {
        if (code !== 0) {
          logger.error(`yt-dlp download failed for video ${videoId}: ${errorOutput}`);
          reject(new Error(`Download failed: ${errorOutput}`));
          return;
        }

        // Find the downloaded file
        const expectedPath = path.join(this.tempDir, `${jobId}.mp3`);
        try {
          await fs.access(expectedPath);
          resolve(expectedPath);
        } catch (error) {
          reject(new Error('Downloaded file not found'));
        }
      });
    });
  }

  /**
   * Process audio with ffmpeg
   */
  private async processAudio(
    inputPath: string, 
    outputPath: string, 
    quality: string, 
    trimStart?: number, 
    trimDuration?: number
  ): Promise<{ logs: string; duration: number; fileSize: number }> {
    return new Promise((resolve, reject) => {
      const args = ['-i', inputPath];
      
      // Add trim parameters if specified
      if (trimStart !== undefined && trimDuration !== undefined) {
        args.push('-ss', trimStart.toString());
        args.push('-t', trimDuration.toString());
      }
      
      // Add quality settings
      const bitrate = quality.replace('k', '');
      args.push('-b:a', `${bitrate}k`);
      args.push('-y'); // Overwrite output file
      args.push(outputPath);

      const ffmpeg = spawn('ffmpeg', args);
      
      let logs = '';
      let errorLogs = '';

      ffmpeg.stdout.on('data', (data) => {
        logs += data.toString();
      });

      ffmpeg.stderr.on('data', (data) => {
        errorLogs += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (code !== 0) {
          logger.error(`ffmpeg processing failed: ${errorLogs}`);
          reject(new Error(`Audio processing failed: ${errorLogs}`));
          return;
        }

        try {
          const stats = await fs.stat(outputPath);
          const fileSize = stats.size;
          
          // Get duration from ffprobe
          const duration = await this.getAudioDuration(outputPath);
          
          resolve({
            logs: logs + errorLogs,
            duration,
            fileSize
          });
        } catch (error) {
          reject(new Error(`Failed to get file info: ${error}`));
        }
      });
    });
  }

  /**
   * Get audio duration using ffprobe
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        filePath
      ]);

      let output = '';

      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Failed to get audio duration'));
          return;
        }

        const duration = parseFloat(output.trim());
        resolve(isNaN(duration) ? 0 : duration);
      });
    });
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

      logger.info(`🎵 Creating conversion job: ${jobId} for video: ${videoId}`, {
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
          'SELECT id, status, download_url FROM jobs WHERE video_id = $1 AND status = $2 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1',
          [videoId, 'completed']
        );

        if (existingJob.rows.length > 0) {
          logger.info(`Returning existing completed job ${existingJob.rows[0].id} for video ${videoId}`, {
            existingJobId: existingJob.rows[0].id,
            videoId,
            userId: request.userId
          });
          return existingJob.rows[0].id;
        }

        throw new Error('Video is already being processed. Please wait for completion.');
      }

      // Get video information
      const videoInfo = await this.getVideoInfo(videoId);
      
      // Create job in database
      await query(
        `INSERT INTO jobs (
          id, video_id, youtube_url, video_title, user_id, status, quality, 
          trim_start, trim_duration, created_at, updated_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours')`,
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

      // Log user request
      if (request.userIp) {
        await query(
          'INSERT INTO user_requests (user_id, ip_address, video_id, job_id, request_type) VALUES ($1, $2, $3, $4, $5)',
          [request.userId, request.userIp, videoId, jobId, 'convert']
        );
      }

      logger.info(`✅ Job ${jobId} created successfully for video ${videoId}`, {
        jobId,
        videoId,
        videoTitle: videoInfo.title,
        userId: request.userId,
        quality: request.quality || '128k'
      });

      // Start processing asynchronously
      this.processJob(jobId).catch(error => {
        ErrorHandler.logTechnicalError(error, 'JOB_PROCESSING_FAILED', {
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
   * Process a conversion job
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
   * Actual job processing logic
   */
  private async doProcessJob(jobId: string): Promise<void> {
    let job: ConversionJob;
    let videoId: string = '';

    try {
      // Get job details
      const result = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }
      job = result.rows[0];
      videoId = job.video_id;

      logger.info(`🚀 Starting processing for job ${jobId}, video ${videoId}`, {
        jobId,
        videoId,
        videoTitle: job.video_title,
        quality: job.quality,
        trimStart: job.trim_start,
        trimDuration: job.trim_duration
      });

      // Update status to processing
      await this.updateJobStatus(jobId, 'processing');

      // Download video
      logger.info(`📥 Downloading video ${videoId} for job ${jobId}`, {
        jobId,
        videoId,
        operation: 'download'
      });
      const downloadedPath = await this.downloadVideo(videoId, jobId);
      logger.info(`✅ Downloaded video ${videoId} to ${downloadedPath}`, {
        jobId,
        videoId,
        downloadedPath
      });

      // Process audio
      const outputPath = path.join(this.downloadsDir, `${jobId}.mp3`);
      logger.info(`🎵 Processing audio for job ${jobId} with quality ${job.quality}`, {
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
        job.quality,
        job.trim_start,
        job.trim_duration
      );

      logger.info(`✅ Audio processing completed for job ${jobId}`, {
        jobId,
        videoId,
        fileSize: processResult.fileSize,
        duration: processResult.duration,
        outputPath
      });

      // Update job with results
      await query(
        `UPDATE jobs SET 
          status = $1, 
          file_path = $2, 
          file_size = $3, 
          duration = $4, 
          ffmpeg_logs = $5, 
          download_url = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7`,
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
        'INSERT INTO processed_files (job_id, file_path, file_size, expires_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL \'24 hours\')',
        [jobId, outputPath, processResult.fileSize]
      );

      // Clean up temp file
      try {
        await fs.unlink(downloadedPath);
      } catch (error) {
        logger.warn(`Failed to clean up temp file ${downloadedPath}:`, error);
      }

      logger.info(`🎉 Job ${jobId} completed successfully`, {
        jobId,
        videoId,
        videoTitle: job.video_title,
        fileSize: processResult.fileSize,
        duration: processResult.duration,
        quality: job.quality
      });

    } catch (error) {
      ErrorHandler.logTechnicalError(error, 'JOB_PROCESSING_ERROR', {
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
        'UPDATE jobs SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, errorMessage, jobId]
      );
      logger.info(`📝 Updated job ${jobId} status to: ${status}`);
    } catch (error) {
      logger.error(`Failed to update job ${jobId} status:`, error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ConversionJob | null> {
    try {
      const result = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
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
      logger.info('🧹 Starting cleanup of old files and expired jobs');

      // Clean up expired jobs
      const expiredJobs = await query(
        'SELECT id, file_path FROM jobs WHERE expires_at < CURRENT_TIMESTAMP AND status != $1',
        ['cancelled']
      );

      let cleanedCount = 0;
      for (const job of expiredJobs.rows) {
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
            'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['cancelled', job.id]
          );

          cleanedCount++;
        } catch (error) {
          logger.error(`Failed to cleanup job ${job.id}:`, error);
        }
      }

      // Clean up processed_files table
      await query(
        'DELETE FROM processed_files WHERE expires_at < CURRENT_TIMESTAMP',
        []
      );

      // Clean up expired video mutex locks
      await query(
        'DELETE FROM video_mutex WHERE expires_at < CURRENT_TIMESTAMP',
        []
      );

      logger.info(`✅ Cleanup completed. Processed ${cleanedCount} expired jobs.`);
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
        FROM jobs 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
        GROUP BY status
      `);

      const totalJobs = await query('SELECT COUNT(*) as total FROM jobs WHERE created_at > CURRENT_TIMESTAMP - INTERVAL \'24 hours\'');
      const activeJobs = this.processingJobs.size;

      return {
        jobs: stats.rows,
        totalJobs: totalJobs.rows[0]?.total || 0,
        activeJobs,
        maxConcurrentJobs: this.maxConcurrentJobs
      };
    } catch (error) {
      logger.error('Failed to get stats:', error);
      return { error: 'Failed to get statistics' };
    }
  }
}

export const conversionService = new ConversionService();
