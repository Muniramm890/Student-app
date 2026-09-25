// FILE: student-app/src/pages/Login.tsx

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTheme } from "../contexts/ThemeContext";
import { StudentApi } from "../api/client";
import { Icon } from "../components/ui/Icon";
import { BrandMark } from "../components/ui/BrandMark";

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
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, position: "relative", background: "var(--bg)", overflow: "hidden",
    }}>
      {/* Background glow — same as admin login */}
      <div style={{
        position: "fixed", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%",
        background: "rgba(var(--brand-rgb), 0.08)", pointerEvents: "none", filter: "blur(60px)",
      }} />

      <button onClick={toggle} className="btn btn-ghost" style={{
        position: "fixed", top: "calc(20px + var(--sat))", right: 20, width: 38, height: 38,
        padding: 0, borderRadius: "50%", zIndex: 20,
      }}>
        <Icon name={mode === "dark" ? "sun" : "moon"} size={16} />
      </button>

      <div className="enter" style={{
        width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 24, padding: 36, boxShadow: "0 25px 60px var(--shadow)", position: "relative", zIndex: 10,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ marginBottom: 16 }}><BrandMark size={78} /></div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: "0.5px" }}>
            <span style={{ color: "var(--text)" }}>School</span>
            <span style={{ color: "var(--brand)" }}>Office</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6, marginBottom: 0, fontWeight: 500, letterSpacing: "0.5px" }}>
            Student Portal
          </p>
        </div>

        {forgot ? (
          <ForgotPasswordFlow onDone={() => setForgot(false)} />
        ) : (
          <form onSubmit={submit}>
            <Field label="Phone or Email">
              <input
                className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                placeholder="9876543210 or name@email.com" autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <div style={{ position: "relative" }}>
                <input
                  className="input" type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", padding: 0 }}>
                  <Icon name={showPw ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <button type="button" onClick={() => setForgot(true)} style={{
                  background: "none", border: "none", color: "var(--brand)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0,
                }}>
                  Forgot Password?
                </button>
              </div>
            </Field>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
                padding: "10px 14px", marginBottom: 16, color: "var(--danger)", fontSize: 13, fontWeight: 500,
              }}>
                ⚠ {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: "100%", padding: "12px 20px", fontSize: 14 }}>
              {busy ? "⏳ Signing in…" : "→ Sign In"}
            </button>
          </form>
        )}
      </div>

      {/* Powered By footer — same as admin login */}
      <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 5, opacity: 0.85 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderRadius: 14,
          background: "var(--overlay)", border: "1px solid var(--border-soft)", backdropFilter: "blur(6px)",
        }}>
          <BrandMark size={26} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "-0.01em", lineHeight: 1 }}>
              <span style={{ color: "var(--text)" }}>School</span>
              <span style={{ color: "var(--brand)" }}>Office</span>
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
              Smart ERP for Smart Schools
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%; padding: 11px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border);
          background: var(--surface-alt); color: var(--text); font-size: 14px; outline: none;
          transition: border-color 0.15s var(--ease);
        }
        .input:focus { border-color: var(--brand); }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
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
