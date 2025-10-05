import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const toastConfig = {
  success: {
    bg: 'bg-green-500',
    icon: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z',
  },
  error: {
    bg: 'bg-red-500',
    icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
  },
  info: {
    bg: 'bg-blue-500',
    icon: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      // Allow time for fade out animation before calling onClose
      setTimeout(onClose, 300);
    }, 4700);

    return () => clearTimeout(timer);
  }, [onClose]);

  const config = toastConfig[type];

  const baseClasses = 'fixed z-50 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 text-white rounded-xl shadow-2xl max-w-xs sm:max-w-sm transition-all duration-500 ease-out backdrop-blur-sm';
  const positionClasses = 'top-20 sm:top-24 left-1/2 -translate-x-1/2';
  const animationClasses = visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-95';

  return (
    <div
      role="alert"
      className={`${baseClasses} ${positionClasses} ${config.bg} ${animationClasses}`}
    >
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d={config.icon} clipRule="evenodd" />
        </svg>
      </div>
      <span className="flex-1 text-sm sm:text-base font-medium leading-tight">{message}</span>
      <button 
        onClick={onClose} 
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;