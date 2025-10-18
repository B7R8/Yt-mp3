
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ThemeToggle from './components/ThemeToggle';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from './context/ThemeContext';
import { ToastData } from './types';
import LoadingSpinner from './components/LoadingSpinner';
import { useURLRouting, updateURL } from './hooks/useURLRouting';

// Direct imports to fix loading issues
import Home from './pages/Home';
import FAQs from './pages/FAQs';
import Changelog from './pages/Changelog';
import Contact from './pages/Contact';
import Copyright from './pages/Copyright';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ComingSoon from './pages/ComingSoon';
import SupportUs from './pages/SupportUs';
import CryptoDonation from './pages/CryptoDonation';
import NotFound from './components/NotFound';

export type Page = 'home' | 'faqs' | 'changelog' | 'contact' | 'copyright' | 'terms' | 'privacy' | 'coming-soon' | 'support-us' | 'crypto-donation' | 'not-found';

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
    updateURL(p);
    // Scroll to top immediately when navigating
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Handle URL routing
  useURLRouting({ setPage });

  // Ensure scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [page]);

  // Scroll to top when component mounts (handles browser back/forward)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const renderPage = () => {
    const PageComponent = (() => {
      switch (page) {
        case 'home':
          return Home;
        case 'faqs':
          return FAQs;
        case 'changelog':
          return Changelog;
        case 'contact':
          return Contact;
        case 'copyright':
          return Copyright;
        case 'terms':
          return Terms;
        case 'privacy':
          return Privacy;
        case 'coming-soon':
          return ComingSoon;
        case 'support-us':
          return SupportUs;
        case 'crypto-donation':
          return CryptoDonation;
        case 'not-found':
          return NotFound;
        default:
          return NotFound;
      }
    })();

    return (
      <PageComponent 
        showToast={showToast} 
        navigateTo={navigateTo} 
      />
    );
  };

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen font-sans text-gray-800 dark:text-gray-200 overflow-x-hidden">
        <Header navigateTo={navigateTo} />
        <main className="flex-grow w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 md:px-6 py-4 sm:py-6 md:py-6 lg:py-8 overflow-x-hidden">
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
    </ThemeProvider>
  );
}

export default App;
