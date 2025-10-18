
import React from 'react';
import { CoffeeIcon } from './icons/CoffeeIcon';
import { VideoIcon } from './icons/VideoIcon';

type Page = 'home' | 'faqs' | 'changelog' | 'contact' | 'copyright' | 'terms' | 'privacy' | 'coming-soon' | 'support-us' | 'crypto-donation' | 'not-found';

interface SupportLinksProps {
  navigateTo?: (page: Page) => void;
}

const SupportLinks: React.FC<SupportLinksProps> = ({ navigateTo }) => {
  return (
    <div className="flex flex-col md:grid md:grid-cols-3 items-stretch justify-center gap-4 sm:gap-4 md:gap-4 max-w-full sm:max-w-lg md:max-w-2xl mx-auto px-4 sm:px-2 md:px-4">
      <a href="https://ko-fi.com/saveytb" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 py-4 sm:py-3.5 md:py-2.5 px-6 sm:px-5 md:px-3 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors text-center text-base sm:text-base md:text-sm">
        <CoffeeIcon className="w-6 h-6 sm:w-6 sm:h-6 md:w-4 md:h-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">Buy me a coffee</span>
      </a>
      <a href="https://paypal.me/SaveYTB" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 py-4 sm:py-3.5 md:py-2.5 px-6 sm:px-5 md:px-3 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors text-center text-base sm:text-base md:text-sm">
        <svg height="20px" viewBox="0 0 512 512" width="20px" className="w-6 h-6 sm:w-6 sm:h-6 md:w-4 md:h-4 text-gray-700 dark:text-gray-300 flex-shrink-0">
          <g>
            <path d="M250.585,271.874c68.566-0.811,120.299-28.097,142.106-91.593    c21.911-61.671,16.332-118.676-44.63-142.311c-39.457-15.316-52.441-11.563-206.923-11.563c-10.042,0-18.765,7.405-20.288,17.142    L61.412,420.778c-1.014,7.404,4.564,14.099,12.272,14.099h75.669c2.029,0,2.738-0.708,3.043-2.534    c4.158-25.664,18.259-116.447,21.808-135.922C180.089,264.774,206.563,272.586,250.585,271.874z" fill="currentColor"/>
            <path d="M423.427,150.46c-1.826-1.319-2.536-1.827-3.043,1.317c-2.029,11.565-5.173,22.823-8.927,34.083    C370.985,301.29,258.8,291.249,204.026,291.249c-6.188,0-10.245,3.348-11.057,9.534    c-22.923,142.411-27.488,172.131-27.488,172.131c-1.015,7.202,3.55,13.085,10.752,13.085h64.41c8.723,0,15.925-6.391,17.65-15.112    c0.709-5.479-1.115,6.187,14.606-92.609c4.665-22.314,14.504-19.98,29.719-19.98c72.019,0,128.211-29.214,144.948-113.91    C454.161,209.088,452.234,171.963,423.427,150.46z" fill="currentColor"/>
          </g>
        </svg>
        <span className="font-semibold text-gray-700 dark:text-gray-300">PayPal</span>
      </a>
      <a 
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigateTo?.('coming-soon');
        }}
        className="w-full flex items-center justify-center gap-3 py-4 sm:py-3.5 md:py-2.5 px-6 sm:px-5 md:px-3 bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-[#3a3a3a] transition-colors text-center text-base sm:text-base md:text-sm"
      >
        <VideoIcon className="w-6 h-6 sm:w-6 sm:h-6 md:w-4 md:h-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
        <span className="font-semibold text-gray-700 dark:text-gray-300">YouTube to MP4</span>
      </a>
    </div>
  );
};

export default SupportLinks;
