import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { ConversionJob, ConversionRequest } from '../types';
import logger from '../config/logger';
import { db } from '../config/database';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorHandler';

export class ConversionService {
  private downloadsDir: string;

  constructor() {
    this.downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    this.ensureDownloadsDir();
  }

  private async ensureDownloadsDir(): Promise<void> {
    try {
      await fs.mkdir(this.downloadsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create downloads directory:', error);
    }
  }

  private async extractVideoTitle(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('python', ['-m', 'yt_dlp',
        '--get-title',
        '--no-playlist',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=android',
        url
      ]);

      let title = '';
      let errorOutput = '';

      ytdlp.stdout.on('data', (data) => {
        title += data.toString().trim();
      });

      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code === 0 && title) {
          resolve(title);
        } else {
          logger.warn(`Failed to extract video title for ${url}: ${errorOutput}`);
          resolve('Unknown Video'); // Fallback title
        }
      });

      ytdlp.on('error', (error) => {
        logger.error(`Error extracting video title for ${url}:`, error);
        resolve('Unknown Video'); // Fallback title
      });
    });
  }

  async createJob(request: ConversionRequest): Promise<string> {
    const jobId = uuidv4();
    const database = await db;

    try {
      // First, extract video title using yt-dlp
      const videoTitle = await this.extractVideoTitle(request.url);
      
      await database.run(
        `INSERT INTO conversions (id, youtube_url, video_title, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        [jobId, request.url, videoTitle]
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
        created_at: new Date(result.created_at),
        updated_at: new Date(result.updated_at)
      };
    } catch (error) {
      logger.error('Failed to get job status:', error);
      throw error;
    }
  }

  private async updateJobStatus(
    jobId: string, 
    status: string, 
    mp3Filename?: string, 
    errorMessage?: string
  ): Promise<void> {
    const database = await db;
    
    try {
      await database.run(
        `UPDATE conversions 
         SET status = ?, mp3_filename = ?, error_message = ?, updated_at = datetime('now') 
         WHERE id = ?`,
        [status, mp3Filename, errorMessage, jobId]
      );
    } catch (error) {
      logger.error('Failed to update job status:', error);
      throw error;
    }
  }

  /**
   * Download audio from YouTube using yt-dlp
   * Returns path to the downloaded audio file
   */
  private async downloadAudio(url: string, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ytdlpArgs = [
        '-m', 'yt_dlp',
        '-f', 'bestaudio[ext=m4a]/bestaudio/best',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '--output', outputPath,
        '--no-playlist',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=android',
        url
      ];

      logger.info(`Downloading audio with yt-dlp: ${ytdlpArgs.join(' ')}`);

      const ytdlp = spawn('python', ytdlpArgs);
      
      let errorOutput = '';
      let stdOutput = '';

      ytdlp.stdout.on('data', (data) => {
        stdOutput += data.toString();
        logger.debug(`yt-dlp stdout: ${data}`);
      });

      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
        logger.debug(`yt-dlp stderr: ${data}`);
      });

      ytdlp.on('close', async (code) => {
        if (code === 0) {
          // Check if file was created
          try {
            await fs.access(outputPath);
            logger.info(`Audio downloaded successfully to: ${outputPath}`);
            resolve(outputPath);
          } catch (error) {
            reject(new Error(`Output file not created: ${outputPath}`));
          }
        } else {
          reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput}`));
        }
      });

      ytdlp.on('error', (error) => {
        reject(new Error(`yt-dlp process error: ${error.message}`));
      });
    });
  }

  /**
   * Convert time string (HH:mm:ss) to seconds
   */
  private timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else {
      return parts[0];
    }
  }

  /**
   * Process audio with ffmpeg: trim and set bitrate
   */
  private async processAudioWithFFmpeg(
    inputPath: string,
    outputPath: string,
    bitrate: number,
    startTime?: string,
    endTime?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info(`Processing audio with FFmpeg: input=${inputPath}, output=${outputPath}, bitrate=${bitrate}k`);

      const command = ffmpeg(inputPath);

      // Set start time if provided
      if (startTime) {
        command.setStartTime(startTime);
        logger.info(`Setting start time: ${startTime}`);
      }

      // Calculate duration if both start and end times are provided
      if (startTime && endTime) {
        const startSeconds = this.timeToSeconds(startTime);
        const endSeconds = this.timeToSeconds(endTime);
        const duration = endSeconds - startSeconds;
        
        if (duration > 0) {
          command.setDuration(duration);
          logger.info(`Setting duration: ${duration} seconds (${startTime} to ${endTime})`);
        }
      }

      // Set audio bitrate and format
      command
        .audioBitrate(bitrate)
        .toFormat('mp3')
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.info(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          logger.debug(`Processing: ${JSON.stringify(progress)}`);
        })
        .on('end', () => {
          logger.info(`FFmpeg processing completed: ${outputPath}`);
          resolve();
        })
        .on('error', (error, stdout, stderr) => {
          logger.error(`FFmpeg error: ${error.message}`);
          logger.error(`FFmpeg stderr: ${stderr}`);
          reject(new Error(`FFmpeg processing failed: ${error.message}`));
        })
        .run();
    });
  }

  private async processConversion(jobId: string, request: ConversionRequest): Promise<void> {
    let tempAudioPath: string | null = null;
    
    try {
      await this.updateJobStatus(jobId, 'processing');
      
      const mp3Filename = `${jobId}.mp3`;
      const tempFilename = `${jobId}_temp.mp3`;
      const outputPath = path.join(this.downloadsDir, mp3Filename);
      tempAudioPath = path.join(this.downloadsDir, tempFilename);

      // Step 1: Download audio using yt-dlp
      logger.info(`[Job ${jobId}] Step 1: Downloading audio from ${request.url}`);
      await this.downloadAudio(request.url, tempAudioPath);

      // Step 2: Process with FFmpeg (trim + bitrate)
      const bitrate = request.quality ? parseInt(request.quality.replace('k', '')) : 192;
      
      if (request.trim_start && request.trim_end) {
        logger.info(`[Job ${jobId}] Step 2: Processing with FFmpeg (trim: ${request.trim_start} to ${request.trim_end}, bitrate: ${bitrate}k)`);
        await this.processAudioWithFFmpeg(
          tempAudioPath,
          outputPath,
          bitrate,
          request.trim_start,
          request.trim_end
        );
      } else {
        logger.info(`[Job ${jobId}] Step 2: Processing with FFmpeg (bitrate: ${bitrate}k, no trimming)`);
        await this.processAudioWithFFmpeg(
          tempAudioPath,
          outputPath,
          bitrate
        );
      }

      // Step 3: Cleanup temporary file
      try {
        await fs.unlink(tempAudioPath);
        logger.info(`[Job ${jobId}] Cleaned up temporary file: ${tempAudioPath}`);
      } catch (error) {
        logger.warn(`[Job ${jobId}] Failed to cleanup temp file:`, error);
      }

      // Step 4: Mark as completed
      await this.updateJobStatus(jobId, 'completed', mp3Filename);
      logger.info(`[Job ${jobId}] Conversion completed successfully`);

    } catch (error) {
      // Log technical error details for debugging
      logTechnicalError(error, `Conversion Job ${jobId}`);
      logger.error(`[Job ${jobId}] Conversion failed:`, error);
      
      // Cleanup temp file on error
      if (tempAudioPath) {
        try {
          await fs.unlink(tempAudioPath);
        } catch (cleanupError) {
          logger.warn(`[Job ${jobId}] Failed to cleanup temp file on error:`, cleanupError);
        }
      }
      
      // Store user-friendly error message only
      const userFriendlyError = getUserFriendlyError(error);
      await this.updateJobStatus(
        jobId, 
        'failed', 
        undefined, 
        userFriendlyError
      );
    }
  }

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

  async cleanupOldFiles(): Promise<void> {
    const maxAgeHours = parseInt(process.env.MAX_FILE_AGE_HOURS || '1');
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - maxAgeMs);

    const database = await db;
    
    try {
      // Get old completed jobs
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

        // Mark job as cleaned up
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
