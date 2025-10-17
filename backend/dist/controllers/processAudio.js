"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAudio = processAudio;
exports.downloadAudio = downloadAudio;
exports.getJobStatus = getJobStatus;
exports.cleanupExpiredJobs = cleanupExpiredJobs;
const logger_1 = __importDefault(require("../config/logger"));
const mediaService_1 = __importDefault(require("../services/mediaService"));
/**
 * Process audio file from URL
 * POST /api/process
 */
async function processAudio(req, res) {
    try {
        const { sourceUrl, action, trim, bitrate, expireMinutes } = req.body;
        // Validate required fields
        if (!sourceUrl) {
            res.status(400).json({
                success: false,
                message: 'sourceUrl is required'
            });
            return;
        }
        if (!action || !['trim', 'reencode', 'none'].includes(action)) {
            res.status(400).json({
                success: false,
                message: 'action must be one of: trim, reencode, none'
            });
            return;
        }
        // Validate URL format
        try {
            new URL(sourceUrl);
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: 'Invalid sourceUrl format'
            });
            return;
        }
        // Validate trim parameters if action is trim
        if (action === 'trim' && trim) {
            if (typeof trim.start !== 'number' || trim.start < 0) {
                res.status(400).json({
                    success: false,
                    message: 'trim.start must be a non-negative number'
                });
                return;
            }
            if (typeof trim.duration !== 'number' || trim.duration <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'trim.duration must be a positive number'
                });
                return;
            }
        }
        // Validate bitrate
        if (bitrate && ![64, 128, 192, 256, 320].includes(bitrate)) {
            res.status(400).json({
                success: false,
                message: 'bitrate must be one of: 64, 128, 192, 256, 320'
            });
            return;
        }
        // Validate expireMinutes
        if (expireMinutes && (expireMinutes < 1 || expireMinutes > 1440)) {
            res.status(400).json({
                success: false,
                message: 'expireMinutes must be between 1 and 1440 (24 hours)'
            });
            return;
        }
        logger_1.default.info('Processing audio request', {
            sourceUrl,
            action,
            trim,
            bitrate,
            expireMinutes,
            clientIp: req.ip
        });
        // Create job
        const job = await mediaService_1.default.createJob({
            sourceUrl,
            action,
            trim,
            bitrate,
            expireMinutes
        });
        // Schedule job deletion
        const expireMinutesValue = expireMinutes || 20;
        mediaService_1.default.scheduleJobDeletion(job.id, expireMinutesValue);
        // Start processing asynchronously
        processAudioJob(job).catch(error => {
            logger_1.default.error(`Background processing failed for job ${job.id}:`, error);
        });
        // Return immediate response
        const response = {
            jobId: job.id,
            status: job.status,
            downloadUrl: `${req.protocol}://${req.get('host')}/api/download/${job.download_token}`
        };
        res.status(201).json({
            success: true,
            data: response
        });
    }
    catch (error) {
        logger_1.default.error('Process audio request failed:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
/**
 * Download processed audio file
 * GET /api/download/:token
 */
async function downloadAudio(req, res) {
    try {
        const { token } = req.params;
        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Download token is required'
            });
            return;
        }
        logger_1.default.info('Download request', { token, clientIp: req.ip });
        // Get job by token
        const job = await mediaService_1.default.getJobByToken(token);
        if (!job) {
            res.status(404).json({
                success: false,
                message: 'Download token not found'
            });
            return;
        }
        // Check if job is expired
        if (new Date() > new Date(job.expires_at)) {
            res.status(410).json({
                success: false,
                message: 'Download link has expired'
            });
            return;
        }
        // Check if job is ready
        if (job.status !== 'ready') {
            res.status(202).json({
                success: false,
                message: `Job is still ${job.status}. Please try again later.`,
                status: job.status
            });
            return;
        }
        // Check if file exists
        if (!job.processed_path || !require('fs').existsSync(job.processed_path)) {
            res.status(404).json({
                success: false,
                message: 'Processed file not found'
            });
            return;
        }
        // Get file stats
        const fs = require('fs');
        const path = require('path');
        const stats = fs.statSync(job.processed_path);
        const fileName = `processed_audio_${job.id}.mp3`;
        // Set response headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Cache-Control', 'private, max-age=0, no-store');
        res.setHeader('X-File-Size', stats.size.toString());
        logger_1.default.info('Serving file download', {
            jobId: job.id,
            fileName,
            fileSize: stats.size,
            clientIp: req.ip
        });
        // Stream file to client
        const fileStream = fs.createReadStream(job.processed_path);
        fileStream.on('error', (error) => {
            logger_1.default.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error reading file'
                });
            }
        });
        fileStream.pipe(res);
    }
    catch (error) {
        logger_1.default.error('Download request failed:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
/**
 * Get job status
 * GET /api/job/:jobId
 */
async function getJobStatus(req, res) {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            res.status(400).json({
                success: false,
                message: 'Job ID is required'
            });
            return;
        }
        const job = await mediaService_1.default.getJob(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                message: 'Job not found'
            });
            return;
        }
        // Don't expose sensitive information
        const publicJob = {
            id: job.id,
            status: job.status,
            action: job.action,
            bitrate: job.bitrate,
            trim_start: job.trim_start,
            trim_duration: job.trim_duration,
            file_size: job.file_size,
            duration: job.duration,
            created_at: job.created_at,
            expires_at: job.expires_at,
            error_message: job.error_message
        };
        res.json({
            success: true,
            data: publicJob
        });
    }
    catch (error) {
        logger_1.default.error('Get job status failed:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}
/**
 * Background job processing
 */
async function processAudioJob(job) {
    try {
        logger_1.default.info(`Starting background processing for job ${job.id}`);
        // Update status to processing
        await mediaService_1.default.updateJobStatus(job.id, 'processing');
        // Download file
        const downloadedPath = await mediaService_1.default.downloadFile(job.id, job.source_url);
        // Process audio
        await mediaService_1.default.processAudio(job.id, downloadedPath, job);
        logger_1.default.info(`Background processing completed for job ${job.id}`);
    }
    catch (error) {
        logger_1.default.error(`Background processing failed for job ${job.id}:`, error);
        // Update job status to failed
        await mediaService_1.default.updateJobStatus(job.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
}
/**
 * Cleanup expired jobs (called by cron)
 */
async function cleanupExpiredJobs() {
    try {
        const cleanedCount = await mediaService_1.default.cleanupExpiredJobs();
        if (cleanedCount > 0) {
            logger_1.default.info(`Cleanup completed: ${cleanedCount} expired jobs removed`);
        }
    }
    catch (error) {
        logger_1.default.error('Cleanup expired jobs failed:', error);
    }
}
//# sourceMappingURL=processAudio.js.map