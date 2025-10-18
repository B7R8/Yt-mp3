import React from 'react';
import { Page } from '../App';

interface NotFoundProps {
  navigateTo?: (page: Page) => void;
}

const NotFound: React.FC<NotFoundProps> = ({ navigateTo }) => {
  const handleGoHome = () => {
    if (navigateTo) {
      navigateTo('home');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Number */}
        <h1 className="text-6xl font-bold text-gray-400 dark:text-gray-500 mb-4">404</h1>

        {/* Error Message */}
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
          Page Not Found
        </h2>

        {/* Modern Button */}
        <button
          onClick={handleGoHome}
          className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
