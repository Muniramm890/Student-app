// FILE: student-app/src/pages/Homework.tsx

import { useEffect, useState } from "react";
import { StudentApi } from "../api/client";
import { Icon } from "../components/ui/Icon";
import { SkeletonBlock } from "../components/ui/Skeleton";

type Attachment = { id: string; file_name: string; file_type: string; download_url: string };
type HomeworkItem = {
  id: string; title: string; description?: string;
  given_date: string; due_date: string; created_at: string;
  attachments: Attachment[];
};

const daysUntil = (dateStr: string) => {
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
};

const DueBadge = ({ dueDate }: { dueDate: string }) => {
  const d = daysUntil(dueDate);
  let label = `Due ${new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  let color = "var(--text-muted)", bg = "var(--surface-alt)";
  if (d < 0) { label = "Overdue"; color = "var(--danger)"; bg = "color-mix(in srgb, var(--danger) 12%, transparent)"; }
  else if (d === 0) { label = "Due today"; color = "var(--warning)"; bg = "color-mix(in srgb, var(--warning) 14%, transparent)"; }
  else if (d === 1) { label = "Due tomorrow"; color = "var(--warning)"; bg = "color-mix(in srgb, var(--warning) 14%, transparent)"; }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, borderRadius: 8, padding: "3px 8px", flexShrink: 0 }}>
      {label}
    </span>
  );
};

export const Homework = () => {
  const [items, setItems] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    StudentApi.homework()
      .then((res) => setItems(res.data as HomeworkItem[]))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="enter">
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Homework</h1>

      {error && (
        <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", fontSize: 13.5, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!items && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonBlock height={90} /><SkeletonBlock height={90} /><SkeletonBlock height={90} />
        </div>
      )}

      {items && items.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <Icon name="book" size={28} color="var(--text-faint)" />
          <p style={{ marginTop: 12, fontSize: 13.5 }}>No homework assigned right now.</p>
        </div>
      )}

      {items && items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((hw) => (
            <div key={hw.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <h3 style={{ fontSize: 15.5 }}>{hw.title}</h3>
                <DueBadge dueDate={hw.due_date} />
              </div>
              {hw.description && (
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: hw.attachments.length ? 12 : 4 }}>
                  {hw.description}
                </p>
              )}
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: hw.attachments.length ? 10 : 0 }}>
                Given {new Date(hw.given_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
              {hw.attachments.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {hw.attachments.map((a) => (
                    <a key={a.id} href={a.download_url} target="_blank" rel="noreferrer" style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                      background: "var(--surface-alt)", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                    }}>
                      <Icon name="download" size={14} color="var(--brand)" />
                      {a.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
