import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Terms of Use</h1>
      <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300">
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
          <p>By using this service (YTConv), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.</p>
        </div>
        <div className="bg-white dark:bg-gray-800/60 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-2">2. Service Usage</h2>
          <p>You agree to use this service only for lawful purposes. You are responsible for ensuring that you have the right to convert the content you are accessing. This service must not be used to download or convert copyrighted material without permission from the copyright owner.</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;