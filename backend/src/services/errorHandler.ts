import logger from '../config/logger';

export interface ErrorContext {
  jobId?: string;
  videoId?: string;
  userId?: string;
  userIp?: string;
  operation?: string;
  additionalData?: any;
}

export class ErrorHandler {
  /**
   * Get user-friendly error message
   */
  static getUserFriendlyError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Network/connection errors
      if (message.includes('econnrefused') || message.includes('connection refused')) {
        return 'Service temporarily unavailable. Please try again later.';
      }
      
      if (message.includes('timeout') || message.includes('etimedout')) {
        return 'Request timed out. Please try again.';
      }
      
      if (message.includes('enotfound') || message.includes('dns')) {
        return 'Network error. Please check your connection and try again.';
      }
      
      // YouTube-specific errors
      if (message.includes('video unavailable') || message.includes('private video')) {
        return 'This video is not available for conversion.';
      }
      
      if (message.includes('age-restricted') || message.includes('age restricted')) {
        return 'This video is age-restricted and cannot be converted.';
      }
      
      if (message.includes('copyright') || message.includes('blocked')) {
        return 'This video cannot be converted due to copyright restrictions.';
      }
      
      if (message.includes('region') || message.includes('not available in your country')) {
        return 'This video is not available in your region.';
      }
      
      // Processing errors
      if (message.includes('ffmpeg') || message.includes('audio processing')) {
        return 'Audio processing failed. Please try again with a different video.';
      }
      
      if (message.includes('download') || message.includes('yt-dlp')) {
        return 'Failed to download video. Please try again.';
      }
      
      if (message.includes('invalid url') || message.includes('invalid youtube url')) {
        return 'Please provide a valid YouTube URL.';
      }
      
      // Database errors
      if (message.includes('database') || message.includes('connection')) {
        return 'Service temporarily unavailable. Please try again later.';
      }
      
      // Rate limiting
      if (message.includes('rate limit') || message.includes('too many requests')) {
        return 'Too many requests. Please wait a moment and try again.';
      }
      
      // File system errors
      if (message.includes('no space') || message.includes('disk full')) {
        return 'Service temporarily unavailable. Please try again later.';
      }
      
      if (message.includes('permission denied') || message.includes('eacces')) {
        return 'Service temporarily unavailable. Please try again later.';
      }
      
      // Generic fallback
      return 'An unexpected error occurred. Please try again.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log technical error with context
   */
  static logTechnicalError(error: any, operation: string, context?: ErrorContext): void {
    const errorInfo = {
      operation,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      context: {
        jobId: context?.jobId,
        videoId: context?.videoId,
        userId: context?.userId,
        userIp: context?.userIp,
        additionalData: context?.additionalData
      },
      timestamp: new Date().toISOString()
    };

    logger.error(`Technical Error [${operation}]:`, errorInfo);
  }

  /**
   * Handle conversion errors with proper fallbacks
   */
  static async handleConversionError(
    error: any, 
    jobId: string, 
    videoId: string, 
    operation: string
  ): Promise<{ shouldRetry: boolean; retryDelay?: number; fallbackAction?: string }> {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    // Log the error with context
    this.logTechnicalError(error, operation, {
      jobId,
      videoId,
      operation
    });

    // Determine if we should retry and what fallback action to take
    if (errorMessage.includes('timeout') || errorMessage.includes('etimedout')) {
      return {
        shouldRetry: true,
        retryDelay: 5000, // 5 seconds
        fallbackAction: 'retry_download'
      };
    }

    if (errorMessage.includes('econnrefused') || errorMessage.includes('connection refused')) {
      return {
        shouldRetry: true,
        retryDelay: 10000, // 10 seconds
        fallbackAction: 'retry_connection'
      };
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        shouldRetry: true,
        retryDelay: 30000, // 30 seconds
        fallbackAction: 'wait_and_retry'
      };
    }

    if (errorMessage.includes('video unavailable') || 
        errorMessage.includes('private video') ||
        errorMessage.includes('age-restricted') ||
        errorMessage.includes('copyright') ||
        errorMessage.includes('blocked')) {
      return {
        shouldRetry: false,
        fallbackAction: 'fail_permanently'
      };
    }

    if (errorMessage.includes('ffmpeg') || errorMessage.includes('audio processing')) {
      return {
        shouldRetry: true,
        retryDelay: 2000, // 2 seconds
        fallbackAction: 'retry_processing'
      };
    }

    if (errorMessage.includes('no space') || errorMessage.includes('disk full')) {
      return {
        shouldRetry: false,
        fallbackAction: 'fail_permanently'
      };
    }

    // Default: retry once with delay
    return {
      shouldRetry: true,
      retryDelay: 3000, // 3 seconds
      fallbackAction: 'retry_once'
    };
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(
    statusCode: number,
    userMessage: string,
    technicalError?: any,
    context?: ErrorContext
  ): { statusCode: number; response: any } {
    const response: any = {
      success: false,
      message: userMessage,
      timestamp: new Date().toISOString()
    };

    // Add context if available
    if (context?.jobId) {
      response.jobId = context.jobId;
    }

    // Log technical error if provided
    if (technicalError) {
      this.logTechnicalError(technicalError, 'API_ERROR', context);
    }

    return {
      statusCode,
      response
    };
  }

  /**
   * Handle API failures with fallback strategies
   */
  static async handleApiFailure(
    primaryError: any,
    fallbackAction: string,
    context: ErrorContext
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    logger.warn(`API failure handled with fallback: ${fallbackAction}`, {
      context,
      primaryError: primaryError instanceof Error ? primaryError.message : primaryError
    });

    switch (fallbackAction) {
      case 'retry_download':
        return {
          success: false,
          error: 'Download failed. Please try again.'
        };

      case 'retry_connection':
        return {
          success: false,
          error: 'Connection failed. Please try again.'
        };

      case 'wait_and_retry':
        return {
          success: false,
          error: 'Service is busy. Please try again in a moment.'
        };

      case 'retry_processing':
        return {
          success: false,
          error: 'Processing failed. Please try again.'
        };

      case 'fail_permanently':
        return {
          success: false,
          error: 'This video cannot be processed.'
        };

      case 'retry_once':
        return {
          success: false,
          error: 'Temporary error. Please try again.'
        };

      default:
        return {
          success: false,
          error: 'An unexpected error occurred. Please try again.'
        };
    }
  }

  /**
   * Validate and sanitize error messages for logging
   */
  static sanitizeErrorMessage(error: any): string {
    if (typeof error === 'string') {
      // Remove sensitive information
      return error
        .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
        .replace(/token[=:]\s*[^\s]+/gi, 'token=***')
        .replace(/key[=:]\s*[^\s]+/gi, 'key=***')
        .replace(/secret[=:]\s*[^\s]+/gi, 'secret=***');
    }

    if (error instanceof Error) {
      return this.sanitizeErrorMessage(error.message);
    }

    return String(error);
  }

  /**
   * Get error severity level
   */
  static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    if (typeof error === 'string') {
      const message = error.toLowerCase();
      
      if (message.includes('no space') || message.includes('disk full')) {
        return 'critical';
      }
      
      if (message.includes('database') || message.includes('connection')) {
        return 'high';
      }
      
      if (message.includes('timeout') || message.includes('rate limit')) {
        return 'medium';
      }
      
      return 'low';
    }

    if (error instanceof Error) {
      return this.getErrorSeverity(error.message);
    }

    return 'medium';
  }
}

// Export convenience functions for backward compatibility
export const getUserFriendlyError = ErrorHandler.getUserFriendlyError;
export const logTechnicalError = ErrorHandler.logTechnicalError;
export const sendErrorResponse = (res: any, statusCode: number, userMessage: string, technicalError?: any, context?: ErrorContext) => {
  const { response } = ErrorHandler.createErrorResponse(statusCode, userMessage, technicalError, context);
  res.status(statusCode).json(response);
};
