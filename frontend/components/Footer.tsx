import React from 'react';
import { Page } from '../App';

interface FooterProps {
  navigateTo: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ navigateTo }) => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full p-4 sm:p-6 md:p-8 text-sm relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
      <div className="container mx-auto max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl text-gray-500 dark:text-gray-400 px-2 sm:px-4">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">SaveYTB</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Free YouTube to MP3 converter. Download high-quality MP3 audio from YouTube videos instantly.
            </p>
            <div className="flex justify-center md:justify-start gap-3">
              <a href="https://x.com/saveytb" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-gray-800 hover:bg-gray-900 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://discord.gg/saveytb" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a href="https://t.me/saveytb" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a href="https://reddit.com/r/saveytb" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.5 1.25a.749.749 0 1 0 0 1.498.749.749 0 0 0 0-1.498zm5.5 0a.749.749 0 1 0 0 1.498.749.749 0 0 0 0-1.498z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Links</h4>
            <div className="space-y-2">
              <button onClick={() => navigateTo('faqs')} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">FAQs</button>
              <button onClick={() => navigateTo('contact')} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">Contact</button>
              <button onClick={() => navigateTo('changelog')} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">Changelog</button>
              <button onClick={() => navigateTo('support-us')} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">Support Us</button>
            </div>
          </div>

          {/* Legal Links */}
          <div className="text-center md:text-left">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Legal</h4>
            <div className="space-y-2">
              <button onClick={() => navigateTo('terms')} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">Terms of Use</button>
              <button onClick={() => navigateTo('privacy')} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">Privacy Policy</button>
              <button onClick={() => navigateTo('copyright')} className="block text-xs text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">Copyright</button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {currentYear} SaveYTB. All Rights Reserved. Free YouTube to MP3 converter.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;