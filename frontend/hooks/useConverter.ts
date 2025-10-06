
import { useState, useEffect, useRef, useCallback } from 'react';
import { Job, JobStatus } from '../types';
import { startConversion, getJobStatus } from '../services/api';
import { POLLING_INTERVAL } from '../constants';
import { getUserFriendlyError, logTechnicalError } from '../utils/errorMessages';

type ShowToastFn = (message: string, type: 'success' | 'error' | 'info') => void;

export const useConverter = (showToast: ShowToastFn, autoDownload: boolean = false) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  const clearPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const pollStatus = useCallback(async (id: string) => {
    try {
      const currentJob = await getJobStatus(id);
      setJob(currentJob);

      if (currentJob.status === JobStatus.COMPLETED) {
        showToast(`Successfully converted "${currentJob.title}"!`, 'success');
        
        // Auto-download if enabled
        if (autoDownload) {
          const downloadUrl = `/api/download/${currentJob.id}`;
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${currentJob.title || 'converted'}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        clearPolling();
      } else if (currentJob.status === JobStatus.FAILED) {
        const userMessage = getUserFriendlyError(currentJob.error || 'Conversion failed');
        showToast(userMessage, 'error');
        logTechnicalError(currentJob.error, 'Job Failed');
        clearPolling();
      }
    } catch (error) {
      const userMessage = getUserFriendlyError(error);
      showToast(userMessage, 'error');
      logTechnicalError(error, 'Poll Status');
      clearPolling();
      setJob(prev => prev ? { ...prev, status: JobStatus.FAILED, error: userMessage } : null);
    }
  }, [showToast, autoDownload]);

  useEffect(() => {
    if (job?.id && (job.status === JobStatus.PENDING || job.status === JobStatus.PROCESSING)) {
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = window.setInterval(() => {
          pollStatus(job.id);
        }, POLLING_INTERVAL);
      }
    } else {
      // Clear polling if job is completed or failed
      clearPolling();
    }

    return () => {
      clearPolling();
    };
  }, [job, pollStatus]);

  const handleSubmit = async (
    url: string,
    quality?: string,
    trimEnabled?: boolean,
    trimStart?: string,
    trimEnd?: string
  ) => {
    if (!url.trim()) {
      showToast('Please enter a YouTube URL.', 'error');
      return;
    }
    
    // A simple regex to validate YouTube URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) {
        showToast('Please enter a valid YouTube URL.', 'error');
        return;
    }

    setIsLoading(true);
    setJob(null);
    clearPolling();

    try {
      const { id } = await startConversion(url, quality, trimEnabled, trimStart, trimEnd);
      
      let message = 'Conversion started!';
      if (trimEnabled && trimStart && trimEnd) {
        message += ` Trimming from ${trimStart} to ${trimEnd}`;
      }
      if (quality) {
        message += ` at ${quality}`;
      }
      
      showToast(message, 'info');
      // Set initial job state and start polling
      setJob({
        id,
        status: JobStatus.PENDING,
        progress: 0,
        title: 'Starting conversion...'
      });
      // Initial status fetch
      pollStatus(id);
    } catch (error) {
      const userMessage = getUserFriendlyError(error);
      showToast(userMessage, 'error');
      logTechnicalError(error, 'Start Conversion');
    } finally {
      setIsLoading(false);
    }
  };

  const resetConverter = () => {
    setJob(null);
    clearPolling();
  };

  return { job, isLoading, handleSubmit, resetConverter };
};