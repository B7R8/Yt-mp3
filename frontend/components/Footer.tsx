import React from 'react';
import { Page } from '../App';

interface FooterProps {
  navigateTo: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full p-3 sm:p-4 md:p-6 text-xs sm:text-sm border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4 max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl text-gray-500 dark:text-gray-400 px-2 sm:px-4">
        <p>
          &copy; {currentYear} YTConv. All Rights Reserved.
        </p>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
           <button onClick={() => navigateTo('copyright')} className="hover:text-brand-500 transition-colors text-xs sm:text-sm">Copyright</button>
           <button onClick={() => navigateTo('terms')} className="hover:text-brand-500 transition-colors text-xs sm:text-sm">Terms</button>
           <button onClick={() => navigateTo('privacy')} className="hover:text-brand-500 transition-colors text-xs sm:text-sm">Privacy</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;