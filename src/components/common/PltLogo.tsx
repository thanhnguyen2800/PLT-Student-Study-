import React from 'react';

interface PltLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PltLogo: React.FC<PltLogoProps> = ({ className = '', size = 'md' }) => {
  const heightStyles = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-14',
  }[size];

  return (
    <div 
      className={`inline-flex items-center justify-center bg-transparent select-none transition-transform hover:scale-102 shrink-0 ${heightStyles} ${className}`}
      title="PLT Solutions"
    >
      <svg 
        viewBox="0 0 160 80" 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        aria-label="PLT SOLUTIONS"
      >
        {/* PLT Main Brand Typography */}
        <text 
          x="80" 
          y="52" 
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
          y="73" 
          textAnchor="middle" 
          className="fill-[#2B3A8C] dark:fill-slate-200"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
          fontWeight="800" 
          fontSize="10" 
          letterSpacing="5.8"
        >
          SOLUTIONS
        </text>
      </svg>
    </div>
  );
};

