import { EventEmitter } from 'events';
import { redisManager } from '../config/redis';
import logger from '../config/logger';
import { ConversionRequest } from '../types';

interface QueueJob {
  id: string;
  data: ConversionRequest;
  priority: number;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
}

export class QueueService extends EventEmitter {
  private queueName: string;
  private processingSet: string;
  private completedSet: string;
  private failedSet: string;
  private statsKey: string;
  private isProcessing: boolean = false;
  private maxConcurrentJobs: number;
  private currentJobs: Map<string, QueueJob> = new Map();

  constructor(queueName: string = 'conversion_queue') {
    super();
    this.queueName = queueName;
    this.processingSet = `${queueName}:processing`;
    this.completedSet = `${queueName}:completed`;
    this.failedSet = `${queueName}:failed`;
    this.statsKey = `${queueName}:stats`;
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS || '5');
  }

  // Add job to queue
  async addJob(jobId: string, data: ConversionRequest, priority: number = 0): Promise<void> {
    const job: QueueJob = {
      id: jobId,
      data,
      priority,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: 3
    };

    try {
      // Add to queue with priority (higher priority = lower score for sorted set)
      await redisManager.getClient().zadd(this.queueName, priority, JSON.stringify(job));
      
      // Update stats
      await this.incrementStats('pending');
      
      logger.info(`Job ${jobId} added to queue with priority ${priority}`);
      this.emit('jobAdded', job);
    } catch (error) {
      logger.error(`Failed to add job ${jobId} to queue:`, error);
      throw error;
    }
  }

  // Get next job from queue
  async getNextJob(): Promise<QueueJob | null> {
    try {
      // Get job with highest priority (lowest score)
      const result = await redisManager.getClient().zpopmin(this.queueName, 1);
      
      if (result.length === 0) {
        return null;
      }

      const job: QueueJob = JSON.parse(result[0]);
      
      // Add to processing set
      await redisManager.sadd(this.processingSet, job.id);
      
      // Update stats
      await this.decrementStats('pending');
      await this.incrementStats('processing');
      
      logger.info(`Job ${job.id} moved to processing`);
      return job;
    } catch (error) {
      logger.error('Failed to get next job from queue:', error);
      return null;
    }
  }

  // Mark job as completed
  async completeJob(jobId: string, result?: any): Promise<void> {
    try {
      // Remove from processing set
      await redisManager.srem(this.processingSet, jobId);
      
      // Add to completed set
      await redisManager.sadd(this.completedSet, jobId);
      
      // Update stats
      await this.decrementStats('processing');
      await this.incrementStats('completed');
      await this.incrementStats('totalProcessed');
      
      // Remove from current jobs
      this.currentJobs.delete(jobId);
      
      logger.info(`Job ${jobId} completed successfully`);
      this.emit('jobCompleted', { jobId, result });
    } catch (error) {
      logger.error(`Failed to complete job ${jobId}:`, error);
    }
  }

  // Mark job as failed
  async failJob(jobId: string, error: string, retry: boolean = true): Promise<void> {
    try {
      const job = this.currentJobs.get(jobId);
      
      if (job && retry && job.attempts < job.maxAttempts) {
        // Retry job
        job.attempts++;
        job.priority += 1000; // Lower priority for retries
        
        // Add back to queue
        await redisManager.getClient().zadd(this.queueName, job.priority, JSON.stringify(job));
        
        // Remove from processing set
        await redisManager.srem(this.processingSet, jobId);
        
        // Update stats
        await this.decrementStats('processing');
        await this.incrementStats('pending');
        
        logger.info(`Job ${jobId} failed, retrying (attempt ${job.attempts}/${job.maxAttempts})`);
        this.emit('jobRetry', { jobId, attempt: job.attempts, error });
      } else {
        // Mark as permanently failed
        await redisManager.srem(this.processingSet, jobId);
        await redisManager.sadd(this.failedSet, jobId);
        
        // Update stats
        await this.decrementStats('processing');
        await this.incrementStats('failed');
        
        // Remove from current jobs
        this.currentJobs.delete(jobId);
        
        logger.error(`Job ${jobId} failed permanently: ${error}`);
        this.emit('jobFailed', { jobId, error });
      }
    } catch (error) {
      logger.error(`Failed to handle job failure ${jobId}:`, error);
    }
  }

  // Start processing jobs
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logger.info('Queue processing started');

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
          logger.error(`Error processing job ${job.id}:`, error);
          this.failJob(job.id, error.message);
        });

      } catch (error) {
        logger.error('Error in queue processing loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // Stop processing jobs
  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    logger.info('Queue processing stopped');
  }

  // Process individual job
  private async processJob(job: QueueJob): Promise<void> {
    try {
      logger.info(`Processing job ${job.id}`);
      
      // Emit job processing event
      this.emit('jobProcessing', job);
      
      // Here you would integrate with your conversion service
      // For now, we'll simulate processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark as completed
      await this.completeJob(job.id, { success: true });
      
    } catch (error) {
      logger.error(`Job ${job.id} processing failed:`, error);
      await this.failJob(job.id, error instanceof Error ? error.message : String(error));
    }
  }

  // Get queue statistics
  async getStats(): Promise<QueueStats> {
    try {
      const stats = await redisManager.get<QueueStats>(this.statsKey);
      return stats || {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalProcessed: 0
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
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
  async getQueueLength(): Promise<number> {
    try {
      return await redisManager.getClient().zcard(this.queueName);
    } catch (error) {
      logger.error('Failed to get queue length:', error);
      return 0;
    }
  }

  // Get processing jobs count
  async getProcessingCount(): Promise<number> {
    try {
      return await redisManager.getClient().scard(this.processingSet);
    } catch (error) {
      logger.error('Failed to get processing count:', error);
      return 0;
    }
  }

  // Clear queue
  async clearQueue(): Promise<void> {
    try {
      await Promise.all([
        redisManager.getClient().del(this.queueName),
        redisManager.getClient().del(this.processingSet),
        redisManager.getClient().del(this.completedSet),
        redisManager.getClient().del(this.failedSet),
        redisManager.getClient().del(this.statsKey)
      ]);
      
      this.currentJobs.clear();
      logger.info('Queue cleared');
    } catch (error) {
      logger.error('Failed to clear queue:', error);
    }
  }

  // Cleanup old jobs
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<number> {
    try {
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let cleaned = 0;

      // Clean completed jobs
      const completedJobs = await redisManager.smembers(this.completedSet);
      for (const jobId of completedJobs) {
        // Here you would check job creation time and remove old ones
        // For now, we'll just count them
        cleaned++;
      }

      // Clean failed jobs
      const failedJobs = await redisManager.smembers(this.failedSet);
      for (const jobId of failedJobs) {
        // Here you would check job creation time and remove old ones
        cleaned++;
      }

      logger.info(`Cleaned up ${cleaned} old jobs`);
      return cleaned;
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
      return 0;
    }
  }

  // Private helper methods
  private async incrementStats(field: string): Promise<void> {
    try {
      await redisManager.getClient().hincrby(this.statsKey, field, 1);
    } catch (error) {
      logger.error(`Failed to increment stats for ${field}:`, error);
    }
  }

  private async decrementStats(field: string): Promise<void> {
    try {
      await redisManager.getClient().hincrby(this.statsKey, field, -1);
    } catch (error) {
      logger.error(`Failed to decrement stats for ${field}:`, error);
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const isRedisHealthy = await redisManager.ping();
      return isRedisHealthy && this.isProcessing;
    } catch (error) {
      logger.error('Queue health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const queueService = new QueueService();
export default queueService;
