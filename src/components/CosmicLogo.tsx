import React from 'react';

interface CosmicLogoProps {
  className?: string;
  size?: number;
}

export const CosmicLogo: React.FC<CosmicLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial gradient for central sun/star core */}
          <radialGradient id="starCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </radialGradient>

          {/* Star Corona Glow */}
          <radialGradient id="starCorona" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>

          {/* Orbit Track Gradient 1 */}
          <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.7" />
          </linearGradient>

          {/* Orbit Track Gradient 2 */}
          <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Ambient Star Flare / Halo */}
        <circle cx="50" cy="50" r="36" fill="url(#starCorona)" className="animate-pulse" />

        {/* Outer Orbit Ring 1 (Rotates smoothly) */}
        <g className="animate-spin-slow origin-center">
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="18"
            stroke="url(#orbitGrad1)"
            strokeWidth="1.8"
            strokeDasharray="4 2"
            transform="rotate(-25 50 50)"
          />
          {/* Orbiting Planet / Celestial Particle on Ring 1 */}
          <g transform="rotate(-25 50 50)">
            <circle cx="92" cy="50" r="3.5" fill="#10B981" className="shadow-sm" />
            <circle cx="92" cy="50" r="1.5" fill="#FFFFFF" />
          </g>
        </g>

        {/* Inner Orbit Ring 2 (Counter-rotates) */}
        <g className="animate-spin-reverse origin-center">
          <ellipse
            cx="50"
            cy="50"
            rx="34"
            ry="14"
            stroke="url(#orbitGrad2)"
            strokeWidth="1.5"
            transform="rotate(45 50 50)"
          />
          {/* Orbiting Planet on Ring 2 */}
          <g transform="rotate(45 50 50)">
            <circle cx="16" cy="50" r="2.8" fill="#F59E0B" />
            <circle cx="16" cy="50" r="1" fill="#FFFFFF" />
          </g>
        </g>

        {/* Central Glowing Star Core (恒星) */}
        <g className="origin-center">
          {/* Star Core Rays */}
          <path
            d="M 50 22 L 53 45 L 78 50 L 53 55 L 50 78 L 47 55 L 22 50 L 47 45 Z"
            fill="#FEF08A"
            opacity="0.5"
            className="animate-pulse"
          />
          {/* Star Core Sphere */}
          <circle cx="50" cy="50" r="14" fill="url(#starCore)" />
          <circle cx="46" cy="46" r="4" fill="#FFFFFF" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
};
