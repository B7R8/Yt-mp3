import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { XIcon } from './icons/XIcon';
import { ClockIcon } from './icons/ClockIcon';

interface TrimAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoDuration?: number; // Duration in seconds
  isFetchingDuration?: boolean;
  onSave: (enabled: boolean, startTime: string, endTime: string) => void;
  initialEnabled?: boolean;
  initialStart?: string;
  initialEnd?: string;
}

const TimeInput: React.FC<{
  value: { h: string; m: string; s: string };
  onChange: (value: { h: string; m: string; s: string }) => void;
  disabled: boolean;
  maxDuration?: number; // Video duration in seconds
  isEndTime?: boolean; // Whether this is the end time field
  otherTime?: { h: string; m: string; s: string }; // The other time field for comparison
}> = ({ value, onChange, disabled, maxDuration, isEndTime = false, otherTime }) => {
  const handleInput = (field: 'h' | 'm' | 's', val: string) => {
    // Only allow numbers, remove any non-numeric characters
    const numVal = val.replace(/[^0-9]/g, '').slice(0, 2);
    
    // If no valid numbers, keep the original value
    if (numVal === '' && val !== '') {
      return; // Don't change anything if user typed non-numeric characters
    }
    
    // Create new value with the updated field
    const newValue = { ...value, [field]: numVal };
    const newTotalSeconds = parseInt(newValue.h) * 3600 + parseInt(newValue.m) * 60 + parseInt(newValue.s);
    
    // Validate against video duration
    if (maxDuration && newTotalSeconds > maxDuration) {
      return; // Don't allow values exceeding video duration
    }
    
    // Validate start time vs end time
    if (otherTime) {
      const otherTotalSeconds = parseInt(otherTime.h) * 3600 + parseInt(otherTime.m) * 60 + parseInt(otherTime.s);
      
      if (isEndTime && newTotalSeconds <= otherTotalSeconds) {
        return; // End time must be greater than start time
      }
      if (!isEndTime && newTotalSeconds >= otherTotalSeconds) {
        return; // Start time must be less than end time
      }
    }
    
    // Don't pad while typing, let user type naturally
    onChange(newValue);
  };

  const handleBlur = (field: 'h' | 'm' | 's') => {
    // Add padding when user finishes typing (onBlur)
    const currentVal = value[field];
    if (currentVal === '' || currentVal === '0') {
      onChange({ ...value, [field]: '00' });
    } else if (currentVal.length === 1) {
      onChange({ ...value, [field]: currentVal.padStart(2, '0') });
    }
  };

  const increment = (field: 'h' | 'm' | 's') => {
    if (disabled) return;
    const current = parseInt(value[field]);
    const max = field === 'h' ? 99 : 59;
    const newVal = current >= max ? 0 : current + 1;
    const paddedVal = newVal.toString().padStart(2, '0');
    
    const newValue = { ...value, [field]: paddedVal };
    const newTotalSeconds = parseInt(newValue.h) * 3600 + parseInt(newValue.m) * 60 + parseInt(newValue.s);
    
    // Validate against video duration
    if (maxDuration && newTotalSeconds > maxDuration) {
      return; // Don't allow values exceeding video duration
    }
    
    // Validate start time vs end time
    if (otherTime) {
      const otherTotalSeconds = parseInt(otherTime.h) * 3600 + parseInt(otherTime.m) * 60 + parseInt(otherTime.s);
      
      if (isEndTime && newTotalSeconds <= otherTotalSeconds) {
        return; // End time must be greater than start time
      }
      if (!isEndTime && newTotalSeconds >= otherTotalSeconds) {
        return; // Start time must be less than end time
      }
    }
    
    onChange(newValue);
  };

  const decrement = (field: 'h' | 'm' | 's') => {
    if (disabled) return;
    const current = parseInt(value[field]);
    const max = field === 'h' ? 99 : 59;
    const newVal = current <= 0 ? max : current - 1;
    const paddedVal = newVal.toString().padStart(2, '0');
    
    const newValue = { ...value, [field]: paddedVal };
    const newTotalSeconds = parseInt(newValue.h) * 3600 + parseInt(newValue.m) * 60 + parseInt(newValue.s);
    
    // Validate against video duration
    if (maxDuration && newTotalSeconds > maxDuration) {
      return; // Don't allow values exceeding video duration
    }
    
    // Validate start time vs end time
    if (otherTime) {
      const otherTotalSeconds = parseInt(otherTime.h) * 3600 + parseInt(otherTime.m) * 60 + parseInt(otherTime.s);
      
      if (isEndTime && newTotalSeconds <= otherTotalSeconds) {
        return; // End time must be greater than start time
      }
      if (!isEndTime && newTotalSeconds >= otherTotalSeconds) {
        return; // Start time must be less than end time
      }
    }
    
    onChange(newValue);
  };

  // Check if increment/decrement buttons should be disabled
  const isIncrementDisabled = (field: 'h' | 'm' | 's') => {
    if (disabled) return true;
    const current = parseInt(value[field]);
    const max = field === 'h' ? 99 : 59;
    const newVal = current >= max ? 0 : current + 1;
    const newValue = { ...value, [field]: newVal.toString().padStart(2, '0') };
    const newTotalSeconds = parseInt(newValue.h) * 3600 + parseInt(newValue.m) * 60 + parseInt(newValue.s);
    
    // Check video duration limit
    if (maxDuration && newTotalSeconds > maxDuration) return true;
    
    // Check start/end time relationship
    if (otherTime) {
      const otherTotalSeconds = parseInt(otherTime.h) * 3600 + parseInt(otherTime.m) * 60 + parseInt(otherTime.s);
      if (isEndTime && newTotalSeconds <= otherTotalSeconds) return true;
      if (!isEndTime && newTotalSeconds >= otherTotalSeconds) return true;
    }
    
    return false;
  };

  const isDecrementDisabled = (field: 'h' | 'm' | 's') => {
    if (disabled) return true;
    const current = parseInt(value[field]);
    const max = field === 'h' ? 99 : 59;
    const newVal = current <= 0 ? max : current - 1;
    const newValue = { ...value, [field]: newVal.toString().padStart(2, '0') };
    const newTotalSeconds = parseInt(newValue.h) * 3600 + parseInt(newValue.m) * 60 + parseInt(newValue.s);
    
    // Check video duration limit
    if (maxDuration && newTotalSeconds > maxDuration) return true;
    
    // Check start/end time relationship
    if (otherTime) {
      const otherTotalSeconds = parseInt(otherTime.h) * 3600 + parseInt(otherTime.m) * 60 + parseInt(otherTime.s);
      if (isEndTime && newTotalSeconds <= otherTotalSeconds) return true;
      if (!isEndTime && newTotalSeconds >= otherTotalSeconds) return true;
    }
    
    return false;
  };

  // Check if current time has validation issues
  const hasValidationError = () => {
    const currentSeconds = parseInt(value.h) * 3600 + parseInt(value.m) * 60 + parseInt(value.s);
    
    // Check video duration limit
    if (maxDuration && currentSeconds > maxDuration) return true;
    
    // Check start/end relationship
    if (otherTime) {
      const otherSeconds = parseInt(otherTime.h) * 3600 + parseInt(otherTime.m) * 60 + parseInt(otherTime.s);
      if (isEndTime && currentSeconds <= otherSeconds) return true;
      if (!isEndTime && currentSeconds >= otherSeconds) return true;
    }
    
    return false;
  };

  const hasError = hasValidationError();

  return (
    <div className={`flex items-center gap-1 font-mono text-lg sm:text-2xl p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
      hasError 
        ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-600' 
        : 'bg-gray-100 dark:bg-gray-700 border-2 border-transparent'
    }`}>
      <div className="relative group">
        <button
          type="button"
          onClick={() => increment('h')}
          disabled={disabled || isIncrementDisabled('h')}
          className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:cursor-not-allowed rounded-t-sm transition-opacity ${
            disabled || isIncrementDisabled('h') 
              ? 'opacity-0' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg className="w-2 h-2 text-gray-600 dark:text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      <input 
        type="text" 
        value={value.h} 
        onChange={(e) => handleInput('h', e.target.value)}
          onBlur={() => handleBlur('h')}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              increment('h');
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              decrement('h');
            }
          }}
        maxLength={2} 
        className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" 
        disabled={disabled} 
      />
        <button
          type="button"
          onClick={() => decrement('h')}
          disabled={disabled || isDecrementDisabled('h')}
          className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:cursor-not-allowed rounded-b-sm transition-opacity ${
            disabled || isDecrementDisabled('h') 
              ? 'opacity-0' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg className="w-2 h-2 text-gray-600 dark:text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <span>:</span>
      <div className="relative group">
        <button
          type="button"
          onClick={() => increment('m')}
          disabled={disabled || isIncrementDisabled('m')}
          className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:cursor-not-allowed rounded-t-sm transition-opacity ${
            disabled || isIncrementDisabled('m') 
              ? 'opacity-0' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg className="w-2 h-2 text-gray-600 dark:text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      <input 
        type="text" 
        value={value.m} 
        onChange={(e) => handleInput('m', e.target.value)}
          onBlur={() => handleBlur('m')}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              increment('m');
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              decrement('m');
            }
          }}
        maxLength={2} 
        className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" 
        disabled={disabled} 
      />
        <button
          type="button"
          onClick={() => decrement('m')}
          disabled={disabled || isDecrementDisabled('m')}
          className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:cursor-not-allowed rounded-b-sm transition-opacity ${
            disabled || isDecrementDisabled('m') 
              ? 'opacity-0' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg className="w-2 h-2 text-gray-600 dark:text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <span>:</span>
      <div className="relative group">
        <button
          type="button"
          onClick={() => increment('s')}
          disabled={disabled || isIncrementDisabled('s')}
          className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:cursor-not-allowed rounded-t-sm transition-opacity ${
            disabled || isIncrementDisabled('s') 
              ? 'opacity-0' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg className="w-2 h-2 text-gray-600 dark:text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      <input 
        type="text" 
        value={value.s} 
        onChange={(e) => handleInput('s', e.target.value)}
          onBlur={() => handleBlur('s')}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              increment('s');
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              decrement('s');
            }
          }}
        maxLength={2} 
        className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" 
        disabled={disabled} 
      />
        <button
          type="button"
          onClick={() => decrement('s')}
          disabled={disabled || isDecrementDisabled('s')}
          className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:cursor-not-allowed rounded-b-sm transition-opacity ${
            disabled || isDecrementDisabled('s') 
              ? 'opacity-0' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <svg className="w-2 h-2 text-gray-600 dark:text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const TrimAudioModal: React.FC<TrimAudioModalProps> = ({ 
  isOpen, 
  onClose, 
  videoDuration,
  isFetchingDuration = false,
  onSave,
  initialEnabled = false,
  initialStart = '00:00:00',
  initialEnd = '00:00:00'
}) => {
  const [isTrimEnabled, setIsTrimEnabled] = useState(initialEnabled);
  const [startTime, setStartTime] = useState({ h: '00', m: '00', s: '00' });
  const [endTime, setEndTime] = useState({ h: '00', m: '00', s: '00' });

  // Convert seconds to time object
  const secondsToTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };

  // Convert time string to object
  const timeStringToObject = (timeStr: string) => {
    const parts = timeStr.split(':');
    return {
      h: parts[0] || '00',
      m: parts[1] || '00',
      s: parts[2] || '00'
    };
  };

  // Initialize with video duration when available
  useEffect(() => {
    if (videoDuration && videoDuration > 0) {
      const endTimeObj = secondsToTime(videoDuration);
      setEndTime(endTimeObj);
    }
  }, [videoDuration]);

  // Initialize with saved values
  useEffect(() => {
    if (initialStart !== '00:00:00') {
      setStartTime(timeStringToObject(initialStart));
    }
    if (initialEnd !== '00:00:00') {
      setEndTime(timeStringToObject(initialEnd));
    }
    setIsTrimEnabled(initialEnabled);
  }, [initialEnabled, initialStart, initialEnd]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    } else if (m > 0) {
      return `${m}m ${s}s`;
    } else {
      return `${s}s`;
    }
  };

  // Calculate trimmed duration in seconds
  const calculateTrimmedDuration = () => {
    const startSeconds = parseInt(startTime.h) * 3600 + parseInt(startTime.m) * 60 + parseInt(startTime.s);
    const endSeconds = parseInt(endTime.h) * 3600 + parseInt(endTime.m) * 60 + parseInt(endTime.s);
    
    // Handle invalid inputs (NaN values)
    if (isNaN(startSeconds) || isNaN(endSeconds)) {
      return 0;
    }
    
    // Ensure end time does not exceed video duration
    const maxEndSeconds = videoDuration || endSeconds;
    const validEndSeconds = Math.min(endSeconds, maxEndSeconds);
    
    return Math.max(0, validEndSeconds - startSeconds);
  };

  // Get trimmed duration for display
  const trimmedDuration = calculateTrimmedDuration();

  // Check if times are valid for saving
  const isTimeValid = () => {
    const startSeconds = parseInt(startTime.h) * 3600 + parseInt(startTime.m) * 60 + parseInt(startTime.s);
    const endSeconds = parseInt(endTime.h) * 3600 + parseInt(endTime.m) * 60 + parseInt(endTime.s);
    
    // Check if times are valid numbers
    if (isNaN(startSeconds) || isNaN(endSeconds)) return false;
    
    // Check if start < end
    if (startSeconds >= endSeconds) return false;
    
    // Check if end does not exceed video duration
    if (videoDuration && endSeconds > videoDuration) return false;
    
    return true;
  };

  const canSave = isTimeValid();

  const handleSave = () => {
    const startStr = `${startTime.h}:${startTime.m}:${startTime.s}`;
    const endStr = `${endTime.h}:${endTime.m}:${endTime.s}`;
    onSave(isTrimEnabled, startStr, endStr);
    onClose();
  };

  const handleReset = () => {
    setIsTrimEnabled(false);
    setStartTime({ h: '00', m: '00', s: '00' });
    if (videoDuration && videoDuration > 0) {
      setEndTime(secondsToTime(videoDuration));
    } else {
      setEndTime({ h: '00', m: '00', s: '00' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trim Audio">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
                <ScissorsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
                <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Trim Audio
                </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <label htmlFor="trim-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            id="trim-toggle" 
                            className="sr-only peer" 
                            checked={isTrimEnabled}
                            onChange={() => setIsTrimEnabled(!isTrimEnabled)}
                        />
                        <div className="block bg-gray-600 peer-checked:bg-green-500 w-12 h-6 sm:w-14 sm:h-8 rounded-full transition-colors"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 sm:w-6 sm:h-6 rounded-full transition-transform peer-checked:translate-x-5 sm:peer-checked:translate-x-6"></div>
                    </div>
                </label>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <XIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
            </div>
        </div>

        {!isTrimEnabled ? (
          // When toggle is OFF - show only status messages
          <div className="flex items-center justify-center py-12 mb-6">
            {isFetchingDuration ? (
              <div className="flex flex-col items-center gap-3">
                <ClockIcon className="w-12 h-12 text-yellow-500 dark:text-yellow-400 animate-spin" />
                <span className="text-lg text-yellow-600 dark:text-yellow-400 font-semibold">
                  Fetching video duration...
                </span>
              </div>
            ) : videoDuration && videoDuration > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <ClockIcon className="w-12 h-12 text-green-500 dark:text-green-400" />
                <span className="text-base text-green-600 dark:text-green-400 font-medium">
                  Enable trim to get started
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ClockIcon className="w-12 h-12 text-gray-400" />
                <span className="text-base text-gray-500 dark:text-gray-400">
                  Enable trim to get started
                </span>
              </div>
            )}
          </div>
        ) : (
          // When toggle is ON - show duration badge and time inputs
          <>
            {videoDuration && videoDuration > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Video Duration: {formatDuration(videoDuration)}
                </span>
              </div>
            )}

             <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 text-gray-800 dark:text-gray-200">
              <div className="text-center">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Time</label>
                 <TimeInput value={startTime} onChange={setStartTime} disabled={false} maxDuration={videoDuration} isEndTime={false} otherTime={endTime} />
              </div>
              <span className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl">--</span>
              <div className="text-center">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">End Time</label>
                 <TimeInput value={endTime} onChange={setEndTime} disabled={false} maxDuration={videoDuration} isEndTime={true} otherTime={startTime} />
              </div>
            </div>

            {/* Trimmed Duration Display */}
            <div className={`flex items-center justify-center gap-2 mb-6 sm:mb-8 p-3 rounded-lg border ${
              trimmedDuration === 0 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                : trimmedDuration < 10 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <ClockIcon className={`w-4 h-4 ${
                trimmedDuration === 0 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : trimmedDuration < 10 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
              <span className={`text-sm font-medium ${
                trimmedDuration === 0 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : trimmedDuration < 10 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {trimmedDuration === 0 
                  ? 'Trimmed Audio Duration: 0s (Please set valid start and end times)'
                  : trimmedDuration < 10 
                  ? `Trimmed Audio Duration: ${formatDuration(trimmedDuration)} (Very short duration)`
                  : `Trimmed Audio Duration: ${formatDuration(trimmedDuration)}`
                }
              </span>
            </div>

            {/* Video Duration Warning */}
            {videoDuration && (() => {
              const endSeconds = parseInt(endTime.h) * 3600 + parseInt(endTime.m) * 60 + parseInt(endTime.s);
              const exceedsDuration = endSeconds > videoDuration;
              return exceedsDuration ? (
                <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <ClockIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    End time cannot exceed video duration ({formatDuration(videoDuration)})
                  </span>
                </div>
              ) : null;
            })()}
          </>
        )}

        <div className="flex justify-center">
            {isTrimEnabled ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                {/* Save Button - Modern Gradient Design */}
                <button 
                  onClick={handleSave}
                  disabled={!canSave}
                  className={`group relative flex-1 px-6 py-3 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm sm:text-base overflow-hidden ${
                    canSave 
                      ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95' 
                      : 'text-gray-400 bg-gray-300 dark:bg-gray-600 cursor-not-allowed shadow-sm'
                  }`}
                >
                  {canSave && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <span className="relative flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </span>
                </button>

                {/* Reset Button - Modern Outline Design */}
                <button 
                  onClick={handleReset}
                  className="group relative flex-1 px-6 py-3 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm sm:text-base overflow-hidden text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  Reset All
                  </span>
                </button>
              </div>
            ) : (
              /* Cancel Button - Modern Red Gradient Design */
              <button 
                onClick={onClose}
                className="group relative px-8 sm:px-12 py-3 sm:py-4 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 text-sm sm:text-base overflow-hidden text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 focus:ring-red-500 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                Cancel
                </span>
              </button>
            )}
        </div>
    </Modal>
  );
};

export default TrimAudioModal;