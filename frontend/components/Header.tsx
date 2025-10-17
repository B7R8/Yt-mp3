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
    <header className="header">
      <div className="header-content">
        <button onClick={() => handleNavigate('home')} className="logo-btn" aria-label="Go to homepage">
          <img 
            src={isDarkMode ? "/logo-dm.webp" : "/logo.webp"} 
            alt="YouTube to MP3 Converter Logo - SaveYTB" 
            className="logo-img" 
          />
        </button>
        
        {/* Desktop Nav */}
        <nav className="nav nav-desktop">
          <button onClick={() => handleNavigate('faqs')} className="nav-link">FAQs</button>
          <button onClick={() => handleNavigate('changelog')} className="nav-link">Changelog</button>
          <button onClick={() => handleNavigate('contact')} className="nav-link">Contact</button>
          <button onClick={() => handleNavigate('support-us')} className="nav-link">Support Us</button>
        </nav>

        {/* Mobile Menu Button */}
        <div className="mobile-menu-btn">
          <button 
            onClick={() => setIsMenuOpen(true)} 
            aria-label="Open menu"
            className="menu-toggle-btn"
          >
            <MenuIcon className="menu-icon" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="mobile-nav">
              <button 
                onClick={() => handleNavigate('home')} 
                className="mobile-nav-link"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavigate('faqs')} 
                className="mobile-nav-link"
              >
                FAQs
              </button>
              <button 
                onClick={() => handleNavigate('changelog')} 
                className="mobile-nav-link"
              >
                Changelog
              </button>
              <button 
                onClick={() => handleNavigate('contact')} 
                className="mobile-nav-link"
              >
                Contact
              </button>
              <button 
                onClick={() => handleNavigate('support-us')} 
                className="mobile-nav-link"
              >
                Support Us
              </button>
            </nav>
          </div>
        )}
        
        {/* Backdrop overlay when menu is open */}
        {isMenuOpen && (
          <div 
            className="mobile-menu-backdrop" 
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;