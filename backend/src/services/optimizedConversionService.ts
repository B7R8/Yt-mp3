import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import { ConversionJob, ConversionRequest } from '../types';
import logger from '../config/logger';
import { db } from '../config/database';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorHandler';
import { processVideoTitle, preserveExactTitle, isValidTitle } from '../utils/titleProcessor';
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// Advanced caching system
interface CachedConversion {
  filePath: string;
  metadata: {
    title: string;
    duration: number;
    quality: string;
    fileSize: number;
  };
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CachedVideoInfo {
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  viewCount: number;
  timestamp: number;
}

interface ConversionWorkerData {
  jobId: string;
  url: string;
  quality: string;
  trimStart?: string;
  trimEnd?: string;
  outputPath: string;
  tempPath: string;
}

export class OptimizedConversionService extends EventEmitter {
  private downloadsDir: string;
  private cacheDir: string;
  private tempDir: string;
  private conversionCache = new Map<string, CachedConversion>();
  private videoInfoCache = new Map<string, CachedVideoInfo>();
  private activeJobs = new Map<string, ChildProcess>();
  private workerPool: Worker[] = [];
  private maxWorkers: number;
  private maxCacheSize: number;
  private cacheTTL: number;

  constructor() {
    super();
    this.downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    this.cacheDir = process.env.CACHE_DIR || './cache';
    this.tempDir = process.env.TEMP_DIR || './temp';
    this.maxWorkers = parseInt(process.env.MAX_WORKERS || '4');
    this.maxCacheSize = parseInt(process.env.MAX_CACHE_SIZE || '100');
    this.cacheTTL = parseInt(process.env.CACHE_TTL || '3600000'); // 1 hour
    
    this.initializeDirectories();
    this.initializeWorkerPool();
    this.startCacheCleanup();
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await Promise.all([
        fs.mkdir(this.downloadsDir, { recursive: true }),
        fs.mkdir(this.cacheDir, { recursive: true }),
        fs.mkdir(this.tempDir, { recursive: true })
      ]);
    } catch (error) {
      logger.error('Failed to create directories:', error);
    }
  }

  private initializeWorkerPool(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(path.join(__dirname, 'conversionWorker.js'));
      worker.on('message', this.handleWorkerMessage.bind(this));
      worker.on('error', this.handleWorkerError.bind(this));
      this.workerPool.push(worker);
    }
  }

  private handleWorkerMessage(message: any): void {
    const { jobId, type, data, error } = message;
    
    switch (type) {
      case 'progress':
        this.emit('progress', { jobId, progress: data.progress });
        break;
      case 'completed':
        this.emit('completed', { jobId, filePath: data.filePath });
        break;
      case 'error':
        this.emit('error', { jobId, error });
        break;
    }
  }

  private handleWorkerError(error: Error): void {
    logger.error('Worker error:', error);
  }

  private getCacheKey(url: string, quality: string, trimStart?: string, trimEnd?: string): string {
    const data = `${url}:${quality}:${trimStart || ''}:${trimEnd || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async checkCache(cacheKey: string): Promise<CachedConversion | null> {
    const cached = this.conversionCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.conversionCache.delete(cacheKey);
      return null;
    }

    // Check if file still exists
    try {
      await fs.access(cached.filePath);
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      return cached;
    } catch {
      this.conversionCache.delete(cacheKey);
      return null;
    }
  }

  private async addToCache(cacheKey: string, filePath: string, metadata: any): Promise<void> {
    // Remove oldest entries if cache is full
    if (this.conversionCache.size >= this.maxCacheSize) {
      const entries = Array.from(this.conversionCache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.2));
      
      for (const [key] of toRemove) {
        this.conversionCache.delete(key);
      }
    }

    const stats = await fs.stat(filePath);
    this.conversionCache.set(cacheKey, {
      filePath,
      metadata,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    });
  }

  private async getVideoInfoOptimized(url: string): Promise<CachedVideoInfo> {
    // Extract video ID for caching
    const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : url;

    // Check cache first
    const cached = this.videoInfoCache.get(videoId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached;
    }

    // Fetch video info with optimized yt-dlp settings
    const videoInfo = await this.fetchVideoInfo(url);
    
    // Cache the result
    this.videoInfoCache.set(videoId, {
      ...videoInfo,
      timestamp: Date.now()
    });

    return videoInfo;
  }

  private async fetchVideoInfo(url: string): Promise<CachedVideoInfo> {
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('python', [
        '-m', 'yt_dlp',
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificates',
        '--socket-timeout', '15',
        '--extractor-retries', '2',
        '--fragment-retries', '2',
        '--retries', '3',
        '--concurrent-fragments', '4',
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
            
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
            const durationFormatted = hours > 0 
              ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
              : `${minutes}:${seconds.toString().padStart(2, '0')}`;

            resolve({
              title,
              duration,
              durationFormatted,
              thumbnail: jsonData.thumbnail || '',
              uploader: jsonData.uploader || '',
              viewCount: jsonData.view_count || 0,
              timestamp: Date.now()
            });
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

  async createJob(request: ConversionRequest): Promise<string> {
    const jobId = uuidv4();
    const database = await db;

    try {
      // Check if URL is blacklisted
      const blacklistResult = await this.checkBlacklist(request.url);
      if (blacklistResult.isBlacklisted) {
        throw new Error(blacklistResult.reason || 'This content is not available for conversion');
      }

      // Check cache first
      const cacheKey = this.getCacheKey(
        request.url, 
        request.quality || '192k', 
        request.trim_start, 
        request.trim_end
      );
      
      const cached = await this.checkCache(cacheKey);
      if (cached) {
        // Create a new job entry for the cached result
        const videoInfo = await this.getVideoInfoOptimized(request.url);
        
        await database.run(
          `INSERT INTO conversions (id, youtube_url, video_title, status, mp3_filename, created_at, updated_at) 
           VALUES (?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))`,
          [jobId, request.url, videoInfo.title, path.basename(cached.filePath)]
        );

        // Copy cached file to downloads directory
        const newFilePath = path.join(this.downloadsDir, `${jobId}.mp3`);
        await fs.copyFile(cached.filePath, newFilePath);
        
        logger.info(`Job ${jobId} served from cache`);
        return jobId;
      }

      // Get video info for job creation
      const videoInfo = await this.getVideoInfoOptimized(request.url);
      
      await database.run(
        `INSERT INTO conversions (id, youtube_url, video_title, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`,
        [jobId, request.url, videoInfo.title]
      );
      
      // Start conversion process asynchronously with worker
      this.processConversionWithWorker(jobId, request).catch(error => {
        logger.error(`Conversion failed for job ${jobId}:`, error);
        this.updateJobStatus(jobId, 'failed', undefined, error.message);
      });

      return jobId;
    } catch (error) {
      logger.error('Failed to create conversion job:', error);
      throw error;
    }
  }

  private async processConversionWithWorker(jobId: string, request: ConversionRequest): Promise<void> {
    try {
      await this.updateJobStatus(jobId, 'processing');
      
      const mp3Filename = `${jobId}.mp3`;
      const tempFilename = `${jobId}_temp.mp3`;
      const outputPath = path.join(this.downloadsDir, mp3Filename);
      const tempPath = path.join(this.tempDir, tempFilename);

      // Get available worker
      const worker = this.workerPool[Math.floor(Math.random() * this.workerPool.length)];
      
      const workerData: ConversionWorkerData = {
        jobId,
        url: request.url,
        quality: request.quality || '192k',
        trimStart: request.trim_start,
        trimEnd: request.trim_end,
        outputPath,
        tempPath
      };

      // Send job to worker
      worker.postMessage(workerData);

      // Listen for worker completion
      const handleWorkerMessage = (message: any) => {
        if (message.jobId === jobId) {
          worker.off('message', handleWorkerMessage);
          
          if (message.type === 'completed') {
            this.updateJobStatus(jobId, 'completed', mp3Filename);
            
            // Add to cache
            const cacheKey = this.getCacheKey(
              request.url, 
              request.quality || '192k', 
              request.trim_start, 
              request.trim_end
            );
            
            this.addToCache(cacheKey, outputPath, {
              title: request.url,
              duration: 0,
              quality: request.quality || '192k',
              fileSize: 0
            });
          } else if (message.type === 'error') {
            this.updateJobStatus(jobId, 'failed', undefined, message.error);
          }
        }
      };

      worker.on('message', handleWorkerMessage);

    } catch (error) {
      logger.error(`Conversion failed for job ${jobId}:`, error);
      await this.updateJobStatus(jobId, 'failed', undefined, error.message);
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

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean expired cache entries
      for (const [key, value] of this.conversionCache.entries()) {
        if (now - value.timestamp > this.cacheTTL) {
          this.conversionCache.delete(key);
        }
      }
      
      for (const [key, value] of this.videoInfoCache.entries()) {
        if (now - value.timestamp > this.cacheTTL) {
          this.videoInfoCache.delete(key);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

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

  // Get cache statistics
  getCacheStats(): { conversionCache: number; videoInfoCache: number; workerPool: number } {
    return {
      conversionCache: this.conversionCache.size,
      videoInfoCache: this.videoInfoCache.size,
      workerPool: this.workerPool.length
    };
  }
}
