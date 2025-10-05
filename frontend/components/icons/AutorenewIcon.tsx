import React from 'react';

interface AutorenewIconProps {
  className?: string;
}

const AutorenewIcon: React.FC<AutorenewIconProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
      className={className} 
      focusable="false" 
      aria-hidden="true" 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6m6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26"></path>
    </svg>
  );
};

export default AutorenewIcon;
