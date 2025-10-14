
import React, { memo } from 'react';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = 'w-6 h-6', size }) => {
  // Determine size based on prop or className
  const getSizeClasses = () => {
    if (size === 'small') return 'w-4 h-4';
    if (size === 'large') return 'w-8 h-8';
    return className; // Use className if no size prop
  };

  const sizeClasses = getSizeClasses();
  
  return (
    <div className={`relative ${sizeClasses}`}>
      <span className="loader"></span>
      <style jsx>{`
        .loader {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: inline-block;
          border-top: 2px solid #000000; /* Black for light mode */
          border-right: 2px solid transparent;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        
        @media (prefers-color-scheme: dark) {
          .loader {
            border-top: 2px solid #FFFFFF; /* White for dark mode */
            border-right: 2px solid transparent;
          }
        }
        
        .dark .loader {
          border-top: 2px solid #FFFFFF; /* White for dark mode */
          border-right: 2px solid transparent;
        }

        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default memo(LoadingSpinner);