import React, { useState } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';
import { Page } from '../App';

interface HeaderProps {
  navigateTo: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleNavigate = (page: Page) => {
    navigateTo(page);
    setIsMenuOpen(false);
  }

  return (
    <header className="w-full p-2.5 sm:p-3 md:p-4 bg-gradient-to-b from-gray-100 to-gray-200/50 dark:bg-gradient-to-b dark:from-[#151A1D] dark:to-[#0f1214] backdrop-blur-sm sticky top-0 z-20 border-b border-gray-300 dark:border-gray-800">
      <div className="container mx-auto flex justify-between items-center max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl px-2 sm:px-4">
        <button onClick={() => handleNavigate('home')} className="flex items-center gap-2 sm:gap-3" aria-label="Go to homepage">
          <LogoIcon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
            YTConv
          </span>
        </button>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-base font-medium text-gray-600 dark:text-gray-300">
          <button onClick={() => handleNavigate('faqs')} className="hover:text-brand-500 transition-colors">FAQs</button>
          <button onClick={() => handleNavigate('changelog')} className="hover:text-brand-500 transition-colors">Changelog</button>
          <button onClick={() => handleNavigate('contact')} className="hover:text-brand-500 transition-colors">Contact</button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(true)} 
            aria-label="Open menu"
            className="p-2 sm:p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <MenuIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>


        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div 
            className="fixed top-14 right-2 sm:right-4 z-30 w-48 bg-white dark:bg-[#2d3748] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 md:hidden overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col">
              <button 
                onClick={() => handleNavigate('home')} 
                className="text-left px-6 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-base font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavigate('faqs')} 
                className="text-left px-6 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-base font-medium"
              >
                FAQs
              </button>
              <button 
                onClick={() => handleNavigate('changelog')} 
                className="text-left px-6 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-base font-medium"
              >
                Changelog
              </button>
              <button 
                onClick={() => handleNavigate('contact')} 
                className="text-left px-6 py-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-base font-medium"
              >
                Contact
              </button>
            </nav>
          </div>
        )}
        
        {/* Backdrop overlay when menu is open */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 z-20 md:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;