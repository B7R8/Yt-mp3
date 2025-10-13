"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const titleProcessor_1 = require("../utils/titleProcessor");
class ConversionWorker {
    constructor(data) {
        this.jobId = data.jobId;
        this.url = data.url;
        this.quality = data.quality;
        this.trimStart = data.trimStart;
        this.trimEnd = data.trimEnd;
        this.outputPath = data.outputPath;
        this.tempPath = data.tempPath;
    }
    sendMessage(type, data = {}) {
        if (worker_threads_1.parentPort) {
            worker_threads_1.parentPort.postMessage({
                jobId: this.jobId,
                type,
                data
            });
        }
    }
    sendError(error) {
        this.sendMessage('error', { error });
    }
    timeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(p => parseInt(p, 10));
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        else {
            return parts[0];
        }
    }
    async getVideoMetadata() {
        return new Promise((resolve, reject) => {
            const ytdlp = (0, child_process_1.spawn)('python', [
                '-m', 'yt_dlp',
                '--dump-json',
                '--no-playlist',
                '--no-warnings',
                '--cookies', path_1.default.join(__dirname, '../../cookies.txt'), // Use cookies to bypass robot verification
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
            ytdlp.stdout.on('data', (data) => {
                output += data.toString('utf8');
            });
            ytdlp.stderr.on('data', (data) => {
                errorOutput += data.toString('utf8');
            });
            ytdlp.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    try {
                        const jsonData = JSON.parse(output);
                        const title = (0, titleProcessor_1.preserveExactTitle)(jsonData.title || 'Unknown');
                        const duration = jsonData.duration || 0;
                        resolve({ title, duration });
                    }
                    catch (parseError) {
                        reject(new Error(`Failed to parse video metadata: ${parseError}`));
                    }
                }
                else {
                    reject(new Error(`Failed to get video metadata: ${errorOutput}`));
                }
            });
            ytdlp.on('error', (error) => {
                reject(new Error(`Error getting video metadata: ${error.message}`));
            });
        });
    }
    determineQuality(userQuality, videoDurationSeconds) {
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
    async downloadAudio() {
        return new Promise((resolve, reject) => {
            const ytdlpArgs = [
                '-m', 'yt_dlp',
                '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best', // Audio-only streams
                '--extract-audio', // Extract audio only
                '--audio-format', 'mp3', // Convert to MP3
                '--audio-quality', this.quality, // Set user-requested quality
                '--output', this.tempPath, // Output path
                '--no-playlist', // Single video only
                '--no-warnings', // Reduce output noise
                '--no-check-certificates', // Skip SSL verification for speed
                '--no-cache-dir', // Don't use cache
                '--concurrent-fragments', '4', // Parallel downloads for speed
                '--fragment-retries', '3', // Retry failed fragments
                '--retries', '3', // Total retries
                '--socket-timeout', '30', // Socket timeout
                '--extractor-retries', '2', // Extractor retries
                '--http-chunk-size', '10485760', // 10MB chunks for faster processing
                '--postprocessor-args', 'ffmpeg:-vn', // Force no video stream in output
                '--cookies', path_1.default.join(__dirname, '../../cookies.txt'), // Use cookies to bypass robot verification
                '--extractor-args', 'youtube:player_client=android', // Use mobile client for faster access
                this.url
            ];
            const ytdlp = (0, child_process_1.spawn)('python', ytdlpArgs, {
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
                        await fs_1.promises.access(this.tempPath);
                        resolve(this.tempPath);
                    }
                    catch (error) {
                        reject(new Error(`Output file not created: ${this.tempPath}`));
                    }
                }
                else {
                    reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput}`));
                }
            });
            ytdlp.on('error', (error) => {
                reject(new Error(`yt-dlp process error: ${error.message}`));
            });
        });
    }
    async processAudioWithFFmpeg() {
        return new Promise((resolve, reject) => {
            const command = (0, fluent_ffmpeg_1.default)(this.tempPath);
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
            // Optimized FFmpeg settings for speed (no bitrate change needed, already correct quality)
            command
                .toFormat('mp3')
                .addOption('-preset', 'ultrafast')
                .addOption('-threads', '0') // Use all available threads
                .addOption('-ac', '2') // Stereo
                .addOption('-ar', '44100') // Sample rate
                .addOption('-vn') // Force no video stream
                .addOption('-acodec', 'libmp3lame') // Force audio codec
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
    async process() {
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
            // Step 3: Process with FFmpeg (only if trimming needed)
            this.sendMessage('progress', { progress: 20 });
            if (this.trimStart || this.trimEnd) {
                await this.processAudioWithFFmpeg();
            }
            else {
                // No trimming needed, just copy the file
                await fs_1.promises.copyFile(this.tempPath, this.outputPath);
                this.sendMessage('progress', { progress: 100 });
            }
            // Step 4: Cleanup temporary file
            try {
                await fs_1.promises.unlink(this.tempPath);
            }
            catch (error) {
                // Ignore cleanup errors
            }
            // Step 5: Complete
            this.sendMessage('completed', { filePath: this.outputPath });
        }
        catch (error) {
            this.sendError(error.message);
        }
    }
}
// Handle worker messages
if (worker_threads_1.parentPort) {
    worker_threads_1.parentPort.on('message', async (data) => {
        const worker = new ConversionWorker(data);
        await worker.process();
    });
}
//# sourceMappingURL=conversionWorker.js.map