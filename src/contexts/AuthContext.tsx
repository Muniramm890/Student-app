// FILE: student-app/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { StudentApi, getToken, setToken, clearToken, setUnauthorizedHandler } from "../api/client";
import { useDialog } from "./DialogContext";

type StudentProfile = {
  id: string; first_name: string; last_name?: string; photo_url?: string;
  admission_no?: string; class_name?: string; section_name?: string; roll_no?: number;
  school_name?: string; logo_url?: string; login_phone?: string; login_email?: string;
};

type AuthCtx = {
  student: StudentProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { dialogConfirm } = useDialog();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootFailed, setBootFailed] = useState(false);
  const [forceLoggedOut, setForceLoggedOut] = useState(false);

  const logout = () => {
    clearToken();
    setStudent(null);
  };

  useEffect(() => { setUnauthorizedHandler(logout); }, []);

  const refreshProfile = async () => {
    const res = await StudentApi.me();
    setStudent(res.data as StudentProfile);
  };

  // Boot: verify token, but never hang forever — race a timeout like the
  // admin app does, and never nuke a possibly-valid token on a slow network.
  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) { setLoading(false); return; }

      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000));
      try {
        await Promise.race([refreshProfile(), timeout]);
      } catch (e: any) {
        if (e.message === "timeout") setBootFailed(true);
        else { clearToken(); setStudent(null); }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!bootFailed) return;
    dialogConfirm(
      "We couldn't reach the server. Please check your internet connection and try again.",
      "Connection problem"
    ).then((retry) => {
      if (retry) window.location.reload();
      else { clearToken(); setStudent(null); setForceLoggedOut(true); }
    });
  }, [bootFailed]); // eslint-disable-line

  // Idle auto-logout — 20 min, warned via the global dialog 1 min before.
  useEffect(() => {
    if (!student) return;
    const TIMEOUT_MS = 20 * 60 * 1000;
    const WARNING_MS = 60 * 1000;
    let idleTimer: number, warnTimer: number;

    const reset = () => {
      clearTimeout(idleTimer); clearTimeout(warnTimer);
      warnTimer = window.setTimeout(async () => {
        const stay = await dialogConfirm(
          "You've been inactive for a while. You'll be signed out in 1 minute.",
          "Still there?"
        );
        if (stay) reset();
      }, TIMEOUT_MS - WARNING_MS);
      idleTimer = window.setTimeout(() => logout(), TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, reset));
    reset();
    return () => {
      clearTimeout(idleTimer); clearTimeout(warnTimer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [student]); // eslint-disable-line

  const login = async (identifier: string, password: string) => {
    const res = await StudentApi.login(identifier, password);
    const payload: any = res.data;
    if (!payload?.token) throw new Error("Invalid response from server.");
    setToken(payload.token);
    await refreshProfile();
  };

  if (loading) return <BootSplash />;
  if (bootFailed && !forceLoggedOut) return <BootSplash />;

  return (
    <AuthContext.Provider value={{ student, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

const BootSplash = () => (
  <div style={{
    height: "100dvh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 16, background: "var(--bg)",
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16, background: "var(--brand)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "#fff",
      animation: "fadeUp 0.4s var(--ease)",
    }}>
      SO
    </div>
    <div style={{ width: 120, height: 3, borderRadius: 3, background: "var(--surface-alt)", overflow: "hidden" }}>
      <div style={{ width: "40%", height: "100%", background: "var(--brand)", animation: "loadbar 1.1s ease-in-out infinite" }} />
    </div>
    <style>{`@keyframes loadbar {0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}`}</style>
  </div>
);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
