import React from 'react';
import Converter from '../components/Converter';
import HowTo from '../components/HowTo';

const Home: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 py-6 md:py-12">
      <Converter />

      <section className="text-center my-8 md:my-12">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          {/* These buttons are for UI demonstration purposes */}
          <button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg text-sm sm:text-base inline-flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a.5.5 0 01.5.5v1.517a4.5 4.5 0 013.98 4.026A4.5 4.5 0 0110 18.5a4.5 4.5 0 01-4.48-4.957A4.5 4.5 0 019.5 5.517V4a.5.5 0 01.5-.5zM12.5 10a2.5 2.5 0 10-5 0 2.5 2.5 0 005 0z" /><path d="M10 1a1 1 0 00-1 1v.054a7.502 7.502 0 00-4.11 2.223A.5.5 0 005 4.646l.1.173a.5.5 0 00.758.12L6 4.88A6.503 6.503 0 0110 3c1.75 0 3.36.69 4.54 1.88l.142.159a.5.5 0 00.758-.12l.1-.173a.5.5 0 00-.131-.723A7.502 7.502 0 0011 2.054V2a1 1 0 00-1-1z" /></svg>
            <span>Buy me a coffee</span>
          </button>
          <button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg text-sm sm:text-base inline-flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 5.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 5.293z" clipRule="evenodd" /></svg>
            <span>Donate via crypto</span>
          </button>
          <button className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg text-sm sm:text-base inline-flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>
            <span>YouTube to MP4</span>
          </button>
        </div>
      </section>
      
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent my-8 md:my-16"></div>

      <HowTo />
    </main>
  );
};

export default Home;
