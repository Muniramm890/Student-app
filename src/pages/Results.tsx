// FILE: student-app/src/pages/Results.tsx

import { openGeneratedPdf } from "../utils/fetchDoc";
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { StudentApi } from "../api/client";
import { openDocument } from "../utils/openDocument";
import { SkeletonBlock } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../contexts/ToastContext";

type ExamGroup = { id: string; name: string; exam_type: string; start_date: string };
type TrendPoint = { exam_group_id: string; exam_name: string; percentage: number; grade: string | null; class_rank: number | null; school_rank: number | null; status?: string };
type ReportCard = {
  total_marks: number; max_total: number; percentage: number; grade: string | null; class_rank: number | null; school_rank: number | null; status?: string;
  subjects: { subject_name: string; marks_obtained: number | null; grade_obtained?: string | null; max_marks: number; passing_marks?: number; is_grade_only: boolean; status: string }[];
};

export const Results = () => {
  const [groups, setGroups] = useState<ExamGroup[] | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [error, setError] = useState("");
  const [openGroup, setOpenGroup] = useState<ExamGroup | null>(null);
  const chart = (trend || []).filter((t) => t.status !== "incomplete"); // incomplete results have no real percentage

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

      {chart.length > 1 && (
        <div className="card" style={{ marginBottom: 18, padding: "18px 8px 8px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, paddingLeft: 10 }}>Performance trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chart}>
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

// special mark statuses shown instead of marks
const SPECIAL: Record<string, string> = { absent: "Absent", malpractice: "Malpractice", leave: "Leave", tc: "TC", exempted: "Exempt" };

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
      await openGeneratedPdf(`/student/results/report-card/pdf?exam_group_id=${group.id}`, { name: `${group.name} - Report Card.pdf`, title: "Report Card" });
    } catch (e: any) {
      show(e.message || "Could not generate PDF", "error");
    } finally { setDownloading(false); }
  };

  const marksSubs = (card?.subjects || []).filter((x) => !x.is_grade_only);
  const gradeSubs = (card?.subjects || []).filter((x) => x.is_grade_only);

  return (
    <Modal open onClose={onClose} title={group.name} maxWidth={480}>
      {error && <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{error}</p>}
      {!card && !error && <SkeletonBlock height={160} />}
      {card && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(88px,1fr))", gap: 8, marginBottom: 12 }}>
            <Stat label="Percentage" value={card.status === "incomplete" ? "-" : `${card.percentage}%`} />
            <Stat label="Grade" value={card.grade || "-"} />
            <Stat label="Class rank" value={card.class_rank ? `#${card.class_rank}` : "-"} />
            <Stat label="School rank" value={card.school_rank ? `#${card.school_rank}` : "-"} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 12.5 }}>
            <span style={{ color: "var(--text-muted)" }}>Total: <b style={{ color: "var(--text)" }}>{card.total_marks ?? "-"} / {card.max_total ?? "-"}</b></span>
            {card.status && (
              <span style={{ fontWeight: 800, letterSpacing: 0.6, padding: "3px 10px", borderRadius: 100,
                color: card.status === "pass" ? "var(--success)" : card.status === "fail" ? "var(--danger)" : "var(--text-muted)",
                background: "var(--surface-alt)" }}>{card.status.toUpperCase()}</span>
            )}
          </div>
          {marksSubs.length > 0 && (
            <>
              <div style={SECTION}>Subjects</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {marksSubs.map((s) => {
                  const special = SPECIAL[s.status];
                  const has = s.marks_obtained !== null && s.marks_obtained !== undefined;
                  const pct = !special && has && s.max_marks > 0 ? Math.min(100, (Number(s.marks_obtained) / s.max_marks) * 100) : 0;
                  const failed = !special && has && s.passing_marks !== undefined && Number(s.marks_obtained) < Number(s.passing_marks);
                  const col = special ? (["leave", "tc", "exempted"].includes(s.status) ? "var(--text-muted)" : "var(--danger)") : failed ? "var(--danger)" : "var(--success)";
                  return (
                    <div key={s.subject_name} style={{ background: "var(--surface-alt)", borderRadius: 12, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13.5 }}>
                        <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subject_name}</span>
                        <span style={{ fontWeight: 700, color: col, flexShrink: 0 }}>{special ? special : has ? `${s.marks_obtained}/${s.max_marks}` : "-"}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 5, background: "var(--border)", marginTop: 7, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 5 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {gradeSubs.length > 0 && (
            <>
              <div style={SECTION}>Co-scholastic</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8, marginBottom: 16 }}>
                {gradeSubs.map((s) => (
                  <div key={s.subject_name} style={{ background: "var(--surface-alt)", borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subject_name}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: SPECIAL[s.status] ? "var(--danger)" : "var(--brand)" }}>{SPECIAL[s.status] ? SPECIAL[s.status] : (s.grade_obtained || "-")}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button onClick={download} disabled={downloading} className="btn btn-primary" style={{ width: "100%", padding: 13 }}>
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </>
      )}
    </Modal>
  );
};

const SECTION: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-muted)", margin: "12px 0 8px" };

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div style={{ flex: 1, textAlign: "center", background: "var(--surface-alt)", borderRadius: 12, padding: "12px 8px" }}>
    <div style={{ fontSize: 17, fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
  </div>
);
