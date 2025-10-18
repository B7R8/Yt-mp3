import { useState, useCallback, useRef, useEffect } from 'react';
import { Job, JobStatus } from '../types';
import { startConversion, getJobStatus, checkUrl } from '../services/api';
import { sanitizeText, validateInput, logSecurityIncident, detectSuspiciousPatterns } from '../utils/securityUtils';

interface UseConverterProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  autoDownload: boolean;
}

export const useConverter = (showToast: (message: string, type: 'success' | 'error' | 'info') => void, autoDownload: boolean) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qualityMessageShownRef = useRef<boolean>(false);
  const activeRequestsRef = useRef<Set<string>>(new Set()); // Track active requests by video ID
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const clearRequestTimeout = useCallback(() => {
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  }, []);

  // Extract video ID from YouTube URL
  const extractVideoId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=|gaming\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }, []);

  // Enhanced download method with file validation
  const downloadFile = useCallback(async (jobId: string, filename: string) => {
    try {
      console.log(`🎵 Starting download for: ${filename}`);
      
      // First, verify the file exists and get its info
      const statusResponse = await fetch(`/api/status/${jobId}`);
      if (!statusResponse.ok) {
        throw new Error('Failed to verify file status');
      }
      
      const statusData = await statusResponse.json();
      if (statusData.status !== 'completed' || !statusData.download_url) {
        throw new Error('File not ready for download');
      }
      
      // Validate file using backend validation
      if (statusData.file_valid === false) {
        throw new Error('File appears to be corrupted or empty. Please try converting again.');
      }
      
      // Additional frontend validation
      if (statusData.file_size && statusData.file_size <= 0) {
        throw new Error('File appears to be empty');
      }
      
      const downloadUrl = `/api/download/${jobId}`;
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() || 'converted_audio';
      
      // Create a hidden download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${sanitizedFilename}.mp3`;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Download triggered successfully for: ${sanitizedFilename}`);
      showToast(`Download started: ${sanitizedFilename}.mp3`, 'success');
    } catch (error) {
      console.error('❌ Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Download failed. Please try again.';
      showToast(errorMessage, 'error');
    }
  }, [showToast]);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const currentJob = await getJobStatus(id);
      setJob(currentJob);

      // Show quality message only once (for 3-hour rule)
      if (currentJob.quality_message && !qualityMessageShownRef.current) {
        showToast(currentJob.quality_message, 'info');
        qualityMessageShownRef.current = true;
      }

      if (currentJob.status === JobStatus.COMPLETED) {
        showToast(`Successfully converted "${currentJob.title}"!`, 'success');
        
        // Clean up active requests
        const videoId = extractVideoId(currentJob.url || '');
        if (videoId) {
          activeRequestsRef.current.delete(videoId);
        }
        clearRequestTimeout();
        
        // Auto-download if enabled
        if (autoDownload) {
          // Small delay to ensure the file is ready
          setTimeout(() => {
            downloadFile(currentJob.id, currentJob.title || 'download');
          }, 500);
        }
        
        clearPolling();
      } else if (currentJob.status === JobStatus.FAILED) {
        showToast(`Conversion failed: ${currentJob.error || 'Unknown error'}`, 'error');
        
        // Clean up active requests
        const videoId = extractVideoId(currentJob.url || '');
        if (videoId) {
          activeRequestsRef.current.delete(videoId);
        }
        clearRequestTimeout();
        clearPolling();
      } else if (currentJob.status === 'processing') {
        // Continue polling for processing status
        console.log(`⏳ Conversion still processing for job: ${id}`);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      showToast('Error checking conversion status', 'error');
      clearPolling();
    }
  }, [autoDownload, clearPolling, extractVideoId, clearRequestTimeout, downloadFile]);

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

      // Extract video ID to prevent duplicate requests
      const videoId = extractVideoId(url);
      if (!videoId) {
        showToast('Invalid YouTube URL format.', 'error');
        setIsConverting(false);
        return;
      }

      // Check if this video is already being processed
      if (activeRequestsRef.current.has(videoId)) {
        showToast('This video is already being processed. Please wait for completion.', 'info');
        setIsConverting(false);
        return;
      }

      // Add video ID to active requests
      activeRequestsRef.current.add(videoId);

      // Set a timeout to remove the video ID from active requests after 5 minutes
      requestTimeoutRef.current = setTimeout(() => {
        activeRequestsRef.current.delete(videoId);
      }, 5 * 60 * 1000);

      // First check if URL is blacklisted
      const urlCheck = await checkUrl(sanitizedUrl);
      
      if (urlCheck.isBlacklisted) {
        // Show detailed blacklist message
        const blacklistMessage = `${urlCheck.message}${urlCheck.type ? ` (${urlCheck.type})` : ''}`;
        showToast(blacklistMessage, 'error');
        activeRequestsRef.current.delete(videoId);
        clearRequestTimeout();
        setIsConverting(false);
        return;
      }

      const response = await startConversion(url, quality, trimEnabled, trimStart, trimEnd);
      
      if (response.id) {
        setJob({
          id: response.id,
          status: JobStatus.PENDING,
          progress: 0,
          title: undefined,
          url: url
        });

        // Start polling for status updates
        pollingIntervalRef.current = setInterval(() => {
          pollStatus(response.id);
        }, 2000);

        showToast('Conversion started!', 'info');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      const videoId = extractVideoId(url);
      if (videoId) {
        activeRequestsRef.current.delete(videoId);
      }
      clearRequestTimeout();
      showToast('Failed to start conversion', 'error');
      setIsConverting(false);
    }
  }, [isConverting, pollStatus, extractVideoId, clearRequestTimeout]);

  const resetConverter = useCallback(() => {
    clearPolling();
    clearRequestTimeout();
    setJob(null);
    setIsConverting(false);
    qualityMessageShownRef.current = false; // Reset the flag for new conversions
    activeRequestsRef.current.clear(); // Clear all active requests
  }, [clearPolling, clearRequestTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling();
      clearRequestTimeout();
      activeRequestsRef.current.clear();
    };
  }, [clearPolling, clearRequestTimeout]);

  return {
    job,
    isLoading: isConverting,
    handleSubmit,
    resetConverter,
    downloadFile
  };
};
