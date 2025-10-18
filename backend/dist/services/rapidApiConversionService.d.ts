export interface ConversionRequest {
    url: string;
    quality?: string;
    trimStart?: number;
    trimDuration?: number;
    userId?: string;
    userIp?: string;
}
export interface ConversionJob {
    id: number;
    video_id: string;
    title?: string;
    status: 'pending' | 'processing' | 'done' | 'failed';
    progress?: number;
    download_url?: string;
    requested_at: Date;
    completed_at?: Date;
    error_message?: string;
    quality?: string;
    file_size?: number;
    duration?: number;
    user_ip?: string;
    expires_at: Date;
    updated_at: Date;
}
export interface VideoInfo {
    title: string;
    duration: number;
    durationFormatted: string;
    thumbnail: string;
    uploader: string;
    viewCount: string;
}
export interface IConversionService {
    maxConcurrentJobs: number;
    createJob(request: ConversionRequest): Promise<string>;
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    cleanupOldFiles(): Promise<void>;
    getStats(): Promise<any>;
    extractVideoId(url: string): string | null;
    getVideoInfo(videoId: string): Promise<VideoInfo>;
}
export declare class RapidApiConversionService implements IConversionService {
    private rapidApiService;
    maxConcurrentJobs: number;
    private processingJobs;
    constructor();
    /**
     * Extract video ID from YouTube URL
     */
    extractVideoId(url: string): string | null;
    /**
     * Get video information using RapidAPI
     */
    getVideoInfo(videoId: string): Promise<VideoInfo>;
    /**
     * Create a new conversion job with proper locking
     */
    createJob(request: ConversionRequest): Promise<string>;
    /**
     * Process a conversion job using RapidAPI only
     */
    private processJob;
    /**
     * Actual job processing logic using RapidAPI
     */
    private doProcessJob;
    /**
     * Update job status
     */
    private updateJobStatus;
    /**
     * Update job progress
     */
    private updateJobProgress;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    /**
     * Clean up old files and expired jobs
     */
    cleanupOldFiles(): Promise<void>;
    /**
     * Get system statistics
     */
    getStats(): Promise<any>;
}
export declare const rapidApiConversionService: RapidApiConversionService;
//# sourceMappingURL=rapidApiConversionService.d.ts.map