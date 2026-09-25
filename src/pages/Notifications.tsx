// FILE: student-app/src/pages/Notifications.tsx

import { useEffect, useState } from "react";
import { StudentApi } from "../api/client";
import { Icon } from "../components/ui/Icon";
import { SkeletonBlock } from "../components/ui/Skeleton";

type Notification = {
  id: string; type: string; title: string; message: string;
  related_id?: string; is_read: boolean; created_at: string;
};

export const Notifications = () => {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    StudentApi.notifications()
      .then((res) => setItems(res.data as Notification[]))
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const markRead = async (id: string) => {
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, is_read: true } : n)) || prev);
    try { await StudentApi.markNotificationRead(id); } catch { /* optimistic — resync on next load */ }
  };

  return (
    <div className="enter">
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Notifications</h1>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", fontSize: 13.5, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!items && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SkeletonBlock height={70} /><SkeletonBlock height={70} /><SkeletonBlock height={70} />
        </div>
      )}

      {items && items.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <Icon name="bell" size={28} color="var(--text-faint)" />
          <p style={{ marginTop: 12, fontSize: 13.5 }}>You're all caught up — no notifications yet.</p>
        </div>
      )}

      {items && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              className="card"
              style={{
                textAlign: "left", width: "100%", display: "flex", gap: 12,
                border: n.is_read ? "1px solid var(--border)" : "1px solid var(--brand)",
                background: n.is_read ? "var(--surface)" : "var(--brand-light)",
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                background: n.is_read ? "transparent" : "var(--brand)",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: n.is_read ? "var(--text)" : "var(--brand-dark)" }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
                  {new Date(n.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
