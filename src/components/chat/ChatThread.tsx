import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../ui/Icon";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import type { ChatMsg } from "../../hooks/useChatThread";

const fmtClock = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const dayKey = (d: string) => new Date(d).toDateString();
const dayLabel = (d: string) => {
  const x = new Date(d), t = new Date(), y = new Date(Date.now() - 86400000);
  if (x.toDateString() === t.toDateString()) return "Today";
  if (x.toDateString() === y.toDateString()) return "Yesterday";
  return x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

type Announcement = {
  id: string; title: string; body: string; created_at?: string; created_by_name?: string; label?: string;
  attachments?: { id: string; file_name: string; file_url: string; file_type: string }[];
};

// Announcement (school ka original message) ek card ki tarah, uske neeche private reply bubbles.
export const ChatThread = ({
  announcement, messages, ownSide, canReply, closedNote, onSend, onRetry,
  sending, loading, error, privacyNote, placeholder = "Write a reply…", emptyHint,
}: {
  announcement: Announcement | null; messages: ChatMsg[]; ownSide: "recipient" | "admin";
  canReply: boolean; closedNote?: string; onSend: (t: string) => Promise<any>; onRetry?: (key: string) => void;
  sending?: boolean; loading?: boolean; error?: string; privacyNote?: string; placeholder?: string; emptyHint?: string;
}) => {
  const isTouch = useMediaQuery("(max-width: 899px)");
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const ta = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");

  const onScroll = () => {
    const el = scroller.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);
  useEffect(() => { stick.current = true; }, [announcement?.id]);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    stick.current = true;
    await onSend(t);
  };
  const onKey = (e: React.KeyboardEvent) => {
    // desktop: Enter = send, Shift+Enter = new line.  phone: Enter = new line
    if (e.key === "Enter" && !e.shiftKey && !isTouch) { e.preventDefault(); submit(); }
  };

  let lastDay: string | null = null;
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div ref={scroller} onScroll={onScroll} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        {announcement && (
          <div style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", borderLeft: "4px solid var(--brand)", borderRadius: 14, padding: 14, marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6, flexWrap: "wrap" }}>
              <Icon name="megaphone" size={13} />
              <span style={{ fontWeight: 700, color: "var(--brand)" }}>{announcement.label || "Announcement"}</span>
              {announcement.created_by_name && <span>· {announcement.created_by_name}</span>}
              {announcement.created_at && <span>· {dayLabel(announcement.created_at)}, {fmtClock(announcement.created_at)}</span>}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, marginBottom: 6, wordBreak: "break-word" }}>{announcement.title}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{announcement.body}</div>
            {!!announcement.attachments?.length && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {announcement.attachments.map((a) =>
                  a.file_type === "image" ? (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer">
                      <img src={a.file_url} alt={a.file_name} style={{ maxWidth: "100%", borderRadius: 10, display: "block" }} />
                    </a>
                  ) : (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, textDecoration: "none", color: "var(--text)", fontSize: 13 }}>
                      <Icon name="file" size={14} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.file_name}</span>
                      <Icon name="download" size={13} />
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12.5, padding: 12 }}>Loading…</div>}
        {error && !loading && <div style={{ textAlign: "center", color: "var(--danger)", fontSize: 12.5, padding: 8 }}>{error}</div>}
        {!loading && messages.length === 0 && emptyHint && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12.5, padding: "18px 12px", lineHeight: 1.5 }}>{emptyHint}</div>
        )}

        {messages.map((m) => {
          const mine = m.sender_side === ownSide;
          const dk = dayKey(m.created_at);
          const showDay = dk !== lastDay;
          lastDay = dk;
          return (
            <div key={m.id || m.key}>
              {showDay && (
                <div style={{ textAlign: "center", margin: "8px 0" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--surface-alt)", padding: "3px 10px", borderRadius: 100 }}>{dayLabel(m.created_at)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "80%", minWidth: 0 }}>
                  {!mine && m.sender_name && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2, marginLeft: 4 }}>{m.sender_name}</div>}
                  <div style={{
                    padding: "9px 13px", borderRadius: 16, borderBottomRightRadius: mine ? 4 : 16, borderBottomLeftRadius: mine ? 16 : 4,
                    background: mine ? "var(--brand)" : "var(--surface-alt)", color: mine ? "#fff" : "var(--text)",
                    border: mine ? "none" : "1px solid var(--border)", fontSize: 13.5, lineHeight: 1.5,
                    whiteSpace: "pre-wrap", wordBreak: "break-word", opacity: m.status === "sending" ? 0.6 : 1,
                  }}>
                    {m.body}
                  </div>
                  <div style={{ fontSize: 10.5, color: m.status === "failed" ? "var(--danger)" : "var(--text-faint)", marginTop: 2, textAlign: mine ? "right" : "left", padding: "0 4px" }}>
                    {m.status === "failed" ? (
                      <span>Not sent · <button onClick={() => m.key && onRetry?.(m.key)} style={{ background: "none", border: "none", color: "var(--danger)", fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>Retry</button></span>
                    ) : m.status === "sending" ? "Sending…" : fmtClock(m.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {canReply ? (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 12px calc(10px + var(--sab))", background: "var(--bg-elevated)" }}>
          {privacyNote && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Icon name="eye" size={11} /> {privacyNote}</div>}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={ta} rows={1} value={text} maxLength={2000} placeholder={placeholder}
              onChange={(e) => setText(e.target.value)} onKeyDown={onKey}
              style={{ flex: 1, resize: "none", padding: "10px 12px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-alt)", color: "var(--text)", fontFamily: "inherit", fontSize: isTouch ? 16 : 13.5, lineHeight: 1.4, outline: "none", maxHeight: 120 }}
            />
            <button
              className="btn btn-primary" onClick={submit} disabled={!text.trim() || sending} title="Send"
              style={{ width: 42, height: 42, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}
            >
              <Icon name="send" size={17} />
            </button>
          </div>
        </div>
      ) : (
        closedNote && <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px calc(12px + var(--sab))", fontSize: 12.5, color: "var(--text-muted)", textAlign: "center", background: "var(--bg-elevated)" }}>{closedNote}</div>
      )}
    </div>
  );
};
