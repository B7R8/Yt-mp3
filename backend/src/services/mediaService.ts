import axios, { AxiosResponse } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { query } from '../config/database';

export interface ProcessAudioRequest {
  sourceUrl: string;
  action: 'trim' | 'reencode' | 'none';
  trim?: {
    start: number;
    duration: number;
  };
  bitrate?: 64 | 128 | 192 | 256 | 320;
  expireMinutes?: number;
}

export interface JobData {
  id: string;
  source_url: string;
  status: string;
  direct_download_url?: string;
  processed_path?: string;
  file_size?: number;
  duration?: number;
  bitrate?: number;
  action?: string;
  trim_start?: number;
  trim_duration?: number;
  download_token?: string;
  created_at: Date;
  expires_at: Date;
  error_message?: string;
}

export class MediaService {
  private tmpDir: string;
  private maxFileSize: number;
  private allowedBitrates = [64, 128, 192, 256, 320];

  constructor() {
    this.tmpDir = process.env.TMP_DIR || '/tmp/app-media';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '100000000'); // 100MB default
    
    // Ensure tmp directory exists
    this.ensureTmpDirectory();
  }

  private ensureTmpDirectory(): void {
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
      logger.info(`Created temporary directory: ${this.tmpDir}`);
    }
  }

  /**
   * Create a new audio processing job
   */
  async createJob(request: ProcessAudioRequest): Promise<JobData> {
    const jobId = uuidv4();
    const downloadToken = uuidv4();
    const expireMinutes = request.expireMinutes || 20;
    const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);

    // Validate bitrate
    if (request.bitrate && !this.allowedBitrates.includes(request.bitrate)) {
      throw new Error(`Invalid bitrate. Allowed values: ${this.allowedBitrates.join(', ')}`);
    }

    // Validate trim parameters
    if (request.action === 'trim' && request.trim) {
      if (request.trim.start < 0 || request.trim.duration <= 0) {
        throw new Error('Invalid trim parameters: start must be >= 0, duration must be > 0');
      }
    }

    const jobData: Partial<JobData> = {
      id: jobId,
      source_url: request.sourceUrl,
      status: 'pending',
      action: request.action,
      bitrate: request.bitrate,
      trim_start: request.trim?.start,
      trim_duration: request.trim?.duration,
      download_token: downloadToken,
      expires_at: expiresAt
    };

    try {
      const result = await query(`
        INSERT INTO jobs (
          id, source_url, status, action, bitrate, trim_start, trim_duration, 
          download_token, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        jobData.id,
        jobData.source_url,
        jobData.status,
        jobData.action,
        jobData.bitrate,
        jobData.trim_start,
        jobData.trim_duration,
        jobData.download_token,
        jobData.expires_at
      ]);

      logger.info(`Created audio processing job: ${jobId}`, { 
        sourceUrl: request.sourceUrl, 
        action: request.action,
        expiresAt 
      });

      return result.rows[0] as JobData;
    } catch (error) {
      logger.error('Failed to create job:', error);
      throw new Error('Failed to create processing job');
    }
  }

  /**
   * Download file from URL to temporary location
   */
  async downloadFile(jobId: string, sourceUrl: string): Promise<string> {
    const tempPath = path.join(this.tmpDir, `${jobId}.mp3.part`);
    const finalPath = path.join(this.tmpDir, `${jobId}.mp3`);

    logger.info(`Starting download for job ${jobId}`, { sourceUrl });

    try {
      const response: AxiosResponse = await axios({
        method: 'GET',
        url: sourceUrl,
        responseType: 'stream',
        timeout: 300000, // 5 minutes timeout
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Check content type
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('audio/') && !contentType.includes('application/octet-stream')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      // Check file size
      const contentLength = response.headers['content-length'];
      if (contentLength && parseInt(contentLength) > this.maxFileSize) {
        throw new Error(`File too large: ${contentLength} bytes (max: ${this.maxFileSize})`);
      }

      // Stream download to file
      const writer = fs.createWriteStream(tempPath);
      let downloadedBytes = 0;

      response.data.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        if (downloadedBytes > this.maxFileSize) {
          writer.destroy();
          fs.unlinkSync(tempPath);
          throw new Error(`File too large: ${downloadedBytes} bytes (max: ${this.maxFileSize})`);
        }
      });

      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
        response.data.on('error', reject);
      });

      // Rename to final path
      fs.renameSync(tempPath, finalPath);

      // Get file stats
      const stats = fs.statSync(finalPath);
      const fileSize = stats.size;

      // Update job with download info
      await query(`
        UPDATE jobs 
        SET status = 'processing', direct_download_url = $1, file_size = $2
        WHERE id = $3
      `, [sourceUrl, fileSize, jobId]);

      logger.info(`Download completed for job ${jobId}`, { 
        fileSize, 
        path: finalPath 
      });

      return finalPath;
    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }

      logger.error(`Download failed for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Process audio file with ffmpeg
   */
  async processAudio(jobId: string, inputPath: string, jobData: JobData): Promise<string> {
    const outputPath = path.join(this.tmpDir, `${jobId}_processed.mp3`);
    
    logger.info(`Starting audio processing for job ${jobId}`, { 
      action: jobData.action,
      bitrate: jobData.bitrate,
      trim: jobData.action === 'trim' ? { start: jobData.trim_start, duration: jobData.trim_duration } : null
    });

    try {
      const ffmpegArgs = this.buildFfmpegArgs(inputPath, outputPath, jobData);
      
      logger.debug(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
      
      let stderr = '';
      
      ffmpegProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const exitCode = await new Promise<number>((resolve, reject) => {
        ffmpegProcess.on('close', (code) => {
          resolve(code || 0);
        });
        ffmpegProcess.on('error', (error) => {
          reject(error);
        });
      });

      if (exitCode !== 0) {
        throw new Error(`FFmpeg failed with exit code ${exitCode}: ${stderr}`);
      }

      // Verify output file exists and get stats
      if (!fs.existsSync(outputPath)) {
        throw new Error('FFmpeg processing completed but output file not found');
      }

      const stats = fs.statSync(outputPath);
      const processedFileSize = stats.size;

      // Get audio duration from ffmpeg output
      const duration = this.extractDurationFromFfmpegOutput(stderr);

      // Update job with processing results
      await query(`
        UPDATE jobs 
        SET status = 'ready', processed_path = $1, file_size = $2, duration = $3
        WHERE id = $4
      `, [outputPath, processedFileSize, duration, jobId]);

      // Clean up original file
      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      logger.info(`Audio processing completed for job ${jobId}`, { 
        outputPath, 
        fileSize: processedFileSize,
        duration 
      });

      return outputPath;
    } catch (error) {
      // Clean up output file if it exists
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      logger.error(`Audio processing failed for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Build ffmpeg command arguments based on job parameters
   */
  private buildFfmpegArgs(inputPath: string, outputPath: string, jobData: JobData): string[] {
    const args = ['-i', inputPath];

    // Add trim parameters if action is trim
    if (jobData.action === 'trim' && jobData.trim_start !== undefined && jobData.trim_duration !== undefined) {
      args.push('-ss', jobData.trim_start.toString());
      args.push('-t', jobData.trim_duration.toString());
    }

    // Add bitrate/quality settings
    if (jobData.bitrate) {
      args.push('-b:a', `${jobData.bitrate}k`);
    }

    // Add codec settings based on action
    if (jobData.action === 'reencode') {
      args.push('-c:a', 'libmp3lame');
    } else if (jobData.action === 'none') {
      args.push('-c', 'copy');
    } else {
      // Default for trim or other actions
      args.push('-c:a', 'libmp3lame');
    }

    // Add output file and overwrite flag
    args.push('-y', outputPath);

    return args;
  }

  /**
   * Extract duration from ffmpeg stderr output
   */
  private extractDurationFromFfmpegOutput(stderr: string): number | null {
    try {
      // Look for duration in format "Duration: HH:MM:SS.mmm"
      const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        return hours * 3600 + minutes * 60 + seconds;
      }
    } catch (error) {
      logger.warn('Failed to extract duration from ffmpeg output:', error);
    }
    return null;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<JobData | null> {
    try {
      const result = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
      return result.rows[0] as JobData || null;
    } catch (error) {
      logger.error(`Failed to get job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Get job by download token
   */
  async getJobByToken(token: string): Promise<JobData | null> {
    try {
      const result = await query('SELECT * FROM jobs WHERE download_token = $1', [token]);
      return result.rows[0] as JobData || null;
    } catch (error) {
      logger.error(`Failed to get job by token ${token}:`, error);
      return null;
    }
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void> {
    try {
      await query(`
        UPDATE jobs 
        SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, errorMessage, jobId]);
      
      logger.info(`Updated job ${jobId} status to ${status}`, { errorMessage });
    } catch (error) {
      logger.error(`Failed to update job ${jobId} status:`, error);
      throw error;
    }
  }

  /**
   * Delete job and associated files
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        logger.warn(`Job ${jobId} not found for deletion`);
        return;
      }

      // Delete files
      if (job.processed_path && fs.existsSync(job.processed_path)) {
        fs.unlinkSync(job.processed_path);
        logger.info(`Deleted processed file: ${job.processed_path}`);
      }

      // Update job status to deleted
      await query(`
        UPDATE jobs 
        SET status = 'deleted', processed_path = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [jobId]);

      logger.info(`Deleted job ${jobId}`);
    } catch (error) {
      logger.error(`Failed to delete job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up expired jobs and files
   */
  async cleanupExpiredJobs(): Promise<number> {
    try {
      // For RapidAPI-only system, we don't have local files to clean up
      // Just return 0 to indicate no cleanup needed
      logger.info('RapidAPI-only system: No local files to clean up');
      return 0;
    } catch (error) {
      logger.error('Failed to cleanup expired jobs:', error);
      return 0;
    }
  }

  /**
   * Schedule job deletion after expiration
   */
  scheduleJobDeletion(jobId: string, expireMinutes: number): void {
    const deleteTime = expireMinutes * 60 * 1000; // Convert to milliseconds
    
    setTimeout(async () => {
      try {
        await this.deleteJob(jobId);
      } catch (error) {
        logger.error(`Scheduled deletion failed for job ${jobId}:`, error);
      }
    }, deleteTime);

    logger.info(`Scheduled deletion for job ${jobId} in ${expireMinutes} minutes`);
  }
}

export default new MediaService();
