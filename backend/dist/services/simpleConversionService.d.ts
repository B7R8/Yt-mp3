import { ConversionJob, ConversionRequest } from '../types';
import { VideoInfo } from './youtubeMp3ApiService';
export declare class SimpleConversionService {
    private downloadsDir;
    private apiService;
    constructor();
    private ensureDownloadsDir;
    /**
     * Extract video ID from YouTube URL - Enhanced to support all formats
     */
    private extractVideoId;
    /**
     * Check if URL is blacklisted
     */
    private checkBlacklist;
    /**
     * Create a new conversion job
     */
    createJob(request: ConversionRequest): Promise<string>;
    /**
     * Process conversion using YouTube MP3 API
     */
    private processConversion;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    /**
     * Update job status
     */
    private updateJobStatus;
    /**
     * Get job file path
     */
    getJobFilePath(jobId: string): Promise<string | null>;
    /**
     * Get video information
     */
    getVideoInfo(url: string): Promise<VideoInfo>;
    /**
     * Refresh download URL for an existing job
     */
    refreshDownloadUrl(jobId: string): Promise<string | null>;
    /**
     * Cleanup old files (20 minutes = 1/3 hour)
     */
    cleanupOldFiles(): Promise<void>;
}
//# sourceMappingURL=simpleConversionService.d.ts.map