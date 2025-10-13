import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { ConversionJob, ConversionRequest } from '../types';
import logger from '../config/logger';
import { db } from '../config/database';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorHandler';
import { processVideoTitle, preserveExactTitle, isValidTitle } from '../utils/titleProcessor';

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
      ], {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          LANG: 'en_US.UTF-8',
          LC_ALL: 'en_US.UTF-8'
        }
      });

      let title = '';
      let errorOutput = '';

      ytdlp.stdout.on('data', (data: Buffer) => {
        // Use UTF-8 encoding explicitly and accumulate all data
        const chunk = data.toString('utf8');
        title += chunk;
      });

      ytdlp.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString('utf8');
      });

      ytdlp.on('close', (code: number | null) => {
        if (code === 0 && title) {
          // Preserve the exact original title from yt-dlp
          const exactTitle = preserveExactTitle(title);
          logger.info(`Extracted exact title: "${exactTitle}" (raw: "${title}")`);
          resolve(exactTitle);
        } else {
          logger.warn(`Failed to extract video title for ${url}: ${errorOutput}`);
          resolve('Unknown Video'); // Fallback title
        }
      });

      ytdlp.on('error', (error: Error) => {
        logger.error(`Error extracting video title for ${url}:`, error);
        resolve('Unknown Video'); // Fallback title
      });
    });
  }

  private async checkBlacklist(url: string): Promise<{ isBlacklisted: boolean; reason?: string; type?: string }> {
    try {
      const database = await db;
      
      // Extract video ID from URL
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;
      
      // Check for exact URL match
      const urlMatch = await database.get(
        'SELECT reason FROM blacklist WHERE type = ? AND value = ?',
        ['url', url]
      );
      
      if (urlMatch) {
        logger.info(`URL blacklisted: ${url}`);
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
          logger.info(`Video ID blacklisted: ${videoId}`);
          return { 
            isBlacklisted: true, 
            reason: videoIdMatch.reason || 'This video has been blocked by the content owner or administrator',
            type: 'Video'
          };
        }
      }
      
      // Check for channel match (extract channel ID from URL)
      const channelMatch = url.match(/youtube\.com\/channel\/([^&\n?#]+)/);
      if (channelMatch) {
        const channelId = channelMatch[1];
        const channelMatchResult = await database.get(
          'SELECT reason FROM blacklist WHERE type = ? AND value = ?',
          ['channel', channelId]
        );
        
        if (channelMatchResult) {
          logger.info(`Channel blacklisted: ${channelId}`);
          return { 
            isBlacklisted: true, 
            reason: channelMatchResult.reason || 'This channel has been blocked by the content owner or administrator',
            type: 'Channel'
          };
        }
      }
      
      return { isBlacklisted: false };
    } catch (error) {
      logger.error('Error checking blacklist:', error);
      return { isBlacklisted: false }; // Allow conversion if blacklist check fails
    }
  }

  async createJob(request: ConversionRequest): Promise<string> {
    const jobId = uuidv4();
    const database = await db;

    try {
      // Check if URL is blacklisted
      const blacklistResult = await this.checkBlacklist(request.url);
      if (blacklistResult.isBlacklisted) {
        throw new Error(blacklistResult.reason || 'This content is not available for conversion');
      }

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
        quality_message: result.quality_message,
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
   * Download audio from YouTube using yt-dlp at specified quality
   * Returns path to the downloaded audio file
   */
  private async downloadAudio(url: string, outputPath: string, quality: string = '192K'): Promise<string> {
    return new Promise((resolve, reject) => {
      const ytdlpArgs = [
        '-m', 'yt_dlp',
        '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',  // Audio-only streams
        '--extract-audio',                           // Extract audio only
        '--audio-format', 'mp3',                     // Convert to MP3
        '--audio-quality', quality,                   // Set user-requested quality
        '--output', outputPath,                      // Output path
        '--no-playlist',                             // Single video only
        '--no-warnings',                             // Reduce output noise
        '--no-check-certificates',                   // Skip SSL verification for speed
        '--no-cache-dir',                            // Don't use cache
        '--concurrent-fragments', '4',               // Parallel downloads for speed
        '--fragment-retries', '3',                   // Retry failed fragments
        '--retries', '3',                            // Total retries
        '--socket-timeout', '30',                    // Socket timeout
        '--extractor-retries', '2',                  // Extractor retries
        '--http-chunk-size', '10485760',             // 10MB chunks for faster processing
        '--postprocessor-args', 'ffmpeg:-vn',        // Force no video stream in output
        '--cookies', path.join(__dirname, '../../cookies.txt'), // Use cookies to bypass robot verification
        '--extractor-args', 'youtube:player_client=android', // Use mobile client for faster access
        url
      ];

      logger.info(`Downloading audio with yt-dlp: ${ytdlpArgs.join(' ')}`);

      const ytdlp = spawn('python', ytdlpArgs, {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          LANG: 'en_US.UTF-8',
          LC_ALL: 'en_US.UTF-8'
        }
      });
      
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
   * Get video metadata including duration
   */
  private async getVideoMetadata(url: string): Promise<{ title: string; duration: number }> {
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('python', [
        '-m', 'yt_dlp',
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        '--cookies', path.join(__dirname, '../../cookies.txt'), // Use cookies to bypass robot verification
        '--extractor-args', 'youtube:player_client=android',
        url
      ], {
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          LANG: 'en_US.UTF-8',
          LC_ALL: 'en_US.UTF-8'
        }
      });

      let output = '';
      let errorOutput = '';

      ytdlp.stdout.on('data', (data: Buffer) => {
        output += data.toString('utf8');
      });

      ytdlp.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString('utf8');
      });

      ytdlp.on('close', (code: number | null) => {
        if (code === 0 && output.trim()) {
          try {
            const jsonData = JSON.parse(output);
            const title = preserveExactTitle(jsonData.title || 'Unknown');
            const duration = jsonData.duration || 0;
            
            resolve({ title, duration });
          } catch (parseError) {
            reject(new Error(`Failed to parse video metadata: ${parseError}`));
          }
        } else {
          reject(new Error(`Failed to get video metadata: ${errorOutput}`));
        }
      });

      ytdlp.on('error', (error: Error) => {
        reject(new Error(`Error getting video metadata: ${error.message}`));
      });
    });
  }

  /**
   * Determine quality based on video duration (3-hour rule)
   */
  private determineQuality(userQuality: string, videoDurationSeconds: number): { quality: string; message?: string } {
    const LONG_VIDEO_THRESHOLD = 3 * 60 * 60; // 3 hours in seconds (10800)
    
    if (videoDurationSeconds > LONG_VIDEO_THRESHOLD) {
      // Extract numeric value from quality string (e.g., "192k" -> 192)
      const userQualityNum = parseInt(userQuality.replace('k', ''));
      
      // If user selected 128k or lower, use their choice
      if (userQualityNum <= 128) {
        return { quality: userQuality };
      }
      
      // If user selected higher than 128k, force 128k
      return {
        quality: '128k',
        message: 'Note: For videos longer than 3 hours, audio quality is automatically set to 128k for faster processing.'
      };
    }
    
    return { quality: userQuality };
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

      // Set audio bitrate and format with ultrafast preset for speed
      command
        .toFormat('mp3')
        .addOption('-preset', 'ultrafast')
        .addOption('-vn')  // Force no video stream
        .addOption('-acodec', 'libmp3lame');  // Force audio codec
      
      // Only set bitrate if it's not 0 (0 means no quality change needed)
      if (bitrate > 0) {
        command.audioBitrate(bitrate);
      }
      
      command
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

      // Step 0: Get video metadata to apply 3-hour rule
      logger.info(`[Job ${jobId}] Step 0: Getting video metadata for duration check`);
      const { duration } = await this.getVideoMetadata(request.url);
      
      // Apply 3-hour rule for quality
      const qualityResult = this.determineQuality(request.quality || '192k', duration);
      const finalQuality = qualityResult.quality;
      const qualityMessage = qualityResult.message;
      
      if (qualityMessage) {
        logger.info(`[Job ${jobId}] 3-hour rule applied: ${qualityMessage}`);
        // Store the message in the job for later retrieval
        await this.updateJobStatus(jobId, 'processing', undefined, undefined, qualityMessage);
      }

      // Step 1: Download audio using yt-dlp at user-requested quality
      logger.info(`[Job ${jobId}] Step 1: Downloading audio from ${request.url} (duration: ${duration}s, quality: ${finalQuality})`);
      await this.downloadAudio(request.url, tempAudioPath, finalQuality);

      // Step 2: Process with FFmpeg (only for trimming, quality already set by yt-dlp)
      if (request.trim_start && request.trim_end) {
        logger.info(`[Job ${jobId}] Step 2: Processing with FFmpeg (trim only: ${request.trim_start} to ${request.trim_end})`);
        await this.processAudioWithFFmpeg(
          tempAudioPath,
          outputPath,
          0, // No bitrate change needed, already at correct quality
          request.trim_start,
          request.trim_end
        );
      } else {
        logger.info(`[Job ${jobId}] Step 2: No FFmpeg processing needed - copying file directly`);
        // No processing needed, just copy the file
        await fs.copyFile(tempAudioPath, outputPath);
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
