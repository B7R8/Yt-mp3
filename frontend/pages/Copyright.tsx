import React from 'react';

const Copyright: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Copyright Information</h1>
      </div>
      <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/60 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <p>All content, branding, code, and other intellectual property on this website are the property of YTConv, &copy; {currentYear}. All rights are reserved.</p>
        <p className="mt-4">This service is intended for personal use only. It should only be used to convert and download content for which you have obtained the legal right to do so, such as your own creations or public domain materials. We do not endorse or condone the conversion of copyrighted materials without the explicit permission of the copyright holder.</p>
        <p className="mt-4">Users are solely responsible for the content they choose to convert and download using our service. YTConv acts only as a technical service provider.</p>
      </div>
    </div>
  );
};

export default Copyright;