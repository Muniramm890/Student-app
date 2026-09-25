// FILE: student-app/src/contexts/ToastContext.tsx

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; message: string; variant: "success" | "error" | "info" };
type ToastCtx = { show: (message: string, variant?: Toast["variant"]) => void };

const ToastContext = createContext<ToastCtx | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, variant: Toast["variant"] = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const colors = { success: "var(--success)", error: "var(--danger)", info: "var(--brand)" };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: "fixed", left: 0, right: 0, bottom: "calc(84px + var(--sab))",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          zIndex: 10500, pointerEvents: "none", padding: "0 16px",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="enter"
            style={{
              pointerEvents: "auto",
              background: "var(--bg-elevated)",
              border: `1px solid ${colors[t.variant]}`,
              color: "var(--text)",
              borderRadius: 14,
              padding: "12px 16px",
              fontSize: 13.5,
              fontWeight: 500,
              boxShadow: "0 10px 30px var(--shadow)",
              display: "flex", alignItems: "center", gap: 10,
              maxWidth: 420, width: "100%",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[t.variant], flexShrink: 0 }} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
