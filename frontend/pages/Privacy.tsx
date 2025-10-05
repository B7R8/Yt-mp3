import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
       <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Privacy Policy</h1>
      </div>
      <div className="space-y-8 text-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/60 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Data Collection</h2>
          <p>We do not collect, store, or share any personal information from our users. The YouTube URLs you enter are processed in real-time and are never stored on our servers. Your privacy is paramount.</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Logging</h2>
          <p>We maintain anonymous logs of conversion activity for the sole purpose of service maintenance and statistical analysis. These logs do not contain any personally identifiable information, such as IP addresses or specific URLs.</p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Cookies</h2>
          <p>We use a single cookie (`localStorage`) for the sole purpose of remembering your theme (dark/light mode) preference. We do not use any tracking or third-party cookies.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;