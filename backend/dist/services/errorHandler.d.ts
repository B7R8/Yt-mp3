export interface ErrorContext {
    jobId?: string;
    videoId?: string;
    userId?: string;
    userIp?: string;
    operation?: string;
    additionalData?: any;
}
export declare class ErrorHandler {
    /**
     * Get user-friendly error message
     */
    static getUserFriendlyError(error: any): string;
    /**
     * Log technical error with context
     */
    static logTechnicalError(error: any, operation: string, context?: ErrorContext): void;
    /**
     * Handle conversion errors with proper fallbacks
     */
    static handleConversionError(error: any, jobId: string, videoId: string, operation: string): Promise<{
        shouldRetry: boolean;
        retryDelay?: number;
        fallbackAction?: string;
    }>;
    /**
     * Create standardized error response
     */
    static createErrorResponse(statusCode: number, userMessage: string, technicalError?: any, context?: ErrorContext): {
        statusCode: number;
        response: any;
    };
    /**
     * Handle API failures with fallback strategies
     */
    static handleApiFailure(primaryError: any, fallbackAction: string, context: ErrorContext): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    /**
     * Validate and sanitize error messages for logging
     */
    static sanitizeErrorMessage(error: any): string;
    /**
     * Get error severity level
     */
    static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical';
}
export declare const getUserFriendlyError: typeof ErrorHandler.getUserFriendlyError;
export declare const logTechnicalError: typeof ErrorHandler.logTechnicalError;
export declare const sendErrorResponse: (res: any, statusCode: number, userMessage: string, technicalError?: any, context?: ErrorContext) => void;
//# sourceMappingURL=errorHandler.d.ts.map