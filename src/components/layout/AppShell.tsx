// FILE: student-app/src/components/layout/AppShell.tsx

import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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

// Desktop header title per route — Home shows the school name instead of "Home".
const PAGE_TITLES: Record<string, string> = {
  "/attendance": "Attendance",
  "/fees": "Fees",
  "/results": "Results",
  "/profile": "Profile",
  "/notifications": "Notifications",
};

const SIDEBAR_KEY = "student_sidebar_collapsed";

export const AppShell = () => {
  const { mode, toggle } = useTheme();
  const { student } = useAuth();
  const location = useLocation();
  const pageTitle = location.pathname === "/" ? (student?.school_name || "Dashboard") : (PAGE_TITLES[location.pathname] || "School Office");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "1");

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="app-shell">
      {/* Desktop sidebar — collapsible to icon-only, same pattern as the admin console */}
      <aside className="hide-mobile" style={{
        width: collapsed ? 76 : 248, flexShrink: 0, borderRight: "1px solid var(--border)",
        padding: collapsed ? "28px 12px" : "28px 18px", display: "flex", flexDirection: "column", gap: 4,
        position: "sticky", top: 0, height: "100dvh", overflow: "hidden",
        transition: "width 0.22s var(--ease), padding 0.22s var(--ease)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brand logoOnly />
        </div>
        <div style={{ height: 28 }} />
        {NAV.map((item) => (
          <SideLink key={item.to} {...item} collapsed={collapsed} />
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={toggleCollapsed}
          className="btn btn-ghost"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ width: "100%", justifyContent: collapsed ? "center" : "flex-start", marginBottom: 4 }}
        >
          <Icon name="menu" size={17} />
          {!collapsed && <span style={{ marginLeft: 8, fontSize: 13 }}>Collapse</span>}
        </button>
        <ThemeToggle mode={mode} toggle={toggle} full={!collapsed} />
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
          <div className="hide-mobile" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
            {pageTitle}
          </div>
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

const Brand = ({ compact = false, logoOnly = false }: { compact?: boolean; logoOnly?: boolean }) => {
  const { student } = useAuth();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", minWidth: 0 }}>
      {student?.logo_url ? (
        <img src={student.logo_url} alt="" style={{ width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: 9, objectFit: "contain", background: "#fff", flexShrink: 0 }} />
      ) : (
        <div style={{
          width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: 9, background: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: compact ? 12 : 14,
        }}>SO</div>
      )}
      {!logoOnly && (
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: compact ? 15 : 16, lineHeight: 1.1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {student?.school_name || "School Office"}
        </div>
      )}
    </div>
  );
};

const SideLink = ({ to, label, icon, end, collapsed }: { to: string; label: string; icon: any; end?: boolean; collapsed?: boolean }) => (
  <NavLink to={to} end={end} title={collapsed ? label : ""} style={({ isActive }) => ({
    display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "11px" : "11px 12px",
    justifyContent: collapsed ? "center" : "flex-start", borderRadius: 12,
    color: isActive ? "#fff" : "var(--text-muted)",
    background: isActive ? "var(--brand)" : "transparent",
    fontWeight: 600, fontSize: 14, transition: "background 0.15s var(--ease)",
  })}>
    <Icon name={icon} size={19} />
    {!collapsed && label}
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
