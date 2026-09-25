// FILE: student-app/src/components/ui/Skeleton.tsx

import React from "react";

export const SkeletonBlock = ({ height = 60, style = {} }: { height?: number; style?: React.CSSProperties }) => (
  <div className="skeleton" style={{ width: "100%", height, ...style }} />
);
