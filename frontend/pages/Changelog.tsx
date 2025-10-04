import React from 'react';

const Changelog: React.FC = () => {
  const changelog = [
    {
      version: "1.2.0",
      date: "2024-10-04",
      changes: [
        {
          type: "feature",
          title: "Video Title Display",
          description: "Added automatic video title extraction and display after conversion"
        },
        {
          type: "feature",
          title: "Enhanced UI",
          description: "Improved success screen with prominent video title display and better button styling"
        },
        {
          type: "improvement",
          title: "Better Error Handling",
          description: "Enhanced error messages and fallback handling for video title extraction"
        }
      ]
    },
    {
      version: "1.1.0",
      date: "2024-09-28",
      changes: [
        {
          type: "feature",
          title: "Audio Trimming",
          description: "Added ability to trim audio with start and end time selection"
        },
        {
          type: "feature",
          title: "Multiple Quality Options",
          description: "Added support for 64k, 128k, 192k, 256k, and 320k audio quality options"
        },
        {
          type: "improvement",
          title: "Real-time Progress",
          description: "Added real-time conversion status updates and progress indicators"
        }
      ]
    },
    {
      version: "1.0.0",
      date: "2024-09-20",
      changes: [
        {
          type: "feature",
          title: "Initial Release",
          description: "Launched AudioFlow with basic YouTube to MP3 conversion functionality"
        },
        {
          type: "feature",
          title: "Dark/Light Theme",
          description: "Added support for both dark and light themes with automatic system detection"
        },
        {
          type: "feature",
          title: "Rate Limiting",
          description: "Implemented rate limiting to prevent abuse and ensure fair usage"
        },
        {
          type: "feature",
          title: "File Cleanup",
          description: "Automatic cleanup of converted files after 1 hour for privacy and storage management"
        }
      ]
    }
  ];

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'improvement':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'bugfix':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'improvement':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'bugfix':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Changelog
        </h1>
        <p className="text-lg text-gray-600 dark:text-dark-text-secondary">
          Track all the latest updates and improvements to AudioFlow
        </p>
      </div>

      <div className="space-y-8">
        {changelog.map((release, index) => (
          <div key={index} className="bg-white dark:bg-dark-card rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-dark-surface px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Version {release.version}
                </h2>
                <span className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {new Date(release.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {release.changes.map((change, changeIndex) => (
                  <div key={changeIndex} className={`border-l-4 ${getChangeColor(change.type)} pl-4 py-3 rounded-r-lg`}>
                    <div className="flex items-start space-x-3">
                      {getChangeIcon(change.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {change.title}
                        </h3>
                        <p className="text-gray-600 dark:text-dark-text-secondary">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <div className="bg-gray-50 dark:bg-dark-surface rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Stay Updated
          </h3>
          <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
            Follow our blog for the latest news and updates
          </p>
          <a 
            href="https://www.aiploma.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-brand-red text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
          >
            Visit Our Blog
          </a>
        </div>
      </div>
    </div>
  );
};

export default Changelog;
