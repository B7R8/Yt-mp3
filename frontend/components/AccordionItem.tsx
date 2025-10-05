import React, { useState } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface AccordionItemProps {
  question: string;
  answer: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left p-5 font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{question}</span>
        <ChevronDownIcon
          className={`w-6 h-6 transform transition-transform duration-300 ${
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
          <p className="p-5 pt-0 text-gray-600 dark:text-gray-300">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccordionItem;