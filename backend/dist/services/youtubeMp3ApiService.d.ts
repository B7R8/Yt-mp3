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
    filesize?: number;
}
export declare class YouTubeMp3ApiService {
    private readonly apiKeys;
    private readonly apiHost;
    private readonly downloadsDir;
    private readonly alternativeApiHost;
    private currentApiKeyIndex;
    constructor();
    private loadApiKeys;
    private getCurrentApiKey;
    private switchToNextApiKey;
    private resetApiKeyIndex;
    private ensureDownloadsDir;
    /**
     * Extract video ID from YouTube URL - Enhanced to support all formats
     */
    private extractVideoId;
    /**
     * Get video information from YouTube MP3 API with fallback system
     */
    getVideoInfo(url: string): Promise<VideoInfo>;
    /**
     * Get video information with current API key
     */
    private getVideoInfoWithCurrentKey;
    /**
     * Convert YouTube video to MP3 using the API - Direct download approach with fallback system
     */
    convertToMp3(url: string, quality?: string): Promise<ConversionResult>;
    /**
     * Try alternative API if primary fails with validation
     */
    private tryAlternativeApiWithValidation;
    /**
     * Try alternative API if primary fails
     */
    private tryAlternativeApi;
    /**
     * Get download link from YouTube MP3 API with validation
     */
    private getDownloadLinkWithValidation;
    /**
     * Get download link from YouTube MP3 API
     */
    private getDownloadLink;
    /**
     * Validate if a download URL is accessible - DISABLED for performance
     */
    private validateDownloadUrl;
    /**
     * Download file from URL to local path with retry logic
     */
    private downloadFile;
    /**
     * Check if URL is a valid YouTube URL
     */
    isValidYouTubeUrl(url: string): boolean;
}
//# sourceMappingURL=youtubeMp3ApiService.d.ts.map