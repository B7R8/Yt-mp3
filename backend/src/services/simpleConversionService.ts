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
   * Extract video ID from YouTube URL - Enhanced to support all formats
   */
  private extractVideoId(url: string): string | null {
    // Comprehensive patterns for all YouTube URL formats
    const patterns = [
      // Standard watch URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Short URLs
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      
      // Embed URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      
      // Direct video URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      
      // Shorts URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      
      // Mobile URLs
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Music URLs
      /(?:https?:\/\/)?(?:www\.)?music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?music\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Gaming URLs
      /(?:https?:\/\/)?(?:www\.)?gaming\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
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

    logger.info(`🎵 Creating new conversion job: ${jobId} for URL: ${request.url}`);

    try {
      // Validate YouTube URL
      if (!this.apiService.isValidYouTubeUrl(request.url)) {
        logger.error(`❌ Invalid YouTube URL format: ${request.url}`);
        throw new Error('Invalid YouTube URL format');
      }

      logger.info(`✅ YouTube URL validation passed for job: ${jobId}`);

      // Check if URL is blacklisted
      const blacklistResult = await this.checkBlacklist(request.url);
      if (blacklistResult.isBlacklisted) {
        logger.warn(`🚫 URL is blacklisted for job ${jobId}: ${blacklistResult.reason}`);
        throw new Error(blacklistResult.reason || 'This content is not available for conversion');
      }

      logger.info(`✅ Blacklist check passed for job: ${jobId}`);

      // Get video info for job creation
      logger.info(`📝 Fetching video info for job: ${jobId}`);
      const videoInfo = await this.apiService.getVideoInfo(request.url);
      logger.info(`📝 Video title for job ${jobId}: ${videoInfo.title}`);
      
      await database.run(
        `INSERT INTO conversions (id, youtube_url, video_title, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        [jobId, request.url, videoInfo.title]
      );
      
      logger.info(`💾 Job ${jobId} created in database successfully`);
      
      // Start conversion process asynchronously
      this.processConversion(jobId, request).catch(error => {
        logger.error(`❌ Conversion failed for job ${jobId}:`, error);
        this.updateJobStatus(jobId, 'failed', undefined, error.message);
      });

      logger.info(`🚀 Conversion process started for job: ${jobId}`);
      return jobId;
    } catch (error) {
      logger.error(`❌ Failed to create conversion job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Process conversion using YouTube MP3 API
   */
  private async processConversion(jobId: string, request: ConversionRequest): Promise<void> {
    try {
      logger.info(`🔄 [Job ${jobId}] Updating status to processing`);
      await this.updateJobStatus(jobId, 'processing');
      
      logger.info(`🎵 [Job ${jobId}] Starting conversion for URL: ${request.url}`);
      logger.info(`🎵 [Job ${jobId}] Quality setting: ${request.quality || '192k'}`);
      
      // Convert using YouTube MP3 API - Direct download approach
      const result = await this.apiService.convertToMp3(request.url, request.quality || '192k');
      
      if (!result.success) {
        logger.error(`❌ [Job ${jobId}] API conversion failed: ${result.error}`);
        throw new Error(result.error || 'Conversion failed');
      }

      // Generate filename from video ID for display purposes
      const videoId = this.extractVideoId(request.url);
      const filename = `${result.title || `video_${videoId}`}.mp3`;
      
      logger.info(`📁 [Job ${jobId}] Generated filename: ${filename}`);
      logger.info(`🔗 [Job ${jobId}] Direct download URL: ${result.downloadUrl}`);
      
      // Store the direct download URL in the database instead of a local file
      await this.updateJobStatus(jobId, 'completed', filename, undefined, undefined, result.downloadUrl);
      logger.info(`✅ [Job ${jobId}] Conversion completed successfully with direct download URL`);

    } catch (error) {
      logger.error(`❌ [Job ${jobId}] Conversion failed:`, error);
      logTechnicalError(error, `Conversion Job ${jobId}`);
      
      let userFriendlyError = getUserFriendlyError(error);
      
      // Provide more specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          userFriendlyError = 'This video could not be found. Please check the URL and try again.';
          logger.warn(`🔍 [Job ${jobId}] Video not found (404 error)`);
        } else if (error.message.includes('timeout')) {
          userFriendlyError = 'The conversion timed out. Please try again.';
          logger.warn(`⏰ [Job ${jobId}] Conversion timeout`);
        } else if (error.message.includes('expired')) {
          userFriendlyError = 'The download link has expired. Please try again.';
          logger.warn(`⏰ [Job ${jobId}] Download link expired`);
        } else if (error.message.includes('rate limit')) {
          userFriendlyError = 'Too many requests. Please wait a moment and try again.';
          logger.warn(`🚫 [Job ${jobId}] Rate limit exceeded`);
        }
      }
      
      logger.info(`📝 [Job ${jobId}] Updating status to failed with message: ${userFriendlyError}`);
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
        direct_download_url: result.direct_download_url, // Now properly stored in dedicated column
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
    qualityMessage?: string,
    directDownloadUrl?: string
  ): Promise<void> {
    const database = await db;
    
    try {
      // Store direct download URL in dedicated column
      await database.run(
        `UPDATE conversions 
         SET status = ?, mp3_filename = ?, error_message = ?, quality_message = ?, direct_download_url = ?, updated_at = datetime('now') 
         WHERE id = ?`,
        [status, mp3Filename, errorMessage, qualityMessage, directDownloadUrl, jobId]
      );
      
      logger.info(`📝 Updated job ${jobId} status to: ${status}${directDownloadUrl ? ' with download URL' : ''}`);
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
   * Cleanup old files (20 minutes = 1/3 hour)
   */
  async cleanupOldFiles(): Promise<void> {
    const maxAgeMinutes = parseInt(process.env.MAX_FILE_AGE_MINUTES || '20');
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
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
