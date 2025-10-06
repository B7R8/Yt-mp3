import { ConversionJob, ConversionRequest } from '../types';
export declare class ConversionService {
    private downloadsDir;
    constructor();
    private ensureDownloadsDir;
    private extractVideoTitle;
    createJob(request: ConversionRequest): Promise<string>;
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    private updateJobStatus;
    /**
     * Download audio from YouTube using yt-dlp
     * Returns path to the downloaded audio file
     */
    private downloadAudio;
    /**
     * Convert time string (HH:mm:ss) to seconds
     */
    private timeToSeconds;
    /**
     * Process audio with ffmpeg: trim and set bitrate
     */
    private processAudioWithFFmpeg;
    private processConversion;
    getJobFilePath(jobId: string): Promise<string | null>;
    cleanupOldFiles(): Promise<void>;
}
//# sourceMappingURL=conversionService.d.ts.map