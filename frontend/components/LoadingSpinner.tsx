
import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <div className={`relative ${className}`}>
      <span className="loader"></span>
      <style jsx>{`
        .loader {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: inline-block;
          border-top: 3px solid #000000; /* Black for light mode */
          border-right: 3px solid transparent;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        
        @media (prefers-color-scheme: dark) {
          .loader {
            border-top: 3px solid #FFFFFF; /* White for dark mode */
            border-right: 3px solid transparent;
          }
        }
        
        .dark .loader {
          border-top: 3px solid #FFFFFF; /* White for dark mode */
          border-right: 3px solid transparent;
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

export default LoadingSpinner;