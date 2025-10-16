import https from 'https';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorHandler';
import { preserveExactTitle, generateFilenameFromTitle } from '../utils/titleProcessor';

export interface VideoInfo {
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  viewCount: number;
  videoId: string;
}

export interface ConversionResult {
  success: boolean;
  downloadUrl?: string; // Direct API download URL
  error?: string;
  title?: string;
  duration?: number;
}

export class YouTubeMp3ApiService {
  private readonly apiKey: string;
  private readonly apiHost: string;
  private readonly downloadsDir: string;
  private readonly alternativeApiHost: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || '546e353d67msha411dc0cd0b0b7dp153e93jsn651c16a2c85b';
    this.apiHost = 'youtube-mp36.p.rapidapi.com';
    this.alternativeApiHost = 'youtube-mp3-download1.p.rapidapi.com';
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

  /**
   * Extract video ID from YouTube URL
   */
  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Get video information from YouTube MP3 API
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL - could not extract video ID');
    }

    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        hostname: this.apiHost,
        port: null,
        path: `/dl?id=${videoId}`,
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString();
            logger.info(`API Response for video ${videoId}: ${body}`);
            const data = JSON.parse(body);

            // Handle different response formats
            if (data.status === 'ok' || data.status === 'success') {
              const title = data.title || data.video_title || `YouTube Video ${videoId}`;
              const duration = data.duration || 0;
              
              // Format duration
              const hours = Math.floor(duration / 3600);
              const minutes = Math.floor((duration % 3600) / 60);
              const seconds = duration % 60;
              const durationFormatted = hours > 0 
                ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                : `${minutes}:${seconds.toString().padStart(2, '0')}`;

              resolve({
                title: preserveExactTitle(title),
                duration,
                durationFormatted,
                thumbnail: data.thumb || data.thumbnail || '',
                uploader: data.a || data.uploader || '',
                viewCount: 0,
                videoId
              });
            } else {
              reject(new Error(data.msg || data.message || 'Failed to get video information'));
            }
          } catch (parseError) {
            logger.error(`Parse error for video ${videoId}: ${parseError}`);
            reject(new Error(`Failed to parse API response: ${parseError}`));
          }
        });
      });

      req.on('error', (error) => {
        logger.error(`API request error for video ${videoId}: ${error.message}`);
        reject(new Error(`API request failed: ${error.message}`));
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('API request timeout'));
      });

      req.end();
    });
  }

  /**
   * Convert YouTube video to MP3 using the API - Direct download approach
   */
  async convertToMp3(url: string, quality: string = '192k'): Promise<ConversionResult> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL - could not extract video ID'
      };
    }

    try {
      // Get download link directly from API
      let downloadResult = await this.getDownloadLink(videoId);
      
      // If primary API fails, try alternative API
      if (!downloadResult.success || !downloadResult.downloadUrl) {
        logger.info(`Primary API failed for ${videoId}, trying alternative API`);
        downloadResult = await this.tryAlternativeApi(videoId);
      }
      
      if (!downloadResult.success || !downloadResult.downloadUrl) {
        return {
          success: false,
          error: downloadResult.error || 'Failed to get download link from all available APIs'
        };
      }

      // Get video info for title
      let title = `YouTube Video ${videoId}`;
      try {
        const videoInfo = await this.getVideoInfo(url);
        title = videoInfo.title;
      } catch (error) {
        logger.warn('Failed to get video info, using default title:', error);
      }

      logger.info(`Direct download approach: Returning API download URL for ${videoId}: ${downloadResult.downloadUrl}`);

      return {
        success: true,
        downloadUrl: downloadResult.downloadUrl, // Return the API download URL directly
        title: title,
        duration: 0 // Duration not available from this API
      };

    } catch (error) {
      logTechnicalError(error, 'YouTube MP3 API Conversion');
      return {
        success: false,
        error: getUserFriendlyError(error)
      };
    }
  }

  /**
   * Try alternative API if primary fails
   */
  private async tryAlternativeApi(videoId: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    logger.info(`Trying alternative API for video ${videoId}`);
    
    return new Promise((resolve) => {
      const options = {
        method: 'GET',
        hostname: this.alternativeApiHost,
        port: null,
        path: `/dl?id=${videoId}`,
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.alternativeApiHost,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString();
            logger.info(`Alternative API response for ${videoId}: ${body}`);
            const data = JSON.parse(body);

            if ((data.status === 'ok' || data.status === 'success') && (data.link || data.download_url || data.url)) {
              const downloadUrl = data.link || data.download_url || data.url;
              logger.info(`Alternative API download URL found for ${videoId}: ${downloadUrl}`);
              resolve({
                success: true,
                downloadUrl: downloadUrl
              });
            } else {
              logger.error(`Alternative API returned error for ${videoId}: ${JSON.stringify(data)}`);
              resolve({
                success: false,
                error: data.msg || data.message || data.error || 'Alternative API failed'
              });
            }
          } catch (parseError) {
            logger.error(`Alternative API parse error for ${videoId}: ${parseError}`);
            resolve({
              success: false,
              error: `Alternative API parse error: ${parseError}`
            });
          }
        });
      });

      req.on('error', (error) => {
        logger.error(`Alternative API request error for ${videoId}: ${error.message}`);
        resolve({
          success: false,
          error: `Alternative API request failed: ${error.message}`
        });
      });

      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Alternative API request timeout'
        });
      });

      req.end();
    });
  }

  /**
   * Get download link from YouTube MP3 API
   */
  private async getDownloadLink(videoId: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        hostname: this.apiHost,
        port: null,
        path: `/dl?id=${videoId}`,
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString();
            logger.info(`Download link API response for ${videoId}: ${body}`);
            const data = JSON.parse(body);

            // Handle different response formats from the API
            if ((data.status === 'ok' || data.status === 'success') && (data.link || data.download_url || data.url)) {
              const downloadUrl = data.link || data.download_url || data.url;
              logger.info(`Download URL found for ${videoId}: ${downloadUrl}`);
              resolve({
                success: true,
                downloadUrl: downloadUrl
              });
            } else {
              logger.error(`API returned error for ${videoId}: ${JSON.stringify(data)}`);
              resolve({
                success: false,
                error: data.msg || data.message || data.error || 'Failed to get download link'
              });
            }
          } catch (parseError) {
            logger.error(`Parse error for download link ${videoId}: ${parseError}`);
            resolve({
              success: false,
              error: `Failed to parse API response: ${parseError}`
            });
          }
        });
      });

      req.on('error', (error) => {
        logger.error(`API request error for download link ${videoId}: ${error.message}`);
        resolve({
          success: false,
          error: `API request failed: ${error.message}`
        });
      });

      req.setTimeout(30000, () => {
        req.destroy();
        resolve({
          success: false,
          error: 'API request timeout'
        });
      });

      req.end();
    });
  }

  /**
   * Validate if a download URL is accessible
   */
  private async validateDownloadUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const options = {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'audio/mpeg, audio/*, */*',
        },
        timeout: 10000
      };
      
      https.request(url, options, (response) => {
        logger.info(`URL validation status: ${response.statusCode} for ${url}`);
        resolve(response.statusCode === 200);
      }).on('error', (error) => {
        logger.warn(`URL validation failed: ${error.message}`);
        resolve(false);
      }).on('timeout', () => {
        logger.warn(`URL validation timeout for ${url}`);
        resolve(false);
      }).end();
    });
  }

  /**
   * Download file from URL to local path with retry logic
   */
  private async downloadFile(url: string, filePath: string, retries: number = 3): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(filePath);
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'audio/mpeg, audio/*, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000
      };
      
      https.get(url, options, (response) => {
        logger.info(`Download response status: ${response.statusCode} for URL: ${url}`);
        
        // Handle redirects (301, 302, etc.)
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          logger.info(`Following redirect to: ${response.headers.location}`);
          file.close();
          // Retry with the redirect URL
          this.downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
          return;
        }
        
        if (response.statusCode === 404) {
          file.close();
          fs.unlink(filePath).catch(() => {}); // Clean up on error
          reject(new Error(`Download failed with status: ${response.statusCode} - File not found. The download link may have expired.`));
          return;
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(filePath).catch(() => {}); // Clean up on error
          reject(new Error(`Download failed with status: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          logger.info(`File downloaded successfully: ${filePath}`);
          resolve();
        });

        file.on('error', (error: Error) => {
          logger.error(`File write error: ${error.message}`);
          fs.unlink(filePath).catch(() => {}); // Clean up on error
          reject(error);
        });
      }).on('error', (error: Error) => {
        logger.error(`Download request error: ${error.message}`);
        reject(error);
      }).on('timeout', () => {
        logger.error(`Download timeout for URL: ${url}`);
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * Check if URL is a valid YouTube URL
   */
  isValidYouTubeUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/youtu\.be\/[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtube\.com\/v\/[a-zA-Z0-9_-]{11}/,
      /^https?:\/\/(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/
    ];

    return patterns.some(pattern => pattern.test(url));
  }
}
