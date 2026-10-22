// FILE: student-app/src/components/layout/AppShell.tsx

import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { StudentApi } from "../../api/client";
import { registerPush } from "../../native";
import { usePolling } from "../../hooks/usePolling";

// Desktop sidebar — grouped like the admin console. Add new modules to the right group.
const SIDE_GROUPS = [
  { label: "Main", items: [{ to: "/", label: "Home", icon: "home" as const, end: true }] },
  {
    label: "Academics",
    items: [
      { to: "/attendance", label: "Attendance", icon: "attendance" as const },
      { to: "/homework", label: "Homework", icon: "book" as const },
      { to: "/tests", label: "Tests", icon: "grid" as const },
      { to: "/results", label: "Results", icon: "result" as const },
    ],
  },
  { label: "Finance", items: [{ to: "/fees", label: "Fees", icon: "fee" as const }] },
  {
    label: "Account",
    items: [
      { to: "/notifications", label: "Notifications", icon: "bell" as const, badge: true },
      { to: "/profile", label: "Profile", icon: "profile" as const },
    ],
  },
];

// Mobile bottom nav — fixed at 4 high-frequency items + a "Menu" slot. Do not add a 5th
// route icon here; every new module goes into MENU_GROUPS below instead.
const MOBILE_NAV = [
  { to: "/", label: "Home", icon: "home" as const, end: true },
  { to: "/attendance", label: "Attendance", icon: "attendance" as const },
  { to: "/homework", label: "Homework", icon: "book" as const },
  { to: "/fees", label: "Fees", icon: "fee" as const },
];

// Everything else lives in the "More" sheet, grouped by section. Add new modules here.
const MENU_GROUPS = [
  {
    label: "Academics",
    items: [
      { to: "/attendance", label: "Attendance", icon: "attendance" as const },
      { to: "/homework", label: "Homework", icon: "book" as const },
      { to: "/tests", label: "Tests", icon: "grid" as const },
      { to: "/results", label: "Results", icon: "result" as const },
    ],
  },
  {
    label: "Finance",
    items: [{ to: "/fees", label: "Fees", icon: "fee" as const }],
  },
  {
    label: "Account",
    items: [
      { to: "/profile", label: "Profile", icon: "profile" as const },
      { to: "/notifications", label: "Notifications", icon: "bell" as const },
    ],
  },
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
  const { student, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = location.pathname === "/" ? (student?.school_name || "Dashboard") : (PAGE_TITLES[location.pathname] || (location.pathname.startsWith("/notifications") ? "Notifications" : "School Office"));
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === "1");
  const [menuOpen, setMenuOpen] = useState(false);

  // push: token register (app me hi) + notification tap -> us chat ko kholo
  useEffect(() => { registerPush((t) => StudentApi.registerDevice(t)); }, []);
  useEffect(() => {
    const h = (e: Event) => {
      const d: any = (e as CustomEvent).detail || {};
      if (d.messageId) navigate(`/notifications/${d.messageId}`);
    };
    window.addEventListener("open-chat", h);
    return () => window.removeEventListener("open-chat", h);
  }, [navigate]);

  // unread chats (new announcement / new reply) -> badge on the bell
  const [unread, setUnread] = useState(0);
  const refreshUnread = useCallback(() => {
    StudentApi.inboxUnread().then((r: any) => setUnread(r?.data?.count || 0)).catch(() => {});
  }, []);
  useEffect(() => { refreshUnread(); }, [refreshUnread, location.pathname]);
  useEffect(() => {
    window.addEventListener("inbox:changed", refreshUnread);
    return () => window.removeEventListener("inbox:changed", refreshUnread);
  }, [refreshUnread]);
  usePolling(refreshUnread, 30000);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="app-shell">
      {/* Desktop sidebar — expandable, grouped, same pattern as the admin console */}
      <aside className="hide-mobile" style={{
        width: collapsed ? 70 : 230, flexShrink: 0, background: "var(--bg-elevated)",
        borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100dvh", overflow: "hidden",
        transition: "width 0.22s var(--ease)",
      }}>
        {/* Header: logo + school name, collapse toggle */}
        <div style={{
          padding: collapsed ? "16px 0" : "16px 12px 16px 14px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8, flexDirection: collapsed ? "column" : "row",
          justifyContent: collapsed ? "center" : "space-between", minHeight: 68,
        }}>
          <div style={{ minWidth: 0, flex: collapsed ? "none" : 1 }}><Brand logoOnly={collapsed} /></div>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-alt)",
              color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}
          >
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} size={15} />
          </button>
        </div>

        {/* Grouped links */}
        <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 8px" }}>
          {SIDE_GROUPS.map((g, gi) => (
            <div key={g.label}>
              {collapsed ? (
                gi > 0 && <div style={{ height: 1, background: "var(--border-soft)", margin: "8px 10px" }} />
              ) : (
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", padding: "14px 12px 6px", letterSpacing: 0.4 }}>{g.label}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {g.items.map((item: any) => (
                  <SideLink key={item.to} {...item} collapsed={collapsed} count={item.badge ? unread : 0} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: profile card + theme + logout */}
        <div style={{ borderTop: "1px solid var(--border)", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <NavLink to="/profile" title={collapsed ? "My profile" : ""} style={{
            display: "flex", alignItems: "center", gap: 10, padding: collapsed ? 6 : "8px 10px", borderRadius: 12,
            background: "var(--surface-alt)", justifyContent: collapsed ? "center" : "flex-start", minWidth: 0,
          }}>
            <Avatar url={student?.photo_url} name={student?.first_name} />
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {[student?.first_name, student?.last_name].filter(Boolean).join(" ") || "Student"}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>View profile</div>
              </div>
            )}
          </NavLink>
          <div style={{ display: "flex", gap: 6, flexDirection: collapsed ? "column" : "row" }}>
            <div style={{ flex: 1 }}><ThemeToggle mode={mode} toggle={toggle} full={!collapsed} /></div>
            <button
              onClick={logout}
              aria-label="Logout"
              title="Logout"
              className="btn btn-ghost"
              style={{ width: collapsed ? "100%" : 38, height: 38, padding: 0, borderRadius: 12, color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border-soft)",
          padding: "calc(12px + var(--sat)) 16px 12px",
        }}>
          <div style={{
            maxWidth: 1120, margin: "0 auto", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div className="hide-desktop" style={{ minWidth: 0, overflow: "hidden", flex: "1 1 auto" }}><Brand compact /></div>
            <div className="hide-mobile" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              {pageTitle}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", flexShrink: 0 }}>
              <span className="hide-mobile" style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                Hi, {student?.first_name || "Student"}
              </span>
              <NavLink to="/notifications" aria-label="Notifications" style={{
                width: 38, height: 38, borderRadius: 12, background: "var(--surface-alt)",
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
              }}>
                <Icon name="bell" size={18} />
                {unread > 0 && (
                  <span style={{
                    position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 100,
                    background: "var(--danger)", color: "#fff", fontSize: 10.5, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg)",
                  }}>{unread > 9 ? "9+" : unread}</span>
                )}
              </NavLink>
              <div className="hide-desktop"><ThemeToggle mode={mode} toggle={toggle} /></div>
              <Avatar url={student?.photo_url} name={student?.first_name} />
            </div>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav — fixed 4 + Menu, never more */}
      <nav className="hide-desktop" style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
        background: "var(--bg-elevated)", borderTop: "1px solid var(--border)",
        paddingBottom: "var(--sab)",
        display: "flex", justifyContent: "space-around",
      }}>
        {MOBILE_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            padding: "9px 2px 7px", color: isActive ? "var(--brand)" : "var(--text-faint)",
            fontSize: 10.5, fontWeight: 600, flex: "1 1 0", minWidth: 0, minHeight: 54,
          })}>
            <Icon name={item.icon} size={21} />
            <span style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            padding: "9px 2px 7px", color: "var(--text-faint)",
            fontSize: 10.5, fontWeight: 600, flex: "1 1 0", minWidth: 0, minHeight: 54, background: "none", border: "none",
          }}
        >
          <Icon name="menu" size={21} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Grouped "More" sheet — every module beyond the fixed 4 lives here */}
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <p style={{
                fontSize: 11.5, fontWeight: 700, color: "var(--text-faint)",
                textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8,
              }}>
                {group.label}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 10px", borderRadius: 12,
                      color: isActive ? "var(--brand)" : "var(--text)",
                      background: isActive ? "var(--brand-light)" : "transparent",
                      fontWeight: 600, fontSize: 14.5,
                    })}
                  >
                    <Icon name={item.icon} size={19} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

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

const SideLink = ({ to, label, icon, end, collapsed, count = 0 }: { to: string; label: string; icon: any; end?: boolean; collapsed?: boolean; count?: number }) => (
  <NavLink to={to} end={end} title={collapsed ? label : ""} style={({ isActive }) => ({
    display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "10px 0" : "10px 12px",
    justifyContent: collapsed ? "center" : "flex-start", borderRadius: 10, position: "relative",
    color: isActive ? "var(--brand)" : "var(--text-muted)",
    background: isActive ? "var(--brand-light)" : "transparent",
    boxShadow: isActive && !collapsed ? "inset 3px 0 0 var(--brand)" : "none",
    fontWeight: isActive ? 700 : 600, fontSize: 14, whiteSpace: "nowrap", transition: "background 0.15s var(--ease), color 0.15s var(--ease)",
  })}>
    <Icon name={icon} size={19} />
    {!collapsed && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
    {count > 0 && (
      <span style={{
        ...(collapsed ? { position: "absolute", top: 3, right: 10 } : {}),
        minWidth: 18, height: 18, padding: "0 5px", borderRadius: 100, background: "var(--danger)", color: "#fff",
        fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
      }}>{count > 9 ? "9+" : count}</span>
    )}
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
