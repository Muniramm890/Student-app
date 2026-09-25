// FILE: student-app/src/pages/Attendance.tsx

import React, { useEffect, useState } from "react";
import { StudentApi } from "../api/client";
import { SkeletonBlock } from "../components/ui/Skeleton";

type Record = { attendance_date: string; status: "P" | "A" | "L" | "OD"; remarks?: string };
type History = { records: Record[]; counts: Record<string, number> & { P: number; A: number; L: number; OD: number }; totalMarked: number; percentage: number };

const STATUS_META: Record<string, { label: string; color: string }> = {
  P: { label: "Present", color: "var(--success)" },
  A: { label: "Absent", color: "var(--danger)" },
  L: { label: "Leave", color: "var(--warning)" },
  OD: { label: "On duty", color: "var(--info)" },
};

export const Attendance = () => {
  const [data, setData] = useState<History | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    StudentApi.attendanceHistory().then((res) => setData(res.data as History)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="enter">
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Attendance</h1>

      {error && <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", fontSize: 13.5, marginBottom: 16 }}>{error}</div>}
      {!data && !error && <SkeletonBlock height={100} />}

      {data && (
        <>
          <div className="card" style={{ marginBottom: 18, textAlign: "center", padding: 24 }}>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 6 }}>Last 30 days</p>
            <p style={{ fontSize: 40, fontWeight: 700, fontFamily: "var(--font-display)", color: data.percentage >= 85 ? "var(--success)" : data.percentage >= 70 ? "var(--warning)" : "var(--danger)" }}>
              {data.percentage}%
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
                  {meta.label}: {(data.counts as any)[key] || 0}
                </div>
              ))}
            </div>
          </div>

          <h2 style={{ fontSize: 15.5, marginBottom: 10 }}>Daily record</h2>
          {data.records.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13.5 }}>
              No attendance marked yet in this range.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...data.records].reverse().map((r) => (
                <div key={r.attendance_date} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_META[r.status]?.color || "var(--text-faint)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5 }}>
                    {new Date(r.attendance_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: STATUS_META[r.status]?.color }}>
                    {STATUS_META[r.status]?.label || r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
