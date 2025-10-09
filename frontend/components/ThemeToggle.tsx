import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Theme } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 p-2.5 sm:p-3 rounded-full bg-gray-200 dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-[#3a3a3a] shadow-lg hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6">
         <SunIcon
            className={`absolute transition-all duration-300 transform ${
              theme === Theme.LIGHT ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
            }`}
          />
         <MoonIcon
            className={`absolute transition-all duration-300 transform ${
              theme === Theme.DARK ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
            }`}
          />
      </div>
    </button>
  );
};

export default ThemeToggle;