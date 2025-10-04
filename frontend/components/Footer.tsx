
import React from 'react';
import { Link } from 'react-router-dom';

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 dark:bg-dark-surface border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-dark-text-secondary">
        <p>&copy; {new Date().getFullYear()} AudioFlow. All rights reserved.</p>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <Link to="/terms" onClick={scrollToTop} className="hover:text-gray-800 dark:hover:text-white transition-colors">Terms of Use</Link>
          <Link to="/privacy" onClick={scrollToTop} className="hover:text-gray-800 dark:hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/contact" onClick={scrollToTop} className="hover:text-gray-800 dark:hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
