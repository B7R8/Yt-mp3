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
    video_id: string;
    youtube_url: string;
    video_title?: string;
    user_id?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    quality: string;
    trim_start?: number;
    trim_duration?: number;
    file_path?: string;
    file_size?: number;
    duration?: number;
    ffmpeg_logs?: string;
    error_message?: string;
    download_url?: string;
    created_at: Date;
    updated_at: Date;
    expires_at: Date;
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
export declare class ConversionService implements IConversionService {
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
     * Get video information using yt-dlp
     */
    getVideoInfo(videoId: string): Promise<VideoInfo>;
    /**
     * Download video using yt-dlp
     */
    private downloadVideo;
    /**
     * Process audio with ffmpeg
     */
    private processAudio;
    /**
     * Get audio duration using ffprobe
     */
    private getAudioDuration;
    /**
     * Create a new conversion job
     */
    createJob(request: ConversionRequest): Promise<string>;
    /**
     * Process a conversion job
     */
    private processJob;
    /**
     * Actual job processing logic
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
export declare const conversionService: ConversionService;
//# sourceMappingURL=conversionService.d.ts.map