import { Job, JobStatus } from '../types';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorMessages';

// Enhanced response handler with better error handling and retry logic
const handleResponse = async (response: Response, retryCount: number = 0): Promise<any> => {
  if (!response.ok) {
    // Retry on server errors (5xx) up to 3 times
    if (response.status >= 500 && retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return handleResponse(response, retryCount + 1);
    }

    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    const technicalError = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    logTechnicalError(technicalError, 'API Response');
    throw technicalError;
  }
  
  // Ensure proper UTF-8 handling
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  // Fallback to text if not JSON
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// Enhanced URL checking with caching
const urlCheckCache = new Map<string, { result: any; timestamp: number }>();
const URL_CHECK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const checkUrl = async (url: string): Promise<{ 
  success: boolean; 
  isBlacklisted: boolean; 
  message: string; 
  type?: string 
}> => {
  // Check cache first
  const cached = urlCheckCache.get(url);
  if (cached && (Date.now() - cached.timestamp) < URL_CHECK_CACHE_TTL) {
    return cached.result;
  }

  const response = await fetch('/api/check-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ url }),
  });
  
  const data = await handleResponse(response);
  const result = {
    success: data.success,
    isBlacklisted: data.isBlacklisted || false,
    message: data.message,
    type: data.type
  };

  // Cache the result
  urlCheckCache.set(url, { result, timestamp: Date.now() });
  
  return result;
};

// Enhanced conversion with progress tracking
export const startConversion = async (
  url: string,
  quality?: string,
  trimEnabled?: boolean,
  trimStart?: string,
  trimEnd?: string
): Promise<{ id: string }> => {
  const requestBody: {
    url: string;
    quality?: string;
    trim_start?: string;
    trim_end?: string;
  } = { url };

  // Add quality if specified (convert 128K to 128k format)
  if (quality) {
    requestBody.quality = quality.toLowerCase();
  }

  // Add trim parameters if enabled
  if (trimEnabled && trimStart && trimEnd) {
    requestBody.trim_start = trimStart;
    requestBody.trim_end = trimEnd;
  }

  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await handleResponse(response);
  return { id: data.jobId };
};

// Enhanced job status with caching and better error handling
const jobStatusCache = new Map<string, { job: Job; timestamp: number }>();
const JOB_STATUS_CACHE_TTL = 2 * 1000; // 2 seconds

export const getJobStatus = async (id: string): Promise<Job> => {
  // Check cache first (short TTL for real-time updates)
  const cached = jobStatusCache.get(id);
  if (cached && (Date.now() - cached.timestamp) < JOB_STATUS_CACHE_TTL) {
    return cached.job;
  }

  const response = await fetch(`/api/status/${id}`, {
    headers: {
      'Accept': 'application/json; charset=utf-8',
    },
  });
  
  const data = await handleResponse(response);
  
  // Transform backend response to frontend Job format
  const job: Job = {
    id: data.jobId,
    status: data.status as JobStatus,
    progress: data.status === 'completed' ? 100 : data.status === 'processing' ? 50 : 0,
    title: data.video_title,
    url: data.youtube_url || '',
    error: data.error_message,
    quality_message: data.quality_message
  };

  // Cache the result
  jobStatusCache.set(id, { job, timestamp: Date.now() });
  
  return job;
};

// Enhanced video info fetching with caching
const videoInfoCache = new Map<string, { info: any; timestamp: number }>();
const VIDEO_INFO_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const getVideoInfo = async (url: string): Promise<any> => {
  // Check cache first
  const cached = videoInfoCache.get(url);
  if (cached && (Date.now() - cached.timestamp) < VIDEO_INFO_CACHE_TTL) {
    return cached.info;
  }

  const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`, {
    headers: {
      'Accept': 'application/json; charset=utf-8',
    },
  });
  
  const data = await handleResponse(response);
  
  // Cache the result
  videoInfoCache.set(url, { info: data, timestamp: Date.now() });
  
  return data;
};

// Batch conversion support
export const startBatchConversion = async (
  urls: string[],
  quality?: string,
  trimEnabled?: boolean,
  trimStart?: string,
  trimEnd?: string
): Promise<{ results: any[] }> => {
  const requestBody = {
    urls,
    quality: quality?.toLowerCase(),
    trim_start: trimEnabled ? trimStart : undefined,
    trim_end: trimEnabled ? trimEnd : undefined
  };

  const response = await fetch('/api/batch-convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(requestBody),
  });
  
  const data = await handleResponse(response);
  return { results: data.results };
};

// System stats
export const getSystemStats = async (): Promise<any> => {
  const response = await fetch('/api/stats', {
    headers: {
      'Accept': 'application/json; charset=utf-8',
    },
  });
  
  return await handleResponse(response);
};

// Cache management utilities
export const clearCache = (): void => {
  urlCheckCache.clear();
  jobStatusCache.clear();
  videoInfoCache.clear();
};

export const getCacheStats = (): {
  urlCheckCache: number;
  jobStatusCache: number;
  videoInfoCache: number;
} => {
  return {
    urlCheckCache: urlCheckCache.size,
    jobStatusCache: jobStatusCache.size,
    videoInfoCache: videoInfoCache.size
  };
};

// Enhanced download with progress tracking
export const downloadFile = async (
  jobId: string,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const response = await fetch(`/api/download/${jobId}`, {
    headers: {
      'Accept': 'audio/mpeg',
    },
  });

  if (!response.ok) {
    throw new Error('Download failed');
  }

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    if (onProgress && total > 0) {
      onProgress((loaded / total) * 100);
    }
  }

  // Combine all chunks into a single blob
  const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
  return blob;
};
