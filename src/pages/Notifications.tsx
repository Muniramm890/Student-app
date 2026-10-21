// FILE: student-app/src/pages/Notifications.tsx
// Chat-style Inbox: announcements & school messages arrive as conversations. If the sender allowed replies,
// you can reply — only the sender / school office sees it (private thread). Unlimited back-and-forth.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { StudentApi } from "../api/client";
import { Icon } from "../components/ui/Icon";
import { SkeletonBlock } from "../components/ui/Skeleton";
import { ChatThread } from "../components/chat/ChatThread";
import { useChatThread, type ChatMsg } from "../hooks/useChatThread";
import { buildReplyForm, type Prepared } from "../utils/chatMedia";
import { usePolling } from "../hooks/usePolling";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useVisualViewport } from "../hooks/useVisualViewport";
import { isNative } from "../native";

type InboxItem = {
  message_id: string; title: string; category: string; source_module?: string; kind?: string;
  preview?: string; unread: number; last_reply_body?: string; last_reply_side?: string;
  last_activity_at: string; created_at: string;
};

const CAT: Record<string, { label: string; color: string }> = {
  general: { label: "General", color: "var(--info)" },
  exam: { label: "Exam", color: "#A855F7" },
  fee: { label: "Fee", color: "var(--warning)" },
  event: { label: "Event", color: "#06B6D4" },
  emergency: { label: "Emergency", color: "var(--danger)" },
};
const SOURCE_LABEL: Record<string, string> = { substitution: "Update" };
const catOf = (c: { category?: string; kind?: string }) => CAT[c.category || "general"] || CAT.general;

export const notifyInboxChanged = () => window.dispatchEvent(new Event("inbox:changed"));

const shortTime = (d?: string) => {
  if (!d) return "";
  const x = new Date(d), now = new Date();
  if (x.toDateString() === now.toDateString()) return x.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (now.getTime() - x.getTime() < 6 * 86400000) return x.toLocaleDateString("en-IN", { weekday: "short" });
  return x.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ── one open conversation ──
const Conversation = ({ messageId, onBack, onOpened, showBack }: { messageId: string; onBack: () => void; onOpened: () => void; showBack: boolean }) => {
  const load = useCallback(async () => {
    const res: any = await StudentApi.conversation(messageId);
    const d = res?.data || {};
    return { meta: d, replies: (d.replies || []) as ChatMsg[], receipts: d.receipts || [] };
  }, [messageId]);
  const poll = useCallback(async (since: number) => {
    const res: any = await StudentApi.conversationReplies(messageId, since);
    return (res?.data || { replies: [] }) as { replies: ChatMsg[]; receipts?: any[] };
  }, [messageId]);
  const send = useCallback(async (body: string, cid: string, prepared?: Prepared | null) => {
    const res: any = await StudentApi.sendReply(messageId, buildReplyForm(body, cid, prepared));
    return res.data as ChatMsg;
  }, [messageId]);

  const t = useChatThread<any>({ threadKey: messageId, load, poll, send, ownSide: "recipient" });
  useEffect(() => { if (t.meta) onOpened(); }, [t.meta?.message_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const m = t.meta;
  const label = m ? (m.kind === "system" ? SOURCE_LABEL[m.source_module] || "Update" : catOf(m).label) : "";
  const closedNote = m && !m.can_reply
    ? (m.allow_replies ? "Replies are closed for this message." : "Replies are turned off for this message.")
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)", minHeight: 58, flexShrink: 0 }}>
        {showBack && (
          <button className="btn btn-ghost" onClick={onBack} aria-label="Back"
            style={{ width: 40, height: 40, padding: 0, flexShrink: 0, justifyContent: "center", touchAction: "manipulation" }}>
            <Icon name="chevronLeft" size={20} />
          </button>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m?.title || "…"}</div>
          {m && <div style={{ fontSize: 11.5, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}{m.created_by_name ? ` · from ${m.created_by_name}` : ""}</div>}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatThread
          announcement={m ? { id: m.message_id, title: m.title, body: m.body, created_at: m.created_at, created_by_name: m.created_by_name, attachments: m.attachments, label } : null}
          messages={t.messages} ownSide="recipient" canReply={!!m?.can_reply} closedNote={closedNote}
          onSend={t.send} onRetry={t.retry} sending={t.sending} loading={t.loading} error={t.error}
          privacyNote="Only the sender and school office can see your reply."
          emptyHint={m?.can_reply ? "You can reply to this message. Your reply stays private." : ""}
        />
      </div>
    </div>
  );
};

export const Notifications = () => {
  const { messageId } = useParams();
  const nav = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 900px)");
  // Phone: open chat takes the visible area only (keyboard-safe)
  const vp = useVisualViewport(!isDesktop && !!messageId);
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [error, setError] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);

  const loadList = useCallback(async (silent?: boolean) => {
    try {
      const res: any = await StudentApi.inbox(50);
      setItems(Array.isArray(res?.data) ? res.data : []);
      setError("");
    } catch (e: any) { if (!silent) setError(e?.message || "Could not load messages"); }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  usePolling(() => loadList(true), 20000);
  useEffect(() => {
    const h = () => loadList(true);
    window.addEventListener("inbox:changed", h);
    return () => window.removeEventListener("inbox:changed", h);
  }, [loadList]);

  const visible = useMemo(() => (items || []).filter((c) => !onlyUnread || c.unread), [items, onlyUnread]);
  const unreadTotal = useMemo(() => (items || []).filter((c) => c.unread).length, [items]);

  const open = (id: string) => nav(`/notifications/${id}`);
  const back = () => { if (window.history.state && window.history.state.idx > 0) nav(-1); else nav("/notifications", { replace: true }); };
  const onOpened = useCallback(() => {
    setItems((p) => p && p.map((c) => (c.message_id === messageId ? { ...c, unread: 0 } : c)));
    notifyInboxChanged();
  }, [messageId]);

  const list = (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: isDesktop ? "100%" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h1 style={{ fontSize: 24, flex: 1 }}>{isDesktop ? "Inbox" : "Notifications"}</h1>
        {unreadTotal > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", background: "var(--brand-light)", padding: "3px 10px", borderRadius: 100 }}>{unreadTotal} new</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {([["all", "All"], ["unread", "Unread"]] as const).map(([k, l]) => {
          const on = (k === "unread") === onlyUnread;
          return (
            <button key={k} onClick={() => setOnlyUnread(k === "unread")}
              style={{ padding: "6px 14px", borderRadius: 100, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation",
                border: `1px solid ${on ? "var(--brand)" : "var(--border)"}`, background: on ? "var(--brand-light)" : "transparent", color: on ? "var(--brand-dark)" : "var(--text-muted)" }}>
              {l}
            </button>
          );
        })}
      </div>

      {error && <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
      {!items && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><SkeletonBlock height={64} /><SkeletonBlock height={64} /><SkeletonBlock height={64} /></div>
      )}
      {items && visible.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 36, color: "var(--text-muted)" }}>
          <Icon name="message" size={28} color="var(--text-faint)" />
          <p style={{ marginTop: 12, fontSize: 13.5 }}>{onlyUnread ? "No unread messages." : "You're all caught up — no messages yet."}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: isDesktop ? "auto" : undefined, minHeight: 0 }}>
        {visible.map((c) => {
          const on = c.message_id === messageId;
          const col = c.kind === "system" ? "var(--info)" : catOf(c).color;
          const preview = c.last_reply_body ? `${c.last_reply_side === "recipient" ? "You: " : ""}${c.last_reply_body}` : c.preview;
          return (
            <button key={c.message_id} onClick={() => open(c.message_id)}
              style={{ width: "100%", textAlign: "left", display: "flex", gap: 12, padding: "12px 10px", cursor: "pointer", fontFamily: "inherit", color: "var(--text)",
                border: "none", borderBottom: "1px solid var(--border-soft)", borderRadius: 12, background: on ? "var(--surface-alt)" : "transparent", touchAction: "manipulation" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: `color-mix(in srgb, ${col} 18%, transparent)`, color: col, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={c.kind === "system" ? "bell" : "megaphone"} size={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: c.unread ? 800 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                  <span style={{ fontSize: 11, color: c.unread ? "var(--brand)" : "var(--text-faint)", fontWeight: c.unread ? 700 : 500, flexShrink: 0 }}>{shortTime(c.last_activity_at || c.created_at)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: c.unread ? "var(--text)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
                  {c.unread ? <span style={{ minWidth: 10, height: 10, borderRadius: "50%", background: "var(--brand)", flexShrink: 0 }} /> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Desktop: list + chat side by side
  if (isDesktop) {
    return (
      <div className="enter" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, height: "calc(100vh - 130px)", minHeight: 420 }}>
        <div className="card" style={{ padding: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>{list}</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {messageId ? (
            <Conversation key={messageId} messageId={messageId} onBack={back} onOpened={onOpened} showBack={false} />
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)", textAlign: "center", padding: 24 }}>
              <Icon name="message" size={34} color="var(--text-faint)" />
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Select a message</div>
              <div style={{ fontSize: 12.5 }}>Open a message to read it and reply to your school.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Phone: list page; an opened conversation takes the whole screen (above header + bottom nav)
  return (
    <div className="enter">
      {list}
      {messageId && (
        <div
          style={{
            position: "fixed", left: 0, right: 0, zIndex: 60, background: "var(--bg)", display: "flex", flexDirection: "column",
            paddingTop: "var(--sat)", overflow: "hidden", overscrollBehavior: "contain",
            ...(vp ? { top: vp.top, height: vp.height } : { top: 0, bottom: 0 }),
            ...(vp?.keyboardOpen ? ({ "--sab": "0px" } as any) : {}),
          }}>
          {/* Android app: system back button / gesture goes back, so no on-screen back button there */}
          <Conversation key={messageId} messageId={messageId} onBack={back} onOpened={onOpened} showBack={!isNative} />
        </div>
      )}
    </div>
  );
};
