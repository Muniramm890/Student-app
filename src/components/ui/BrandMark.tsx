// FILE: student-app/src/components/ui/BrandMark.tsx
import React from "react";

export const BrandMark = ({ size = 78 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ display: "inline-block" }}>
    <defs>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E2E52" />
        <stop offset="100%" stopColor="#0F1A33" />
      </linearGradient>
      <linearGradient id="ribbonGrad" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#FFB25B" />
        <stop offset="100%" stopColor="#E8600A" />
      </linearGradient>
      <filter id="softLift" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F1A33" floodOpacity="0.28" />
      </filter>
    </defs>
    <rect x="4" y="4" width="192" height="192" rx="46" fill="url(#badgeGrad)" />
    <rect x="4.5" y="4.5" width="191" height="191" rx="45.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    <path
      d="M62,66 C100,44 152,52 146,82 C141,108 96,96 88,116 C81,134 116,140 150,132"
      fill="none" stroke="url(#ribbonGrad)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"
      filter="url(#softLift)"
    />
    <circle cx="150" cy="132" r="13" fill="#FFD98A" />
    <circle cx="150" cy="132" r="13" fill="none" stroke="#0F1A33" strokeWidth="2" opacity="0.15" />
  </svg>
);
