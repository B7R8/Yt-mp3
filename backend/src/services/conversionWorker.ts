import { parentPort, workerData } from 'worker_threads';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { preserveExactTitle } from '../utils/titleProcessor';

interface ConversionWorkerData {
  jobId: string;
  url: string;
  quality: string;
  trimStart?: string;
  trimEnd?: string;
  outputPath: string;
  tempPath: string;
}

class ConversionWorker {
  private jobId: string;
  private url: string;
  private quality: string;
  private trimStart?: string;
  private trimEnd?: string;
  private outputPath: string;
  private tempPath: string;

  constructor(data: ConversionWorkerData) {
    this.jobId = data.jobId;
    this.url = data.url;
    this.quality = data.quality;
    this.trimStart = data.trimStart;
    this.trimEnd = data.trimEnd;
    this.outputPath = data.outputPath;
    this.tempPath = data.tempPath;
  }

  private sendMessage(type: string, data: any = {}): void {
    if (parentPort) {
      parentPort.postMessage({
        jobId: this.jobId,
        type,
        data
      });
    }
  }

  private sendError(error: string): void {
    this.sendMessage('error', { error });
  }

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

  private async getVideoMetadata(): Promise<{ title: string; duration: number }> {
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('python', [
        '-m', 'yt_dlp',
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=android',
        this.url
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

  private determineQuality(userQuality: string, videoDurationSeconds: number): { quality: string; message?: string } {
    const LONG_VIDEO_THRESHOLD = 3 * 60 * 60; // 3 hours
    
    if (videoDurationSeconds > LONG_VIDEO_THRESHOLD) {
      const userQualityNum = parseInt(userQuality.replace('k', ''));
      
      if (userQualityNum <= 128) {
        return { quality: userQuality };
      }
      
      return {
        quality: '128k',
        message: 'Note: For videos longer than 3 hours, audio quality is automatically set to 128k for faster processing.'
      };
    }
    
    return { quality: userQuality };
  }

  private async downloadAudio(): Promise<string> {
    return new Promise((resolve, reject) => {
      const ytdlpArgs = [
        '-m', 'yt_dlp',
        '-f', 'bestaudio[ext=m4a]/bestaudio/best',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '--output', this.tempPath,
        '--no-playlist',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=android',
        '--concurrent-fragments', '4',
        '--fragment-retries', '3',
        '--retries', '3',
        this.url
      ];

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
      });

      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ytdlp.on('close', async (code) => {
        if (code === 0) {
          try {
            await fs.access(this.tempPath);
            resolve(this.tempPath);
          } catch (error) {
            reject(new Error(`Output file not created: ${this.tempPath}`));
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

  private async processAudioWithFFmpeg(): Promise<void> {
    return new Promise((resolve, reject) => {
      const bitrate = parseInt(this.quality.replace('k', ''));

      const command = ffmpeg(this.tempPath);

      // Set start time if provided
      if (this.trimStart) {
        command.setStartTime(this.trimStart);
      }

      // Calculate duration if both start and end times are provided
      if (this.trimStart && this.trimEnd) {
        const startSeconds = this.timeToSeconds(this.trimStart);
        const endSeconds = this.timeToSeconds(this.trimEnd);
        const duration = endSeconds - startSeconds;
        
        if (duration > 0) {
          command.setDuration(duration);
        }
      }

      // Optimized FFmpeg settings for speed
      command
        .audioBitrate(bitrate)
        .toFormat('mp3')
        .addOption('-preset', 'ultrafast')
        .addOption('-threads', '0') // Use all available threads
        .addOption('-ac', '2') // Stereo
        .addOption('-ar', '44100') // Sample rate
        .output(this.outputPath)
        .on('start', (commandLine) => {
          this.sendMessage('progress', { progress: 25 });
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            this.sendMessage('progress', { progress: 25 + (progress.percent * 0.75) });
          }
        })
        .on('end', () => {
          this.sendMessage('progress', { progress: 100 });
          resolve();
        })
        .on('error', (error, stdout, stderr) => {
          reject(new Error(`FFmpeg processing failed: ${error.message}`));
        })
        .run();
    });
  }

  async process(): Promise<void> {
    try {
      this.sendMessage('progress', { progress: 0 });

      // Step 1: Get video metadata
      this.sendMessage('progress', { progress: 5 });
      const { duration } = await this.getVideoMetadata();
      
      // Apply quality rules
      const qualityResult = this.determineQuality(this.quality, duration);
      const finalQuality = qualityResult.quality;
      
      if (qualityResult.message) {
        // Note: Quality message would need to be handled by the main service
        // as workers can't directly update the database
      }

      // Step 2: Download audio
      this.sendMessage('progress', { progress: 10 });
      await this.downloadAudio();

      // Step 3: Process with FFmpeg
      this.sendMessage('progress', { progress: 20 });
      await this.processAudioWithFFmpeg();

      // Step 4: Cleanup temporary file
      try {
        await fs.unlink(this.tempPath);
      } catch (error) {
        // Ignore cleanup errors
      }

      // Step 5: Complete
      this.sendMessage('completed', { filePath: this.outputPath });

    } catch (error) {
      this.sendError(error.message);
    }
  }
}

// Handle worker messages
if (parentPort) {
  parentPort.on('message', async (data: ConversionWorkerData) => {
    const worker = new ConversionWorker(data);
    await worker.process();
  });
}
