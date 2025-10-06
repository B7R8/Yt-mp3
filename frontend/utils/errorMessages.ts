// Professional error messages for users
export const ERROR_MESSAGES = {
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
  
  // Generic errors
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
  TRY_AGAIN: "Please try again in a few moments.",
  CONTACT_SUPPORT: "If this problem persists, please contact our support team.",
};

// Technical error mapping for background logging - CLEAN VERSION
export const TECHNICAL_ERROR_MAP = {
  // Network errors
  'ENOTFOUND': 'DNS resolution failed',
  'ECONNREFUSED': 'Connection refused',
  'ECONNRESET': 'Connection reset by peer',
  'ECONNABORTED': 'Connection aborted',
  'EHOSTUNREACH': 'Host unreachable',
  'ENETUNREACH': 'Network unreachable',
  'ETIMEDOUT': 'Request timeout',
  'EHOSTDOWN': 'Host is down',
  'ENETDOWN': 'Network is down',
  'ENETRESET': 'Network dropped connection because of reset',
  
  // File system errors
  'ENOENT': 'File not found',
  'EACCES': 'Permission denied',
  'ENOSPC': 'No space left on device',
  'EMFILE': 'Too many open files',
  'EAGAIN': 'Resource temporarily unavailable',
  'EPIPE': 'Broken pipe',
  'EISDIR': 'Is a directory',
  'ENOTDIR': 'Not a directory',
  'EEXIST': 'File already exists',
  'EMLINK': 'Too many links',
  'ENAMETOOLONG': 'File name too long',
  'ELOOP': 'Too many symbolic links',
  'ENODATA': 'No data available',
  'ENOSTR': 'Not a stream',
  'ENOTTY': 'Inappropriate I/O control operation',
  'ETXTBSY': 'Text file busy',
  'EFBIG': 'File too large',
  'ESPIPE': 'Illegal seek',
  'EROFS': 'Read-only file system',
  'ENOTEMPTY': 'Directory not empty',
  'ESTALE': 'Stale file handle',
  
  // Process errors
  'ECANCELED': 'Operation canceled',
  'EINVAL': 'Invalid argument',
  'ENOTSUP': 'Operation not supported',
  'EUNATCH': 'Protocol driver not attached',
  'ENOSR': 'No stream resources',
  'EDOM': 'Math argument out of domain',
  'ERANGE': 'Math result not representable',
  'EDEADLK': 'Resource deadlock would occur',
  'ENOLCK': 'No record locks available',
  'ENOSYS': 'Function not implemented',
  'EWOULDBLOCK': 'Operation would block',
  'EINPROGRESS': 'Operation now in progress',
  'EALREADY': 'Operation already in progress',
  
  // Socket errors
  'ENOTSOCK': 'Socket operation on non-socket',
  'EDESTADDRREQ': 'Destination address required',
  'EMSGSIZE': 'Message too long',
  'EPROTOTYPE': 'Protocol wrong type for socket',
  'ENOPROTOOPT': 'Protocol not available',
  'EPROTONOSUPPORT': 'Protocol not supported',
  'ESOCKTNOSUPPORT': 'Socket type not supported',
  'EOPNOTSUPP': 'Operation not supported on transport endpoint',
  'EPFNOSUPPORT': 'Protocol family not supported',
  'EAFNOSUPPORT': 'Address family not supported by protocol',
  'EADDRINUSE': 'Address already in use',
  'EADDRNOTAVAIL': 'Cannot assign requested address',
  'ENOBUFS': 'No buffer space available',
  'EISCONN': 'Transport endpoint is already connected',
  'ENOTCONN': 'Transport endpoint is not connected',
  'ESHUTDOWN': 'Cannot send after transport endpoint shutdown',
  'ETOOMANYREFS': 'Too many references: cannot splice',
  
  // System errors
  'EUCLEAN': 'Structure needs cleaning',
  'ENOTNAM': 'Not a XENIX named type file',
  'ENAVAIL': 'No XENIX semaphores available',
  'EISNAM': 'Is a named type file',
  'EREMOTEIO': 'Remote I/O error',
  'EDQUOT': 'Quota exceeded',
  'ENOMEDIUM': 'No medium found',
  'EMEDIUMTYPE': 'Wrong medium type',
  'ENOKEY': 'Required key not available',
  'EKEYEXPIRED': 'Key has expired',
  'EKEYREVOKED': 'Key has been revoked',
  'EKEYREJECTED': 'Key was rejected by service',
  'EOWNERDEAD': 'Owner died',
  'ENOTRECOVERABLE': 'State not recoverable',
  'ERFKILL': 'Operation not possible due to RF-kill',
  'EHWPOISON': 'Memory page has hardware error',
};

// Check if error contains technical details that should be hidden
const isTechnicalError = (message: string): boolean => {
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

// Get user-friendly error message
export const getUserFriendlyError = (error: any): string => {
  // Handle specific error types
  if (error?.code && TECHNICAL_ERROR_MAP[error.code]) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // If it's a technical error, return generic message
    if (isTechnicalError(error.message)) {
      return ERROR_MESSAGES.CONVERSION_FAILED;
    }
    
    // Network/connection errors
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    // Video-specific errors
    if (message.includes('video not found') || message.includes('404')) {
      return ERROR_MESSAGES.VIDEO_NOT_FOUND;
    }
    if (message.includes('private') || message.includes('unlisted')) {
      return ERROR_MESSAGES.VIDEO_PRIVATE;
    }
    if (message.includes('age restricted') || message.includes('restricted')) {
      return ERROR_MESSAGES.VIDEO_AGE_RESTRICTED;
    }
    if (message.includes('unavailable') || message.includes('not available')) {
      return ERROR_MESSAGES.VIDEO_UNAVAILABLE;
    }
    if (message.includes('too long') || message.includes('duration')) {
      return ERROR_MESSAGES.VIDEO_TOO_LONG;
    }
    
    // Conversion errors - Hide technical details
    if (message.includes('conversion failed') || message.includes('processing failed')) {
      return ERROR_MESSAGES.CONVERSION_FAILED;
    }
    if (message.includes('audio') && message.includes('extract')) {
      return ERROR_MESSAGES.AUDIO_EXTRACTION_FAILED;
    }
    if (message.includes('ffmpeg') || message.includes('processing')) {
      return ERROR_MESSAGES.PROCESSING_ERROR;
    }
    
    // Hide yt-dlp technical errors
    if (message.includes('yt-dlp') || message.includes('youtube-dl')) {
      return ERROR_MESSAGES.CONVERSION_FAILED;
    }
    if (message.includes('failed with code') || message.includes('exit code')) {
      return ERROR_MESSAGES.CONVERSION_FAILED;
    }
    if (message.includes('requested format is not available')) {
      return ERROR_MESSAGES.VIDEO_UNAVAILABLE;
    }
    if (message.includes('warning') || message.includes('error:')) {
      return ERROR_MESSAGES.CONVERSION_FAILED;
    }
    
    // File errors
    if (message.includes('file too large') || message.includes('size')) {
      return ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    if (message.includes('storage') || message.includes('space')) {
      return ERROR_MESSAGES.STORAGE_FULL;
    }
  }
  
  // Default fallback - but check if it looks technical
  if (error?.message && isTechnicalError(error.message)) {
    return ERROR_MESSAGES.CONVERSION_FAILED;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

// Log technical error for debugging
export const logTechnicalError = (error: any, context: string = 'Unknown'): void => {
  const technicalMessage = error?.code ? TECHNICAL_ERROR_MAP[error.code] : error?.message || 'Unknown error';
  console.error(`[${context}] Technical Error:`, {
    code: error?.code,
    message: technicalMessage,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  });
};