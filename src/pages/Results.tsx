// FILE: student-app/src/pages/Results.tsx

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { StudentApi } from "../api/client";
import { SkeletonBlock } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../contexts/ToastContext";

type ExamGroup = { id: string; name: string; exam_type: string; start_date: string };
type TrendPoint = { exam_group_id: string; exam_name: string; percentage: number; grade: string; class_rank: number; school_rank: number };
type ReportCard = {
  total_marks: number; max_total: number; percentage: number; grade: string; class_rank: number; school_rank: number;
  subjects: { subject_name: string; marks_obtained: number; grade_obtained?: string; max_marks: number; is_grade_only: boolean; status: string }[];
};

export const Results = () => {
  const [groups, setGroups] = useState<ExamGroup[] | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [error, setError] = useState("");
  const [openGroup, setOpenGroup] = useState<ExamGroup | null>(null);

  useEffect(() => {
    Promise.all([StudentApi.examGroups(), StudentApi.resultTrend()])
      .then(([g, t]) => { setGroups(g.data as ExamGroup[]); setTrend(t.data as TrendPoint[]); })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="enter">
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Results</h1>
      {error && <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", fontSize: 13.5, marginBottom: 16 }}>{error}</div>}

      {!groups && !error && <SkeletonBlock height={220} />}

      {trend && trend.length > 1 && (
        <div className="card" style={{ marginBottom: 18, padding: "18px 8px 8px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, paddingLeft: 10 }}>Performance trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
              <XAxis dataKey="exam_name" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="percentage" stroke="#E8600A" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {groups && groups.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13.5 }}>
          No published exam results yet.
        </div>
      )}

      {groups && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {groups.map((g) => (
            <button key={g.id} onClick={() => setOpenGroup(g)} className="card" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
              textAlign: "left", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{g.exam_type}</div>
              </div>
              <span style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600 }}>View →</span>
            </button>
          ))}
        </div>
      )}

      {openGroup && <ReportCardModal group={openGroup} onClose={() => setOpenGroup(null)} />}
    </div>
  );
};

const ReportCardModal = ({ group, onClose }: { group: ExamGroup; onClose: () => void }) => {
  const { show } = useToast();
  const [card, setCard] = useState<ReportCard | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    StudentApi.reportCard(group.id).then((res) => setCard(res.data as ReportCard)).catch((e) => setError(e.message));
  }, [group.id]);

  const download = async () => {
    setDownloading(true);
    try {
      const res: any = await StudentApi.reportCardPdf(group.id);
      window.open(res.data.url, "_blank");
    } catch (e: any) {
      show(e.message || "Could not generate PDF", "error");
    } finally { setDownloading(false); }
  };

  return (
    <Modal open onClose={onClose} title={group.name} maxWidth={480}>
      {error && <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p>}
      {!card && !error && <SkeletonBlock height={160} />}
      {card && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <Stat label="Percentage" value={`${card.percentage}%`} />
            <Stat label="Grade" value={card.grade} />
            <Stat label="Class rank" value={`#${card.class_rank}`} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {card.subjects.map((s) => (
              <div key={s.subject_name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "var(--surface-alt)", borderRadius: 10, fontSize: 13.5 }}>
                <span>{s.subject_name}</span>
                <span style={{ fontWeight: 600 }}>
                  {s.is_grade_only ? s.grade_obtained : `${s.marks_obtained}/${s.max_marks}`}
                </span>
              </div>
            ))}
          </div>
          <button onClick={download} disabled={downloading} className="btn btn-primary" style={{ width: "100%", padding: 13 }}>
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </>
      )}
    </Modal>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div style={{ flex: 1, textAlign: "center", background: "var(--surface-alt)", borderRadius: 12, padding: "12px 8px" }}>
    <div style={{ fontSize: 17, fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
  </div>
);
