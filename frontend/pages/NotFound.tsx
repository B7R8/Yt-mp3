import React from 'react';

interface NotFoundProps {
  navigateTo?: (page: string) => void;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-blue-600 dark:text-blue-400 mb-4 animate-pulse">
            404
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            Oops! The page you're looking for doesn't exist
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Sorry, the page you're looking for doesn't exist or has been moved
          </p>
        </div>

        {/* Search Box */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for something else..."
              className="w-full px-4 py-3 pl-12 pr-4 text-gray-700 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            🏠 Go Back to Homepage
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => navigateTo && navigateTo('faqs')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              ❓ FAQs
            </button>
            
            <button
              onClick={() => navigateTo && navigateTo('contact')}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              📞 Contact Us
            </button>
          </div>
        </div>

        {/* Popular Links */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Useful Links:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => navigateTo && navigateTo('home')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              MP3 Converter
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigateTo && navigateTo('faqs')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Help
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigateTo && navigateTo('changelog')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Updates
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigateTo && navigateTo('support-us')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Support Us
            </button>
          </div>
        </div>

        {/* Fun Fact */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Did you know?</strong> You can convert any YouTube video to MP3 in just seconds!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
