// FILE: student-app/src/pages/Profile.tsx

import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { useDialog } from "../contexts/DialogContext";
import { StudentApi } from "../api/client";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";

export const Profile = () => {
  const { student, logout } = useAuth();
  const { mode, toggle } = useTheme();
  const { dialogConfirm } = useDialog();
  const [pwOpen, setPwOpen] = useState(false);

  const confirmLogout = async () => {
    if (await dialogConfirm("You'll need to sign in again to access your account.", "Sign out?")) {
      StudentApi.logout().catch(() => {});
      logout();
    }
  };

  return (
    <div className="enter">
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Profile</h1>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        {student?.photo_url ? (
          <img src={student.photo_url} alt="" style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--brand-light)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>
            {(student?.first_name?.[0] || "S").toUpperCase()}
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{student?.first_name} {student?.last_name || ""}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            {student?.class_name} · {student?.section_name} · Roll {student?.roll_no ?? "—"}
          </div>
        </div>
      </div>

      <Section title="Account">
        <InfoRow label="Admission no." value={student?.admission_no || "—"} />
        <InfoRow label="Phone" value={student?.login_phone || "—"} />
        <InfoRow label="Email" value={student?.login_email || "—"} />
        <InfoRow label="School" value={student?.school_name || "—"} />
      </Section>

      <Section title="Preferences">
        <button onClick={toggle} className="row-btn">
          <Icon name={mode === "dark" ? "sun" : "moon"} size={18} />
          <span style={{ flex: 1, textAlign: "left" }}>Appearance</span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{mode === "dark" ? "Dark" : "Light"}</span>
          <Icon name="chevronRight" size={16} />
        </button>
        <button onClick={() => setPwOpen(true)} className="row-btn">
          <Icon name="eyeOff" size={18} />
          <span style={{ flex: 1, textAlign: "left" }}>Change password</span>
          <Icon name="chevronRight" size={16} />
        </button>
      </Section>

      <button onClick={confirmLogout} className="row-btn" style={{ color: "var(--danger)", marginTop: 8 }}>
        <Icon name="logout" size={18} color="var(--danger)" />
        <span style={{ flex: 1, textAlign: "left" }}>Sign out</span>
      </button>

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}

      <style>{`
        .row-btn {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px;
          background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
          font-size: 14px; font-weight: 500; color: var(--text); cursor: pointer; margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>{title}</p>
    {children}
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="card" style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", marginBottom: 6, fontSize: 13.5 }}>
    <span style={{ color: "var(--text-muted)" }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

const ChangePasswordModal = ({ onClose }: { onClose: () => void }) => {
  const { show } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (next.length < 6) { setError("New password must be at least 6 characters."); return; }
    setBusy(true); setError("");
    try {
      await StudentApi.changePassword(current, next);
      show("Password updated", "success");
      onClose();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title="Change password">
      <input className="input" type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} style={{ marginBottom: 12 }} />
      <input className="input" type="password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} style={{ marginBottom: 12 }} />
      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <button onClick={submit} disabled={busy} className="btn btn-primary" style={{ width: "100%", padding: 13 }}>
        {busy ? "Updating…" : "Update password"}
      </button>
    </Modal>
  );
};
