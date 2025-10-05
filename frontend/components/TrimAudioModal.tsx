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
}> = ({ value, onChange, disabled }) => {
  const handleInput = (field: 'h' | 'm' | 's', val: string) => {
    const numVal = val.replace(/[^0-9]/g, '').slice(0, 2);
    const paddedVal = numVal.padStart(2, '0');
    onChange({ ...value, [field]: paddedVal });
  };

  return (
    <div className="flex items-center gap-1 font-mono text-lg sm:text-2xl bg-gray-100 dark:bg-gray-700 p-1.5 sm:p-2 rounded-md">
      <input 
        type="text" 
        value={value.h} 
        onChange={(e) => handleInput('h', e.target.value)}
        maxLength={2} 
        className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" 
        disabled={disabled} 
      />
      <span>:</span>
      <input 
        type="text" 
        value={value.m} 
        onChange={(e) => handleInput('m', e.target.value)}
        maxLength={2} 
        className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" 
        disabled={disabled} 
      />
      <span>:</span>
      <input 
        type="text" 
        value={value.s} 
        onChange={(e) => handleInput('s', e.target.value)}
        maxLength={2} 
        className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" 
        disabled={disabled} 
      />
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-gray-800 dark:text-gray-200">
              <div className="text-center">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Time</label>
                <TimeInput value={startTime} onChange={setStartTime} disabled={false} />
              </div>
              <span className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl">--</span>
              <div className="text-center">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">End Time</label>
                <TimeInput value={endTime} onChange={setEndTime} disabled={false} />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-center">
            {isTrimEnabled ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                <button 
                  onClick={handleSave}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 transition-colors text-sm sm:text-base"
                >
                  Save
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 transition-colors text-sm sm:text-base"
                >
                  Reset All
                </button>
              </div>
            ) : (
              <button 
                onClick={onClose}
                className="px-8 sm:px-12 py-2.5 sm:py-3 font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors text-sm sm:text-base shadow-lg"
              >
                Cancel
              </button>
            )}
        </div>
    </Modal>
  );
};

export default TrimAudioModal;