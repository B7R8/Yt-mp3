import React from 'react';
import HeartIcon from '../components/icons/HeartIcon';
import { Page } from '../App';

interface SupportUsProps {
  navigateTo: (page: Page) => void;
}

const SupportUs: React.FC<SupportUsProps> = ({ navigateTo }) => {
  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full mb-6">
          <HeartIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
          Support Our Mission
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Help us keep this free service running and continuously improving for millions of users worldwide.
        </p>
      </div>

      {/* Thank You Message */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-lg">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <HeartIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Thank You to Our Amazing Community!</h3>
        </div>
        <p className="text-center text-blue-700 dark:text-blue-300 leading-relaxed">
          A heartfelt thank you to all the incredible people who support SaveYTB! Your encouragement, feedback, and support help us keep this free service running and continuously improving. You make this project possible and inspire us every day! 💙
        </p>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column - Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Why Support us?</h2>
            <div className="space-y-4 flex-grow">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Keep the service completely free for everyone</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Improve server performance and reliability</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Add new features and enhancements</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Support ongoing development and maintenance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Donation Options */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Choose Your Support Method</h2>
            
            <div className="space-y-4 flex-grow">
              {/* Buy Me a Coffee */}
              <a 
                href="https://ko-fi.com/saveytb" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-between w-full p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 text-orange-700 dark:text-orange-300 font-medium rounded-lg hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30 transition-all duration-200 border border-orange-200 dark:border-orange-700/30"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                  <span className="text-lg">Buy Me a Coffee</span>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* PayPal */}
              <a 
                href="https://paypal.me/SaveYTB" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 font-medium rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 border border-blue-200 dark:border-blue-700/30"
              >
                <div className="flex items-center gap-3">
                  <svg height="24px" viewBox="0 0 512 512" width="24px" className="w-6 h-6">
                    <g>
                      <path d="M250.585,271.874c68.566-0.811,120.299-28.097,142.106-91.593    c21.911-61.671,16.332-118.676-44.63-142.311c-39.457-15.316-52.441-11.563-206.923-11.563c-10.042,0-18.765,7.405-20.288,17.142    L61.412,420.778c-1.014,7.404,4.564,14.099,12.272,14.099h75.669c2.029,0,2.738-0.708,3.043-2.534    c4.158-25.664,18.259-116.447,21.808-135.922C180.089,264.774,206.563,272.586,250.585,271.874z" fill="#002D8A"/>
                      <path d="M423.427,150.46c-1.826-1.319-2.536-1.827-3.043,1.317c-2.029,11.565-5.173,22.823-8.927,34.083    C370.985,301.29,258.8,291.249,204.026,291.249c-6.188,0-10.245,3.348-11.057,9.534    c-22.923,142.411-27.488,172.131-27.488,172.131c-1.015,7.202,3.55,13.085,10.752,13.085h64.41c8.723,0,15.925-6.391,17.65-15.112    c0.709-5.479-1.115,6.187,14.606-92.609c4.665-22.314,14.504-19.98,29.719-19.98c72.019,0,128.211-29.214,144.948-113.91    C454.161,209.088,452.234,171.963,423.427,150.46z" fill="#019BE1"/>
                    </g>
                  </svg>
                  <span className="text-lg">PayPal Donation</span>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Crypto */}
              <button 
                onClick={() => navigateTo?.('crypto-donation')}
                className="group flex items-center justify-between w-full p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-700 dark:text-yellow-300 font-medium rounded-lg hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30 transition-all duration-200 border border-yellow-200 dark:border-yellow-700/30"
              >
                <div className="flex items-center gap-3">
                  <svg enableBackground="new 0 0 226.777 226.777" height="24px" viewBox="0 0 226.777 226.777" width="24px" className="w-6 h-6">
                    <g>
                      <path d="M135.715,122.244c-2.614-1.31-8.437-3.074-15.368-3.533c-6.934-0.458-15.828,0-15.828,0v30.02c0,0,9.287,0.198,15.503-0.26   c6.21-0.458,12.621-2.027,15.826-3.795c3.203-1.766,7.063-4.513,7.063-11.379C142.911,126.428,138.332,123.552,135.715,122.244z" fill="currentColor"/>
                      <path d="M116.16,104.779c5.104-0.197,10.532-1.373,14.453-3.532c3.925-2.158,6.148-5.557,6.02-10.66   c-0.134-5.102-3.532-9.418-9.287-11.186c-5.757-1.766-9.613-1.897-13.998-1.962c-4.382-0.064-8.83,0.328-8.83,0.328v27.012   C104.519,104.779,111.059,104.976,116.16,104.779z" fill="currentColor"/>
                      <path d="M113.413,0C50.777,0,0,50.776,0,113.413c0,62.636,50.777,113.413,113.413,113.413s113.411-50.777,113.411-113.413   C226.824,50.776,176.049,0,113.413,0z M159.591,156.777c-8.44,5.887-17.465,6.935-21.455,7.456   c-1.969,0.259-5.342,0.532-8.959,0.744v22.738h-13.998v-22.37c-2.615,0-6.361,0-10.66,0v22.37H90.522v-22.37   c-13.852,0-27.535,0-27.535,0l2.877-16.812c0,0,5.559,0,8.371,0c2.814,0,3.989-0.261,5.166-1.372   c1.177-1.113,1.439-2.812,1.439-4.188c0-1.373,0-54.286,0-57.916c0-3.628-0.295-4.61-1.963-6.473   c-1.668-1.867-5.591-2.112-7.8-2.112c-2.207,0-8.091,0-8.091,0V61.939c0,0,13.246,0,27.535,0V39.505h13.996v22.434   c3.889,0,7.537,0,10.66,0V39.505h13.998v22.703c10.435,0.647,18.203,2.635,24.983,7.645c8.766,6.475,8.306,17.724,8.11,20.406   c-0.195,2.682-1.372,7.85-3.729,11.183c-2.352,3.337-8.108,6.673-8.108,6.673s6.801,1.438,11.578,5.036   c4.771,3.598,8.307,9.941,8.106,19.229C169.923,141.668,168.027,150.891,159.591,156.777z" fill="currentColor"/>
                    </g>
                  </svg>
                  <span className="text-lg">Cryptocurrency</span>
                </div>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border border-green-200/50 dark:border-green-800/50 rounded-2xl p-8 shadow-lg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-4">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-green-800 dark:text-green-200">Love Our Service?</h3>
          <p className="text-green-700 dark:text-green-300 mb-6 max-w-2xl mx-auto">
            Help others discover SaveYTB by leaving us a review on Trustpilot. Your feedback means the world to us!
          </p>
          <a 
            href="https://www.trustpilot.com/review/saveytb.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 font-medium rounded-lg transition-all duration-200 border border-green-200 dark:border-green-700/30"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Leave a Review on Trustpilot
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupportUs;
