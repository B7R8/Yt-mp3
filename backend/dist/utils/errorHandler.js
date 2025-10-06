"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorResponse = exports.handleError = exports.logTechnicalError = exports.getUserFriendlyError = exports.USER_ERROR_MESSAGES = void 0;
const logger_1 = __importDefault(require("../config/logger"));
// Professional error messages for users
exports.USER_ERROR_MESSAGES = {
    // Network errors
    NETWORK_ERROR: "Unable to connect to our servers. Please check your internet connection and try again.",
    TIMEOUT_ERROR: "The request is taking longer than expected. Please try again in a moment.",
    SERVER_ERROR: "We're experiencing technical difficulties. Please try again later.",
    // Video errors
    INVALID_URL: "Please enter a valid YouTube URL.",
    VIDEO_NOT_FOUND: "This video could not be found. Please check the URL and try again.",
    VIDEO_PRIVATE: "This video is private and cannot be converted.",
    VIDEO_AGE_RESTRICTED: "This video has age restrictions and cannot be converted.",
    VIDEO_UNAVAILABLE: "This video is currently unavailable. Please try again later.",
    VIDEO_TOO_LONG: "This video is too long to convert. Please try a shorter video.",
    // Conversion errors
    CONVERSION_FAILED: "The conversion failed. Please try again with a different video.",
    AUDIO_EXTRACTION_FAILED: "We couldn't extract audio from this video. Please try a different video.",
    PROCESSING_ERROR: "There was an error processing your video. Please try again.",
    // File errors
    FILE_TOO_LARGE: "The converted file is too large. Please try a shorter video or different quality.",
    STORAGE_FULL: "Our storage is temporarily full. Please try again later.",
    // Validation errors
    INVALID_TIME_RANGE: "Please enter a valid time range for trimming.",
    START_AFTER_END: "Start time must be before end time.",
    END_EXCEEDS_DURATION: "End time cannot exceed video duration.",
    // Rate limiting
    RATE_LIMITED: "Too many requests. Please wait a moment before trying again.",
    // Generic errors
    UNKNOWN_ERROR: "Something went wrong. Please try again.",
    TRY_AGAIN: "Please try again in a few moments.",
    CONTACT_SUPPORT: "If this problem persists, please contact our support team.",
};
// Check if error contains technical details that should be hidden
const isTechnicalError = (message) => {
    const technicalKeywords = [
        'yt-dlp', 'youtube-dl', 'ffmpeg', 'spawn', 'process', 'exit code',
        'failed with code', 'warning:', 'error:', 'traceback', 'stack trace',
        'requested format is not available', 'use --list-formats',
        'github.com/yt-dlp', 'sabr', 'client https formats', 'server-side',
        'experiment', 'missing a url', 'forcing sabr streaming',
        'tv client https formats', 'web_safari client', 'web client',
        'youtube may have enabled', 'sabr-only', 'server-side ad placement',
        'some tv client', 'some web_safari client', 'some web client',
        'youtube is forcing', 'sabr streaming', 'client https formats',
        'missing a url', 'youtube may have', 'enabled the sabr-only',
        'server-side ad placement experiment', 'current session',
        'see https://github.com/yt-dlp', 'for more details'
    ];
    return technicalKeywords.some(keyword => message.toLowerCase().includes(keyword));
};
// Get user-friendly error message based on technical error
const getUserFriendlyError = (error) => {
    // If it's a technical error, return generic message immediately
    if (error?.message && isTechnicalError(error.message)) {
        return exports.USER_ERROR_MESSAGES.CONVERSION_FAILED;
    }
    // Handle specific error types
    if (error?.code) {
        switch (error.code) {
            case 'ENOTFOUND':
            case 'ECONNREFUSED':
            case 'ETIMEDOUT':
            case 'ECONNRESET':
            case 'EHOSTUNREACH':
            case 'ENETUNREACH':
                return exports.USER_ERROR_MESSAGES.NETWORK_ERROR;
            case 'ENOSPC':
            case 'EMFILE':
                return exports.USER_ERROR_MESSAGES.STORAGE_FULL;
            case 'EACCES':
            case 'EPERM':
                return exports.USER_ERROR_MESSAGES.SERVER_ERROR;
            case 'ENOENT':
                return exports.USER_ERROR_MESSAGES.VIDEO_NOT_FOUND;
        }
    }
    if (error?.message) {
        const message = error.message.toLowerCase();
        // Network/connection errors
        if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
            return exports.USER_ERROR_MESSAGES.NETWORK_ERROR;
        }
        // Video-specific errors
        if (message.includes('video not found') || message.includes('404') || message.includes('not found')) {
            return exports.USER_ERROR_MESSAGES.VIDEO_NOT_FOUND;
        }
        if (message.includes('private') || message.includes('unlisted') || message.includes('sign in')) {
            return exports.USER_ERROR_MESSAGES.VIDEO_PRIVATE;
        }
        if (message.includes('age restricted') || message.includes('restricted') || message.includes('sign in to confirm')) {
            return exports.USER_ERROR_MESSAGES.VIDEO_AGE_RESTRICTED;
        }
        if (message.includes('unavailable') || message.includes('not available') || message.includes('removed')) {
            return exports.USER_ERROR_MESSAGES.VIDEO_UNAVAILABLE;
        }
        if (message.includes('too long') || message.includes('duration') || message.includes('length')) {
            return exports.USER_ERROR_MESSAGES.VIDEO_TOO_LONG;
        }
        // Conversion errors
        if (message.includes('conversion failed') || message.includes('processing failed')) {
            return exports.USER_ERROR_MESSAGES.CONVERSION_FAILED;
        }
        if (message.includes('audio') && (message.includes('extract') || message.includes('download'))) {
            return exports.USER_ERROR_MESSAGES.AUDIO_EXTRACTION_FAILED;
        }
        if (message.includes('ffmpeg') || message.includes('processing') || message.includes('encode')) {
            return exports.USER_ERROR_MESSAGES.PROCESSING_ERROR;
        }
        // File errors
        if (message.includes('file too large') || message.includes('size') || message.includes('big')) {
            return exports.USER_ERROR_MESSAGES.FILE_TOO_LARGE;
        }
        if (message.includes('storage') || message.includes('space') || message.includes('disk')) {
            return exports.USER_ERROR_MESSAGES.STORAGE_FULL;
        }
        // Rate limiting
        if (message.includes('rate limit') || message.includes('too many requests')) {
            return exports.USER_ERROR_MESSAGES.RATE_LIMITED;
        }
    }
    // Default fallback
    return exports.USER_ERROR_MESSAGES.UNKNOWN_ERROR;
};
exports.getUserFriendlyError = getUserFriendlyError;
// Log technical error for debugging
const logTechnicalError = (error, context = 'Unknown', req) => {
    const errorId = Math.random().toString(36).substring(2, 15);
    const userAgent = req?.get('User-Agent') || 'Unknown';
    const ip = req?.ip || req?.connection?.remoteAddress || 'Unknown';
    logger_1.default.error(`[${context}] Technical Error [${errorId}]:`, {
        errorId,
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        context,
        userAgent,
        ip,
        timestamp: new Date().toISOString(),
        url: req?.url,
        method: req?.method
    });
};
exports.logTechnicalError = logTechnicalError;
// Professional error response handler
const handleError = (error, req, res, next) => {
    const userMessage = (0, exports.getUserFriendlyError)(error);
    (0, exports.logTechnicalError)(error, 'Express Error', req);
    // Don't expose technical details to users
    res.status(500).json({
        success: false,
        message: userMessage
    });
};
exports.handleError = handleError;
// Professional error response for specific status codes
const sendErrorResponse = (res, statusCode, userMessage, technicalError) => {
    if (technicalError) {
        (0, exports.logTechnicalError)(technicalError, 'API Error');
    }
    res.status(statusCode).json({
        success: false,
        message: userMessage
    });
};
exports.sendErrorResponse = sendErrorResponse;
//# sourceMappingURL=errorHandler.js.map