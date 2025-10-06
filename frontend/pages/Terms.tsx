import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Terms of Use</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">SaveYTB terms and conditions for using our YouTube to MP3 converter service.</p>
      </div>
      <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>By using SaveYTB (our YouTube to MP3 converter service), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our free YouTube to MP3 converter service.</p>
        </div>
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">2. Service Usage</h2>
          <p>You agree to use SaveYTB only for lawful purposes. You are responsible for ensuring that you have the right to convert the content you are accessing. Our YouTube to MP3 converter must not be used to download or convert copyrighted material without permission from the copyright owner.</p>
        </div>
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">3. Free and Ad-Free Service</h2>
          <p>SaveYTB is completely free to use with no hidden fees. Our YouTube to MP3 converter is ad-free with no annoying pop-ups or third-party scripts. We maintain this service through user donations to keep it free and clean for everyone.</p>
        </div>
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">4. Features and Functionality</h2>
          <p>SaveYTB offers advanced features including auto-download, audio trimming, quality selection (64kbps to 320kbps), and quality preference saving. All features are provided free of charge as part of our YouTube to MP3 converter service.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;