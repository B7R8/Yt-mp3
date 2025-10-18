import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isLight } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      {isLight ? (
        <MoonIcon className="w-6 h-6" />
      ) : (
        <SunIcon className="w-6 h-6" />
      )}
    </button>
  );
};

export default ThemeToggle;