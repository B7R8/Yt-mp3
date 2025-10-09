
import React, { useState, useEffect } from 'react';
import { useConverter } from '../hooks/useConverter';
import { JobStatus, Quality } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { DownloadIcon } from './icons/DownloadIcon';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { CloseIcon } from './icons/CloseIcon';
import HeartIcon from './icons/HeartIcon';
import AutorenewIcon from './icons/AutorenewIcon';
import Tooltip from './Tooltip';
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
  const { job, isLoading, handleSubmit, resetConverter } = useConverter(showToast, autoDownload);

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

  // Extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Convert seconds to HH:mm:ss string
  const secondsToTimeString = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle URL change - NO auto-fetch, only when user clicks trim
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    // Reset duration when URL changes
    if (!newUrl || !extractVideoId(newUrl)) {
      setVideoDuration(undefined);
      setDurationError(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(url, quality, trimEnabled, trimStart, trimEnd);
  };
  
  const handleClearUrl = () => {
    setUrl('');
    setVideoDuration(undefined);
    setIsFetchingDuration(false);
    setDurationError(null);
    setTrimEnabled(false);
    setTrimStart('00:00:00');
    setTrimEnd('00:00:00');
  };

  const handleTrimClick = () => {
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
  };

  const handleTrimSave = (enabled: boolean, start: string, end: string) => {
    setTrimEnabled(enabled);
    setTrimStart(start);
    setTrimEnd(end);
    if (enabled) {
      showToast(`Trim set: ${start} to ${end}`, 'info');
    }
  };

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
        case JobStatus.PROCESSING:
          return (
            <div className="max-w-lg mx-auto">
              <h3 className="text-sm font-semibold text-center mb-2 break-words overflow-wrap-anywhere hyphens-auto video-title" title={job.title}>{job.title || 'Processing...'}</h3>
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
              <style jsx>{`
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
          return (
            <div className="text-center">
              <h3 className="text-sm font-semibold mb-2 break-words overflow-wrap-anywhere hyphens-auto video-title" title={job.title}>{job.title}</h3>
              <p className="text-green-500 mb-6 text-sm font-medium">Conversion Complete!</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center items-center">
                <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  try {
                    // Detect browser for optimal download method
                    const userAgent = navigator.userAgent.toLowerCase();
                    const isChrome = userAgent.includes('chrome');
                    const isFirefox = userAgent.includes('firefox');
                    const isEdge = userAgent.includes('edge');
                    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
                    
                    // Create a completely silent download using XMLHttpRequest
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', `/api/download/${job.id}`, true);
                    xhr.responseType = 'blob';
                    xhr.setRequestHeader('Accept', 'audio/mpeg');
                    xhr.setRequestHeader('Cache-Control', 'no-cache');
                    
                    // Add browser-specific headers
                    if (isChrome || isEdge) {
                      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    }
                    
                    xhr.onload = function() {
                      if (xhr.status === 200) {
                        const blob = xhr.response;
                        const url = window.URL.createObjectURL(blob);
                        
                        // Create a completely hidden download link
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${job.title || 'converted'}.mp3`;
                        link.style.position = 'absolute';
                        link.style.left = '-9999px';
                        link.style.top = '-9999px';
                        link.style.opacity = '0';
                        link.style.pointerEvents = 'none';
                        
                        document.body.appendChild(link);
                        
                        // Trigger download silently
                        const clickEvent = new MouseEvent('click', {
                          bubbles: true,
                          cancelable: true,
                          view: window
                        });
                        link.dispatchEvent(clickEvent);
                        
                        // Clean up immediately
                        setTimeout(() => {
                          if (document.body.contains(link)) {
                            document.body.removeChild(link);
                          }
                          window.URL.revokeObjectURL(url);
                        }, 100);
                      }
                    };
                    
                    xhr.onerror = function() {
                      console.error('Download failed');
                      // Fallback: try direct window.open for stubborn browsers
                      try {
                        window.open(`/api/download/${job.id}`, '_blank');
                      } catch (fallbackError) {
                        console.error('Fallback download also failed:', fallbackError);
                      }
                    };
                    
                    xhr.send();
                    
                  } catch (error) {
                    console.error('Download error:', error);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white bg-black rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors duration-300 text-xs sm:text-sm w-full sm:w-auto"
              >
                <DownloadIcon className="w-5 h-5" />
                Download MP3
              </button>
              
              <button
                onClick={() => window.open('https://buymeacoffee.com/ytconverter', '_blank')}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-300 text-xs sm:text-sm w-full sm:w-auto"
                style={{ backgroundColor: '#ff5f5f' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff4a4a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff5f5f'}
              >
                <HeartIcon className="w-5 h-5" />
                Buy Me a Coffee
              </button>
              
              <button 
                onClick={resetConverter} 
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors duration-300 text-xs sm:text-sm w-full sm:w-auto"
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
              <h3 className="text-sm font-semibold text-red-500 mb-2">Conversion Failed</h3>
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
        <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-grow flex w-full bg-white dark:bg-[#1D2528] border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500">
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste YouTube URL here to convert YouTube to MP3"
              aria-label="YouTube video URL"
              className="flex-grow px-3 sm:px-3 md:px-4 lg:px-5 py-3 sm:py-3 md:py-3.5 lg:py-4 bg-transparent border-0 rounded-l-lg focus:outline-none focus:ring-0 text-xs sm:text-sm min-w-0"
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
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 pl-1 sm:pl-2 md:pl-3 lg:pl-4 pr-1 sm:pr-2 md:pr-3 lg:pr-4 bg-transparent">
              <div className="h-5 sm:h-6 md:h-7 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-500 to-transparent mr-1 sm:mr-2"></div>
              <Tooltip text="Trim Audio">
                <button 
                  type="button" 
                  onClick={handleTrimClick}
                  className={`p-1.5 sm:p-2 md:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white transition-colors relative ${isFetchingDuration ? 'animate-pulse' : ''}`}
                  disabled={isFetchingDuration}
                >
                    {isFetchingDuration ? (
                      <LoadingSpinner className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    ) : (
                      <ScissorsIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    )}
                </button>
              </Tooltip>
              <div className="h-5 sm:h-6 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-500 to-transparent"></div>
              <Tooltip text="Quality">
                <button 
                  type="button"
                  onClick={() => setIsQualityModalOpen(true)}
                  className="px-2 sm:px-2.5 md:px-3 py-2 sm:py-2.5 md:py-3 rounded-md font-semibold text-gray-700 dark:text-gray-300 text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    {quality}
                </button>
              </Tooltip>
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-1 sm:gap-2 w-full md:w-auto md:shrink-0 px-5 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-3 md:py-3.5 lg:py-4 font-semibold text-white bg-gray-900 dark:bg-black rounded-lg hover:bg-black dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-[#1D2528] transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-xs sm:text-sm"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"/> : 'Convert'}
            {!isLoading && <RefreshIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
          </button>
        </form>
        
        {/* Auto Download Toggle */}
        <div className="flex items-center justify-center mt-3">
          <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Auto Download
            </span>
            <button
              type="button"
              onClick={() => setAutoDownload(!autoDownload)}
              className={`relative inline-flex h-4 w-8 sm:h-5 sm:w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${
                autoDownload ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 transform rounded-full bg-white transition-transform ${
                  autoDownload ? 'translate-x-4 sm:translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
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
        <SelectQualityModal 
            isOpen={isQualityModalOpen} 
            onClose={() => setIsQualityModalOpen(false)}
            currentQuality={quality}
            onSave={setQuality}
        />
      </>
    );
  };

  return (
    <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl mx-auto bg-gray-100/50 dark:bg-[#2d3748] rounded-lg sm:rounded-xl shadow-md border border-gray-200/80 dark:border-gray-600/50 p-3 sm:p-5 md:p-6 lg:p-7 xl:p-8 transition-all duration-300 flex items-center justify-center">
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default Converter;
