import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ComputerIcon } from './icons/ComputerIcon';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCurrentIcon = () => {
    if (theme === Theme.SYSTEM) {
      return <ComputerIcon className="w-6 h-6" />;
    }
    return theme === Theme.LIGHT ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />;
  };

  const getCurrentLabel = () => {
    if (theme === Theme.SYSTEM) {
      return `System (${systemTheme})`;
    }
    return theme === Theme.LIGHT ? 'Light' : 'Dark';
  };

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-20" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 sm:p-3 rounded-full bg-gray-200 dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#3a3a3a] shadow-lg hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center justify-center"
        aria-label="Theme selector"
        aria-expanded={isOpen}
      >
        {getCurrentIcon()}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-[#2d2d2d] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Theme
          </div>
          
          <button
            onClick={() => handleThemeSelect(Theme.LIGHT)}
            className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors ${
              theme === Theme.LIGHT ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <SunIcon className="w-4 h-4" />
            <span>Light</span>
          </button>
          
          <button
            onClick={() => handleThemeSelect(Theme.DARK)}
            className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors ${
              theme === Theme.DARK ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <MoonIcon className="w-4 h-4" />
            <span>Dark</span>
          </button>
          
          <button
            onClick={() => handleThemeSelect(Theme.SYSTEM)}
            className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors ${
              theme === Theme.SYSTEM ? 'text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <ComputerIcon className="w-4 h-4" />
            <span>System ({systemTheme})</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;