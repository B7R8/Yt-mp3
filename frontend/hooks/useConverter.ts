import { useState, useCallback, useRef, useEffect } from 'react';
import { Job, JobStatus } from '../types';
import { startConversion, getJobStatus } from '../services/api';

interface UseConverterProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  autoDownload: boolean;
}

export const useConverter = (showToast: (message: string, type: 'success' | 'error' | 'info') => void, autoDownload: boolean) => {
  const [job, setJob] = useState<Job | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      if (currentJob.status === JobStatus.COMPLETED) {
        showToast(`Successfully converted "${currentJob.title}"!`, 'success');
        
        // Auto-download if enabled
        if (autoDownload) {
          // Small delay to ensure the file is ready
          setTimeout(() => {
            const downloadUrl = `/api/download/${currentJob.id}`;
            
            // Use XMLHttpRequest for reliable download
            const xhr = new XMLHttpRequest();
            xhr.open('GET', downloadUrl, true);
            xhr.responseType = 'blob';
            xhr.setRequestHeader('Accept', 'audio/mpeg');
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            
            xhr.onload = function() {
              if (xhr.status === 200) {
                const blob = xhr.response;
                const url = window.URL.createObjectURL(blob);
                
                // Create a hidden download link
                const link = document.createElement('a');
                link.href = url;
                link.download = `${currentJob.title || 'download'}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              }
            };
            
            xhr.onerror = function() {
              // Fallback: try direct window.open
              window.open(downloadUrl, '_blank');
            };
            
            xhr.send();
          }, 500);
        }
        
        clearPolling();
      } else if (currentJob.status === JobStatus.FAILED) {
        showToast(`Conversion failed: ${currentJob.error || 'Unknown error'}`, 'error');
        clearPolling();
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      showToast('Error checking conversion status', 'error');
      clearPolling();
    }
  }, [autoDownload, clearPolling]);

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
      showToast('Failed to start conversion', 'error');
      setIsConverting(false);
    }
  }, [isConverting, pollStatus]);

  const resetConverter = useCallback(() => {
    clearPolling();
    setJob(null);
    setIsConverting(false);
  }, [clearPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  return {
    job,
    isLoading: isConverting,
    handleSubmit,
    resetConverter
  };
};
