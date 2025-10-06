import React from 'react';
import Converter from '../components/Converter';
import HowToSection from '../components/HowToSection';
import SupportLinks from '../components/SupportLinks';
import { Page } from '../App';

interface HomeProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  navigateTo: (page: Page) => void;
}

const Home: React.FC<HomeProps> = ({ showToast, navigateTo }) => {
  return (
    <>
      <section id="hero" className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-16 px-2 sm:px-3 md:px-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-3 md:mb-4 leading-tight">
          YouTube to MP3 Converter
        </h1>
        <p className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-2 leading-relaxed">
          Quickly and easily convert YouTube videos to high-quality MP3 audio files. Paste a link below to get started.
        </p>
        <Converter showToast={showToast} />
      </section>
      
      <section className="mb-12">
        <SupportLinks />
      </section>
      
      <section className="mb-6 sm:mb-8 md:mb-12 px-2 sm:px-3 md:px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-2 sm:gap-3 md:gap-4">
          <p className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-200 leading-tight">Got questions? Join our subreddit!</p>
          <a href="#" className="bg-orange-500 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 md:px-5 rounded-full hover:bg-orange-600 transition-colors duration-300 shrink-0 text-xs sm:text-sm md:text-base">
            r/YTConv
          </a>
        </div>
      </section>
      
      <div className="my-8 sm:my-12 md:my-16 flex items-center justify-center px-3 sm:px-4">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 w-full max-w-full sm:max-w-md">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <div className="w-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full"></div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
        </div>
      </div>

      <HowToSection navigateTo={navigateTo} />
    </>
  );
};

export default Home;
