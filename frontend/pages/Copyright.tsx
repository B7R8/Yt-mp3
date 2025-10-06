import React from 'react';

const Copyright: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Copyright Information</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">SaveYTB copyright information and intellectual property rights for our YouTube to MP3 converter service.</p>
      </div>
      <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/60 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <p>All content, branding, code, and other intellectual property on this website are the property of SaveYTB, &copy; {currentYear}. All rights are reserved.</p>
        <p className="mt-4">SaveYTB YouTube to MP3 converter is intended for personal use only. It should only be used to convert and download content for which you have obtained the legal right to do so, such as your own creations or public domain materials. We do not endorse or condone the conversion of copyrighted materials without the explicit permission of the copyright holder.</p>
        <p className="mt-4">Users are solely responsible for the content they choose to convert and download using our free YouTube to MP3 converter service. SaveYTB acts only as a technical service provider for YouTube to MP3 conversion.</p>
        <p className="mt-4">SaveYTB is completely free and ad-free, supported by user donations to maintain our YouTube to MP3 converter service without intrusive advertisements or pop-ups.</p>
      </div>
    </div>
  );
};

export default Copyright;