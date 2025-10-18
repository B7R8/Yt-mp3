import React, { useState, useCallback, useMemo } from 'react';
import { useOptimizedConverter } from '../hooks/useOptimizedConverter';
import LoadingSpinner from './LoadingSpinner';
import Toast from './Toast';
import SelectQualityModal from './SelectQualityModal';
import TrimAudioModal from './TrimAudioModal';
import Tooltip from './Tooltip';
import { Quality } from '../types';

interface OptimizedConverterProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  autoDownload: boolean;
}

export const OptimizedConverter: React.FC<OptimizedConverterProps> = ({
  showToast,
  autoDownload
}) => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<Quality>('192K');
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showTrimModal, setShowTrimModal] = useState(false);

  const {
    job,
    isLoading,
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
  } = useOptimizedConverter(showToast, autoDownload);

  // Handle URL input with debounced video info fetching
  const handleUrlInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    handleUrlChange(newUrl);
  }, [handleUrlChange]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canStartConversion) return;
    
    await handleSubmit(url, quality, trimEnabled, trimStart, trimEnd);
  }, [canStartConversion, handleSubmit, url, quality, trimEnabled, trimStart, trimEnd]);

  // Handle quality selection
  const handleQualitySelect = useCallback((selectedQuality: Quality) => {
    setQuality(selectedQuality);
    setShowQualityModal(false);
  }, []);

  // Handle trim settings
  const handleTrimSettings = useCallback((enabled: boolean, startTime: string, endTime: string) => {
    setTrimStart(startTime);
    setTrimEnd(endTime);
    setTrimEnabled(enabled);
    setShowTrimModal(false);
  }, []);

  // Memoized progress percentage
  const progressPercentage = useMemo(() => {
    if (!conversionProgress) return 0;
    return Math.round(conversionProgress.progress);
  }, [conversionProgress]);

  // Memoized status message
  const statusMessage = useMemo(() => {
    if (!conversionProgress) return '';
    
    switch (conversionProgress.status) {
      case 'pending':
        return 'Queued for processing...';
      case 'processing':
        return `Converting... ${progressPercentage}%`;
      case 'completed':
        return 'Conversion completed!';
      case 'failed':
        return 'Conversion failed';
      default:
        return '';
    }
  }, [conversionProgress, progressPercentage]);

  // Memoized video duration display
  const durationDisplay = useMemo(() => {
    if (!videoInfo) return null;
    
    return (
      <div className="video-info">
        <div className="video-thumbnail">
          {videoInfo.thumbnail && (
            <img 
              src={videoInfo.thumbnail} 
              alt="Video thumbnail" 
              className="thumbnail-image"
              loading="lazy"
            />
          )}
        </div>
        <div className="video-details">
          <h2 className="video-title" title={videoInfo.title}>
            {videoInfo.title}
          </h2>
          <div className="video-meta">
            <span className="duration">Duration: {videoInfo.durationFormatted}</span>
            {videoInfo.uploader && (
              <span className="uploader">by {videoInfo.uploader}</span>
            )}
            {videoInfo.viewCount > 0 && (
              <span className="views">
                {videoInfo.viewCount.toLocaleString()} views
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [videoInfo]);

  return (
    <div className="optimized-converter">
      <form onSubmit={handleFormSubmit} className="converter-form">
        <div className="input-group">
          <div className="url-input-container">
            <input
              type="url"
              value={url}
              onChange={handleUrlInputChange}
              placeholder="Paste YouTube URL here..."
              className={`url-input ${!isUrlValid && url ? 'invalid' : ''}`}
              disabled={isLoading}
              autoComplete="off"
              spellCheck="false"
            />
            {isLoadingVideoInfo && (
              <div className="loading-indicator">
                <LoadingSpinner size="small" />
              </div>
            )}
          </div>
          
          {!isUrlValid && url && (
            <div className="error-message">
              Please enter a valid YouTube URL
            </div>
          )}
        </div>

        {/* Video Info Display */}
        {videoInfo && (
          <div className="video-info-container">
            {durationDisplay}
          </div>
        )}

        {/* Quality and Trim Options */}
        <div className="options-row">
          <button
            type="button"
            onClick={() => setShowQualityModal(true)}
            className="option-button"
            disabled={isLoading}
            aria-label={`Select audio quality, current: ${quality}`}
          >
            Quality: {quality}
            <Tooltip text="Select audio quality">
              <span className="info-icon">ℹ️</span>
            </Tooltip>
          </button>

          <button
            type="button"
            onClick={() => setShowTrimModal(true)}
            className="option-button"
            disabled={isLoading}
            aria-label={trimEnabled ? `Trim audio from ${trimStart} to ${trimEnd}` : 'Set audio trim settings'}
          >
            {trimEnabled ? `Trim: ${trimStart} - ${trimEnd}` : 'No Trim'}
            <Tooltip text="Set start and end times for audio trimming">
              <span className="info-icon">✂️</span>
            </Tooltip>
          </button>
        </div>

        {/* Convert Button */}
        <button
          type="submit"
          disabled={!canStartConversion}
          className={`convert-button ${!canStartConversion ? 'disabled' : ''}`}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" />
              Converting...
            </>
          ) : (
            'Convert to MP3'
          )}
        </button>

        {/* Progress Display */}
        {conversionProgress && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="progress-text">
              {statusMessage}
            </div>
            {conversionProgress.error && (
              <div className="error-message">
                {conversionProgress.error}
              </div>
            )}
          </div>
        )}

        {/* Job Status Display */}
        {job && (
          <div className="job-status">
            <div className="status-info">
              <span className="status-label">Status:</span>
              <span className={`status-value ${job.status}`}>
                {job.status}
              </span>
            </div>
            
            {job.status === 'completed' && (
              <button
                onClick={() => downloadFile(job.id, job.title || 'download')}
                className="download-button"
              >
                Download MP3
              </button>
            )}
            
            {job.status === 'failed' && (
              <button
                onClick={resetConverter}
                className="retry-button"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </form>

      {/* Modals */}
      {showQualityModal && (
        <SelectQualityModal
          isOpen={showQualityModal}
          currentQuality={quality}
          onSave={handleQualitySelect}
          onClose={() => setShowQualityModal(false)}
        />
      )}

      {showTrimModal && (
        <TrimAudioModal
          isOpen={showTrimModal}
          initialStart={trimStart}
          initialEnd={trimEnd}
          videoDuration={videoInfo?.duration || 0}
          onSave={handleTrimSettings}
          onClose={() => setShowTrimModal(false)}
        />
      )}
    </div>
  );
};
