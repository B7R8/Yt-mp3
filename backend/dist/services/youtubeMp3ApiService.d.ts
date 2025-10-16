export interface VideoInfo {
    title: string;
    duration: number;
    durationFormatted: string;
    thumbnail: string;
    uploader: string;
    viewCount: number;
    videoId: string;
}
export interface ConversionResult {
    success: boolean;
    downloadUrl?: string;
    error?: string;
    title?: string;
    duration?: number;
}
export declare class YouTubeMp3ApiService {
    private readonly apiKey;
    private readonly apiHost;
    private readonly downloadsDir;
    constructor();
    private ensureDownloadsDir;
    /**
     * Extract video ID from YouTube URL
     */
    private extractVideoId;
    /**
     * Get video information from YouTube MP3 API
     */
    getVideoInfo(url: string): Promise<VideoInfo>;
    /**
     * Convert YouTube video to MP3 using the API
     */
    convertToMp3(url: string, quality?: string): Promise<ConversionResult>;
    /**
     * Get download link from YouTube MP3 API
     */
    private getDownloadLink;
    /**
     * Download file from URL to local path
     */
    private downloadFile;
    /**
     * Check if URL is a valid YouTube URL
     */
    isValidYouTubeUrl(url: string): boolean;
}
//# sourceMappingURL=youtubeMp3ApiService.d.ts.map