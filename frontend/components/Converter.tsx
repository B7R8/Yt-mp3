
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useConverter } from '../hooks/useConverter';
import { JobStatus, Quality } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { DownloadIcon } from './icons/DownloadIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { CloseIcon } from './icons/CloseIcon';
import HeartIcon from './icons/HeartIcon';
import { sanitizeText, validateInput, logSecurityIncident } from '../utils/securityUtils';
import AutorenewIcon from './icons/AutorenewIcon';
import Tooltip from './Tooltip';

// Import modals directly to avoid lazy loading issues
import TrimAudioModal from './TrimAudioModal';
import SelectQualityModal from './SelectQualityModal';

interface ConverterProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Converter: React.FC<ConverterProps> = ({ showToast }) => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<Quality>('128K');
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [isFetchingDuration, setIsFetchingDuration] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [trimStart, setTrimStart] = useState('00:00:00');
  const [trimEnd, setTrimEnd] = useState('00:00:00');
  const [autoDownload, setAutoDownload] = useState(false);
  const { job, isLoading, handleSubmit, resetConverter, downloadFile } = useConverter(showToast, autoDownload);

  // Load preferred quality from localStorage on component mount
  useEffect(() => {
    const savedQuality = localStorage.getItem('preferredQuality');
    if (savedQuality && ['64K', '128K', '192K', '256K', '320K'].includes(savedQuality)) {
      setQuality(savedQuality as Quality);
    }
  }, []);

  // Fetch video duration when URL is entered
  const fetchVideoDuration = async (videoUrl: string) => {
    if (!videoUrl || isFetchingDuration) return;
    
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setDurationError('Invalid YouTube URL');
      return;
    }
    
    try {
      setIsFetchingDuration(true);
      setDurationError(null);
      
      // Direct call to backend with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 second timeout for very long videos (up to 50 hours)
      
      const durationResponse = await fetch(
        `/api/video-info?url=${encodeURIComponent(videoUrl)}`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json; charset=utf-8',
          },
        }
      );
      
      clearTimeout(timeoutId);
      
      if (durationResponse.ok) {
        const info = await durationResponse.json();
        if (info.success && info.duration) {
          setVideoDuration(info.duration);
          setTrimEnd(secondsToTimeString(info.duration));
          setDurationError(null);
        } else {
          setDurationError('Could not get video duration');
        }
      } else {
        setDurationError('Failed to fetch video info');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setDurationError('Request timeout - video might be too long');
      } else {
        setDurationError('Failed to fetch duration');
      }
      console.error('Failed to fetch video duration:', error);
    } finally {
      setIsFetchingDuration(false);
    }
  };

  // Extract YouTube video ID from URL (memoized) - Enhanced to support all formats
  const extractVideoId = useCallback((url: string): string | null => {
    const patterns = [
      // Standard watch URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Short URLs
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      
      // Embed URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      
      // Direct video URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      
      // Shorts URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      
      // Mobile URLs
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Music URLs
      /(?:https?:\/\/)?(?:www\.)?music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?music\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Gaming URLs
      /(?:https?:\/\/)?(?:www\.)?gaming\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?gaming\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      
      // Just the video ID (11 characters)
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log(`🎯 Extracted video ID: ${match[1]} from URL: ${url}`);
        return match[1];
      }
    }
    
    console.warn(`❌ Could not extract video ID from URL: ${url}`);
    return null;
  }, []);

  // Convert seconds to HH:mm:ss string (memoized)
  const secondsToTimeString = useCallback((seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Handle URL change - NO auto-fetch, only when user clicks trim (memoized)
  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
    // Reset duration when URL changes
    if (!newUrl || !extractVideoId(newUrl)) {
      setVideoDuration(undefined);
      setDurationError(null);
    }
  }, [extractVideoId]);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(url, quality, trimEnabled, trimStart, trimEnd);
  }, [url, quality, trimEnabled, trimStart, trimEnd, handleSubmit]);
  
  const handleClearUrl = useCallback(() => {
    setUrl('');
    setVideoDuration(undefined);
    setIsFetchingDuration(false);
    setDurationError(null);
    setTrimEnabled(false);
    setTrimStart('00:00:00');
    setTrimEnd('00:00:00');
  }, []);

  const handleTrimClick = useCallback(() => {
    // If no URL, show message and do not open modal
    if (!url || !extractVideoId(url)) {
      showToast('Please insert a valid YouTube video link to enable audio trim feature.', 'info');
      return;
    }

    // If URL exists but duration not fetched yet, start fetching
    if (!videoDuration && !isFetchingDuration && !durationError) {
      fetchVideoDuration(url);
    }
    
    // Open modal regardless (will show loading state inside)
    setIsTrimModalOpen(true);
  }, [url, extractVideoId, videoDuration, isFetchingDuration, durationError, fetchVideoDuration, showToast]);

  const handleTrimSave = useCallback((enabled: boolean, start: string, end: string) => {
    setTrimEnabled(enabled);
    setTrimStart(start);
    setTrimEnd(end);
    if (enabled) {
      showToast(`Trim set: ${start} to ${end}`, 'info');
    }
  }, [showToast]);

  const renderContent = () => {
    if (isLoading && !job) {
      return (
        <div className="text-center">
          <LoadingSpinner className="w-16 h-16 mx-auto" />
          <p className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">Starting conversion...</p>
          <div className="flex justify-center mt-4 space-x-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      );
    }

    if (job) {
      switch (job.status) {
        case JobStatus.PENDING:
        case 'processing':
          return (
            <div className="max-w-lg mx-auto">
              <h2 className="text-sm font-semibold text-center mb-2 break-words overflow-wrap-anywhere hyphens-auto video-title" title={job.title}>{job.title || 'Processing...'}</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6 capitalize font-medium">{job.status}...</p>
              
              {/* Quality Message for 3-hour rule */}
              {job.quality_message && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    {job.quality_message}
                  </p>
                </div>
              )}
              
              {/* Clean Progress Bar */}
              <div className="relative w-full">
                {/* Progress Track */}
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                  {/* Progress Fill */}
                  <div 
                    className="h-full bg-green-600 dark:bg-red-500 rounded-full transition-all duration-800 ease-out"
                    style={{ width: `${job.progress || 0}%` }}
                  ></div>
                </div>
                
                {/* Centered Progress Indicators */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-3">
                  {/* Indicator 1 */}
                  <div className={`w-3 h-3 rounded-full transition-all duration-700 ${
                    (job.progress || 0) >= 25 ? 'bg-green-600 dark:bg-red-500 shadow-lg scale-110' : 'bg-gray-400 dark:bg-gray-600'
                  }`}></div>
                  
                  {/* Indicator 2 */}
                  <div className={`w-3 h-3 rounded-full transition-all duration-700 ${
                    (job.progress || 0) >= 50 ? 'bg-green-600 dark:bg-red-500 shadow-lg scale-110' : 'bg-gray-400 dark:bg-gray-600'
                  }`}></div>
                  
                  {/* Indicator 3 */}
                  <div className={`w-3 h-3 rounded-full transition-all duration-700 ${
                    (job.progress || 0) >= 75 ? 'bg-green-600 dark:bg-red-500 shadow-lg scale-110' : 'bg-gray-400 dark:bg-gray-600'
                  }`}></div>
                  
                  {/* Indicator 4 */}
                  <div className={`w-3 h-3 rounded-full transition-all duration-700 ${
                    (job.progress || 0) >= 100 ? 'bg-green-600 dark:bg-red-500 shadow-lg scale-110' : 'bg-gray-400 dark:bg-gray-600'
                  }`}></div>
                </div>
              </div>
              
              {/* Custom CSS for particle animations */}
              <style>{`
                @keyframes particle1 {
                  0% { transform: translateX(0) translateY(-50%); opacity: 0; }
                  50% { opacity: 1; }
                  100% { transform: translateX(400px) translateY(-50%); opacity: 0; }
                }
                @keyframes particle2 {
                  0% { transform: translateX(0) translateY(-50%); opacity: 0; }
                  50% { opacity: 1; }
                  100% { transform: translateX(400px) translateY(-50%); opacity: 0; }
                }
              `}</style>
              
              {/* Percentage display with green colors */}
              <div className="flex items-center justify-center mt-4">
                <span className="text-green-600 dark:text-red-500 font-bold text-sm">
                  {job.progress || 0}%
                </span>
              </div>
              
              {/* Animated dots with green colors */}
              <div className="flex justify-center mt-4 space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 dark:bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-green-400 dark:bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-green-300 dark:bg-red-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          );
        case JobStatus.COMPLETED:
        case 'done':
          return (
            <div className="text-center">
              <h2 className="text-sm font-semibold mb-2 break-words overflow-wrap-anywhere hyphens-auto video-title" title={job.title}>{job.title}</h2>
              <p className="text-green-500 mb-6 text-sm font-medium">Conversion Complete!</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center items-center">
                <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Use the hidden anchor tag download method
                  downloadFile(job.id, job.title || 'converted');
                }}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white bg-black rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors duration-300 text-sm sm:text-sm md:text-xs w-full sm:w-auto"
              >
                <DownloadIcon className="w-5 h-5" />
                Download MP3
              </button>
              
              <button
                onClick={() => window.open('https://ko-fi.com/saveytb', '_blank')}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#41484B] transition-colors duration-300 text-sm sm:text-sm md:text-xs w-full sm:w-auto"
                style={{ backgroundColor: '#ff5f5f' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff4a4a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff5f5f'}
              >
                <HeartIcon className="w-5 h-5" />
                Buy Me a Coffee
              </button>
              
              <button 
                onClick={resetConverter} 
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white bg-gray-600 dark:bg-[#2d2d2d] rounded-lg shadow-md hover:bg-gray-700 dark:hover:bg-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-[#2d2d2d] transition-colors duration-300 text-sm sm:text-sm md:text-xs w-full sm:w-auto"
              >
                <AutorenewIcon className="w-5 h-5" />
                Convert Next
              </button>
              </div>
            </div>
          );
        case JobStatus.FAILED:
          return (
             <div className="text-center">
              <h2 className="text-sm font-semibold text-red-500 mb-2">Conversion Failed</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{job.error || 'An unknown error occurred.'}</p>
              <button onClick={resetConverter} className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition-colors text-sm">
                Try Again
              </button>
            </div>
          );
      }
    }

    return (
      <>
        <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row gap-4 md:gap-4">
          <div className="flex-grow flex w-full bg-white dark:bg-[#3a3a3a] border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500">
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste YouTube URL here to convert YouTube to MP3"
              aria-label="YouTube video URL"
              className="flex-grow px-4 sm:px-4 md:px-4 lg:px-5 py-4 sm:py-4 md:py-4 lg:py-4.5 bg-transparent border-0 rounded-l-lg focus:outline-none focus:ring-0 text-sm sm:text-base min-w-0"
              disabled={isLoading}
            />
            {url && (
               <div className="flex items-center bg-transparent pr-1 sm:pr-2">
                  <button
                      type="button"
                      onClick={handleClearUrl}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                      aria-label="Clear input"
                    >
                      <CloseIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
               </div>
            )}
            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-2.5 pl-2 sm:pl-3 md:pl-3 lg:pl-4 pr-2 sm:pr-3 md:pr-3 lg:pr-4 bg-transparent">
              <div className="h-6 sm:h-7 md:h-7 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-500 to-transparent mr-2 sm:mr-3"></div>
              <Tooltip text="Trim Audio">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTrimClick();
                  }}
                  className={`p-2 sm:p-2.5 md:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white transition-colors relative z-10 ${isFetchingDuration ? 'animate-pulse' : ''}`}
                  disabled={isFetchingDuration}
                  aria-label="Open trim audio settings modal"
                >
                    {isFetchingDuration ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <ScissorsIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6" />
                    )}
                </button>
              </Tooltip>
              <div className="h-6 sm:h-7 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-500 to-transparent"></div>
              <Tooltip text="Quality">
                <button 
                  type="button"
                  onClick={() => setIsQualityModalOpen(true)}
                  className="px-3 sm:px-3.5 md:px-3.5 py-2.5 sm:py-3 md:py-3 rounded-md font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label={`Select audio quality, current: ${quality}`}
                >
                    {quality}
                </button>
              </Tooltip>
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 sm:gap-3 w-full md:w-auto md:shrink-0 px-6 sm:px-8 md:px-8 lg:px-10 py-4 sm:py-4 md:py-4 lg:py-4.5 font-semibold text-white bg-gray-900 dark:bg-[#1f1f1f] rounded-lg hover:bg-black dark:hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-[#3a3a3a] transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6"/> : 'Convert'}
            {!isLoading && <RefreshIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6" />}
          </button>
        </form>
        
        {/* Auto Download Toggle */}
        <div className="flex items-center justify-center mt-4">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-3 bg-gray-100 dark:bg-[#2d2d2d] rounded-lg px-4 py-2 sm:px-5 sm:py-2.5 md:px-4 md:py-2">
            <span className="text-sm sm:text-base md:text-base font-medium text-gray-700 dark:text-gray-300">
              Auto Download
            </span>
            <button
              type="button"
              onClick={() => setAutoDownload(!autoDownload)}
              className={`relative inline-flex h-5 w-10 sm:h-6 sm:w-11 md:h-5 md:w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
                autoDownload ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label={`Toggle auto download - currently ${autoDownload ? 'enabled' : 'disabled'}`}
            >
              <span
                className={`inline-block h-3 w-3 sm:h-4 sm:w-4 md:h-3 md:w-3 transform rounded-full bg-white transition-transform ${
                  autoDownload ? 'translate-x-5 sm:translate-x-6 md:translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {isTrimModalOpen && (
          <TrimAudioModal 
              isOpen={isTrimModalOpen} 
              onClose={() => setIsTrimModalOpen(false)}
              videoDuration={videoDuration}
              isFetchingDuration={isFetchingDuration}
              onSave={handleTrimSave}
              initialEnabled={trimEnabled}
              initialStart={trimStart}
              initialEnd={trimEnd}
          />
        )}
        {isQualityModalOpen && (
          <SelectQualityModal 
              isOpen={isQualityModalOpen} 
              onClose={() => setIsQualityModalOpen(false)}
              currentQuality={quality}
              onSave={setQuality}
          />
        )}
      </>
    );
  };

  return (
    <div className="w-full max-w-full md:max-w-2xl lg:max-w-3xl mx-auto bg-gray-100/50 dark:bg-[#2d2d2d] rounded-lg sm:rounded-xl shadow-md border border-gray-200/80 dark:border-gray-600/50 p-4 sm:p-6 md:p-6 lg:p-8 xl:p-10 transition-all duration-300 flex items-center justify-center">
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default memo(Converter);
