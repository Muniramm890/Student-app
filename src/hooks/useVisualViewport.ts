// Phone par keyboard khulne par visible area (visualViewport) ka size deta hai, taaki full-screen chat composer keyboard ke upar rahe.
import { useEffect, useState } from "react";

export type VisualViewportBox = { top: number; height: number; keyboardOpen: boolean };

export const useVisualViewport = (enabled: boolean): VisualViewportBox | null => {
  const [box, setBox] = useState<VisualViewportBox | null>(null);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!enabled || !vv) { setBox(null); return; }
    const update = () => setBox({
      top: Math.round(vv.offsetTop),
      height: Math.round(vv.height),
      keyboardOpen: window.innerHeight - vv.height > 120,
    });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, [enabled]);
  return box;
};
