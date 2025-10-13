import React from 'react';

interface NotFoundProps {
  navigateTo?: (page: string) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const NotFound: React.FC<NotFoundProps> = ({ navigateTo, showToast }) => {
  const handleGoHome = () => {
    if (navigateTo) {
      navigateTo('home');
    } else {
      window.location.href = '/';
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get('search') as string;
    
    if (searchTerm.trim()) {
      // Add search logic here
      showToast && showToast(`Searching for: ${searchTerm}`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-100 dark:bg-gray-700 rounded-full mb-6">
            <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">404</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Sorry, we couldn't find the page you're looking for
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The page may have been moved or deleted
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              name="search"
              placeholder="Search the site..."
              className="w-full px-4 py-3 pl-12 pr-4 text-gray-700 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-blue-600 hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            🏠 Go to Homepage
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigateTo && navigateTo('faqs')}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              ❓ Help
            </button>
            
            <button
              onClick={() => navigateTo && navigateTo('contact')}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              📞 Contact Us
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Quick Links:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { key: 'home', label: 'Home', icon: '🏠' },
              { key: 'faqs', label: 'FAQs', icon: '❓' },
              { key: 'changelog', label: 'Updates', icon: '📝' },
              { key: 'support-us', label: 'Support', icon: '💝' }
            ].map((link) => (
              <button
                key={link.key}
                onClick={() => navigateTo && navigateTo(link.key as any)}
                className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition duration-200"
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Helpful Tip */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> Make sure you typed the URL correctly or use the search to find what you're looking for
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
