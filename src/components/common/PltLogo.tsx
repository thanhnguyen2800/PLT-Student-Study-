import React from 'react';

interface PltLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PltLogo: React.FC<PltLogoProps> = ({ className = '', size = 'md' }) => {
  const heightStyles = {
    sm: 'h-9 sm:h-10',
    md: 'h-11 sm:h-12',
    lg: 'h-16',
  }[size];

  return (
    <div 
      className={`inline-flex items-center justify-center bg-transparent select-none transition-transform hover:scale-102 shrink-0 ${heightStyles} ${className}`}
      title="PLT Solutions"
    >
      <svg 
        viewBox="12 8 136 68" 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PLT SOLUTIONS"
      >
        {/* PLT Main Brand Typography */}
        <text 
          x="80" 
          y="50" 
          textAnchor="middle" 
          className="fill-[#2B3A8C] dark:fill-white"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
          fontWeight="900" 
          fontSize="56" 
          letterSpacing="-1.5"
        >
          PLT
        </text>
        {/* SOLUTIONS Sub-text with wide letter tracking */}
        <text 
          x="82" 
          y="71" 
          textAnchor="middle" 
          className="fill-[#2B3A8C] dark:fill-slate-200"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
          fontWeight="800" 
          fontSize="10.5" 
          letterSpacing="5.8"
        >
          SOLUTIONS
        </text>
      </svg>
    </div>
  );
};

