export interface ProcessAudioRequest {
    sourceUrl: string;
    action: 'trim' | 'reencode' | 'none';
    trim?: {
        start: number;
        duration: number;
    };
    bitrate?: 64 | 128 | 192 | 256 | 320;
    expireMinutes?: number;
}
export interface JobData {
    id: string;
    source_url: string;
    status: string;
    direct_download_url?: string;
    processed_path?: string;
    file_size?: number;
    duration?: number;
    bitrate?: number;
    action?: string;
    trim_start?: number;
    trim_duration?: number;
    download_token?: string;
    created_at: Date;
    expires_at: Date;
    error_message?: string;
}
export declare class MediaService {
    private tmpDir;
    private maxFileSize;
    private allowedBitrates;
    constructor();
    private ensureTmpDirectory;
    /**
     * Create a new audio processing job
     */
    createJob(request: ProcessAudioRequest): Promise<JobData>;
    /**
     * Download file from URL to temporary location
     */
    downloadFile(jobId: string, sourceUrl: string): Promise<string>;
    /**
     * Process audio file with ffmpeg
     */
    processAudio(jobId: string, inputPath: string, jobData: JobData): Promise<string>;
    /**
     * Build ffmpeg command arguments based on job parameters
     */
    private buildFfmpegArgs;
    /**
     * Extract duration from ffmpeg stderr output
     */
    private extractDurationFromFfmpegOutput;
    /**
     * Get job by ID
     */
    getJob(jobId: string): Promise<JobData | null>;
    /**
     * Get job by download token
     */
    getJobByToken(token: string): Promise<JobData | null>;
    /**
     * Update job status
     */
    updateJobStatus(jobId: string, status: string, errorMessage?: string): Promise<void>;
    /**
     * Delete job and associated files
     */
    deleteJob(jobId: string): Promise<void>;
    /**
     * Clean up expired jobs and files
     */
    cleanupExpiredJobs(): Promise<number>;
    /**
     * Schedule job deletion after expiration
     */
    scheduleJobDeletion(jobId: string, expireMinutes: number): void;
}
declare const _default: MediaService;
export default _default;
//# sourceMappingURL=mediaService.d.ts.map