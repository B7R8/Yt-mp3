import { Response } from 'express';
import { ConversionJob } from '../types';
export interface StreamingRequest {
    url: string;
    quality?: string;
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
export declare class StreamingService {
    private readonly LONG_VIDEO_THRESHOLD;
    private readonly FORCED_QUALITY_FOR_LONG_VIDEOS;
    /**
     * Get video metadata including duration
     */
    getVideoMetadata(url: string): Promise<VideoMetadata>;
    /**
     * Determine quality based on video duration (3-hour rule)
     */
    private determineQuality;
    /**
     * Stream audio directly from YouTube to client via FFmpeg pipeline
     * YouTube Stream -> FFmpeg -> Response Stream (NO TEMPORARY FILES)
     */
    streamAudioToClient(url: string, res: Response, request: StreamingRequest): Promise<{
        message?: string;
    }>;
    /**
     * Create a conversion job record (for tracking purposes)
     */
    createJob(request: StreamingRequest): Promise<string>;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
}
//# sourceMappingURL=streamingService.d.ts.map