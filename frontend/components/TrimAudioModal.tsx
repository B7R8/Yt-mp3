import React, { useState } from 'react';
import Modal from './Modal';
import { ScissorsIcon } from './icons/ScissorsIcon';
import { XIcon } from './icons/XIcon';

interface TrimAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TimeInput: React.FC<{
  initialValues: { h: string; m: string; s: string };
  disabled: boolean;
}> = ({ initialValues, disabled }) => {
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    target.value = target.value.replace(/[^0-9]/g, '');
  };

  return (
    <div className="flex items-center gap-1 font-mono text-lg sm:text-2xl bg-gray-100 dark:bg-gray-700 p-1.5 sm:p-2 rounded-md">
      <input type="text" defaultValue={initialValues.h} onInput={handleInput} maxLength={2} className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" disabled={disabled} />
      <span>:</span>
      <input type="text" defaultValue={initialValues.m} onInput={handleInput} maxLength={2} className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" disabled={disabled} />
      <span>:</span>
      <input type="text" defaultValue={initialValues.s} onInput={handleInput} maxLength={2} className="w-7 sm:w-9 text-center bg-transparent focus:outline-none" disabled={disabled} />
    </div>
  );
};

const TrimAudioModal: React.FC<TrimAudioModalProps> = ({ isOpen, onClose }) => {
  const [isTrimEnabled, setIsTrimEnabled] = useState(false);

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
                        <div className="block bg-gray-600 peer-checked:bg-brand-600 w-12 h-6 sm:w-14 sm:h-8 rounded-full transition-colors"></div>
                        <div className="dot absolute left-1 top-1 bg-white w-4 h-4 sm:w-6 sm:h-6 rounded-full transition-transform peer-checked:translate-x-5 sm:peer-checked:translate-x-6"></div>
                    </div>
                </label>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <XIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
            </div>
        </div>

        <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-gray-800 dark:text-gray-200 transition-opacity ${!isTrimEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="text-center">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Time</label>
                <TimeInput initialValues={{ h: '00', m: '00', s: '00' }} disabled={!isTrimEnabled} />
            </div>
            <span className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl">--</span>
             <div className="text-center">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">End Time</label>
                <TimeInput initialValues={{ h: '00', m: '20', s: '30' }} disabled={!isTrimEnabled} />
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 transition-colors text-sm sm:text-base">
                Save
            </button>
            <button className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 transition-colors text-sm sm:text-base">
                Reset All
            </button>
        </div>
    </Modal>
  );
};

export default TrimAudioModal;