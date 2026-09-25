// FILE: student-app/src/pages/Login.tsx

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";
import { StudentApi } from "../api/client";
import { Icon } from "../components/ui/Icon";

export const Login = () => {
  const { login } = useAuth();
  const { show } = useToast();
  const { mode, toggle } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) { setError("Enter your phone/email and password."); return; }
    setBusy(true); setError("");
    try {
      await login(identifier.trim(), password);
      show("Welcome back!", "success");
    } catch (e: any) {
      setError(e.message || "Login failed. Please check your details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px 20px", position: "relative",
    }}>
      <button onClick={toggle} className="btn btn-ghost" style={{ position: "absolute", top: "calc(20px + var(--sat))", right: 20, width: 38, height: 38, padding: 0, borderRadius: "50%" }}>
        <Icon name={mode === "dark" ? "sun" : "moon"} size={16} />
      </button>

      <div className="enter" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18, background: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#fff",
          boxShadow: "0 12px 30px rgba(var(--brand-rgb), 0.35)",
        }}>SO</div>

        <h1 style={{ fontSize: 28, marginBottom: 6 }}>{forgot ? "Reset password" : "Welcome back"}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14.5, marginBottom: 28 }}>
          {forgot ? "We'll send an OTP to your registered phone." : "Sign in to your student account."}
        </p>

        {forgot ? (
          <ForgotPasswordFlow onDone={() => setForgot(false)} />
        ) : (
          <form onSubmit={submit}>
            <Field label="Phone or email">
              <input
                className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                placeholder="9876543210 or name@email.com" autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input
                  className="input" type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)" }}>
                  <Icon name={showPw ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
            </Field>

            {error && <p style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 14 }}>{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", padding: "14px", fontSize: 15 }}>
              {busy ? "Signing in…" : "Sign in"}
            </button>

            <button type="button" onClick={() => setForgot(true)}
              style={{ background: "none", border: "none", color: "var(--brand)", fontSize: 13.5, fontWeight: 600, marginTop: 18, width: "100%" }}>
              Forgot password?
            </button>
          </form>
        )}
      </div>

      <style>{`
        .input {
          width: 100%; padding: 13px 14px; border-radius: 12px; border: 1.5px solid var(--border);
          background: var(--surface); color: var(--text); font-size: 14.5px; outline: none;
          transition: border-color 0.15s var(--ease);
        }
        .input:focus { border-color: var(--brand); }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const ForgotPasswordFlow = ({ onDone }: { onDone: () => void }) => {
  const { show } = useToast();
  const [step, setStep] = useState<"phone" | "otp" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setBusy(true); setError("");
    try { await StudentApi.sendResetOtp(phone.trim()); setStep("otp"); show("OTP sent via WhatsApp", "success"); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const verifyOtp = async () => {
    setBusy(true); setError("");
    try {
      const res: any = await StudentApi.verifyResetOtp(phone.trim(), otp.trim());
      setResetToken(res.data.resetToken); setStep("reset");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const doReset = async () => {
    if (newPw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true); setError("");
    try { await StudentApi.resetPassword(resetToken, newPw); show("Password updated — please sign in", "success"); onDone(); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <div>
      {step === "phone" && (
        <Field label="Registered phone number">
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
        </Field>
      )}
      {step === "otp" && (
        <Field label={`Enter the 6-digit OTP sent to ${phone}`}>
          <input className="input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="••••••" maxLength={6} />
        </Field>
      )}
      {step === "reset" && (
        <Field label="New password">
          <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" />
        </Field>
      )}

      {error && <p style={{ color: "var(--danger)", fontSize: 13.5, marginBottom: 14 }}>{error}</p>}

      <button
        className="btn btn-primary" disabled={busy} style={{ width: "100%", padding: 14 }}
        onClick={step === "phone" ? sendOtp : step === "otp" ? verifyOtp : doReset}
      >
        {busy ? "Please wait…" : step === "phone" ? "Send OTP" : step === "otp" ? "Verify OTP" : "Reset password"}
      </button>
      <button type="button" onClick={onDone} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13.5, marginTop: 16, width: "100%" }}>
        ← Back to sign in
      </button>
    </div>
  );
};
