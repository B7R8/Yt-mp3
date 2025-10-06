import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
       <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">SaveYTB privacy policy - how we protect your data while using our YouTube to MP3 converter.</p>
      </div>
      <div className="space-y-8 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/60 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Data Collection</h2>
          <p>SaveYTB does not collect, store, or share any personal information from our users. The YouTube URLs you enter are processed in real-time and are never stored on our servers. Your privacy is paramount when using our YouTube to MP3 converter.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Logging</h2>
          <p>We maintain anonymous logs of conversion activity for the sole purpose of service maintenance and statistical analysis. These logs do not contain any personally identifiable information, such as IP addresses or specific URLs from our YouTube to MP3 converter service.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Cookies</h2>
          <p>SaveYTB uses a single cookie (`localStorage`) for the sole purpose of remembering your theme (dark/light mode) preference and quality settings. We do not use any tracking or third-party cookies in our YouTube to MP3 converter.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Ad-Free Experience</h2>
          <p>SaveYTB is completely ad-free with no tracking, pop-ups, or third-party scripts. Our YouTube to MP3 converter prioritizes your privacy and provides a clean, fast conversion experience without any intrusive advertisements.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;