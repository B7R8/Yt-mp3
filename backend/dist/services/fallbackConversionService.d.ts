import { IConversionService, ConversionRequest, ConversionJob, VideoInfo } from './conversionService';
export declare class FallbackConversionService implements IConversionService {
    private downloadsDir;
    private tempDir;
    maxConcurrentJobs: number;
    private processingJobs;
    private videoMutex;
    constructor();
    private ensureDirectories;
    /**
     * Extract video ID from YouTube URL
     */
    extractVideoId(url: string): string | null;
    /**
     * Check if video is already being processed (mutex)
     */
    private acquireVideoMutex;
    /**
     * Release video mutex
     */
    private releaseVideoMutex;
    /**
     * Get video information (fallback - returns mock data)
     */
    getVideoInfo(videoId: string): Promise<VideoInfo>;
    /**
     * Download video (fallback - creates mock file)
     */
    private downloadVideo;
    /**
     * Process audio (fallback - creates mock processed file)
     */
    private processAudio;
    /**
     * Get audio duration (fallback - returns mock duration)
     */
    private getAudioDuration;
    /**
     * Create a new conversion job
     */
    createJob(request: ConversionRequest): Promise<string>;
    /**
     * Process a conversion job (fallback - creates mock file)
     */
    private processJob;
    /**
     * Actual job processing logic (fallback)
     */
    private doProcessJob;
    /**
     * Update job status
     */
    private updateJobStatus;
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
export declare const fallbackConversionService: FallbackConversionService;
//# sourceMappingURL=fallbackConversionService.d.ts.map