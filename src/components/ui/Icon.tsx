// FILE: student-app/src/components/ui/Icon.tsx

import React from "react";

const PATHS: Record<string, string> = {
  menu: "M3 6h18M3 12h18M3 18h18",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  attendance: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  fee: "M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 000-8",
  result: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  profile: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  sun: "M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
  moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  chevronRight: "M9 18l6-6-6-6",
  check: "M20 6L9 17l-5-5",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  card: "M2 10h20M6 15h2M2 6h20v12H2z",
  bank: "M3 21h18M4 10h16M4 10L12 3l8 7M6 10v11M10 10v11M14 10v11M18 10v11",
  upi: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  trend: "M3 17l6-6 4 4 8-8M21 7h-6M21 7v6",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z",
  spark: "M12 3l1.9 5.6L19.5 10 13.9 12.4 12 18 10.1 12.4 4.5 10l5.6-1.4L12 3z",
  receipt: "M7 3h10a1 1 0 011 1v17l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 011-1z",
  eyeOff: "M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a19.87 19.87 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a19.86 19.86 0 01-3.18 4.31M1 1l22 22M14.12 14.12a3 3 0 11-4.24-4.24",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  x: "M18 6L6 18M6 6l12 12",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
};

export const Icon = ({ name, size = 20, color = "currentColor", strokeWidth = 2 }: {
  name: keyof typeof PATHS; size?: number; color?: string; strokeWidth?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[name] || ""} />
  </svg>
);
