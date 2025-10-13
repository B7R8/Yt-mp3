import React, { useState, useEffect, useRef } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';
import { Page } from '../App';

interface HeaderProps {
  navigateTo: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ navigateTo }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handleNavigate = (page: Page) => {
    navigateTo(page);
    setIsMenuOpen(false);
    if (page === 'home') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    }
  }

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    // Check initial state
    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="w-full p-3 sm:p-2 md:p-2.5 bg-gradient-to-b from-gray-100 to-gray-200/50 dark:bg-gradient-to-b dark:from-[#2d2d2d] dark:to-[#1f1f1f] sticky top-0 z-20 border-b border-gray-300 dark:border-gray-600">
      <div className="container mx-auto flex justify-between items-center max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl px-2 sm:px-4">
        <button onClick={() => handleNavigate('home')} className="flex items-center" aria-label="Go to homepage">
          <img 
            src={isDarkMode ? "/logo-dm.png" : "/logo.png"} 
            alt="YouTube to MP3 Converter Logo - SaveYTB" 
            className="h-10 sm:h-10 md:h-12 w-auto transition-opacity duration-200" 
          />
        </button>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
          <button onClick={() => handleNavigate('faqs')} className="hover:text-red-500 transition-colors">FAQs</button>
          <button onClick={() => handleNavigate('changelog')} className="hover:text-red-500 transition-colors">Changelog</button>
          <button onClick={() => handleNavigate('contact')} className="hover:text-red-500 transition-colors">Contact</button>
          <button onClick={() => handleNavigate('support-us')} className="hover:text-red-500 transition-colors">Support Us</button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(true)} 
            aria-label="Open menu"
            className="p-2 sm:p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <MenuIcon className="w-6 h-6 sm:w-6 sm:h-6" />
          </button>
        </div>


        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="fixed top-12 right-2 sm:right-4 z-30 w-40 bg-white dark:bg-[#2d2d2d] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 md:hidden overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col">
              <button 
                onClick={() => handleNavigate('home')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-150 text-sm font-medium hover:translate-x-1"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavigate('faqs')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-150 text-sm font-medium hover:translate-x-1"
              >
                FAQs
              </button>
              <button 
                onClick={() => handleNavigate('changelog')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-150 text-sm font-medium hover:translate-x-1"
              >
                Changelog
              </button>
              <button 
                onClick={() => handleNavigate('contact')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-150 text-sm font-medium hover:translate-x-1"
              >
                Contact
              </button>
              <button 
                onClick={() => handleNavigate('support-us')} 
                className="text-left px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-150 text-sm font-medium hover:translate-x-1"
              >
                Support Us
              </button>
            </nav>
          </div>
        )}
        
        {/* Backdrop overlay when menu is open */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 z-10 md:hidden bg-black bg-opacity-20 animate-in fade-in duration-200" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;