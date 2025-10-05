import React, { useState } from 'react';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';

const changelogData = [
    {
        version: 'Version 1.2.0',
        date: 'October 4, 2024',
        changes: [
            { type: 'new', description: 'Interactive Trim Audio and Select Quality modals implemented.' },
            { type: 'improvement', description: 'Redesigned FAQ, Changelog, and Contact pages for a better user experience.' },
            { type: 'improvement', description: 'Full mobile responsiveness for all screen sizes, including very small devices.' },
        ]
    },
    {
        version: 'Version 1.1.0',
        date: 'September 28, 2024',
        changes: [
            { type: 'new', description: 'Added Dark/Light mode with a theme toggle.' },
            { type: 'new', description: 'Real-time conversion progress indicator with percentage.' },
            { type: 'improvement', description: 'Enhanced error handling with more descriptive toast notifications.' }
        ]
    },
    {
        version: 'Version 1.0.0',
        date: 'September 20, 2024',
        changes: [
            { type: 'new', description: 'Initial Release of YTConv with core YouTube to MP3 conversion functionality.' },
        ]
    }
];

const ChangeItem: React.FC<{type: 'new' | 'improvement', description: string}> = ({ type, description }) => {
    const isNew = type === 'new';
    const config = {
        icon: isNew ? <PlusCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" /> : <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        bg: isNew ? 'bg-green-50 dark:bg-green-900/50' : 'bg-blue-50 dark:bg-blue-900/50',
        text: isNew ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'
    };

    return (
        <div className={`flex items-center gap-4 p-3 rounded-md ${config.bg}`}>
            {config.icon}
            <p className={`text-sm font-medium ${config.text}`}>{description}</p>
        </div>
    );
}

const ChangelogVersionItem: React.FC<{ version: typeof changelogData[0] }> = ({ version }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-5 focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700/50"
                aria-expanded={isOpen}
            >
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{version.version}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{version.date}</p>
                </div>
                <ChevronDownIcon
                    className={`w-6 h-6 transform transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden">
                    <div className="p-5 pt-2 space-y-4">
                        {version.changes.map((change, index) => (
                            <ChangeItem key={index} type={change.type as ('new' | 'improvement')} description={change.description} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Changelog: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Changelog</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Track all the latest updates and improvements to YTConv.</p>
      </div>
      <div className="space-y-4">
        {changelogData.map(version => (
          <ChangelogVersionItem key={version.version} version={version} />
        ))}
      </div>
    </div>
  );
};

export default Changelog;