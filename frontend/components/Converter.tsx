
import React, { useState } from 'react';
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
  const { job, isLoading, handleSubmit, resetConverter } = useConverter(showToast);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(url);
  };
  
  const handleClearUrl = () => {
    setUrl('');
  }

  const renderContent = () => {
    if (isLoading && !job) {
      return (
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 mx-auto text-brand-500" />
          <p className="mt-4 text-lg">Starting conversion...</p>
        </div>
      );
    }

    if (job) {
      switch (job.status) {
        case JobStatus.PENDING:
        case JobStatus.PROCESSING:
          return (
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-center truncate mb-2" title={job.title}>{job.title || 'Processing...'}</h3>
              <p className="text-center text-brand-500 dark:text-brand-400 mb-4 capitalize">{job.status}...</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-brand-500 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${job.progress || 0}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 font-mono">{job.progress || 0}%</p>
            </div>
          );
        case JobStatus.COMPLETED:
          return (
            <div className="text-center">
              <h3 className="text-lg font-semibold truncate mb-2" title={job.title}>{job.title}</h3>
              <p className="text-green-500 mb-6 text-lg font-medium">Conversion Complete!</p>
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
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white bg-black rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors duration-300 text-xs sm:text-sm md:text-base w-full sm:w-auto"
              >
                <DownloadIcon className="w-5 h-5" />
                Download MP3
              </button>
              
              <button
                onClick={() => window.open('https://buymeacoffee.com/ytconverter', '_blank')}
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-300 text-xs sm:text-sm md:text-base w-full sm:w-auto"
                style={{ backgroundColor: '#ff5f5f' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff4a4a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff5f5f'}
              >
                <HeartIcon className="w-5 h-5" />
                Buy Me a Coffee
              </button>
              
              <button 
                onClick={resetConverter} 
                className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 font-semibold text-white bg-gray-600 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors duration-300 text-xs sm:text-sm md:text-base w-full sm:w-auto"
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
              <h3 className="text-lg font-semibold text-red-500 mb-2">Conversion Failed</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{job.error || 'An unknown error occurred.'}</p>
              <button onClick={resetConverter} className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-brand-600 rounded-lg shadow-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-900 transition-colors">
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
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here"
              aria-label="YouTube video URL"
              className="flex-grow px-3 sm:px-3 md:px-4 lg:px-5 py-3 sm:py-3 md:py-3.5 lg:py-4 bg-transparent border-0 rounded-l-lg focus:outline-none focus:ring-0 text-sm sm:text-base md:text-lg min-w-0"
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
                  onClick={() => setIsTrimModalOpen(true)}
                  className="p-1.5 sm:p-2 md:p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                    <ScissorsIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
              </Tooltip>
              <div className="h-5 sm:h-6 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-500 to-transparent"></div>
              <Tooltip text="Quality">
                <button 
                  type="button"
                  onClick={() => setIsQualityModalOpen(true)}
                  className="px-2 sm:px-2.5 md:px-3 py-2 sm:py-2.5 md:py-3 rounded-md font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    {quality}
                </button>
              </Tooltip>
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-1 sm:gap-2 w-full md:w-auto md:shrink-0 px-5 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-3 md:py-3.5 lg:py-4 font-semibold text-white bg-gray-900 dark:bg-black rounded-lg hover:bg-black dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-[#1D2528] transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"/> : 'Convert'}
            {!isLoading && <RefreshIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
          </button>
        </form>
        
        <TrimAudioModal 
            isOpen={isTrimModalOpen} 
            onClose={() => setIsTrimModalOpen(false)} 
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
    <div className="w-full max-w-full md:max-w-2xl lg:max-w-3xl mx-auto bg-gray-100/50 dark:bg-[#2d3748] rounded-lg sm:rounded-xl shadow-md border border-gray-200/80 dark:border-gray-600/50 p-3 sm:p-4 md:p-4 lg:p-6 xl:p-8 transition-all duration-300 flex items-center justify-center overflow-hidden">
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default Converter;
