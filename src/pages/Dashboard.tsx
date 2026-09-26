// FILE: student-app/src/pages/Dashboard.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { StudentApi } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { Icon } from "../components/ui/Icon";
import { SkeletonBlock } from "../components/ui/Skeleton";

type DashboardData = {
  attendancePercent: number | null;
  fee: { total_fee_paise: number; paid_paise: number; pending_paise: number } | null;
    todayClasses: { period_number: number; label: string; start_time: string; end_time: string; subject_name: string; teacher_name: string; is_substituted: number; substitute_teacher_name: string | null }[];
  unreadNotifications: number;
};

const rupees = (paise = 0) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const Dashboard = () => {
  const { student } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    StudentApi.dashboard()
      .then((res) => setData(res.data as DashboardData))
      .catch((e) => setError(e.message));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="enter">
      <div style={{ marginBottom: 22 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{greeting},</p>
        <h1 style={{ fontSize: 26 }}>{student?.first_name || "Student"} 👋</h1>
        <p style={{ color: "var(--text-faint)", fontSize: 13, marginTop: 4 }}>
          {student?.class_name && student?.section_name ? `${student.class_name} · ${student.section_name} · Roll ${student.roll_no ?? "—"}` : "\u00A0"}
        </p>
      </div>

      {error && <ErrorCard message={error} />}
      {!data && !error && <DashboardSkeleton />}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
            <AttendanceCard percent={data.attendancePercent} />
            <FeeCard fee={data.fee} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
  <QuickAction to="/homework" icon="book" label="Homework" />   {/* ← add this */}
  <QuickAction to="/fees" icon="card" label="Pay Fees" />
  <QuickAction to="/results" icon="result" label="Results" />
  <QuickAction to="/attendance" icon="calendar" label="Attendance" />
  <QuickAction to="/notifications" icon="bell" label="Notices" badge={data.unreadNotifications} />
</div>

        <h2 style={{ fontSize: 17, marginBottom: 12 }}>Today's classes</h2>
          {data.todayClasses.length === 0 ? (
            <EmptyState text="No classes scheduled for today." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.todayClasses.map((c, i) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: `1px solid ${c.is_substituted ? "var(--brand)" : "var(--border)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{c.subject_name || c.label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.start_time}–{c.end_time}</span>
                  </div>
                  {c.is_substituted ? (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <span style={{ color: "var(--text-faint)", textDecoration: "line-through" }}>{c.teacher_name}</span>
                      {" → "}
                      <span style={{ color: "var(--brand)", fontWeight: 700 }}>{c.substitute_teacher_name}</span>
                      <span style={{ marginLeft: 6, fontSize: 10, background: "rgba(var(--brand-rgb),0.12)", color: "var(--brand)", padding: "2px 6px", borderRadius: 6, fontWeight: 700 }}>SUBSTITUTE</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-muted)" }}>{c.teacher_name}</div>
                  )}
                </div>
              ))}
            </div>
          )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.todayClasses.map((c) => (
                <div key={c.period_number} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: 14 }}>
                  <div style={{
                    width: 46, textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--brand)",
                    background: "var(--brand-light)", borderRadius: 10, padding: "6px 0", flexShrink: 0,
                  }}>
                    P{c.period_number}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{c.subject_name || c.label}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{c.teacher_name || "—"}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", flexShrink: 0 }}>
                    {c.start_time}–{c.end_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AttendanceCard = ({ percent }: { percent: number | null }) => {
  const pct = percent ?? 0;
  const chartData = [{ value: pct }, { value: 100 - pct }];
  const color = pct >= 85 ? "var(--success)" : pct >= 70 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 72, height: 72, position: "relative", flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" innerRadius={26} outerRadius={34} startAngle={90} endAngle={-270} stroke="none">
              <Cell fill={color} />
              <Cell fill="var(--surface-alt)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
          {percent === null ? "—" : `${pct}%`}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Attendance</p>
        <p style={{ fontSize: 13.5, fontWeight: 600 }}>Last 30 days</p>
        <Link to="/attendance" style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600 }}>View details →</Link>
      </div>
    </div>
  );
};

const FeeCard = ({ fee }: { fee: DashboardData["fee"] }) => {
  const pending = fee?.pending_paise ?? 0;
  const paid = fee?.paid_paise ?? 0;
  const total = fee?.total_fee_paise ?? 0;
  const pctPaid = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div className="card">
      <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 6 }}>Fee status</p>
      <p style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
        {pending > 0 ? rupees(pending) : "All clear 🎉"}
      </p>
      <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>
        {pending > 0 ? "pending" : "No dues remaining"}
      </p>
      <div style={{ height: 6, borderRadius: 4, background: "var(--surface-alt)", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ width: `${pctPaid}%`, height: "100%", background: "var(--brand)", borderRadius: 4 }} />
      </div>
      <Link to="/fees" className="btn btn-primary" style={{ width: "100%", padding: "10px", fontSize: 13 }}>
        {pending > 0 ? "Pay now" : "View history"}
      </Link>
    </div>
  );
};

const QuickAction = ({ to, icon, label, badge }: { to: string; icon: any; label: string; badge?: number }) => (
  <Link to={to} className="card" style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 10px",
    position: "relative", textAlign: "center",
  }}>
    {!!badge && (
      <span style={{
        position: "absolute", top: 10, right: 10, background: "var(--danger)", color: "#fff",
        fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "2px 6px", minWidth: 18, textAlign: "center",
      }}>{badge}</span>
    )}
    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--brand-light)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} size={20} />
    </div>
    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>
  </Link>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="card" style={{ textAlign: "center", padding: "32px 20px", color: "var(--text-muted)", fontSize: 13.5 }}>
    {text}
  </div>
);

const ErrorCard = ({ message }: { message: string }) => (
  <div className="card" style={{ borderColor: "var(--danger)", marginBottom: 16, fontSize: 13.5, color: "var(--danger)" }}>
    {message}
  </div>
);

const DashboardSkeleton = () => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
      <SkeletonBlock height={92} /><SkeletonBlock height={92} />
    </div>
    <SkeletonBlock height={64} style={{ marginBottom: 10 }} />
    <SkeletonBlock height={64} />
  </div>
);
