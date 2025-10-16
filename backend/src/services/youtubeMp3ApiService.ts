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
  downloadUrl?: string;
  error?: string;
  title?: string;
  duration?: number;
}

export class YouTubeMp3ApiService {
  private readonly apiKey: string;
  private readonly apiHost: string;
  private readonly downloadsDir: string;

  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY || '546e353d67msha411dc0cd0b0b7dp153e93jsn651c16a2c85b';
    this.apiHost = 'youtube-mp36.p.rapidapi.com';
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
            const data = JSON.parse(body);

            if (data.status === 'ok' && data.link) {
              // Extract title from the response or use a default
              const title = data.title || `YouTube Video ${videoId}`;
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
                thumbnail: data.thumb || '',
                uploader: data.a || '',
                viewCount: 0, // API doesn't provide view count
                videoId
              });
            } else {
              reject(new Error(data.msg || 'Failed to get video information'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse API response: ${parseError}`));
          }
        });
      });

      req.on('error', (error) => {
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
   * Convert YouTube video to MP3 using the API
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
      // First get video info
      const videoInfo = await this.getVideoInfo(url);
      
      // Get download link from API
      const downloadResult = await this.getDownloadLink(videoId);
      
      if (!downloadResult.success || !downloadResult.downloadUrl) {
        return {
          success: false,
          error: downloadResult.error || 'Failed to get download link'
        };
      }

      // Download the MP3 file
      const filename = `${generateFilenameFromTitle(videoInfo.title)}.mp3`;
      const filePath = path.join(this.downloadsDir, filename);
      
      await this.downloadFile(downloadResult.downloadUrl, filePath);

      return {
        success: true,
        title: videoInfo.title,
        duration: videoInfo.duration
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
            const data = JSON.parse(body);

            if (data.status === 'ok' && data.link) {
              resolve({
                success: true,
                downloadUrl: data.link
              });
            } else {
              resolve({
                success: false,
                error: data.msg || 'Failed to get download link'
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: `Failed to parse API response: ${parseError}`
            });
          }
        });
      });

      req.on('error', (error) => {
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
   * Download file from URL to local path
   */
  private async downloadFile(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(filePath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (error: Error) => {
          fs.unlink(filePath).catch(() => {}); // Clean up on error
          reject(error);
        });
      }).on('error', (error: Error) => {
        reject(error);
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
