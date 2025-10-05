import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      fill="url(#logoGradient)"
      d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,14.5l-4-2.5v-4l4,2.5l4-2.5v4L12,14.5z"
    />
  </svg>
);