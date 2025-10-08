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
    if (page === 'home') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }
  }

  return (
    <header className="w-full p-1.5 sm:p-2 md:p-2.5 bg-gradient-to-b from-gray-100 to-gray-200/50 dark:bg-gradient-to-b dark:from-[#151A1D] dark:to-[#0f1214] backdrop-blur-sm sticky top-0 z-20 border-b border-gray-300 dark:border-gray-800">
      <div className="container mx-auto flex justify-between items-center max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl px-2 sm:px-4">
        <button onClick={() => handleNavigate('home')} className="flex items-center" aria-label="Go to homepage">
          <img src="/logo.png" alt="YouTube to MP3 Converter Logo - SaveYTB" className="h-8 sm:h-10 md:h-12 w-auto" />
        </button>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
          <button onClick={() => handleNavigate('faqs')} className="hover:text-red-500 transition-colors">FAQs</button>
          <button onClick={() => handleNavigate('changelog')} className="hover:text-red-500 transition-colors">Changelog</button>
          <button onClick={() => handleNavigate('contact')} className="hover:text-red-500 transition-colors">Contact</button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(true)} 
            aria-label="Open menu"
            className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>


        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div 
            className="fixed top-12 right-2 sm:right-4 z-30 w-40 bg-white dark:bg-[#2d3748] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 md:hidden overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col">
              <button 
                onClick={() => handleNavigate('home')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavigate('faqs')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                FAQs
              </button>
              <button 
                onClick={() => handleNavigate('changelog')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Changelog
              </button>
              <button 
                onClick={() => handleNavigate('contact')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
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