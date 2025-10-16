"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.QueueService = void 0;
const events_1 = require("events");
const memoryCache_1 = require("../config/memoryCache");
const logger_1 = __importDefault(require("../config/logger"));
class QueueService extends events_1.EventEmitter {
    constructor(queueName = 'conversion_queue') {
        super();
        this.isProcessing = false;
        this.currentJobs = new Map();
        this.queueName = queueName;
        this.processingSet = `${queueName}:processing`;
        this.completedSet = `${queueName}:completed`;
        this.failedSet = `${queueName}:failed`;
        this.statsKey = `${queueName}:stats`;
        this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS || '5');
    }
    // Add job to queue
    async addJob(jobId, data, priority = 0) {
        const job = {
            id: jobId,
            data,
            priority,
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: 3
        };
        try {
            // Add to queue with priority (higher priority = lower score for sorted set)
            await memoryCache_1.memoryCache.lpush(this.queueName, job);
            // Update stats
            await this.incrementStats('pending');
            logger_1.default.info(`Job ${jobId} added to queue with priority ${priority}`);
            this.emit('jobAdded', job);
        }
        catch (error) {
            logger_1.default.error(`Failed to add job ${jobId} to queue:`, error);
            throw error;
        }
    }
    // Get next job from queue
    async getNextJob() {
        try {
            // Get job with highest priority (FIFO for now)
            const job = await memoryCache_1.memoryCache.rpop(this.queueName);
            if (!job) {
                return null;
            }
            // Add to processing set
            await memoryCache_1.memoryCache.sadd(this.processingSet, job.id);
            // Update stats
            await this.decrementStats('pending');
            await this.incrementStats('processing');
            logger_1.default.info(`Job ${job.id} moved to processing`);
            return job;
        }
        catch (error) {
            logger_1.default.error('Failed to get next job from queue:', error);
            return null;
        }
    }
    // Mark job as completed
    async completeJob(jobId, result) {
        try {
            // Remove from processing set
            await memoryCache_1.memoryCache.srem(this.processingSet, jobId);
            // Add to completed set
            await memoryCache_1.memoryCache.sadd(this.completedSet, jobId);
            // Update stats
            await this.decrementStats('processing');
            await this.incrementStats('completed');
            await this.incrementStats('totalProcessed');
            // Remove from current jobs
            this.currentJobs.delete(jobId);
            logger_1.default.info(`Job ${jobId} completed successfully`);
            this.emit('jobCompleted', { jobId, result });
        }
        catch (error) {
            logger_1.default.error(`Failed to complete job ${jobId}:`, error);
        }
    }
    // Mark job as failed
    async failJob(jobId, error, retry = true) {
        try {
            const job = this.currentJobs.get(jobId);
            if (job && retry && job.attempts < job.maxAttempts) {
                // Retry job
                job.attempts++;
                job.priority += 1000; // Lower priority for retries
                // Add back to queue
                await memoryCache_1.memoryCache.lpush(this.queueName, job);
                // Remove from processing set
                await memoryCache_1.memoryCache.srem(this.processingSet, jobId);
                // Update stats
                await this.decrementStats('processing');
                await this.incrementStats('pending');
                logger_1.default.info(`Job ${jobId} failed, retrying (attempt ${job.attempts}/${job.maxAttempts})`);
                this.emit('jobRetry', { jobId, attempt: job.attempts, error });
            }
            else {
                // Mark as permanently failed
                await memoryCache_1.memoryCache.srem(this.processingSet, jobId);
                await memoryCache_1.memoryCache.sadd(this.failedSet, jobId);
                // Update stats
                await this.decrementStats('processing');
                await this.incrementStats('failed');
                // Remove from current jobs
                this.currentJobs.delete(jobId);
                logger_1.default.error(`Job ${jobId} failed permanently: ${error}`);
                this.emit('jobFailed', { jobId, error });
            }
        }
        catch (error) {
            logger_1.default.error(`Failed to handle job failure ${jobId}:`, error);
        }
    }
    // Start processing jobs
    async startProcessing() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        logger_1.default.info('Queue processing started');
        while (this.isProcessing) {
            try {
                // Check if we can process more jobs
                if (this.currentJobs.size >= this.maxConcurrentJobs) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                // Get next job
                const job = await this.getNextJob();
                if (!job) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }
                // Add to current jobs
                this.currentJobs.set(job.id, job);
                // Process job asynchronously
                this.processJob(job).catch(error => {
                    logger_1.default.error(`Error processing job ${job.id}:`, error);
                    this.failJob(job.id, error.message);
                });
            }
            catch (error) {
                logger_1.default.error('Error in queue processing loop:', error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    // Stop processing jobs
    async stopProcessing() {
        this.isProcessing = false;
        logger_1.default.info('Queue processing stopped');
    }
    // Process individual job
    async processJob(job) {
        try {
            logger_1.default.info(`Processing job ${job.id}`);
            // Emit job processing event
            this.emit('jobProcessing', job);
            // Here you would integrate with your conversion service
            // For now, we'll simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Mark as completed
            await this.completeJob(job.id, { success: true });
        }
        catch (error) {
            logger_1.default.error(`Job ${job.id} processing failed:`, error);
            await this.failJob(job.id, error instanceof Error ? error.message : String(error));
        }
    }
    // Get queue statistics
    async getStats() {
        try {
            const stats = await memoryCache_1.memoryCache.get(this.statsKey);
            return stats || {
                pending: 0,
                processing: 0,
                completed: 0,
                failed: 0,
                totalProcessed: 0
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get queue stats:', error);
            return {
                pending: 0,
                processing: 0,
                completed: 0,
                failed: 0,
                totalProcessed: 0
            };
        }
    }
    // Get queue length
    async getQueueLength() {
        try {
            return await memoryCache_1.memoryCache.llen(this.queueName);
        }
        catch (error) {
            logger_1.default.error('Failed to get queue length:', error);
            return 0;
        }
    }
    // Get processing jobs count
    async getProcessingCount() {
        try {
            return await memoryCache_1.memoryCache.llen(this.processingSet);
        }
        catch (error) {
            logger_1.default.error('Failed to get processing count:', error);
            return 0;
        }
    }
    // Clear queue
    async clearQueue() {
        try {
            await Promise.all([
                memoryCache_1.memoryCache.del(this.queueName),
                memoryCache_1.memoryCache.del(this.processingSet),
                memoryCache_1.memoryCache.del(this.completedSet),
                memoryCache_1.memoryCache.del(this.failedSet),
                memoryCache_1.memoryCache.del(this.statsKey)
            ]);
            this.currentJobs.clear();
            logger_1.default.info('Queue cleared');
        }
        catch (error) {
            logger_1.default.error('Failed to clear queue:', error);
        }
    }
    // Cleanup old jobs
    async cleanupOldJobs(maxAgeHours = 24) {
        try {
            const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            let cleaned = 0;
            // Clean completed jobs
            const completedJobs = await memoryCache_1.memoryCache.smembers(this.completedSet);
            for (const jobId of completedJobs) {
                // Here you would check job creation time and remove old ones
                // For now, we'll just count them
                cleaned++;
            }
            // Clean failed jobs
            const failedJobs = await memoryCache_1.memoryCache.smembers(this.failedSet);
            for (const jobId of failedJobs) {
                // Here you would check job creation time and remove old ones
                cleaned++;
            }
            logger_1.default.info(`Cleaned up ${cleaned} old jobs`);
            return cleaned;
        }
        catch (error) {
            logger_1.default.error('Failed to cleanup old jobs:', error);
            return 0;
        }
    }
    // Private helper methods
    async incrementStats(field) {
        try {
            const stats = await memoryCache_1.memoryCache.get(this.statsKey) || { pending: 0, processing: 0, completed: 0, failed: 0, totalProcessed: 0 };
            stats[field]++;
            await memoryCache_1.memoryCache.set(this.statsKey, stats);
        }
        catch (error) {
            logger_1.default.error(`Failed to increment stats for ${field}:`, error);
        }
    }
    async decrementStats(field) {
        try {
            const stats = await memoryCache_1.memoryCache.get(this.statsKey) || { pending: 0, processing: 0, completed: 0, failed: 0, totalProcessed: 0 };
            if (stats[field] > 0) {
                stats[field]--;
                await memoryCache_1.memoryCache.set(this.statsKey, stats);
            }
        }
        catch (error) {
            logger_1.default.error(`Failed to decrement stats for ${field}:`, error);
        }
    }
    // Health check
    async isHealthy() {
        try {
            const isCacheHealthy = await memoryCache_1.memoryCache.ping();
            return isCacheHealthy && this.isProcessing;
        }
        catch (error) {
            logger_1.default.error('Queue health check failed:', error);
            return false;
        }
    }
}
exports.QueueService = QueueService;
// Export singleton instance
exports.queueService = new QueueService();
exports.default = exports.queueService;
//# sourceMappingURL=queueService.js.map