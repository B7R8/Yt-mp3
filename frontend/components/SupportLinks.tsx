
import React from 'react';
import { CoffeeIcon } from './icons/CoffeeIcon';
import { BitcoinIcon } from './icons/BitcoinIcon';
import { VideoIcon } from './icons/VideoIcon';

const SupportLinks: React.FC = () => {
  return (
    <div className="flex flex-col md:grid md:grid-cols-3 items-stretch justify-center gap-2 sm:gap-3 md:gap-4 max-w-full sm:max-w-lg md:max-w-2xl mx-auto px-0 sm:px-2 md:px-4">
      <a href="#" className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-4 bg-white dark:bg-[#2d3748] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors text-center text-xs sm:text-sm">
        <CoffeeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">Buy me a coffee</span>
      </a>
      <a href="#" className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-4 bg-white dark:bg-[#2d3748] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors text-center text-xs sm:text-sm">
        <BitcoinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">Donate via crypto</span>
      </a>
      <a href="#" className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-4 bg-white dark:bg-[#2d3748] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors text-center text-xs sm:text-sm">
        <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">YouTube to MP4</span>
      </a>
    </div>
  );
};

export default SupportLinks;
