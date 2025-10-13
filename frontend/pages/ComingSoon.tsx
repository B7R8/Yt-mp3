import React from 'react';
import { Page } from '../App';

interface ComingSoonProps {
  navigateTo: (page: Page) => void;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ navigateTo }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto text-center px-6">
        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto flex items-center justify-center">
              <img src="/Favicon.webp" alt="SaveYTB" className="w-16 h-16" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            YouTube to MP4
          </h1>
          
          {/* Subtitle */}
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
            Coming Soon
          </h2>

          {/* Description */}
          <p className="text-base text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            We're working hard to bring you the best YouTube to MP4 conversion experience. 
            Stay tuned for this exciting new feature!
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">High Quality</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Convert to various video qualities</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Fast Conversion</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Quick and efficient processing</p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Secure & Private</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">No data collection, files auto-deleted</p>
            </div>
          </div>

          {/* Back Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => navigateTo('home')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to MP3 Converter
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Currently available: <span className="font-semibold text-blue-600 dark:text-blue-400">YouTube to MP3</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

