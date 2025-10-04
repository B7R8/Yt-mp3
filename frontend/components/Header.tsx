
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

const Logo: React.FC = () => (
  <Link to="/" onClick={scrollToTop} className="flex items-center space-x-2">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-red">
      <path d="M6.75 12V3.75C6.75 3.55109 6.82902 3.36032 6.96967 3.21967C7.11032 3.07902 7.30109 3 7.5 3H16.5C16.6989 3 16.8897 3.07902 17.0303 3.21967C17.171 3.36032 17.25 3.55109 17.25 3.75V12M6.75 12L3 16.5M6.75 12H17.25M17.25 12L21 16.5M3 16.5V20.25C3 20.4489 3.07902 20.6397 3.21967 20.7803C3.36032 20.921 3.55109 21 3.75 21H20.25C20.4489 21 20.6397 20.921 20.7803 20.7803C20.921 20.6397 21 20.4489 21 20.25V16.5M3 16.5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="text-2xl font-bold text-gray-900 dark:text-white">AudioFlow</span>
  </Link>
);


const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <Logo />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/faq" onClick={scrollToTop} className="text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors">FAQs</Link>
          <Link to="/changelog" onClick={scrollToTop} className="text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors">Changelog</Link>
          <Link to="/contact" onClick={scrollToTop} className="text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
          <a 
            href="https://www.aiploma.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Blog
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-md text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-bg">
          <nav className="px-4 py-4 space-y-3">
            <Link 
              to="/faq" 
              className="block py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToTop();
              }}
            >
              FAQs
            </Link>
            <Link 
              to="/changelog" 
              className="block py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToTop();
              }}
            >
              Changelog
            </Link>
            <Link 
              to="/contact" 
              className="block py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => {
                setIsMobileMenuOpen(false);
                scrollToTop();
              }}
            >
              Contact
            </Link>
            <a 
              href="https://www.aiploma.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block py-2 text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
