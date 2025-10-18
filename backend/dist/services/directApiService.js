"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectApiService = void 0;
const logger_1 = __importDefault(require("../config/logger"));
class DirectApiService {
    constructor() {
        this.apiHost = 'saveytb.com';
        this.apiKey = process.env.SAVEYTB_API_KEY || '';
        if (!this.apiKey) {
            logger_1.default.warn('⚠️ SAVEYTB_API_KEY not found in environment variables. Using public API.');
        }
    }
    /**
     * Extract video ID from YouTube URL (private method)
     */
    extractVideoIdPrivate(url) {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?gaming\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }
    /**
     * Get video information from YouTube
     */
    async getVideoInfo(url) {
        const videoId = this.extractVideoIdPrivate(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }
        logger_1.default.info(`📹 Getting video info for video ID: ${videoId}`);
        try {
            // Use YouTube oEmbed API to get video title
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const response = await fetch(oembedUrl);
            if (response.ok) {
                const data = await response.json();
                return {
                    title: data.title || `Video ${videoId}`,
                    duration: 180, // Default duration
                    durationFormatted: '03:00',
                    thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    uploader: data.author_name || 'Unknown',
                    viewCount: '0',
                    videoId: videoId
                };
            }
        }
        catch (error) {
            logger_1.default.warn(`Failed to fetch video title for ${videoId}:`, error);
        }
        // Fallback to video ID if API fails
        return {
            title: `Video ${videoId}`,
            duration: 180,
            durationFormatted: '03:00',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            uploader: 'Unknown',
            viewCount: '0',
            videoId: videoId
        };
    }
    /**
     * Convert YouTube video to MP3 using a real API
     */
    async convertToMp3(url, quality = '128k') {
        const videoId = this.extractVideoIdPrivate(url);
        if (!videoId) {
            return {
                success: false,
                error: 'Invalid YouTube URL'
            };
        }
        logger_1.default.info(`🎵 Converting video ${videoId} to MP3 with quality 128k`);
        // Get video info to get the real title
        const videoInfo = await this.getVideoInfo(url);
        try {
            // Use a real YouTube to MP3 API service
            const apiUrl = 'https://api.vevioz.com/api/button/mp3/128kbps';
            const formData = new URLSearchParams();
            formData.append('url', url);
            formData.append('format', 'mp3');
            formData.append('quality', '128k');
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: formData
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.download_url) {
                    logger_1.default.info(`✅ Real conversion successful for video ${videoId}`);
                    return {
                        success: true,
                        downloadUrl: data.download_url,
                        title: videoInfo.title,
                        duration: data.duration || 180,
                        filesize: data.filesize || 5000000
                    };
                }
            }
        }
        catch (error) {
            logger_1.default.warn(`API conversion failed for ${videoId}, trying alternative:`, error);
        }
        // Fallback to another API service
        try {
            const alternativeUrl = 'https://youtube-mp3-download1.p.rapidapi.com/api/convert';
            const response = await fetch(alternativeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
                    'X-RapidAPI-Host': 'youtube-mp3-download1.p.rapidapi.com'
                },
                body: JSON.stringify({
                    url: url,
                    format: 'mp3',
                    quality: '128k'
                })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.link) {
                    logger_1.default.info(`✅ Alternative API conversion successful for video ${videoId}`);
                    return {
                        success: true,
                        downloadUrl: data.link,
                        title: videoInfo.title,
                        duration: data.duration || 180,
                        filesize: data.filesize || 5000000
                    };
                }
            }
        }
        catch (error) {
            logger_1.default.warn(`Alternative API also failed for ${videoId}:`, error);
        }
        // If all APIs fail, return error
        return {
            success: false,
            error: 'All conversion services are currently unavailable. Please try again later.'
        };
    }
    /**
     * Format duration in seconds to HH:MM:SS format
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }
    /**
     * Extract video ID from URL (public method)
     */
    extractVideoId(url) {
        return this.extractVideoIdPrivate(url);
    }
}
exports.DirectApiService = DirectApiService;
//# sourceMappingURL=directApiService.js.map