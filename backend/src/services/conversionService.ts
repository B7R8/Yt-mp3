import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversionJob, ConversionRequest } from '../types';
import logger from '../config/logger';
import { db } from '../config/database';

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

  private async processConversion(jobId: string, request: ConversionRequest): Promise<void> {
    try {
      await this.updateJobStatus(jobId, 'processing');
      
      const mp3Filename = `${jobId}.mp3`;
      const outputPath = path.join(this.downloadsDir, mp3Filename);

      // Use yt-dlp to extract audio and convert to MP3
      const ytdlpArgs = [
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', request.quality || '192k',
        '--output', outputPath.replace('.mp3', '.%(ext)s'),
        request.url
      ];

      // Add trim options if provided
      if (request.trim_start && request.trim_end) {
        ytdlpArgs.push('--postprocessor-args', `ffmpeg:-ss ${request.trim_start} -to ${request.trim_end}`);
      }

      logger.info(`Starting conversion for job ${jobId} with args:`, ytdlpArgs);

      const ytdlp = spawn('python', ['-m', 'yt_dlp', ...ytdlpArgs]);
      
      let errorOutput = '';

      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
        logger.debug(`yt-dlp stderr: ${data}`);
      });

      ytdlp.on('close', async (code) => {
        if (code === 0) {
          // Check if file was created successfully
          try {
            await fs.access(outputPath);
            await this.updateJobStatus(jobId, 'completed', mp3Filename);
            logger.info(`Conversion completed successfully for job ${jobId}`);
          } catch (error) {
            logger.error(`Output file not found for job ${jobId}:`, error);
            await this.updateJobStatus(jobId, 'failed', undefined, 'Output file not created');
          }
        } else {
          logger.error(`yt-dlp process exited with code ${code}:`, errorOutput);
          await this.updateJobStatus(jobId, 'failed', undefined, `Conversion failed: ${errorOutput}`);
        }
      });

      ytdlp.on('error', async (error) => {
        logger.error(`yt-dlp process error for job ${jobId}:`, error);
        await this.updateJobStatus(jobId, 'failed', undefined, `Process error: ${error instanceof Error ? error.message : 'Unknown process error'}`);
      });

    } catch (error) {
      logger.error(`Conversion process error for job ${jobId}:`, error);
      await this.updateJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
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
