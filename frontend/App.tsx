
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Converter from './components/Converter';
import Toast from './components/Toast';
import ThemeToggle from './components/ThemeToggle';
import ScrollToTop from './components/ScrollToTop';
import { ToastData } from './types';
import HowToSection from './components/HowToSection';
import FAQs from './pages/FAQs';
import Changelog from './pages/Changelog';
import Contact from './pages/Contact';
import Copyright from './pages/Copyright';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import SupportLinks from './components/SupportLinks';

export type Page = 'home' | 'faqs' | 'changelog' | 'contact' | 'copyright' | 'terms' | 'privacy';

function App() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [page, setPage] = useState<Page>('home');

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  // Prevent page refreshes from download managers
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only prevent unload if it's not a user-initiated action
      if (e.type === 'beforeunload') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handleVisibilityChange = () => {
      // Prevent automatic refreshes when page becomes visible again
      if (document.visibilityState === 'visible') {
        // Do nothing - let the page stay as is
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  const navigateTo = (p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (page) {
      case 'faqs':
        return <FAQs />;
      case 'changelog':
        return <Changelog />;
      case 'contact':
        return <Contact />;
      case 'copyright':
        return <Copyright />;
      case 'terms':
        return <Terms />;
      case 'privacy':
        return <Privacy />;
      default:
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
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800 dark:text-gray-200 overflow-x-hidden">
      <Header navigateTo={navigateTo} />
      <main className="flex-grow w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 overflow-x-hidden">
        {renderPage()}
      </main>
      <Footer navigateTo={navigateTo} />
      <ThemeToggle />
      <ScrollToTop />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
