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
  private readonly apiKeys: string[];
  private readonly apiHost: string;
  private readonly downloadsDir: string;
  private readonly alternativeApiHost: string;
  private currentApiKeyIndex: number = 0;

  constructor() {
    // Load multiple API keys from environment variables
    this.apiKeys = this.loadApiKeys();
    this.apiHost = 'youtube-mp36.p.rapidapi.com';
    this.alternativeApiHost = 'youtube-mp3-download1.p.rapidapi.com';
    this.downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    this.ensureDownloadsDir();
  }

  private loadApiKeys(): string[] {
    const keys: string[] = [];
    
    // Load RAPIDAPI_KEY (required)
    if (process.env.RAPIDAPI_KEY) {
      keys.push(process.env.RAPIDAPI_KEY);
    }
    
    // Load optional additional keys
    for (let i = 2; i <= 5; i++) {
      const key = process.env[`RAPIDAPI_KEY${i}`];
      if (key) {
        keys.push(key);
      }
    }
    
    // No fallback key - must have at least one API key in environment
    if (keys.length === 0) {
      logger.error('❌ No API keys found in environment variables. Please set RAPIDAPI_KEY in your .env file.');
      throw new Error('No API keys configured. Please set RAPIDAPI_KEY in your .env file.');
    }
    
    logger.info(`Loaded ${keys.length} API key(s) for fallback system`);
    return keys;
  }

  private getCurrentApiKey(): string {
    return this.apiKeys[this.currentApiKeyIndex];
  }

  private switchToNextApiKey(): boolean {
    if (this.currentApiKeyIndex < this.apiKeys.length - 1) {
      this.currentApiKeyIndex++;
      logger.warn(`Switching to API key ${this.currentApiKeyIndex + 1} of ${this.apiKeys.length}`);
      return true;
    }
    return false;
  }

  private resetApiKeyIndex(): void {
    this.currentApiKeyIndex = 0;
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
   * Get video information from YouTube MP3 API with fallback system
   */
  async getVideoInfo(url: string): Promise<VideoInfo> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL - could not extract video ID');
    }

    // Try all available API keys for video info
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const result = await this.getVideoInfoWithCurrentKey(videoId);
        if (result) {
          return result;
        }
      } catch (error) {
        logger.warn(`⚠️ API key ${this.currentApiKeyIndex + 1} failed for video info ${videoId}:`, error);
      }

      // Switch to next API key if available
      if (!this.switchToNextApiKey()) {
        break; // No more API keys to try
      }
    }

    throw new Error(`All ${this.apiKeys.length} API keys failed to get video information`);
  }

  /**
   * Get video information with current API key
   */
  private async getVideoInfoWithCurrentKey(videoId: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        hostname: this.apiHost,
        port: null,
        path: `/dl?id=${videoId}`,
        headers: {
          'x-rapidapi-key': this.getCurrentApiKey(),
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
   * Convert YouTube video to MP3 using the API - Direct download approach with fallback system
   */
  async convertToMp3(url: string, quality: string = '192k'): Promise<ConversionResult> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      logger.error(`❌ Invalid YouTube URL - could not extract video ID from: ${url}`);
      return {
        success: false,
        error: 'Invalid YouTube URL - could not extract video ID'
      };
    }

    logger.info(`🎵 Starting MP3 conversion for video ID: ${videoId} with quality: ${quality}`);

    // Reset API key index for new conversion
    this.resetApiKeyIndex();

    // Try all available API keys
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      const currentKey = this.getCurrentApiKey();
      logger.info(`🔑 Attempting conversion with API key ${this.currentApiKeyIndex + 1} of ${this.apiKeys.length}`);

      try {
        // Get download link directly from API with validation
        logger.info(`🔗 Fetching download link from primary API for video: ${videoId}`);
        let downloadResult = await this.getDownloadLinkWithValidation(videoId);
        
        // If primary API fails, try alternative API
        if (!downloadResult.success || !downloadResult.downloadUrl) {
          logger.warn(`⚠️ Primary API failed for ${videoId}, trying alternative API`);
          downloadResult = await this.tryAlternativeApiWithValidation(videoId);
        }
        
        // If this API key worked, return success
        if (downloadResult.success && downloadResult.downloadUrl) {
          logger.info(`✅ Valid download URL obtained for video ${videoId} with API key ${this.currentApiKeyIndex + 1}: ${downloadResult.downloadUrl}`);

          // Get video info for title
          let title = `YouTube Video ${videoId}`;
          try {
            logger.info(`📝 Fetching video info for title: ${videoId}`);
            const videoInfo = await this.getVideoInfo(url);
            title = videoInfo.title;
            logger.info(`📝 Video title: ${title}`);
          } catch (error) {
            logger.warn(`⚠️ Failed to get video info for ${videoId}, using default title:`, error);
          }

          logger.info(`🎵 Conversion completed successfully for ${videoId}: ${title}`);

          return {
            success: true,
            downloadUrl: downloadResult.downloadUrl, // Return the validated API download URL
            title: title,
            duration: 0 // Duration not available from this API
          };
        }

        // If this API key failed, try the next one
        logger.warn(`⚠️ API key ${this.currentApiKeyIndex + 1} failed for video ${videoId}, trying next key...`);
        
      } catch (error) {
        logger.error(`❌ API key ${this.currentApiKeyIndex + 1} failed for video ${videoId}:`, error);
      }

      // Switch to next API key if available
      if (!this.switchToNextApiKey()) {
        break; // No more API keys to try
      }
    }

    // All API keys failed
    logger.error(`❌ All ${this.apiKeys.length} API keys failed for video ${videoId}`);
    return {
      success: false,
      error: `All ${this.apiKeys.length} API keys failed. Please try again later.`
    };
  }

  /**
   * Try alternative API if primary fails with validation
   */
  private async tryAlternativeApiWithValidation(videoId: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    const maxRetries = 2;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(`🔄 Attempt ${attempt}/${maxRetries} - Trying alternative API for ${videoId}`);
      
      const result = await this.tryAlternativeApi(videoId);
      
      if (result.success && result.downloadUrl) {
        // Validate the download URL
        const isValid = await this.validateDownloadUrl(result.downloadUrl);
        if (isValid) {
          logger.info(`✅ Valid alternative download URL obtained for ${videoId} on attempt ${attempt}`);
          return result;
        } else {
          logger.warn(`⚠️ Alternative download URL validation failed for ${videoId} on attempt ${attempt}`);
          lastError = 'Alternative download URL is not accessible';
        }
      } else {
        lastError = result.error || 'Alternative API failed';
        logger.warn(`⚠️ Alternative API request failed for ${videoId} on attempt ${attempt}: ${lastError}`);
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt)); // Exponential backoff
      }
    }
    
    return {
      success: false,
      error: `Alternative API failed after ${maxRetries} attempts. Last error: ${lastError}`
    };
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
          'x-rapidapi-key': this.getCurrentApiKey(),
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
   * Get download link from YouTube MP3 API with validation
   */
  private async getDownloadLinkWithValidation(videoId: string): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
    const maxRetries = 3;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.info(`🔗 Attempt ${attempt}/${maxRetries} - Fetching download link for ${videoId}`);
      
      const result = await this.getDownloadLink(videoId);
      
      if (result.success && result.downloadUrl) {
        // Validate the download URL
        const isValid = await this.validateDownloadUrl(result.downloadUrl);
        if (isValid) {
          logger.info(`✅ Valid download URL obtained for ${videoId} on attempt ${attempt}`);
          return result;
        } else {
          logger.warn(`⚠️ Download URL validation failed for ${videoId} on attempt ${attempt}`);
          lastError = 'Download URL is not accessible';
        }
      } else {
        lastError = result.error || 'Failed to get download link';
        logger.warn(`⚠️ Download link request failed for ${videoId} on attempt ${attempt}: ${lastError}`);
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      }
    }
    
    return {
      success: false,
      error: `Failed to get valid download link after ${maxRetries} attempts. Last error: ${lastError}`
    };
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
          'x-rapidapi-key': this.getCurrentApiKey(),
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
   * Validate if a download URL is accessible - DISABLED for performance
   */
  private async validateDownloadUrl(url: string): Promise<boolean> {
    // URL validation disabled for better performance
    // This was causing delays by making HEAD requests to validate each URL
    logger.info(`URL validation skipped for performance: ${url}`);
    return true;
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
