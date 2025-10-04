
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-5 right-5 bg-gray-800 dark:bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center text-white dark:text-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red dark:focus:ring-offset-dark-bg"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};

export default ThemeToggle;
