import { ConversionJob, ConversionRequest } from '../types';
import { EventEmitter } from 'events';
export declare class OptimizedConversionService extends EventEmitter {
    private downloadsDir;
    private cacheDir;
    private tempDir;
    private conversionCache;
    private videoInfoCache;
    private activeJobs;
    private workerPool;
    private maxWorkers;
    private maxCacheSize;
    private cacheTTL;
    constructor();
    private initializeDirectories;
    private initializeWorkerPool;
    private handleWorkerMessage;
    private handleWorkerError;
    private getCacheKey;
    private checkCache;
    private addToCache;
    private getVideoInfoOptimized;
    private fetchVideoInfo;
    private checkBlacklist;
    createJob(request: ConversionRequest): Promise<string>;
    private processConversionWithWorker;
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    private updateJobStatus;
    getJobFilePath(jobId: string): Promise<string | null>;
    private startCacheCleanup;
    cleanupOldFiles(): Promise<void>;
    getCacheStats(): {
        conversionCache: number;
        videoInfoCache: number;
        workerPool: number;
    };
}
//# sourceMappingURL=optimizedConversionService.d.ts.map