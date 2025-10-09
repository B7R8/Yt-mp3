import React from 'react';

interface SupportUsProps {
  navigateTo?: (page: string) => void;
}

const SupportUs: React.FC<SupportUsProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
          Support Our Project ❤️
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Help us keep this free service running for everyone.
        </p>
      </div>

      {/* Thank You Message */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Thank You to Our Supporters!</h3>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          A heartfelt thank you to all the amazing people who support SaveYTB! Your encouragement, feedback, and support help us keep this free service running and continuously improving. You make this project possible! 💙
        </p>
      </div>

      <div className="space-y-6">
        {/* Intro */}
        <div className="bg-white dark:bg-gray-800/60 p-4 rounded-lg shadow-sm">
          <p className="text-gray-700 dark:text-gray-300 text-center text-sm">
            Our service is completely free and supported by people like you. If you enjoy using it and want to help keep it online, you can support us using one of the options below.
          </p>
        </div>

        {/* Donation Options */}
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-sm">
          <div className="space-y-4">
            {/* Buy Me a Coffee */}
            <a 
              href="https://buymeacoffee.com/saveytb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 text-center"
            >
              Buy me a coffee
            </a>

            {/* PayPal */}
            <a 
              href="https://paypal.me/saveytb" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-center"
            >
              Donate with PayPal
            </a>

            {/* Crypto */}
            <button 
              onClick={() => navigateTo?.('crypto-donation')}
              className="block w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-center"
            >
              Donate via Crypto
            </button>
          </div>
        </div>

        {/* Trustpilot */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300 text-center text-sm">
            If you wanna say thanks, please take a moment and leave us a review on{' '}
            <a 
              href="https://www.trustpilot.com/review/saveytb.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors duration-200"
            >
              Trustpilot
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportUs;
