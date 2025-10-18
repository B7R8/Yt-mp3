"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const logger_1 = __importDefault(require("../config/logger"));
const database_1 = require("../config/database");
class MediaService {
    constructor() {
        this.allowedBitrates = [64, 128, 192, 256, 320];
        this.tmpDir = process.env.TMP_DIR || '/tmp/app-media';
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '100000000'); // 100MB default
        // Ensure tmp directory exists
        this.ensureTmpDirectory();
    }
    ensureTmpDirectory() {
        if (!fs_1.default.existsSync(this.tmpDir)) {
            fs_1.default.mkdirSync(this.tmpDir, { recursive: true });
            logger_1.default.info(`Created temporary directory: ${this.tmpDir}`);
        }
    }
    /**
     * Create a new audio processing job
     */
    async createJob(request) {
        const jobId = (0, uuid_1.v4)();
        const downloadToken = (0, uuid_1.v4)();
        const expireMinutes = request.expireMinutes || 20;
        const expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
        // Validate bitrate
        if (request.bitrate && !this.allowedBitrates.includes(request.bitrate)) {
            throw new Error(`Invalid bitrate. Allowed values: ${this.allowedBitrates.join(', ')}`);
        }
        // Validate trim parameters
        if (request.action === 'trim' && request.trim) {
            if (request.trim.start < 0 || request.trim.duration <= 0) {
                throw new Error('Invalid trim parameters: start must be >= 0, duration must be > 0');
            }
        }
        const jobData = {
            id: jobId,
            source_url: request.sourceUrl,
            status: 'pending',
            action: request.action,
            bitrate: request.bitrate,
            trim_start: request.trim?.start,
            trim_duration: request.trim?.duration,
            download_token: downloadToken,
            expires_at: expiresAt
        };
        try {
            const result = await (0, database_1.query)(`
        INSERT INTO jobs (
          id, source_url, status, action, bitrate, trim_start, trim_duration, 
          download_token, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
                jobData.id,
                jobData.source_url,
                jobData.status,
                jobData.action,
                jobData.bitrate,
                jobData.trim_start,
                jobData.trim_duration,
                jobData.download_token,
                jobData.expires_at
            ]);
            logger_1.default.info(`Created audio processing job: ${jobId}`, {
                sourceUrl: request.sourceUrl,
                action: request.action,
                expiresAt
            });
            return result.rows[0];
        }
        catch (error) {
            logger_1.default.error('Failed to create job:', error);
            throw new Error('Failed to create processing job');
        }
    }
    /**
     * Download file from URL to temporary location
     */
    async downloadFile(jobId, sourceUrl) {
        const tempPath = path_1.default.join(this.tmpDir, `${jobId}.mp3.part`);
        const finalPath = path_1.default.join(this.tmpDir, `${jobId}.mp3`);
        logger_1.default.info(`Starting download for job ${jobId}`, { sourceUrl });
        try {
            const response = await (0, axios_1.default)({
                method: 'GET',
                url: sourceUrl,
                responseType: 'stream',
                timeout: 300000, // 5 minutes timeout
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            // Check content type
            const contentType = response.headers['content-type'];
            if (contentType && !contentType.includes('audio/') && !contentType.includes('application/octet-stream')) {
                throw new Error(`Invalid content type: ${contentType}`);
            }
            // Check file size
            const contentLength = response.headers['content-length'];
            if (contentLength && parseInt(contentLength) > this.maxFileSize) {
                throw new Error(`File too large: ${contentLength} bytes (max: ${this.maxFileSize})`);
            }
            // Stream download to file
            const writer = fs_1.default.createWriteStream(tempPath);
            let downloadedBytes = 0;
            response.data.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                if (downloadedBytes > this.maxFileSize) {
                    writer.destroy();
                    fs_1.default.unlinkSync(tempPath);
                    throw new Error(`File too large: ${downloadedBytes} bytes (max: ${this.maxFileSize})`);
                }
            });
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', () => resolve());
                writer.on('error', reject);
                response.data.on('error', reject);
            });
            // Rename to final path
            fs_1.default.renameSync(tempPath, finalPath);
            // Get file stats
            const stats = fs_1.default.statSync(finalPath);
            const fileSize = stats.size;
            // Update job with download info
            await (0, database_1.query)(`
        UPDATE jobs 
        SET status = 'processing', direct_download_url = $1, file_size = $2
        WHERE id = $3
      `, [sourceUrl, fileSize, jobId]);
            logger_1.default.info(`Download completed for job ${jobId}`, {
                fileSize,
                path: finalPath
            });
            return finalPath;
        }
        catch (error) {
            // Clean up temp file if it exists
            if (fs_1.default.existsSync(tempPath)) {
                fs_1.default.unlinkSync(tempPath);
            }
            if (fs_1.default.existsSync(finalPath)) {
                fs_1.default.unlinkSync(finalPath);
            }
            logger_1.default.error(`Download failed for job ${jobId}:`, error);
            throw error;
        }
    }
    /**
     * Process audio file with ffmpeg
     */
    async processAudio(jobId, inputPath, jobData) {
        const outputPath = path_1.default.join(this.tmpDir, `${jobId}_processed.mp3`);
        logger_1.default.info(`Starting audio processing for job ${jobId}`, {
            action: jobData.action,
            bitrate: jobData.bitrate,
            trim: jobData.action === 'trim' ? { start: jobData.trim_start, duration: jobData.trim_duration } : null
        });
        try {
            const ffmpegArgs = this.buildFfmpegArgs(inputPath, outputPath, jobData);
            logger_1.default.debug(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);
            const ffmpegProcess = (0, child_process_1.spawn)('ffmpeg', ffmpegArgs);
            let stderr = '';
            ffmpegProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            const exitCode = await new Promise((resolve, reject) => {
                ffmpegProcess.on('close', (code) => {
                    resolve(code || 0);
                });
                ffmpegProcess.on('error', (error) => {
                    reject(error);
                });
            });
            if (exitCode !== 0) {
                throw new Error(`FFmpeg failed with exit code ${exitCode}: ${stderr}`);
            }
            // Verify output file exists and get stats
            if (!fs_1.default.existsSync(outputPath)) {
                throw new Error('FFmpeg processing completed but output file not found');
            }
            const stats = fs_1.default.statSync(outputPath);
            const processedFileSize = stats.size;
            // Get audio duration from ffmpeg output
            const duration = this.extractDurationFromFfmpegOutput(stderr);
            // Update job with processing results
            await (0, database_1.query)(`
        UPDATE jobs 
        SET status = 'ready', processed_path = $1, file_size = $2, duration = $3
        WHERE id = $4
      `, [outputPath, processedFileSize, duration, jobId]);
            // Clean up original file
            if (fs_1.default.existsSync(inputPath)) {
                fs_1.default.unlinkSync(inputPath);
            }
            logger_1.default.info(`Audio processing completed for job ${jobId}`, {
                outputPath,
                fileSize: processedFileSize,
                duration
            });
            return outputPath;
        }
        catch (error) {
            // Clean up output file if it exists
            if (fs_1.default.existsSync(outputPath)) {
                fs_1.default.unlinkSync(outputPath);
            }
            logger_1.default.error(`Audio processing failed for job ${jobId}:`, error);
            throw error;
        }
    }
    /**
     * Build ffmpeg command arguments based on job parameters
     */
    buildFfmpegArgs(inputPath, outputPath, jobData) {
        const args = ['-i', inputPath];
        // Add trim parameters if action is trim
        if (jobData.action === 'trim' && jobData.trim_start !== undefined && jobData.trim_duration !== undefined) {
            args.push('-ss', jobData.trim_start.toString());
            args.push('-t', jobData.trim_duration.toString());
        }
        // Add bitrate/quality settings
        if (jobData.bitrate) {
            args.push('-b:a', `${jobData.bitrate}k`);
        }
        // Add codec settings based on action
        if (jobData.action === 'reencode') {
            args.push('-c:a', 'libmp3lame');
        }
        else if (jobData.action === 'none') {
            args.push('-c', 'copy');
        }
        else {
            // Default for trim or other actions
            args.push('-c:a', 'libmp3lame');
        }
        // Add output file and overwrite flag
        args.push('-y', outputPath);
        return args;
    }
    /**
     * Extract duration from ffmpeg stderr output
     */
    extractDurationFromFfmpegOutput(stderr) {
        try {
            // Look for duration in format "Duration: HH:MM:SS.mmm"
            const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
            if (durationMatch) {
                const hours = parseInt(durationMatch[1]);
                const minutes = parseInt(durationMatch[2]);
                const seconds = parseFloat(durationMatch[3]);
                return hours * 3600 + minutes * 60 + seconds;
            }
        }
        catch (error) {
            logger_1.default.warn('Failed to extract duration from ffmpeg output:', error);
        }
        return null;
    }
    /**
     * Get job by ID
     */
    async getJob(jobId) {
        try {
            const result = await (0, database_1.query)('SELECT * FROM jobs WHERE id = $1', [jobId]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.default.error(`Failed to get job ${jobId}:`, error);
            return null;
        }
    }
    /**
     * Get job by download token
     */
    async getJobByToken(token) {
        try {
            const result = await (0, database_1.query)('SELECT * FROM jobs WHERE download_token = $1', [token]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger_1.default.error(`Failed to get job by token ${token}:`, error);
            return null;
        }
    }
    /**
     * Update job status
     */
    async updateJobStatus(jobId, status, errorMessage) {
        try {
            await (0, database_1.query)(`
        UPDATE jobs 
        SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, errorMessage, jobId]);
            logger_1.default.info(`Updated job ${jobId} status to ${status}`, { errorMessage });
        }
        catch (error) {
            logger_1.default.error(`Failed to update job ${jobId} status:`, error);
            throw error;
        }
    }
    /**
     * Delete job and associated files
     */
    async deleteJob(jobId) {
        try {
            const job = await this.getJob(jobId);
            if (!job) {
                logger_1.default.warn(`Job ${jobId} not found for deletion`);
                return;
            }
            // Delete files
            if (job.processed_path && fs_1.default.existsSync(job.processed_path)) {
                fs_1.default.unlinkSync(job.processed_path);
                logger_1.default.info(`Deleted processed file: ${job.processed_path}`);
            }
            // Update job status to deleted
            await (0, database_1.query)(`
        UPDATE jobs 
        SET status = 'deleted', processed_path = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [jobId]);
            logger_1.default.info(`Deleted job ${jobId}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to delete job ${jobId}:`, error);
            throw error;
        }
    }
    /**
     * Clean up expired jobs and files
     */
    async cleanupExpiredJobs() {
        try {
            // Check if processed_path column exists first
            const columnCheck = await (0, database_1.query)(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'processed_path'
      `);
            if (columnCheck.rows.length === 0) {
                logger_1.default.warn('processed_path column does not exist in jobs table, skipping file cleanup');
                return 0;
            }
            // Find expired jobs
            const result = await (0, database_1.query)(`
        SELECT id, processed_path 
        FROM jobs 
        WHERE expires_at < CURRENT_TIMESTAMP 
        AND status != 'deleted'
        AND processed_path IS NOT NULL
      `);
            let cleanedCount = 0;
            for (const job of result.rows) {
                try {
                    // Delete file if it exists
                    if (job.processed_path && fs_1.default.existsSync(job.processed_path)) {
                        fs_1.default.unlinkSync(job.processed_path);
                        logger_1.default.info(`Cleaned up expired file: ${job.processed_path}`);
                    }
                    // Update job status
                    await (0, database_1.query)(`
            UPDATE jobs 
            SET status = 'deleted', processed_path = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [job.id]);
                    cleanedCount++;
                }
                catch (error) {
                    logger_1.default.error(`Failed to cleanup job ${job.id}:`, error);
                }
            }
            if (cleanedCount > 0) {
                logger_1.default.info(`Cleaned up ${cleanedCount} expired jobs`);
            }
            return cleanedCount;
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup expired jobs:', error);
            return 0;
        }
    }
    /**
     * Schedule job deletion after expiration
     */
    scheduleJobDeletion(jobId, expireMinutes) {
        const deleteTime = expireMinutes * 60 * 1000; // Convert to milliseconds
        setTimeout(async () => {
            try {
                await this.deleteJob(jobId);
            }
            catch (error) {
                logger_1.default.error(`Scheduled deletion failed for job ${jobId}:`, error);
            }
        }, deleteTime);
        logger_1.default.info(`Scheduled deletion for job ${jobId} in ${expireMinutes} minutes`);
    }
}
exports.MediaService = MediaService;
exports.default = new MediaService();
//# sourceMappingURL=mediaService.js.map