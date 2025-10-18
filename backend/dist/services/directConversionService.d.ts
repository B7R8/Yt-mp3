import { VideoInfo } from './directApiService';
export interface ConversionRequest {
    url: string;
    quality?: string;
    trimStart?: number;
    trimDuration?: number;
    userId?: string;
    userIp?: string;
}
export interface ConversionJob {
    id: string;
    youtube_url: string;
    video_title: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    quality: string;
    mp3_filename: string;
    direct_download_url: string;
    error_message: string;
    created_at: Date;
    updated_at: Date;
    expires_at: Date;
}
export declare class DirectConversionService {
    private apiService;
    constructor();
    /**
     * Extract video ID from YouTube URL (private method)
     */
    private extractVideoIdPrivate;
    /**
     * Create a new conversion job
     */
    createJob(request: ConversionRequest): Promise<string>;
    /**
     * Process the conversion using direct API
     */
    private processConversion;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    /**
     * Get video information
     */
    getVideoInfo(url: string): Promise<VideoInfo>;
    /**
     * Extract video ID (public method)
     */
    extractVideoId(url: string): string | null;
    /**
     * Cleanup old files (no-op for direct API)
     */
    cleanupOldFiles(): Promise<void>;
    /**
     * Get system stats
     */
    getStats(): Promise<any>;
    /**
     * Refresh download URL (no-op for direct API)
     */
    refreshDownloadUrl(jobId: string): Promise<string | null>;
}
//# sourceMappingURL=directConversionService.d.ts.map