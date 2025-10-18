"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const simpleConversionService_1 = require("../services/simpleConversionService");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = __importDefault(require("../config/logger"));
const errorHandler_1 = require("../utils/errorHandler");
const crypto_1 = __importDefault(require("crypto"));
const optimizedDatabase_1 = require("../config/optimizedDatabase");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const router = express_1.default.Router();
let conversionService = null;
// Lazy initialization of conversion service
function getConversionService() {
    if (!conversionService) {
        conversionService = new simpleConversionService_1.SimpleConversionService();
    }
    return conversionService;
}
// Helper method to refresh download URL
async function refreshDownloadUrl(jobId) {
    return await getConversionService().refreshDownloadUrl(jobId);
}
// POST /api/check-url - URL validation with blacklist check
router.post('/check-url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'YouTube URL is required'
            });
        }
        // Enhanced URL validation - supports all YouTube URL formats
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/|m\.youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=|gaming\.youtube\.com\/watch\?v=)[\w-]+/;
        if (!youtubeRegex.test(url)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid YouTube URL (supports youtube.com, youtu.be, and all YouTube variants)'
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
// POST /api/convert - Create conversion job
router.post('/convert', rateLimiter_1.conversionRateLimit, validation_1.validateConversionRequest, async (req, res) => {
    try {
        const jobId = await getConversionService().createJob(req.body);
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
// GET /api/status/:id - Get job status
router.get('/status/:id', rateLimiter_1.statusRateLimit, validation_1.validateJobId, async (req, res) => {
    try {
        const job = await getConversionService().getJobStatus(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        // Set proper UTF-8 headers for Unicode support
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'utf-8');
        const response = {
            success: true,
            jobId: job.id,
            status: job.status,
            video_title: job.video_title,
            mp3_filename: job.mp3_filename,
            error_message: job.error_message,
            quality_message: job.quality_message,
            created_at: job.created_at,
            updated_at: job.updated_at
        };
        // Add download URL if conversion is completed
        if (job.status === 'completed') {
            if (job.processed_path) {
                // Local file available - preferred method
                response.download_url = `/api/download/${job.id}`;
                response.download_filename = job.mp3_filename;
                response.download_type = 'local'; // Indicates this is a local file
                response.file_valid = true;
                response.file_size = 0; // Will be determined during download
                logger_1.default.info(`📁 [Job ${job.id}] Status: Local file available at ${job.processed_path}`);
            }
            else if (job.direct_download_url) {
                // Fallback to external URL
                response.download_url = job.direct_download_url; // Direct API download URL
                response.download_filename = job.mp3_filename;
                response.download_type = 'direct'; // Indicates this is a direct download
                response.file_valid = true;
                response.file_size = 0; // Unknown for external URLs
                logger_1.default.info(`🔗 [Job ${job.id}] Status: External download URL available`);
            }
        }
        res.json(response);
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Get Job Status', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/download/:id - Stream file with proper headers (no source domain exposure)
router.get('/download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const jobId = req.params.id;
        logger_1.default.info(`🎵 Download request for job: ${jobId}`);
        const job = await getConversionService().getJobStatus(jobId);
        if (!job) {
            logger_1.default.warn(`❌ Job not found: ${jobId}`);
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        if (job.status !== 'completed') {
            logger_1.default.warn(`⏳ Job not completed: ${jobId}, status: ${job.status}`);
            return res.status(400).json({
                success: false,
                message: `Conversion is ${job.status}. Please wait for completion.`
            });
        }
        const filename = job.mp3_filename || 'converted.mp3';
        // Priority 1: Serve local file if available
        if (job.processed_path) {
            logger_1.default.info(`🎵 Starting download for local file: ${filename}`);
            logger_1.default.info(`📁 Local file path: ${job.processed_path}`);
            // Set proper download headers with RFC 5987 encoding for international characters
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            const fs = require('fs');
            const path = require('path');
            try {
                // Resolve the path relative to the backend directory
                const filePath = path.resolve(__dirname, '../../', job.processed_path);
                // Check if file exists and get its size
                const stats = await fs.promises.stat(filePath);
                if (stats.size === 0) {
                    logger_1.default.error(`❌ File is empty: ${filePath}, size: ${stats.size}`);
                    return res.status(500).json({
                        success: false,
                        message: 'File is empty or corrupted'
                    });
                }
                if (stats.size > 1073741824) { // 1GB limit
                    logger_1.default.error(`❌ File too large: ${filePath}, size: ${stats.size} bytes`);
                    return res.status(500).json({
                        success: false,
                        message: 'File is too large'
                    });
                }
                // Set content length for proper download progress
                res.setHeader('Content-Length', stats.size);
                // Stream the local file
                const fileStream = fs.createReadStream(filePath);
                fileStream.pipe(res);
                fileStream.on('error', (error) => {
                    logger_1.default.error(`❌ Error streaming local file: ${error.message}`);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: 'Error reading file'
                        });
                    }
                });
                logger_1.default.info(`✅ Successfully streaming local file: ${filePath}`);
                return;
            }
            catch (error) {
                logger_1.default.error(`❌ Error accessing local file: ${error}`);
                // Fall through to try direct download URL
            }
        }
        // Priority 2: Fallback to direct download URL if no local file
        if (!job.direct_download_url) {
            logger_1.default.error(`❌ No download URL or local file found for job: ${jobId}`);
            return res.status(404).json({
                success: false,
                message: 'Download URL not available'
            });
        }
        logger_1.default.info(`🎵 Starting download for: ${filename}`);
        logger_1.default.info(`🔗 Direct download URL: ${job.direct_download_url}`);
        // Stream the file from the API URL with proper headers
        const https = require('https');
        const url = require('url');
        const parsedUrl = url.parse(job.direct_download_url);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.path,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'audio/mpeg, audio/*, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        };
        // Set proper download headers to hide source domain
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        const proxyReq = https.request(options, (proxyRes) => {
            logger_1.default.info(`📡 Proxy response status: ${proxyRes.statusCode} for job: ${jobId}`);
            // Handle redirects
            if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                logger_1.default.info(`🔄 Following redirect for job: ${jobId}`);
                res.redirect(proxyRes.statusCode, proxyRes.headers.location);
                return;
            }
            if (proxyRes.statusCode === 404) {
                logger_1.default.error(`❌ Download URL expired (404) for job: ${jobId} - attempting to refresh`);
                // Try to refresh the download URL
                refreshDownloadUrl(jobId).then((newUrl) => {
                    if (newUrl) {
                        logger_1.default.info(`🔄 Redirecting to refreshed URL for job: ${jobId}`);
                        res.redirect(302, `/api/download/${jobId}`);
                    }
                    else {
                        res.status(404).json({
                            success: false,
                            message: 'Download link has expired. Please try converting again.'
                        });
                    }
                }).catch((error) => {
                    logger_1.default.error(`❌ Failed to refresh download URL for job ${jobId}:`, error);
                    res.status(404).json({
                        success: false,
                        message: 'Download link has expired. Please try converting again.'
                    });
                });
                return;
            }
            if (proxyRes.statusCode !== 200) {
                logger_1.default.error(`❌ Download failed with status: ${proxyRes.statusCode} for job: ${jobId}`);
                res.status(proxyRes.statusCode).json({
                    success: false,
                    message: 'Download failed'
                });
                return;
            }
            // Copy relevant headers (but not source domain info)
            if (proxyRes.headers['content-length']) {
                res.setHeader('Content-Length', proxyRes.headers['content-length']);
            }
            if (proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', proxyRes.headers['content-type']);
            }
            // Stream the file
            proxyRes.pipe(res);
            proxyRes.on('end', () => {
                logger_1.default.info(`✅ Download completed successfully for job: ${jobId}`);
            });
        });
        proxyReq.on('error', (error) => {
            logger_1.default.error(`❌ Download error for job ${jobId}:`, error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Download failed'
                });
            }
        });
        proxyReq.setTimeout(30000, () => {
            logger_1.default.error(`⏰ Download timeout for job: ${jobId}`);
            proxyReq.destroy();
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Download timeout'
                });
            }
        });
        proxyReq.end();
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Download File', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/video-info - Get video information
router.get('/video-info', rateLimiter_1.statusRateLimit, async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL parameter is required'
            });
        }
        // Get video info using the new API service
        const videoInfo = await getConversionService().getVideoInfo(url);
        // Set proper UTF-8 headers for Unicode support
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'utf-8');
        res.json({
            success: true,
            title: videoInfo.title,
            duration: videoInfo.duration,
            durationFormatted: videoInfo.durationFormatted,
            thumbnail: videoInfo.thumbnail,
            uploader: videoInfo.uploader,
            viewCount: videoInfo.viewCount,
            cached: false
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
        const dbStats = optimizedDatabase_1.optimizedDb.getPoolStats();
        res.json({
            success: true,
            database: dbStats,
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
// GET /api/debug/files - Debug endpoint to check downloaded files
router.get('/debug/files', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
        let files = [];
        try {
            const fileList = fs.readdirSync(downloadsDir);
            files = fileList.map((filename) => {
                const filePath = path.join(downloadsDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            });
        }
        catch (error) {
            logger_1.default.error('Error reading downloads directory:', error);
        }
        res.json({
            success: true,
            downloads_dir: downloadsDir,
            file_count: files.length,
            files: files
        });
    }
    catch (error) {
        logger_1.default.error('Debug files error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get debug info'
        });
    }
});
// POST /api/cleanup - Manual cleanup trigger
router.post('/cleanup', async (req, res) => {
    try {
        logger_1.default.info('Manual cleanup triggered');
        await getConversionService().cleanupOldFiles();
        res.json({
            success: true,
            message: 'Cleanup completed successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Manual cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Cleanup failed'
        });
    }
});
// POST /api/refresh-download/:id - Refresh download URL for a job
router.post('/refresh-download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const jobId = req.params.id;
        logger_1.default.info(`Manual download URL refresh triggered for job: ${jobId}`);
        const newUrl = await getConversionService().refreshDownloadUrl(jobId);
        if (newUrl) {
            res.json({
                success: true,
                message: 'Download URL refreshed successfully',
                download_url: newUrl
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to refresh download URL. The job may not exist or the conversion may have failed.'
            });
        }
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Refresh Download URL', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/direct-download/:id - Get direct download URL (for testing)
router.get('/direct-download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await getConversionService().getJobStatus(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        if (job.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: `Conversion is ${job.status}. Please wait for completion.`
            });
        }
        if (!job.direct_download_url) {
            return res.status(404).json({
                success: false,
                message: 'Direct download URL not available'
            });
        }
        res.json({
            success: true,
            download_url: job.direct_download_url,
            filename: job.mp3_filename,
            title: job.video_title
        });
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Direct Download URL', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// GET /api/test-download/:id - Test download functionality
router.get('/test-download/:id', validation_1.validateJobId, async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await getConversionService().getJobStatus(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        if (job.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: `Conversion is ${job.status}. Please wait for completion.`
            });
        }
        if (!job.direct_download_url) {
            return res.status(404).json({
                success: false,
                message: 'Direct download URL not available'
            });
        }
        // Return HTML page that tests the download
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Download Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ccc; border-radius: 5px; }
            button { padding: 10px 20px; margin: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .info { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>Download Test Page</h1>
        
        <div class="info">
            <h3>Job Information:</h3>
            <p><strong>Job ID:</strong> ${jobId}</p>
            <p><strong>Title:</strong> ${job.video_title || 'N/A'}</p>
            <p><strong>Filename:</strong> ${job.mp3_filename || 'N/A'}</p>
            <p><strong>Direct Download URL:</strong> <a href="${job.direct_download_url}" target="_blank">${job.direct_download_url}</a></p>
        </div>
        
        <div class="test-section">
            <h3>Test 1: Direct Link</h3>
            <p>Click this button to test direct download:</p>
            <button onclick="window.open('${job.direct_download_url}', '_blank')">Download Direct</button>
        </div>
        
        <div class="test-section">
            <h3>Test 2: Redirect Link</h3>
            <p>Click this button to test redirect download:</p>
            <button onclick="window.open('/api/download/${jobId}', '_blank')">Download via Redirect</button>
        </div>
        
        <div class="test-section">
            <h3>Test 3: Hidden Link</h3>
            <p>Click this button to test hidden link download:</p>
            <button onclick="testHiddenDownload()">Download via Hidden Link</button>
        </div>
        
        <script>
            function testHiddenDownload() {
                const link = document.createElement('a');
                link.href = '/api/download/${jobId}';
                link.download = '${job.mp3_filename || 'test.mp3'}';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        </script>
    </body>
    </html>
    `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    catch (error) {
        const userMessage = (0, errorHandler_1.getUserFriendlyError)(error);
        (0, errorHandler_1.logTechnicalError)(error, 'Test Download', req);
        (0, errorHandler_1.sendErrorResponse)(res, 500, userMessage, error);
    }
});
// POST /api/batch-convert - Batch conversion for multiple URLs
router.post('/batch-convert', rateLimiter_1.conversionRateLimit, async (req, res) => {
    try {
        const { urls, quality } = req.body;
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
                const jobId = await getConversionService().createJob({
                    url,
                    quality: quality || '192k'
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
//# sourceMappingURL=simpleConversion.js.map