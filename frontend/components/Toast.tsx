import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const toastConfig = {
  success: {
    bg: 'bg-green-500',
    icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
  },
  error: {
    bg: 'bg-red-500',
    icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.293 7.293a1 1 0 011.414 0L10 8.586l.293-.293a1 1 0 111.414 1.414L11.414 10l.293.293a1 1 0 01-1.414 1.414L10 11.414l-.293.293a1 1 0 01-1.414-1.414L8.586 10 8.293 9.707a1 1 0 010-1.414z',
  },
  info: {
    bg: 'bg-blue-500',
    icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 6a1 1 0 100 2 1 1 0 000-2z',
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

  const baseClasses = 'fixed z-50 flex items-center p-4 text-white rounded-lg shadow-lg max-w-sm transition-all duration-300 ease-in-out';
  const positionClasses = 'top-5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:top-20 sm:right-5';
  const animationClasses = visible ? 'translate-y-0 opacity-100 sm:translate-x-0' : '-translate-y-full opacity-0 sm:-translate-y-0 sm:translate-x-full';

  return (
    <div
      role="alert"
      className={`${baseClasses} ${positionClasses} ${config.bg} ${animationClasses}`}
    >
      <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d={config.icon} clipRule="evenodd" />
      </svg>
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 -mr-2 p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;