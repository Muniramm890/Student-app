// FILE: student-app/src/contexts/DialogContext.tsx

import React, { createContext, useContext, useState } from "react";
import { Modal } from "../components/ui/Modal";

type DialogState = { type: "alert" | "confirm"; title: string; message: string; resolve: (v: boolean) => void } | null;
type DialogCtx = {
  dialogAlert: (message: string, title?: string) => Promise<boolean>;
  dialogConfirm: (message: string, title?: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogCtx | null>(null);

export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<DialogState>(null);

  const dialogAlert = (message: string, title = "Notice") =>
    new Promise<boolean>((resolve) => setState({ type: "alert", title, message, resolve }));

  const dialogConfirm = (message: string, title = "Please confirm") =>
    new Promise<boolean>((resolve) => setState({ type: "confirm", title, message, resolve }));

  const close = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <DialogContext.Provider value={{ dialogAlert, dialogConfirm }}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} title={state?.title} maxWidth={380}>
        {state && (
          <div>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>
              {state.message}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {state.type === "confirm" && (
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => close(false)}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => close(true)}>
                {state.type === "confirm" ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside DialogProvider");
  return ctx;
};
