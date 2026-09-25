// FILE: student-app/src/components/ui/Modal.tsx

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
};

// Bottom-sheet on narrow viewports (thumb-friendly), centered dialog on desktop.
export const Modal = ({ open, onClose, title, children, maxWidth = 420 }: Props) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "var(--overlay)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "fadeUp 0.2s var(--ease)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="enter"
        style={{
          width: "100%", maxWidth,
          background: "var(--bg-elevated)",
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          border: "1px solid var(--border)",
          borderBottom: "none",
          padding: "10px 20px calc(24px + var(--sab))",
          maxHeight: "86vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--border)", margin: "6px auto 16px" }} />
        {title && <h3 style={{ fontSize: 18, marginBottom: 14 }}>{title}</h3>}
        {children}
      </div>
    </div>,
    document.body
  );
};
