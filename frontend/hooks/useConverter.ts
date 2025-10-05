
import { useState, useEffect, useRef, useCallback } from 'react';
import { Job, JobStatus } from '../types';
import { startConversion, getJobStatus } from '../services/api';
import { POLLING_INTERVAL } from '../constants';

type ShowToastFn = (message: string, type: 'success' | 'error' | 'info') => void;

export const useConverter = (showToast: ShowToastFn) => {
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
        clearPolling();
      } else if (currentJob.status === JobStatus.FAILED) {
        showToast(currentJob.error || 'Conversion failed. Please try again.', 'error');
        clearPolling();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get job status.';
      showToast(errorMessage, 'error');
      clearPolling();
      setJob(prev => prev ? { ...prev, status: JobStatus.FAILED, error: errorMessage } : null);
    }
  }, [showToast]);

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

  const handleSubmit = async (url: string) => {
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
      const { id } = await startConversion(url);
      showToast('Conversion started!', 'info');
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
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showToast(errorMessage, 'error');
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