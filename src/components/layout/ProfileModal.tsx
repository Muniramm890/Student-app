// FILE: student-app/src/components/layout/ProfileModal.tsx
// Opens from the top-bar avatar (same idea as the admin app). Student can change only the photo
// and the password (backend: PUT /student/auth/me accepts photo_url only). Also holds Appearance + Logout.
import { useRef, useState } from "react";
import { Modal } from "../ui/Modal";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { useDialog } from "../../contexts/DialogContext";
import { StudentApi } from "../../api/client";
import { uploadProfilePhoto } from "../../utils/profilePhoto";

export const ProfileModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { student, logout, refreshProfile } = useAuth();
  const { mode, toggle } = useTheme();
  const { show } = useToast();
  const { dialogConfirm } = useDialog();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(" ") || "Student";

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { show("Please choose an image file", "error"); return; }
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(file);
      await StudentApi.updateProfile(url);
      await refreshProfile();
      show("Profile photo updated", "success");
    } catch (err: any) {
      show(err?.message || "Photo upload failed", "error");
    } finally { setUploading(false); }
  };

  const resetPw = () => { setPwOpen(false); setCurrent(""); setNext(""); setConfirm(""); setPwError(""); };

  const submitPw = async () => {
    if (!current) { setPwError("Enter your current password."); return; }
    if (next.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (next !== confirm) { setPwError("New passwords do not match."); return; }
    setBusy(true); setPwError("");
    try {
      await StudentApi.changePassword(current, next);
      show("Password updated", "success");
      resetPw();
    } catch (err: any) { setPwError(err?.message || "Could not change password"); }
    finally { setBusy(false); }
  };

  const confirmLogout = async () => {
    if (await dialogConfirm("You'll need to sign in again to access your account.", "Sign out?")) {
      onClose();
      StudentApi.logout().catch(() => {});
      logout();
    }
  };

  return (
    <Modal open={open} onClose={() => { resetPw(); onClose(); }} title="My profile" maxWidth={460}>
      {/* Hero */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", width: 88, height: 88 }}>
          {student?.photo_url ? (
            <img src={student.photo_url} alt="" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--border)", opacity: uploading ? 0.5 : 1 }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--brand-light)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700 }}>
              {(student?.first_name?.[0] || "S").toUpperCase()}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change photo"
            title="Change photo"
            style={{
              position: "absolute", right: -2, bottom: -2, width: 32, height: 32, borderRadius: "50%",
              background: "var(--brand)", color: "#fff", border: "2px solid var(--bg-elevated)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <Icon name="camera" size={15} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: "none" }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 10 }}>{fullName}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
          {[student?.class_name, student?.section_name].filter(Boolean).join(" · ")}{student?.roll_no != null ? ` · Roll ${student.roll_no}` : ""}
        </div>
        {uploading && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Uploading photo…</div>}
      </div>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {[
          ["Admission no.", student?.admission_no],
          ["Phone", student?.login_phone],
          ["Email", student?.login_email],
          ["School", student?.school_name],
        ].map(([k, v]) => (
          <div key={k as string} className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 14px", fontSize: 13.5 }}>
            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{k}</span>
            <span style={{ fontWeight: 600, textAlign: "right", minWidth: 0, overflowWrap: "anywhere" }}>{v || "—"}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <button onClick={toggle} className="pm-row">
        <Icon name={mode === "dark" ? "sun" : "moon"} size={18} />
        <span style={{ flex: 1, textAlign: "left" }}>Appearance</span>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{mode === "dark" ? "Dark" : "Light"}</span>
      </button>

      {!pwOpen ? (
        <button onClick={() => setPwOpen(true)} className="pm-row">
          <Icon name="eyeOff" size={18} />
          <span style={{ flex: 1, textAlign: "left" }}>Change password</span>
          <Icon name="chevronRight" size={16} />
        </button>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 8 }}>
          <input className="input" type="password" placeholder="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} style={{ marginBottom: 10 }} />
          <input className="input" type="password" placeholder="New password (min 6)" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} style={{ marginBottom: 10 }} />
          <input className="input" type="password" placeholder="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ marginBottom: 10 }} />
          {pwError && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 10 }}>{pwError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={resetPw} className="btn btn-ghost" style={{ flex: 1, padding: 12 }}>Cancel</button>
            <button onClick={submitPw} disabled={busy} className="btn btn-primary" style={{ flex: 2, padding: 12 }}>{busy ? "Updating…" : "Update password"}</button>
          </div>
        </div>
      )}

      <button onClick={confirmLogout} className="pm-row" style={{ color: "var(--danger)" }}>
        <Icon name="logout" size={18} color="var(--danger)" />
        <span style={{ flex: 1, textAlign: "left" }}>Sign out</span>
      </button>

      <style>{`
        .pm-row {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 14px; margin-bottom: 8px;
          background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
          font-size: 14px; font-weight: 500; color: var(--text); cursor: pointer;
        }
      `}</style>
    </Modal>
  );
};
