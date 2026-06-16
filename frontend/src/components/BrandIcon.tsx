import { useId } from 'react';

interface BrandIconProps {
  size?: number;
  className?: string;
}

/**
 * GRC Fortress enterprise icon — a gold fortress-shield mark on a navy
 * squircle. Three ascending columns (Governance · Risk · Compliance) rise
 * from a foundation bar inside the shield outline.
 */
export function BrandIcon({ size = 48, className }: BrandIconProps) {
  const uid = useId();
  const bgId = `gf-bg-${uid}`;
  const goldId = `gf-gold-${uid}`;
  const shieldGlowId = `gf-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GRC Fortress"
    >
      <defs>
        <linearGradient id={bgId} x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#233c67" />
          <stop offset="100%" stopColor="#1a3050" />
        </linearGradient>
        <linearGradient id={goldId} x1="24" y1="10" x2="24" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#dbb840" />
          <stop offset="100%" stopColor="#b8901c" />
        </linearGradient>
        <radialGradient id={shieldGlowId} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Squircle background */}
      <rect width="48" height="48" rx="11" fill={`url(#${bgId})`} />

      {/* Subtle inner highlight at top */}
      <rect width="48" height="22" rx="11" fill="rgba(255,255,255,0.04)" />

      {/* Shield glow fill */}
      <path
        d="M10,12 L38,12 L38,30 Q38,42 24,46 Q10,42 10,30 Z"
        fill={`url(#${shieldGlowId})`}
      />

      {/* Shield outline */}
      <path
        d="M10,12 L38,12 L38,30 Q38,42 24,46 Q10,42 10,30 Z"
        stroke={`url(#${goldId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Left column */}
      <rect
        x="13"
        y="20"
        width="5"
        height="17"
        rx="1.2"
        fill={`url(#${goldId})`}
        opacity="0.68"
      />

      {/* Center column — tallest, full opacity */}
      <rect
        x="21.5"
        y="15"
        width="5"
        height="22"
        rx="1.2"
        fill={`url(#${goldId})`}
      />

      {/* Right column */}
      <rect
        x="30"
        y="20"
        width="5"
        height="17"
        rx="1.2"
        fill={`url(#${goldId})`}
        opacity="0.68"
      />

      {/* Foundation bar */}
      <rect
        x="13"
        y="37.5"
        width="22"
        height="1.8"
        rx="0.9"
        fill={`url(#${goldId})`}
        opacity="0.9"
      />
    </svg>
  );
}
