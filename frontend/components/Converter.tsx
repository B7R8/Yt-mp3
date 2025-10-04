
import React, { useState, useCallback, useEffect } from 'react';
import { ConversionStatus, StatusResponse } from '../types';
import { ConvertIcon } from './icons/ConvertIcon';
import { showToast, toastMessages } from '../utils/toast';

// API configuration - Use proxy for development
const API_BASE_URL = '/api';

const Converter: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [error, setError] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  const isValidYouTubeUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
  };

  const handleConvert = useCallback(async () => {
    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL.');
      setStatus('error');
      showToast.error(toastMessages.conversion.invalidUrl);
      return;
    }
    setError('');
    setStatus('converting');
    setIsConverting(true);
    setJobId(null);
    setDownloadUrl(null);
    setVideoTitle('');

    try {
      const response = await fetch(`${API_BASE_URL}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          quality: '192k', // Default quality
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to start conversion');
      }

      setJobId(data.jobId);
    } catch (error) {
      console.error('Conversion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start conversion';
      setError(errorMessage);
      setStatus('error');
      setIsConverting(false);
      showToast.error(toastMessages.conversion.failed);
    }
  }, [url]);

  // Poll the backend for job status
  useEffect(() => {
    if (status !== 'converting' || !jobId) {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
        const data: StatusResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error_message || 'Failed to get status');
        }

        if (data.status === 'completed') {
          setStatus('success');
          setDownloadUrl(`${API_BASE_URL}/download/${jobId}`);
          setVideoTitle(data.video_title || 'Unknown Video');
          setIsConverting(false);
          showToast.success(toastMessages.conversion.completed);
        } else if (data.status === 'failed') {
          const errorMessage = data.error_message || 'Conversion failed';
          setError(errorMessage);
          setStatus('error');
          setIsConverting(false);
          showToast.error(toastMessages.conversion.failed);
        }
        // If status is 'pending' or 'processing', continue polling
      } catch (error) {
        console.error('Status polling error:', error);
        setError('Failed to check conversion status');
        setStatus('error');
        setIsConverting(false);
        showToast.error(toastMessages.conversion.failed);
      }
    };

    const intervalId = setInterval(pollStatus, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [status, jobId]);

  const handleDownload = () => {
    if (!downloadUrl) {
      showToast.error(toastMessages.download.noFile);
      return;
    }

    try {
      // Trigger download from the backend
      window.open(downloadUrl, '_blank');
      showToast.success(toastMessages.download.started);
    } catch (error) {
      console.error('Download error:', error);
      showToast.error(toastMessages.download.failed);
    }
  };
  
  const reset = () => {
      setUrl('');
      setStatus('idle');
      setError('');
      setJobId(null);
      setDownloadUrl(null);
      setVideoTitle('');
      setIsConverting(false);
  }

  const renderContent = () => {
    switch (status) {
      case 'converting':
        return (
          <div className="flex flex-col items-center justify-center h-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
            <p className="mt-4 text-lg">Converting, please wait...</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Video Title Display */}
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text mb-2">
                {videoTitle}
              </h3>
              <p className="text-lg text-green-600 font-semibold">Conversion Successful!</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownload}
                disabled={!downloadUrl}
                className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download MP3</span>
              </button>
              
              <button
                onClick={reset}
                className="bg-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Convert Next</span>
              </button>
            </div>
          </div>
        );
      case 'error':
         return (
             <div className="flex flex-col items-center justify-center h-24 space-y-4">
              <p className="text-red-500 text-lg">{error}</p>
              <button
                onClick={reset}
                className="bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
                >
                Try Again
                </button>
            </div>
         );
      case 'idle':
      default:
        return (
          <div className="w-full">
            <div className="flex flex-col space-y-4">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  // Clear any existing errors when user starts typing
                  if (error) {
                    setError('');
                  }
                }}
                placeholder="Paste YouTube video URL here"
                className="w-full bg-gray-100 dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
              <button
                onClick={handleConvert}
                disabled={!url.trim() || isConverting}
                className="w-full bg-brand-red text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              >
                {isConverting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to MP3</span>
                    <ConvertIcon />
                  </>
                )}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      {renderContent()}
    </div>
  );
};

export default Converter;
