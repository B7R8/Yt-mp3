import { ConversionJob, ConversionRequest } from './conversionService';
import { VideoInfo } from './youtubeMp3ApiService';
export declare class SimpleConversionService {
    private downloadsDir;
    private apiService;
    constructor();
    private ensureDownloadsDir;
    /**
     * Extract video ID from various YouTube URL formats
     */
    private extractVideoId;
    /**
     * Check if URL is blacklisted
     */
    private isBlacklisted;
    /**
     * Validate YouTube URL
     */
    private validateUrl;
    /**
     * Get video information
     */
    getVideoInfo(url: string): Promise<VideoInfo>;
    /**
     * Convert video to MP3
     */
    convertToMp3(request: ConversionRequest): Promise<ConversionJob>;
    /**
     * Process the conversion
     */
    private processConversion;
    /**
     * Download file immediately from URL (for URLs that expire quickly)
     */
    private downloadFileImmediately;
    /**
     * Convert technical errors to user-friendly messages
     */
    private getUserFriendlyErrorMessage;
    /**
     * Generate filename from video title
     */
    private generateFilename;
    /**
     * Get conversion job status
     */
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    /**
     * Get all jobs for a user
     */
    getUserJobs(userId: string, limit?: number): Promise<ConversionJob[]>;
    /**
     * Clean up old files
     */
    cleanupOldFiles(): Promise<void>;
    /**
     * Get conversion statistics
     */
    getStats(): Promise<{
        total: number;
        completed: number;
        failed: number;
        pending: number;
        processing: number;
    }>;
    /**
     * Create a new conversion job
     */
    createJob(request: ConversionRequest): Promise<string>;
    /**
     * Refresh download URL for a job
     */
    refreshDownloadUrl(jobId: string): Promise<string | null>;
}
//# sourceMappingURL=simpleConversionService.d.ts.map