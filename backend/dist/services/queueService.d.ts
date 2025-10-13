import { EventEmitter } from 'events';
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
export declare class QueueService extends EventEmitter {
    private queueName;
    private processingSet;
    private completedSet;
    private failedSet;
    private statsKey;
    private isProcessing;
    private maxConcurrentJobs;
    private currentJobs;
    constructor(queueName?: string);
    addJob(jobId: string, data: ConversionRequest, priority?: number): Promise<void>;
    getNextJob(): Promise<QueueJob | null>;
    completeJob(jobId: string, result?: any): Promise<void>;
    failJob(jobId: string, error: string, retry?: boolean): Promise<void>;
    startProcessing(): Promise<void>;
    stopProcessing(): Promise<void>;
    private processJob;
    getStats(): Promise<QueueStats>;
    getQueueLength(): Promise<number>;
    getProcessingCount(): Promise<number>;
    clearQueue(): Promise<void>;
    cleanupOldJobs(maxAgeHours?: number): Promise<number>;
    private incrementStats;
    private decrementStats;
    isHealthy(): Promise<boolean>;
}
export declare const queueService: QueueService;
export default queueService;
//# sourceMappingURL=queueService.d.ts.map