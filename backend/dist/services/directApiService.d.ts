export interface VideoInfo {
    title: string;
    duration: number;
    durationFormatted: string;
    thumbnail: string;
    uploader: string;
    viewCount: string;
    videoId: string;
}
export interface ConversionResult {
    success: boolean;
    downloadUrl?: string;
    error?: string;
    title?: string;
    duration?: number;
    filesize?: number;
}
export declare class DirectApiService {
    private readonly apiHost;
    private readonly apiKey;
    constructor();
    /**
     * Extract video ID from YouTube URL (private method)
     */
    private extractVideoIdPrivate;
    /**
     * Get video information from YouTube
     */
    getVideoInfo(url: string): Promise<VideoInfo>;
    /**
     * Convert YouTube video to MP3 using a real API
     */
    convertToMp3(url: string, quality?: string): Promise<ConversionResult>;
    /**
     * Format duration in seconds to HH:MM:SS format
     */
    private formatDuration;
    /**
     * Extract video ID from URL (public method)
     */
    extractVideoId(url: string): string | null;
}
//# sourceMappingURL=directApiService.d.ts.map