import { Response } from 'express';
import { ConversionJob, ConversionRequest } from '../types';
export interface StreamingConversionRequest extends ConversionRequest {
    quality: string;
    trim?: {
        start: string;
        end: string;
    };
}
export interface VideoMetadata {
    title: string;
    duration: number;
    durationFormatted: string;
}
export declare class StreamingConversionService {
    private readonly LONG_VIDEO_THRESHOLD;
    private readonly FORCED_QUALITY_FOR_LONG_VIDEOS;
    /**
     * Get video metadata including duration
     */
    getVideoMetadata(url: string): Promise<VideoMetadata>;
    /**
     * Check if video is longer than 3 hours and determine quality
     */
    private determineQuality;
    /**
     * Convert time string (HH:mm:ss or mm:ss) to seconds
     */
    private timeToSeconds;
    /**
     * Stream audio directly from YouTube to client via FFmpeg
     */
    streamAudioToClient(url: string, res: Response, request: StreamingConversionRequest): Promise<{
        message?: string;
        processingTime?: number;
    }>;
    /**
     * Create a conversion job record (for tracking purposes)
     */
    createJob(request: StreamingConversionRequest): Promise<string>;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
}
//# sourceMappingURL=streamingConversionService.d.ts.map