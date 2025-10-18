"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const logger_1 = __importDefault(require("../config/logger"));
class ErrorHandler {
    /**
     * Log user-facing errors
     */
    static logUserError(error, errorCode, context) {
        const errorInfo = {
            errorCode,
            message: error.message,
            context: context || {},
            timestamp: new Date().toISOString(),
        };
        logger_1.default.warn('User Error:', errorInfo);
    }
    /**
     * Handle database errors
     */
    static handleDatabaseError(error, operation, context) {
        this.logTechnicalError(error, 'DATABASE_ERROR', {
            operation,
            ...context,
        });
    }
    /**
     * Handle file system errors
     */
    static handleFileSystemError(error, operation, filePath, context) {
        this.logTechnicalError(error, 'FILE_SYSTEM_ERROR', {
            operation,
            filePath,
            ...context,
        });
    }
    /**
     * Handle external API errors
     */
    static handleApiError(error, apiName, endpoint, context) {
        this.logTechnicalError(error, 'API_ERROR', {
            apiName,
            endpoint,
            ...context,
        });
    }
    /**
     * Handle validation errors
     */
    static handleValidationError(error, field, value, context) {
        this.logUserError(error, 'VALIDATION_ERROR', {
            field,
            value,
            ...context,
        });
    }
    /**
     * Handle conversion errors
     */
    static handleConversionError(error, jobId, videoId, context) {
        this.logTechnicalError(error, 'CONVERSION_ERROR', {
            jobId,
            videoId,
            ...context,
        });
    }
    /**
     * Get user-friendly error messages
     */
    static getUserFriendlyError(error) {
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        // Network and connectivity errors
        if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
            return 'Network connection failed. Please check your internet connection and try again.';
        }
        // YouTube-specific errors
        if (errorMessage.includes('youtube') || errorMessage.includes('video unavailable')) {
            return 'This YouTube video is unavailable or private. Please try a different video.';
        }
        if (errorMessage.includes('age-restricted') || errorMessage.includes('age restricted')) {
            return 'This video is age-restricted and cannot be processed.';
        }
        if (errorMessage.includes('region') || errorMessage.includes('not available')) {
            return 'This video is not available in your region.';
        }
        // File system errors
        if (errorMessage.includes('file') || errorMessage.includes('directory') || errorMessage.includes('path')) {
            return 'File processing error. Please try again.';
        }
        // Database errors
        if (errorMessage.includes('database') || errorMessage.includes('sql') || errorMessage.includes('query')) {
            return 'Database error occurred. Please try again.';
        }
        // Validation errors
        if (errorMessage.includes('invalid') || errorMessage.includes('validation') || errorMessage.includes('format')) {
            return 'Invalid input provided. Please check your request and try again.';
        }
        // Rate limiting
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
            return 'Too many requests. Please wait a moment and try again.';
        }
        // Generic fallback
        return 'An unexpected error occurred. Please try again later.';
    }
    /**
     * Log technical errors with context (updated to handle unknown error type)
     */
    static logTechnicalError(error, errorCode, context) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        const errorInfo = {
            errorCode,
            message: errorObj.message,
            stack: errorObj.stack,
            context: context || {},
            timestamp: new Date().toISOString(),
        };
        logger_1.default.error('Technical Error:', errorInfo);
    }
    /**
     * Create a standardized error response with status code
     */
    static createErrorResponse(statusCode, userMessage, error, context) {
        this.logTechnicalError(error, 'API_ERROR', context);
        return {
            statusCode,
            response: {
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: userMessage,
                    timestamp: new Date().toISOString(),
                },
            },
        };
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=errorHandler.js.map