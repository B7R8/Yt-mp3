import React, { useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Header from './components/Header';
import Footer from './components/Footer';
import Converter from './components/Converter';
import Toast from './components/Toast';
import ThemeToggle from './components/ThemeToggle';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from './context/ThemeContext';
import { ToastData } from './types';
import HowToSection from './components/HowToSection';
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
import SupportLinks from './components/SupportLinks';
import { queryClient } from './utils/queryClient';

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
    // Scroll to top immediately when navigating
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Ensure scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [page]);

  // Scroll to top when component mounts (handles browser back/forward)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home navigateTo={navigateTo} showToast={showToast} />;
      case 'faqs':
        return <FAQs navigateTo={navigateTo} />;
      case 'changelog':
        return <Changelog navigateTo={navigateTo} />;
      case 'contact':
        return <Contact navigateTo={navigateTo} showToast={showToast} />;
      case 'copyright':
        return <Copyright navigateTo={navigateTo} />;
      case 'terms':
        return <Terms navigateTo={navigateTo} />;
      case 'privacy':
        return <Privacy navigateTo={navigateTo} />;
      case 'coming-soon':
        return <ComingSoon navigateTo={navigateTo} />;
      case 'support-us':
        return <SupportUs navigateTo={navigateTo} />;
      case 'crypto-donation':
        return <CryptoDonation navigateTo={navigateTo} />;
      default:
        return <Home navigateTo={navigateTo} showToast={showToast} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
          <Header navigateTo={navigateTo} />
          <main className="flex-1">
            {renderPage()}
          </main>
          <Footer navigateTo={navigateTo} />
          <SupportLinks />
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
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
