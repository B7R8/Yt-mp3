import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Job, JobStatus } from '../types';
import { startConversion, getJobStatus, checkUrl } from '../services/optimizedApi';
import { sanitizeText, validateInput, logSecurityIncident, detectSuspiciousPatterns } from '../utils/securityUtils';

interface UseOptimizedConverterProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  autoDownload: boolean;
}

interface VideoInfo {
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  uploader: string;
  viewCount: number;
  cached: boolean;
}

interface ConversionProgress {
  jobId: string;
  progress: number;
  status: string;
  title?: string;
  error?: string;
}

export const useOptimizedConverter = (showToast: (message: string, type: 'success' | 'error' | 'info') => void, autoDownload: boolean) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoadingVideoInfo, setIsLoadingVideoInfo] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qualityMessageShownRef = useRef<boolean>(false);
  const videoInfoCache = useRef<Map<string, VideoInfo>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized URL validation
  const validateYouTubeUrl = useCallback((url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  }, []);

  // Debounced video info fetching
  const debouncedFetchVideoInfo = useCallback(
    debounce(async (url: string) => {
      if (!validateYouTubeUrl(url)) {
        setVideoInfo(null);
        return;
      }

      setIsLoadingVideoInfo(true);
      try {
        const info = await fetchVideoInfo(url);
        setVideoInfo(info);
      } catch (error) {
        console.error('Error fetching video info:', error);
        setVideoInfo(null);
      } finally {
        setIsLoadingVideoInfo(false);
      }
    }, 500),
    [validateYouTubeUrl]
  );

  // Fetch video info with caching
  const fetchVideoInfo = useCallback(async (url: string): Promise<VideoInfo> => {
    const cacheKey = url;
    const cached = videoInfoCache.current.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`, {
      headers: {
        'Accept': 'application/json; charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }

    const data = await response.json();
    const videoInfo: VideoInfo = {
      title: data.title,
      duration: data.duration,
      durationFormatted: data.durationFormatted,
      thumbnail: data.thumbnail,
      uploader: data.uploader,
      viewCount: data.viewCount,
      cached: data.cached
    };

    // Cache the result
    videoInfoCache.current.set(cacheKey, videoInfo);
    
    return videoInfo;
  }, []);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const currentJob = await getJobStatus(id);
      setJob(currentJob);

      // Update conversion progress
      setConversionProgress({
        jobId: id,
        progress: currentJob.progress || 0,
        status: currentJob.status,
        title: currentJob.title,
        error: currentJob.error
      });

      // Show quality message only once (for 3-hour rule)
      if (currentJob.quality_message && !qualityMessageShownRef.current) {
        showToast(currentJob.quality_message, 'info');
        qualityMessageShownRef.current = true;
      }

      if (currentJob.status === JobStatus.COMPLETED) {
        showToast(`Successfully converted "${currentJob.title}"!`, 'success');
        
        // Auto-download if enabled
        if (autoDownload) {
          setTimeout(() => {
            downloadFile(id, currentJob.title || 'download');
          }, 500);
        }
        
        clearPolling();
        setConversionProgress(null);
      } else if (currentJob.status === JobStatus.FAILED) {
        showToast(`Conversion failed: ${currentJob.error || 'Unknown error'}`, 'error');
        clearPolling();
        setConversionProgress(null);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      showToast('Error checking conversion status', 'error');
      clearPolling();
      setConversionProgress(null);
    }
  }, [autoDownload, clearPolling, showToast]);

  // Optimized file download
  const downloadFile = useCallback(async (jobId: string, filename: string) => {
    try {
      const downloadUrl = `/api/download/${jobId}`;
      
      // Use fetch with streaming for better performance
      const response = await fetch(downloadUrl, {
        headers: {
          'Accept': 'audio/mpeg',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a hidden download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.mp3`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: try direct window.open
      window.open(`/api/download/${jobId}`, '_blank');
    }
  }, []);

  const handleSubmit = useCallback(async (
    url: string,
    quality?: string,
    trimEnabled?: boolean,
    trimStart?: string,
    trimEnd?: string
  ) => {
    if (isConverting) return;

    try {
      setIsConverting(true);
      setJob(null);
      setConversionProgress(null);

      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Security: Sanitize and validate input
      const sanitizedUrl = sanitizeText(url);
      if (!validateInput(sanitizedUrl, 'url')) {
        logSecurityIncident('INVALID_URL_INPUT', { originalUrl: url, sanitizedUrl });
        showToast('Invalid URL format. Please check your input.', 'error');
        setIsConverting(false);
        return;
      }

      // Check for suspicious patterns
      const suspiciousPatterns = detectSuspiciousPatterns(url);
      if (suspiciousPatterns.length > 0) {
        logSecurityIncident('SUSPICIOUS_URL_PATTERNS', { url, patterns: suspiciousPatterns });
        showToast('Suspicious URL detected. Please use a valid YouTube URL.', 'error');
        setIsConverting(false);
        return;
      }

      // First check if URL is blacklisted
      const urlCheck = await checkUrl(sanitizedUrl);
      
      if (urlCheck.isBlacklisted) {
        const blacklistMessage = `${urlCheck.message}${urlCheck.type ? ` (${urlCheck.type})` : ''}`;
        showToast(blacklistMessage, 'error');
        setIsConverting(false);
        return;
      }

      const response = await startConversion(url, quality, trimEnabled, trimStart, trimEnd);
      
      if (response.id) {
        setJob({
          id: response.id,
          status: JobStatus.PENDING,
          progress: 0,
          title: videoInfo?.title,
          url: url
        });

        setConversionProgress({
          jobId: response.id,
          progress: 0,
          status: 'pending',
          title: videoInfo?.title
        });

        // Start polling for status updates with exponential backoff
        let pollInterval = 1000; // Start with 1 second
        const maxInterval = 5000; // Max 5 seconds
        
        const poll = () => {
          pollStatus(response.id);
          
          // Increase interval gradually, but cap at max
          pollInterval = Math.min(pollInterval * 1.2, maxInterval);
          
          pollingIntervalRef.current = setTimeout(poll, pollInterval);
        };

        poll();
        showToast('Conversion started!', 'info');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      showToast('Failed to start conversion', 'error');
      setIsConverting(false);
      setConversionProgress(null);
    }
  }, [isConverting, pollStatus, showToast, videoInfo, validateInput, sanitizeText, detectSuspiciousPatterns, logSecurityIncident, checkUrl, startConversion]);

  const resetConverter = useCallback(() => {
    clearPolling();
    setJob(null);
    setIsConverting(false);
    setConversionProgress(null);
    qualityMessageShownRef.current = false;
    
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [clearPolling]);

  // Handle URL input changes
  const handleUrlChange = useCallback((url: string) => {
    if (url.trim()) {
      debouncedFetchVideoInfo(url);
    } else {
      setVideoInfo(null);
    }
  }, [debouncedFetchVideoInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearPolling]);

  // Memoized computed values
  const isUrlValid = useMemo(() => {
    return job?.url ? validateYouTubeUrl(job.url) : false;
  }, [job?.url, validateYouTubeUrl]);

  const canStartConversion = useMemo(() => {
    return !isConverting && videoInfo && isUrlValid;
  }, [isConverting, videoInfo, isUrlValid]);

  return {
    job,
    isLoading: isConverting,
    videoInfo,
    isLoadingVideoInfo,
    conversionProgress,
    handleSubmit,
    resetConverter,
    handleUrlChange,
    downloadFile,
    isUrlValid,
    canStartConversion,
    validateYouTubeUrl
  };
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
