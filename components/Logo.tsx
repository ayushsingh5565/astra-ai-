import React from 'react';

interface LogoProps {
  className?: string;
  isHackerMode?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", isHackerMode = false }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} overflow-visible`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="saffronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9933" />
          <stop offset="100%" stopColor="#FF7700" />
        </linearGradient>
        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#00A0FF" />
        </linearGradient>
        <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF0000" />
          <stop offset="100%" stopColor="#500000" />
        </linearGradient>
      </defs>

      {/* Outer Hexagonal Shield Ring */}
      <path 
        d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 L50 5Z" 
        stroke={isHackerMode ? "url(#redGradient)" : "url(#blueGradient)"} 
        strokeWidth="1.5" 
        strokeDasharray="10 4 2 4"
        className="animate-spin-slow origin-center opacity-50"
        filter="url(#glow)"
      />
      
      {/* Inner Rotating Ring */}
       <circle cx="50" cy="50" r="35" 
        stroke={isHackerMode ? "#FF0000" : "#00F0FF"} 
        strokeWidth="0.5" 
        strokeDasharray="20 20"
        opacity="0.3"
       >
         <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="20s" repeatCount="indefinite" />
       </circle>

      {/* Central Element: The Cyber-Trishul */}
      <g filter="url(#glow)">
        {/* Center Spike */}
        <path 
          d="M50 20 L50 80" 
          stroke={isHackerMode ? "#FF0000" : "url(#saffronGradient)"} 
          strokeWidth="4" 
          strokeLinecap="round" 
        />
        <path 
          d="M50 20 L40 35 M50 20 L60 35" 
          stroke={isHackerMode ? "#FF0000" : "url(#saffronGradient)"} 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />

        {/* Left Prong */}
        <path 
          d="M30 40 Q30 25 45 35" 
          stroke={isHackerMode ? "#FF0000" : "url(#saffronGradient)"} 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        
        {/* Right Prong */}
        <path 
          d="M70 40 Q70 25 55 35" 
          stroke={isHackerMode ? "#FF0000" : "url(#saffronGradient)"} 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        
        {/* Base Connection */}
        <path 
           d="M30 40 L30 55 Q30 70 50 70 Q70 70 70 55 L70 40"
           stroke={isHackerMode ? "#FF0000" : "url(#saffronGradient)"}
           strokeWidth="2.5"
           strokeLinecap="round"
           fill="none"
        />
      </g>
      
      {/* Tech Accents */}
      <rect x="48" y="82" width="4" height="4" fill={isHackerMode ? "#FF0000" : "#00F0FF"} />
      <circle cx="50" cy="50" r="2" fill={isHackerMode ? "#000" : "#FFF"} />

    </svg>
  );
};