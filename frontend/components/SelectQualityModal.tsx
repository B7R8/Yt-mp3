
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Quality } from '../types';
import { MusicNoteIcon } from './icons/MusicNoteIcon';
import { XIcon } from './icons/XIcon';

interface SelectQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuality: Quality;
  onSave: (quality: Quality) => void;
}

const qualities: Quality[] = ['64K', '128K', '192K', '256K', '320K'];

const SelectQualityModal: React.FC<SelectQualityModalProps> = ({ isOpen, onClose, currentQuality, onSave }) => {
    const [selectedQuality, setSelectedQuality] = useState<Quality>(currentQuality);
    const [alwaysUse, setAlwaysUse] = useState<boolean>(false);

    // Check if there's a saved preference when modal opens
    useEffect(() => {
        if (isOpen) {
            const savedQuality = localStorage.getItem('preferredQuality');
            if (savedQuality && ['64K', '128K', '192K', '256K', '320K'].includes(savedQuality)) {
                setAlwaysUse(true);
            } else {
                setAlwaysUse(false);
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        onSave(selectedQuality);
        
        // Save to localStorage if "Always use this quality" is checked
        if (alwaysUse) {
            localStorage.setItem('preferredQuality', selectedQuality);
        } else {
            // Remove from localStorage if unchecked
            localStorage.removeItem('preferredQuality');
        }
        
        onClose();
    }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Quality">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
                <MusicNoteIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 dark:text-gray-200" />
                <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Select Quality
                </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <XIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
        </div>
        
        <div className="mb-4 sm:mb-6">
            <div className="flex flex-wrap sm:flex-nowrap border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                {qualities.map((q) => (
                    <button 
                        key={q}
                        onClick={() => setSelectedQuality(q)}
                        className={`flex-1 min-w-0 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-colors focus:outline-none ${
                            selectedQuality === q 
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center mb-6 sm:mb-8">
            <input 
                id="always-use" 
                type="checkbox" 
                checked={alwaysUse}
                onChange={(e) => setAlwaysUse(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" 
            />
            <label htmlFor="always-use" className="ml-2 block text-xs sm:text-sm text-gray-800 dark:text-gray-300">
                Always use this quality
            </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button onClick={handleSave} className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 transition-colors text-sm sm:text-base">
                Save
            </button>
            <button className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 transition-colors text-sm sm:text-base">
                Reset All
            </button>
        </div>
    </Modal>
  );
};

export default SelectQualityModal;
