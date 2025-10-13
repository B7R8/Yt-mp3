"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const optimizedConversionService_1 = require("../services/optimizedConversionService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = __importDefault(require("../config/logger"));
const child_process_1 = require("child_process");
const errorHandler_1 = require("../utils/errorHandler");
const titleProcessor_1 = require("../utils/titleProcessor");
const path_1 = __importDefault(require("path"));
// Helper function to check if cookies file exists and is valid
const getCookiesPath = () => {
    try {
        const cookiesPath = path_1.default.join(__dirname, '../../cookies.txt');
        // Check if file exists synchronously (for performance)
        const fs = require('fs');
        if (fs.existsSync(cookiesPath)) {
            const stats = fs.statSync(cookiesPath);
            // Check if file is not empty and is readable
            if (stats.size > 0) {
                return cookiesPath;
            }
        }
        return null;
    }
    catch (error) {
        logger_1.default.warn('Cookies file check failed:', error);
        return null;
    }
};
const optimizedDatabase_1 = require("../config/optimizedDatabase");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const conversionService = new optimizedConversionService_1.OptimizedConversionService();
const videoInfoCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000;
// Clean expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of videoInfoCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            videoInfoCache.delete(key);
        }
    }
    // Limit cache size
    if (videoInfoCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(videoInfoCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
        for (const [key] of toRemove) {
            videoInfoCache.delete(key);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes
// POST /api/check-url - Enhanced URL validation with caching
router.post('/check-url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'YouTube URL is required'
            });
        }
        // Enhanced URL validation
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/;
        if (!youtubeRegex.test(url)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid YouTube URL'
            });
        }
        // Check cache first for blacklist status
        const urlHash = crypto_1.default.createHash('sha256').update(url).digest('hex');
        const cached = await optimizedDatabase_1.optimizedDb.get('SELECT reason, type FROM blacklist WHERE value = ? OR value = ?', [url, urlHash]);
        if (cached) {
            return res.json({
                success: false,
                isBlacklisted: true,
                message: cached.reason || 'This content is not available for conversion',
                type: cached.type || 'Content'
            });
        }
        res.json({
            success: true,
            isBlacklisted: false,
            message: 'URL is available for conversion'
        });
    }
    catch (error) {
        logger_1.default.error('URL check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check URL'
        });
    }
});
// POST /api/convert - Optimized conversion with caching
router.post('/convert', rateLimiter_1.conversionRateLimit, validation_1.validateConversionRequest, async (req, res) => {
    try {
        const jobId = await conversionService.createJob(req.body);
        logger_1.default.info(`New conversion job created: ${jobId} for URL: ${req.body.url}`);
        res.status(202).json({
            success: true,
            jobId,
            status: 'pending',
            message: 'Conversion job started successfully'
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Create Conversion Job', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/status/:id - Enhanced status with progress tracking
router.get('/status/:id', rateLimiter_1.statusRateLimit, validation_1.validateJobId, async (req, res) => {
    try {
        const job = await conversionService.getJobStatus(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        // Set proper UTF-8 headers for Unicode support
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'utf-8');
        res.json({
            success: true,
            jobId: job.id,
            status: job.status,
            video_title: job.video_title,
            mp3_filename: job.mp3_filename,
            error_message: job.error_message,
            quality_message: job.quality_message,
            created_at: job.created_at,
            updated_at: job.updated_at
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Get Job Status', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/download/:id - Optimized download with streaming
router.get('/download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const filePath = await conversionService.getJobFilePath(req.params.id);
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: 'File not found or conversion not completed'
            });
        }
        const job = await conversionService.getJobStatus(req.params.id);
        const filename = job?.mp3_filename || 'converted.mp3';
        // Set proper headers for direct audio download with caching
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Download-Options', 'noopen');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        // Stream the file with proper error handling
        const fs = require('fs');
        const fileStream = fs.createReadStream(filePath);
        // Set content length for proper download
        const stats = fs.statSync(filePath);
        res.setHeader('Content-Length', stats.size);
        fileStream.on('error', (error) => {
            logger_1.default.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'File stream error'
                });
            }
        });
        fileStream.on('end', () => {
            logger_1.default.info(`File ${filename} sent successfully`);
        });
        fileStream.pipe(res);
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Download File', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/video-info - Ultra-fast video info with advanced caching
router.get('/video-info', rateLimiter_1.statusRateLimit, async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL parameter is required'
            });
        }
        // Extract video ID for caching (supports regular videos, Shorts, and youtu.be links)
        const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : url;
        // Check cache first - INSTANT response if cached!
        const cached = videoInfoCache.get(videoId);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            logger_1.default.info(`Cache hit for video: ${videoId}`);
            // Set proper UTF-8 headers for Unicode support
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Encoding', 'utf-8');
            return res.json({
                success: true,
                title: cached.title,
                duration: cached.duration,
                durationFormatted: cached.durationFormatted,
                thumbnail: cached.thumbnail,
                uploader: cached.uploader,
                viewCount: cached.viewCount,
                cached: true
            });
        }
        // Set timeout for very long videos (up to 50 hours)
        const timeout = setTimeout(() => {
            logger_1.default.warn(`Video info request timeout for: ${url}`);
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Request timeout - video might be unavailable or very long'
                });
            }
        }, 30000); // 30 second timeout for faster response
        // Build yt-dlp command with optional cookies
        const ytdlpArgs = [
            '-m', 'yt_dlp',
            '--skip-download', // Don't download anything
            '--no-playlist', // Single video only
            '--no-warnings', // Reduce output
            '--no-check-certificates', // Skip SSL verification
            '--no-cache-dir', // Don't use cache
            '--socket-timeout', '15', // 15 second socket timeout
            '--extractor-retries', '2', // 2 retries for reliability
            '--fragment-retries', '2', // 2 fragment retries
            '--retries', '3', // 3 total retries
            '--http-chunk-size', '10485760', // 10MB chunks for faster processing
            '--concurrent-fragments', '4', // 4 concurrent fragments
            '-J', // JSON output (faster parsing)
            '--flat-playlist', // Don't extract playlist
            '--extractor-args', 'youtube:player_client=android', // Use mobile client for faster access
        ];
        // Add cookies if available
        const cookiesPath = getCookiesPath();
        if (cookiesPath) {
            ytdlpArgs.push('--cookies', cookiesPath);
            logger_1.default.info(`Using cookies file: ${cookiesPath}`);
        }
        else {
            logger_1.default.info('No valid cookies file found, proceeding without cookies');
        }
        ytdlpArgs.push(url);
        // Use yt-dlp with highly optimized settings
        const ytdlp = (0, child_process_1.spawn)('python', ytdlpArgs, {
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
            clearTimeout(timeout);
            if (res.headersSent)
                return; // Already responded due to timeout
            if (code === 0 && output.trim()) {
                try {
                    // Parse JSON output (faster than line parsing)
                    const jsonData = JSON.parse(output);
                    // Preserve the exact original title from yt-dlp
                    const rawTitle = jsonData.title || 'Unknown';
                    const title = (0, titleProcessor_1.preserveExactTitle)(rawTitle);
                    let durationSeconds = 0;
                    // Handle duration from JSON
                    if (jsonData.duration && typeof jsonData.duration === 'number') {
                        durationSeconds = Math.floor(jsonData.duration);
                    }
                    else if (jsonData.duration_string) {
                        // Fallback: parse duration string
                        const parts = jsonData.duration_string.split(':').map((p) => parseInt(p, 10));
                        if (parts.length === 3) {
                            durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                        }
                        else if (parts.length === 2) {
                            durationSeconds = parts[0] * 60 + parts[1];
                        }
                    }
                    // Convert seconds to HH:MM:SS format for display
                    const hours = Math.floor(durationSeconds / 3600);
                    const minutes = Math.floor((durationSeconds % 3600) / 60);
                    const seconds = durationSeconds % 60;
                    const durationFormatted = hours > 0
                        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    // Cache the result for future requests
                    videoInfoCache.set(videoId, {
                        title,
                        duration: durationSeconds,
                        durationFormatted,
                        thumbnail: jsonData.thumbnail || '',
                        uploader: jsonData.uploader || '',
                        viewCount: jsonData.view_count || 0,
                        timestamp: Date.now()
                    });
                    logger_1.default.info(`Video info fetched and cached: "${title}" (${durationSeconds}s) - Original: "${rawTitle}"`);
                    // Set proper UTF-8 headers for Unicode support
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.setHeader('Content-Encoding', 'utf-8');
                    res.json({
                        success: true,
                        title,
                        duration: durationSeconds,
                        durationFormatted,
                        thumbnail: jsonData.thumbnail || '',
                        uploader: jsonData.uploader || '',
                        viewCount: jsonData.view_count || 0,
                        cached: false
                    });
                }
                catch (parseError) {
                    const userMessage = (0, errorHandler_1.getUserFriendlyError)(parseError);
                    (0, errorHandler_1.logTechnicalError)(parseError, 'Parse Video Info', req);
                    (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, parseError);
                }
            }
            else {
                // Create error with technical details for logging only
                const technicalError = new Error(`yt-dlp failed with code ${code}: ${errorOutput}`);
                const userMessage = (0, errorHandler_1.getUserFriendlyError)(technicalError);
                (0, errorHandler_1.logTechnicalError)(technicalError, 'yt-dlp Video Info', req);
                (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, technicalError);
            }
        });
        ytdlp.on('error', (error) => {
            clearTimeout(timeout);
            if (res.headersSent)
                return;
            const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
            (0, errorHandler_1.logTechnicalError)(error, 'yt-dlp Process Error', req);
            (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Video Info Request', req);
        if (!res.headersSent) {
            (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
        }
    }
});
// GET /api/stats - System performance statistics
router.get('/stats', async (req, res) => {
    try {
        const cacheStats = conversionService.getCacheStats();
        const dbStats = optimizedDatabase_1.optimizedDb.getPoolStats();
        res.json({
            success: true,
            cache: cacheStats,
            database: dbStats,
            videoInfoCache: videoInfoCache.size,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    }
    catch (error) {
        logger_1.default.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats'
        });
    }
});
// POST /api/batch-convert - Batch conversion for multiple URLs
router.post('/batch-convert', rateLimiter_1.conversionRateLimit, async (req, res) => {
    try {
        const { urls, quality, trim_start, trim_end } = req.body;
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'URLs array is required'
            });
        }
        if (urls.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 URLs allowed per batch'
            });
        }
        const jobIds = [];
        // Process URLs in parallel
        const promises = urls.map(async (url) => {
            try {
                const jobId = await conversionService.createJob({
                    url,
                    quality: quality || '192k',
                    trim_start,
                    trim_end
                });
                return { success: true, url, jobId };
            }
            catch (error) {
                return { success: false, url, error: error instanceof Error ? error.message : String(error) };
            }
        });
        const results = await Promise.all(promises);
        res.json({
            success: true,
            results,
            message: `Batch conversion started for ${results.length} URLs`
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Batch Convert', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
exports.default = router;
//# sourceMappingURL=optimizedConversion.js.map