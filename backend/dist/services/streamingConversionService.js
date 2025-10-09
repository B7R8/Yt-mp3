"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingConversionService = void 0;
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../config/logger"));
const database_1 = require("../config/database");
const titleProcessor_1 = require("../utils/titleProcessor");
class StreamingConversionService {
    constructor() {
        this.LONG_VIDEO_THRESHOLD = 3 * 60 * 60; // 3 hours in seconds
        this.FORCED_QUALITY_FOR_LONG_VIDEOS = '128k';
    }
    /**
     * Get video metadata including duration
     */
    async getVideoMetadata(url) {
        return new Promise((resolve, reject) => {
            const ytdlp = (0, child_process_1.spawn)('python', [
                '-m', 'yt_dlp',
                '--dump-json',
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
                        // Format duration as HH:mm:ss
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        const seconds = duration % 60;
                        const durationFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        resolve({
                            title,
                            duration,
                            durationFormatted
                        });
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
    /**
     * Check if video is longer than 3 hours and determine quality
     */
    determineQuality(userQuality, videoDuration) {
        if (videoDuration > this.LONG_VIDEO_THRESHOLD) {
            return {
                quality: this.FORCED_QUALITY_FOR_LONG_VIDEOS,
                message: 'Note: For videos longer than 3 hours, audio quality is automatically set to 128k for faster processing.'
            };
        }
        return { quality: userQuality };
    }
    /**
     * Convert time string (HH:mm:ss or mm:ss) to seconds
     */
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
    /**
     * Stream audio directly from YouTube to client via FFmpeg
     */
    async streamAudioToClient(url, res, request) {
        return new Promise(async (resolve, reject) => {
            const startTime = Date.now();
            try {
                // Step 1: Get video metadata to check duration
                logger_1.default.info(`Getting video metadata for: ${url}`);
                const metadata = await this.getVideoMetadata(url);
                // Step 2: Determine quality based on video duration
                const { quality, message } = this.determineQuality(request.quality, metadata.duration);
                logger_1.default.info(`Video duration: ${metadata.duration}s (${metadata.durationFormatted}), using quality: ${quality}`);
                // Step 3: Set up response headers
                const filename = `${metadata.title.replace(/[^\w\s-]/g, '').trim()}.mp3`;
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Transfer-Encoding', 'chunked');
                // Step 4: Create yt-dlp process for audio-only stream
                const ytdlpArgs = [
                    '-m', 'yt_dlp',
                    '-f', 'bestaudio[ext=m4a]/bestaudio/best', // Audio-only format
                    '--no-playlist',
                    '--no-warnings',
                    '--extractor-args', 'youtube:player_client=android',
                    '--output', '-', // Output to stdout
                    '--no-progress', // Disable progress output to stderr
                    '--quiet', // Reduce verbosity
                    '--buffer-size', '16K', // Smaller buffer for faster streaming
                    '--http-chunk-size', '1M', // Chunk size for HTTP requests
                    url
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
                // Step 5: Create FFmpeg process for processing
                const ffmpegArgs = [
                    '-i', 'pipe:0', // Read from stdin
                    '-f', 'mp3',
                    '-b:a', quality,
                    '-preset', 'ultrafast', // Speed optimization
                    '-movflags', '+faststart', // Optimize for streaming
                    '-avoid_negative_ts', 'make_zero', // Handle timestamp issues
                    '-fflags', '+genpts', // Generate presentation timestamps
                    '-y' // Overwrite output
                ];
                // Add trimming if specified
                if (request.trim?.start) {
                    ffmpegArgs.push('-ss', request.trim.start);
                }
                if (request.trim?.end) {
                    ffmpegArgs.push('-to', request.trim.end);
                }
                // Add output to stdout
                ffmpegArgs.push('pipe:1');
                const ffmpeg = (0, child_process_1.spawn)('ffmpeg', ffmpegArgs);
                // Step 6: Set up the streaming pipeline
                // yt-dlp stdout -> FFmpeg stdin
                ytdlp.stdout.pipe(ffmpeg.stdin, { end: false });
                // Handle yt-dlp completion
                ytdlp.on('close', (code) => {
                    if (code === 0) {
                        // Close FFmpeg stdin when yt-dlp is done
                        ffmpeg.stdin.end();
                    }
                });
                // FFmpeg stdout -> HTTP response
                ffmpeg.stdout.pipe(res);
                // Ensure proper error handling for pipes
                ytdlp.stdout.on('error', (error) => {
                    logger_1.default.error(`yt-dlp stdout error: ${error.message}`);
                    ffmpeg.stdin.destroy();
                });
                ffmpeg.stdout.on('error', (error) => {
                    logger_1.default.error(`ffmpeg stdout error: ${error.message}`);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Streaming error occurred' });
                    }
                });
                // Handle errors
                ytdlp.stderr.on('data', (data) => {
                    logger_1.default.debug(`yt-dlp stderr: ${data}`);
                });
                // Parse FFmpeg progress from stderr
                let ffmpegProgress = '';
                ffmpeg.stderr.on('data', (data) => {
                    const output = data.toString();
                    ffmpegProgress += output;
                    // Parse time progress from FFmpeg output
                    // FFmpeg outputs: time=00:01:23.45
                    const timeMatch = output.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
                    if (timeMatch) {
                        const currentTime = timeMatch[1];
                        logger_1.default.info(`FFmpeg progress: ${currentTime}`);
                    }
                    // Log other FFmpeg output for debugging
                    logger_1.default.debug(`ffmpeg stderr: ${output}`);
                });
                // Handle yt-dlp process completion (already handled above, but add error handling)
                ytdlp.on('close', (code) => {
                    if (code !== 0) {
                        logger_1.default.error(`yt-dlp process exited with code ${code}`);
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Failed to download audio stream' });
                        }
                        reject(new Error(`yt-dlp failed with code ${code}`));
                    }
                    else {
                        logger_1.default.info('yt-dlp completed successfully');
                    }
                });
                ffmpeg.on('close', (code) => {
                    if (code === 0) {
                        const processingTime = Date.now() - startTime;
                        const processingTimeSeconds = Math.round(processingTime / 1000);
                        logger_1.default.info(`Audio streaming completed successfully in ${processingTimeSeconds} seconds`);
                        resolve({ message, processingTime: processingTimeSeconds });
                    }
                    else {
                        logger_1.default.error(`ffmpeg process exited with code ${code}`);
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Failed to process audio stream' });
                        }
                        reject(new Error(`ffmpeg failed with code ${code}`));
                    }
                });
                // Handle client disconnect
                res.on('close', () => {
                    logger_1.default.info('Client disconnected, terminating processes');
                    ytdlp.kill();
                    ffmpeg.kill();
                });
                // Handle process errors
                ytdlp.on('error', (error) => {
                    logger_1.default.error(`yt-dlp error: ${error.message}`);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Failed to start audio download' });
                    }
                    reject(error);
                });
                ffmpeg.on('error', (error) => {
                    logger_1.default.error(`ffmpeg error: ${error.message}`);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Failed to start audio processing' });
                    }
                    reject(error);
                });
            }
            catch (error) {
                logger_1.default.error(`Streaming error: ${error}`);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to start audio streaming' });
                }
                reject(error);
            }
        });
    }
    /**
     * Create a conversion job record (for tracking purposes)
     */
    async createJob(request) {
        const jobId = (0, uuid_1.v4)();
        const database = await database_1.db;
        try {
            // Get video metadata
            const metadata = await this.getVideoMetadata(request.url);
            // Determine quality
            const { quality, message } = this.determineQuality(request.quality, metadata.duration);
            await database.run(`INSERT INTO conversions (id, youtube_url, video_title, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`, [jobId, request.url, metadata.title]);
            logger_1.default.info(`Streaming conversion job created: ${jobId} for URL: ${request.url}`);
            return jobId;
        }
        catch (error) {
            logger_1.default.error('Failed to create streaming conversion job:', error);
            throw error;
        }
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId) {
        const database = await database_1.db;
        try {
            const result = await database.get('SELECT * FROM conversions WHERE id = ?', [jobId]);
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
        }
        catch (error) {
            logger_1.default.error('Failed to get job status:', error);
            throw error;
        }
    }
}
exports.StreamingConversionService = StreamingConversionService;
//# sourceMappingURL=streamingConversionService.js.map