// FILE: student-app/src/components/layout/AppShell.tsx

import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

const NAV = [
  { to: "/", label: "Home", icon: "home" as const, end: true },
  { to: "/attendance", label: "Attendance", icon: "attendance" as const },
  { to: "/fees", label: "Fees", icon: "fee" as const },
  { to: "/results", label: "Results", icon: "result" as const },
  { to: "/profile", label: "Profile", icon: "profile" as const },
];

export const AppShell = () => {
  const { mode, toggle } = useTheme();
  const { student } = useAuth();

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="hide-mobile" style={{
        width: 248, flexShrink: 0, borderRight: "1px solid var(--border)",
        padding: "28px 18px", display: "flex", flexDirection: "column", gap: 4,
        position: "sticky", top: 0, height: "100dvh",
      }}>
        <Brand />
        <div style={{ height: 28 }} />
        {NAV.map((item) => (
          <SideLink key={item.to} {...item} />
        ))}
        <div style={{ flex: 1 }} />
        <ThemeToggle mode={mode} toggle={toggle} full />
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border-soft)",
          padding: "calc(12px + var(--sat)) 16px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div className="hide-desktop"><Brand compact /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            <span className="hide-mobile" style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
              Hi, {student?.first_name || "Student"}
            </span>
            <NavLink to="/notifications" style={{
              width: 38, height: 38, borderRadius: 12, background: "var(--surface-alt)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="bell" size={18} />
            </NavLink>
            <div className="hide-desktop"><ThemeToggle mode={mode} toggle={toggle} /></div>
            <Avatar url={student?.photo_url} name={student?.first_name} />
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="hide-desktop" style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
        paddingBottom: "var(--sab)",
        display: "flex", justifyContent: "space-around",
      }}>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "10px 12px 8px", color: isActive ? "var(--brand)" : "var(--text-faint)",
            fontSize: 10.5, fontWeight: 600, flex: 1,
          })}>
            <Icon name={item.icon} size={21} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (max-width: 899px) { .hide-mobile { display: none !important; } }
        @media (min-width: 900px) { .hide-desktop { display: none !important; } }
      `}</style>
    </div>
  );
};

const Brand = ({ compact = false }: { compact?: boolean }) => {
  const { student } = useAuth();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {student?.logo_url ? (
        <img src={student.logo_url} alt="" style={{ width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: 9, objectFit: "contain", background: "#fff" }} />
      ) : (
        <div style={{
          width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: 9, background: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: compact ? 12 : 14,
        }}>SO</div>
      )}
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: compact ? 15 : 16, lineHeight: 1.1 }}>
        {student?.school_name || "School Office"}
      </div>
    </div>
  );
};

const SideLink = ({ to, label, icon, end }: { to: string; label: string; icon: any; end?: boolean }) => (
  <NavLink to={to} end={end} style={({ isActive }) => ({
    display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 12,
    color: isActive ? "#fff" : "var(--text-muted)",
    background: isActive ? "var(--brand)" : "transparent",
    fontWeight: 600, fontSize: 14, transition: "background 0.15s var(--ease)",
  })}>
    <Icon name={icon} size={19} />
    {label}
  </NavLink>
);

const ThemeToggle = ({ mode, toggle, full = false }: { mode: string; toggle: () => void; full?: boolean }) => (
  <button
    onClick={toggle}
    aria-label="Toggle theme"
    className="btn btn-ghost"
    style={{ width: full ? "100%" : 38, height: 38, padding: 0, borderRadius: full ? 12 : "50%" }}
  >
    <Icon name={mode === "dark" ? "sun" : "moon"} size={17} />
    {full && <span style={{ marginLeft: 8, fontSize: 13 }}>{mode === "dark" ? "Light mode" : "Dark mode"}</span>}
  </button>
);

const Avatar = ({ url, name }: { url?: string; name?: string }) => (
  url ? (
    <img src={url} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} />
  ) : (
    <div style={{
      width: 38, height: 38, borderRadius: "50%", background: "var(--brand-light)", color: "var(--brand-dark)",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14,
    }}>
      {(name?.[0] || "S").toUpperCase()}
    </div>
  )
);
