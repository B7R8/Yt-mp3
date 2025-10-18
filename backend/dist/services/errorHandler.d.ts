export interface ErrorContext {
    [key: string]: any;
}
export declare class ErrorHandler {
    /**
     * Log user-facing errors
     */
    static logUserError(error: Error, errorCode: string, context?: ErrorContext): void;
    /**
     * Handle database errors
     */
    static handleDatabaseError(error: Error, operation: string, context?: ErrorContext): void;
    /**
     * Handle file system errors
     */
    static handleFileSystemError(error: Error, operation: string, filePath?: string, context?: ErrorContext): void;
    /**
     * Handle external API errors
     */
    static handleApiError(error: Error, apiName: string, endpoint?: string, context?: ErrorContext): void;
    /**
     * Handle validation errors
     */
    static handleValidationError(error: Error, field?: string, value?: any, context?: ErrorContext): void;
    /**
     * Handle conversion errors
     */
    static handleConversionError(error: Error, jobId?: string, videoId?: string, context?: ErrorContext): void;
    /**
     * Get user-friendly error messages
     */
    static getUserFriendlyError(error: unknown): string;
    /**
     * Log technical errors with context (updated to handle unknown error type)
     */
    static logTechnicalError(error: unknown, errorCode: string, context?: ErrorContext): void;
    /**
     * Create a standardized error response with status code
     */
    static createErrorResponse(statusCode: number, userMessage: string, error: unknown, context?: ErrorContext): {
        statusCode: number;
        response: {
            success: boolean;
            error: {
                code: string;
                message: string;
                timestamp: string;
            };
        };
    };
}
//# sourceMappingURL=errorHandler.d.ts.map