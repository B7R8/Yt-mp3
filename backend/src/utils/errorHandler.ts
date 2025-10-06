import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Professional error messages for users
export const USER_ERROR_MESSAGES = {
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

// Get user-friendly error message based on technical error
export const getUserFriendlyError = (error: any): string => {
  // Handle specific error types
  if (error?.code) {
    switch (error.code) {
      case 'ENOTFOUND':
      case 'ECONNREFUSED':
      case 'ETIMEDOUT':
      case 'ECONNRESET':
      case 'EHOSTUNREACH':
      case 'ENETUNREACH':
        return USER_ERROR_MESSAGES.NETWORK_ERROR;
      case 'ENOSPC':
      case 'EMFILE':
        return USER_ERROR_MESSAGES.STORAGE_FULL;
      case 'EACCES':
      case 'EPERM':
        return USER_ERROR_MESSAGES.SERVER_ERROR;
      case 'ENOENT':
        return USER_ERROR_MESSAGES.VIDEO_NOT_FOUND;
    }
  }
  
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // Network/connection errors
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return USER_ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    // Video-specific errors
    if (message.includes('video not found') || message.includes('404') || message.includes('not found')) {
      return USER_ERROR_MESSAGES.VIDEO_NOT_FOUND;
    }
    if (message.includes('private') || message.includes('unlisted') || message.includes('sign in')) {
      return USER_ERROR_MESSAGES.VIDEO_PRIVATE;
    }
    if (message.includes('age restricted') || message.includes('restricted') || message.includes('sign in to confirm')) {
      return USER_ERROR_MESSAGES.VIDEO_AGE_RESTRICTED;
    }
    if (message.includes('unavailable') || message.includes('not available') || message.includes('removed')) {
      return USER_ERROR_MESSAGES.VIDEO_UNAVAILABLE;
    }
    if (message.includes('too long') || message.includes('duration') || message.includes('length')) {
      return USER_ERROR_MESSAGES.VIDEO_TOO_LONG;
    }
    
    // Conversion errors
    if (message.includes('conversion failed') || message.includes('processing failed')) {
      return USER_ERROR_MESSAGES.CONVERSION_FAILED;
    }
    if (message.includes('audio') && (message.includes('extract') || message.includes('download'))) {
      return USER_ERROR_MESSAGES.AUDIO_EXTRACTION_FAILED;
    }
    if (message.includes('ffmpeg') || message.includes('processing') || message.includes('encode')) {
      return USER_ERROR_MESSAGES.PROCESSING_ERROR;
    }
    
    // File errors
    if (message.includes('file too large') || message.includes('size') || message.includes('big')) {
      return USER_ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    if (message.includes('storage') || message.includes('space') || message.includes('disk')) {
      return USER_ERROR_MESSAGES.STORAGE_FULL;
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return USER_ERROR_MESSAGES.RATE_LIMITED;
    }
  }
  
  // Default fallback
  return USER_ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Log technical error for debugging
export const logTechnicalError = (error: any, context: string = 'Unknown', req?: Request): void => {
  const errorId = Math.random().toString(36).substring(2, 15);
  const userAgent = req?.get('User-Agent') || 'Unknown';
  const ip = req?.ip || req?.connection?.remoteAddress || 'Unknown';
  
  logger.error(`[${context}] Technical Error [${errorId}]:`, {
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

// Professional error response handler
export const handleError = (error: any, req: Request, res: Response, next: NextFunction) => {
  const userMessage = getUserFriendlyError(error);
  logTechnicalError(error, 'Express Error', req);
  
  // Don't expose technical details to users
  res.status(500).json({
    success: false,
    message: userMessage
  });
};

// Professional error response for specific status codes
export const sendErrorResponse = (res: Response, statusCode: number, userMessage: string, technicalError?: any) => {
  if (technicalError) {
    logTechnicalError(technicalError, 'API Error');
  }
  
  res.status(statusCode).json({
    success: false,
    message: userMessage
  });
};
