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
      <section id="hero" className="text-center mb-12 sm:mb-10 md:mb-10 lg:mb-12 px-6 sm:px-6 md:px-6">
        <h1 className="text-4xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          YouTube to MP3
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-sm md:text-sm text-gray-600 dark:text-gray-300 mb-10 px-4 leading-relaxed">
          ⭐ Free YouTube to MP3 converter - Download high-quality MP3 audio instantly. Convert YouTube to MP3, YT to MP3 without registration.
        </p>
        <Converter showToast={showToast} />
      </section>
      
      <section className="mb-12">
        <SupportLinks navigateTo={navigateTo} />
      </section>
      
      <section className="mb-8 sm:mb-10 md:mb-10 px-4 sm:px-6 md:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-3 sm:gap-4 md:gap-4">
          <p className="text-sm sm:text-base md:text-base font-semibold text-gray-800 dark:text-gray-200 leading-tight">Got questions? Join our subreddit!</p>
          <a href="https://reddit.com/r/saveytb" target="_blank" rel="noopener noreferrer" className="bg-gray-800 text-white font-bold py-2 sm:py-3 md:py-2.5 px-4 sm:px-6 md:px-5 rounded-full hover:bg-gray-900 transition-colors duration-300 shrink-0 text-sm sm:text-base md:text-base" aria-label="Join SaveYTB Reddit community r/SaveYTB" title="Join SaveYTB Reddit community r/SaveYTB">
            r/SaveYTB
          </a>
        </div>
      </section>
      
      <div className="my-10 sm:my-14 md:my-14 flex items-center justify-center px-4 sm:px-6">
        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-4 w-full max-w-full sm:max-w-md">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-6 mb-6 sm:mb-8 md:mb-8 px-4 sm:px-6">
        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-green-400/70 via-green-500/40 to-emerald-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="text-base md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Secure</h2>
          <p className="text-sm md:text-sm text-gray-600 dark:text-gray-400">Safe & Private</p>
        </div>

        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-blue-400/70 via-sky-500/40 to-indigo-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-indigo-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h3.02c.264-3.312 3.002-6 6.455-6 3.453 0 6.191 2.688 6.455 6h3.02c-.264-5.557-4.854-10-10.475-10zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="text-base md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Fast</h2>
          <p className="text-sm md:text-sm text-gray-600 dark:text-gray-400">Quick Processing</p>
        </div>

        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-fuchsia-400/70 via-purple-500/40 to-violet-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-fuchsia-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="text-base md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Free</h2>
          <p className="text-sm md:text-sm text-gray-600 dark:text-gray-400">No Cost</p>
        </div>

        <div className="text-center group">
          <div className="relative w-16 h-16 mx-auto mb-2 rounded-2xl p-[1px] bg-gradient-to-br from-rose-400/70 via-red-500/40 to-orange-500/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]">
            <div className="w-full h-full rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-rose-600/30 shadow-md flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
            </div>
          </div>
          <h2 className="text-base md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Quality</h2>
          <p className="text-sm md:text-sm text-gray-600 dark:text-gray-400">High Audio</p>
        </div>
      </div>


      <HowToSection navigateTo={navigateTo} />
      
      {/* SEO Content Section */}
      <section className="pt-6 sm:pt-8 md:pt-8 pb-10 sm:pb-14 md:pb-14 text-gray-700 dark:text-gray-300">
        <div className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto space-y-6 px-4 sm:px-6 md:px-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Why Choose Our YouTube to MP3 Converter?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Best YouTube to MP3 Downloader</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our YouTube to MP3 converter is the fastest and most reliable way to convert YouTube videos to MP3 format. 
                  Download YouTube MP3 files instantly with our advanced YouTube to MP3 downloader. Perfect for YouTube video to MP3 conversion.
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Convert YouTube to MP3 Free</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Convert YouTube to MP3 completely free with no hidden costs. Our YT to MP3 converter supports 
                  all YouTube videos including YouTube Shorts and long-form content. Best free YouTube to MP3 converter available.
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">YouTube Video to MP3</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Transform any YouTube video to MP3 with high-quality audio extraction. Our YouTube MP3 downloader 
                  preserves audio quality while reducing file size for easy storage. Download YouTube MP3 files instantly.
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">YT MP3 Converter</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  The best YT MP3 converter for all your audio needs. Download YT MP3 files quickly and securely 
                  with our user-friendly YouTube to MP3 converter interface. Convert YouTube to MP3 with ease.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms of Use Section */}
      <section className="py-6 text-center">
        <div className="max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 md:px-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By using SaveYTB, you agree to our <button onClick={() => navigateTo('terms')} className="text-red-600 dark:text-red-400 hover:underline">terms of use</button>.
          </p>
        </div>
      </section>
    </>
  );
};

export default Home;
