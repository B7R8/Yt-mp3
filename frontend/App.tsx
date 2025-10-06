
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Converter from './components/Converter';
import Toast from './components/Toast';
import ThemeToggle from './components/ThemeToggle';
import ScrollToTop from './components/ScrollToTop';
import { ToastData } from './types';
import HowToSection from './components/HowToSection';
import Home from './pages/Home';
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

  // Handle page visibility changes to prevent unwanted refreshes
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Prevent automatic refreshes when page becomes visible again
      if (document.visibilityState === 'visible') {
        // Do nothing - let the page stay as is
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  const navigateTo = (p: Page) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home showToast={showToast} navigateTo={navigateTo} />;
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
        return <Home showToast={showToast} navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800 dark:text-gray-200 overflow-x-hidden">
      <Header navigateTo={navigateTo} />
      <main className="flex-grow w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 lg:py-6 overflow-x-hidden">
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
