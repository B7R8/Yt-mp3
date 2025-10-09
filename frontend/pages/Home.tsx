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
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
          YouTube to MP3
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-6 px-2 leading-relaxed">
          Free YouTube to MP3 converter - Download high-quality MP3 audio from YouTube videos instantly. Convert YouTube to MP3, YouTube video to MP3, YT to MP3 with our fast and reliable YouTube to MP3 downloader. No registration required.
        </p>
        <Converter showToast={showToast} />
      </section>
      
      <section className="mb-12">
        <SupportLinks navigateTo={navigateTo} />
      </section>
      
      <section className="mb-6 sm:mb-8 md:mb-12 px-2 sm:px-3 md:px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-2 sm:gap-3 md:gap-4">
          <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">Got questions? Join our subreddit!</p>
          <a href="https://reddit.com/r/saveytb" target="_blank" rel="noopener noreferrer" className="bg-orange-500 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-full hover:bg-orange-600 transition-colors duration-300 shrink-0 text-xs sm:text-sm">
            r/SaveYTB
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

      {/* Feature Icons - Creative Glass Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-3 sm:mb-5 md:mb-7 px-4">
        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-green-400/70 via-green-500/40 to-emerald-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              </div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Secure</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Safe & Private</p>
        </div>

        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-blue-400/70 via-sky-500/40 to-indigo-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-indigo-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h3.02c.264-3.312 3.002-6 6.455-6 3.453 0 6.191 2.688 6.455 6h3.02c-.264-5.557-4.854-10-10.475-10zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z"/></svg>
              </div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Fast</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Quick Processing</p>
        </div>

        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-fuchsia-400/70 via-purple-500/40 to-violet-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-fuchsia-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Free</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">No Cost</p>
        </div>

        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-rose-400/70 via-red-500/40 to-orange-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-rose-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Quality</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">High Audio</p>
        </div>
      </div>


      <HowToSection navigateTo={navigateTo} />
    </>
  );
};

export default Home;
