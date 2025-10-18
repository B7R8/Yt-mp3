import { useEffect } from 'react';

type Page = 'home' | 'faqs' | 'changelog' | 'contact' | 'copyright' | 'terms' | 'privacy' | 'coming-soon' | 'support-us' | 'crypto-donation' | 'not-found';

interface UseURLRoutingProps {
  setPage: (page: Page) => void;
}

export const useURLRouting = ({ setPage }: UseURLRoutingProps) => {
  useEffect(() => {
    // Handle URL changes
    const handleURLChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      
      // Map URLs to pages
      const urlToPageMap: Record<string, Page> = {
        '/': 'home',
        '/home': 'home',
        '/faqs': 'faqs',
        '/faq': 'faqs',
        '/help': 'faqs',
        '/changelog': 'changelog',
        '/updates': 'changelog',
        '/contact': 'contact',
        '/copyright': 'copyright',
        '/terms': 'terms',
        '/privacy': 'privacy',
        '/coming-soon': 'coming-soon',
        '/support': 'support-us',
        '/support-us': 'support-us',
        '/donate': 'crypto-donation',
        '/crypto-donation': 'crypto-donation',
        '/404': 'not-found',
        '/not-found': 'not-found',
      };

      // Check hash-based routing
      if (hash) {
        const hashPage = hash.substring(1); // Remove #
        if (urlToPageMap[`/${hashPage}`]) {
          setPage(urlToPageMap[`/${hashPage}`]);
          return;
        }
      }

      // Check path-based routing
      if (urlToPageMap[path]) {
        setPage(urlToPageMap[path]);
      } else {
        // Check for partial matches
        const pathSegments = path.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          const firstSegment = `/${pathSegments[0]}`;
          if (urlToPageMap[firstSegment]) {
            setPage(urlToPageMap[firstSegment]);
          } else {
            // Unknown path - show 404
            setPage('not-found');
          }
        } else {
          // Root path
          setPage('home');
        }
      }
    };

    // Initial load
    handleURLChange();

    // Listen for URL changes
    window.addEventListener('popstate', handleURLChange);
    window.addEventListener('hashchange', handleURLChange);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleURLChange);
      window.removeEventListener('hashchange', handleURLChange);
    };
  }, [setPage]);
};

// Helper function to update URL without page reload
export const updateURL = (page: Page) => {
  const pageToUrlMap: Record<string, string> = {
    'home': '/',
    'faqs': '/faqs',
    'changelog': '/changelog',
    'contact': '/contact',
    'copyright': '/copyright',
    'terms': '/terms',
    'privacy': '/privacy',
    'coming-soon': '/coming-soon',
    'support-us': '/support',
    'crypto-donation': '/donate',
    'not-found': '/404',
  };

  const url = pageToUrlMap[page] || '/';
  
  // Update URL without page reload
  if (window.history.pushState) {
    window.history.pushState(null, '', url);
  }
  
  // Update page title
  const titles: Record<string, string> = {
    'home': 'YouTube to MP3 Converter - SaveYTB',
    'faqs': 'Frequently Asked Questions - SaveYTB',
    'changelog': 'Changelog - SaveYTB',
    'contact': 'Contact Us - SaveYTB',
    'copyright': 'Copyright - SaveYTB',
    'terms': 'Terms of Service - SaveYTB',
    'privacy': 'Privacy Policy - SaveYTB',
    'coming-soon': 'Coming Soon - SaveYTB',
    'support-us': 'Support Us - SaveYTB',
    'crypto-donation': 'Crypto Donation - SaveYTB',
    'not-found': '404 - Page Not Found - SaveYTB',
  };

  document.title = titles[page] || 'SaveYTB';
};
