import { useCallback, useEffect, useRef, useState } from "react";
import { usePolling } from "./usePolling";

export type ChatMsg = {
  id?: string; key?: string; cid?: string; seq?: number;
  sender_side: "recipient" | "admin"; body: string; created_at: string;
  sender_name?: string | null; status?: "sending" | "failed"; error?: string;
};

const newId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`).slice(0, 36);

const bySeq = (a: ChatMsg, b: ChatMsg) => (a.seq ?? Infinity) - (b.seq ?? Infinity);

// Ek private chat thread: initial load + polling (since_seq) + optimistic send (double-tap / retry safe).
export function useChatThread<M = any>({ threadKey, load, poll, send, ownSide, enabled = true, intervalMs = 5000 }: {
  threadKey: string | null | undefined;
  load: () => Promise<{ meta: M; replies: ChatMsg[] }>;
  poll: (sinceSeq: number) => Promise<ChatMsg[]>;
  send: (body: string, clientMsgId: string) => Promise<ChatMsg>;
  ownSide: "recipient" | "admin";
  enabled?: boolean;
  intervalMs?: number;
}) {
  const [meta, setMeta] = useState<M | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const lastSeq = useRef(0);
  const gen = useRef(0); // thread badalne par purane responses ignore

  const merge = useCallback((incoming: ChatMsg[]) => {
    if (!incoming?.length) return;
    setMessages((prev) => {
      const ids = new Set(prev.filter((m) => m.id).map((m) => m.id));
      const fresh = incoming.filter((r) => !ids.has(r.id));
      if (!fresh.length) return prev;
      let rest = prev;
      fresh.forEach((r) => {
        if (r.sender_side !== ownSide) return;
        const i = rest.findIndex((m) => !m.id && m.status !== "failed" && m.sender_side === r.sender_side && m.body === r.body);
        if (i >= 0) rest = rest.filter((_, k) => k !== i);
      });
      return [...rest, ...fresh].sort(bySeq);
    });
    lastSeq.current = Math.max(lastSeq.current, ...incoming.map((r) => r.seq || 0));
  }, [ownSide]);

  const reload = useCallback(async () => {
    const my = ++gen.current;
    setLoading(true); setError("");
    try {
      const res = await load();
      if (my !== gen.current) return;
      setMeta(res.meta || null);
      setMessages(res.replies || []);
      lastSeq.current = Math.max(0, ...(res.replies || []).map((r) => r.seq || 0));
    } catch (e: any) {
      if (my === gen.current) setError(e?.message || "Failed to load");
    } finally {
      if (my === gen.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (!enabled || !threadKey) return;
    setMeta(null); setMessages([]); lastSeq.current = 0;
    reload();
    return () => { gen.current++; };
  }, [threadKey, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  usePolling(async () => {
    if (!enabled || !threadKey || loading) return;
    const my = gen.current;
    try {
      const rows = await poll(lastSeq.current);
      if (my !== gen.current) return;
      merge(rows);
    } catch { /* network blip: next tick retries */ }
  }, intervalMs, enabled && !!threadKey);

  const doSend = useCallback(async (text: string, existing?: ChatMsg) => {
    const body = String(text || "").trim();
    if (!body) return false;
    const key = existing?.key || `tmp-${newId()}`;
    const cid = existing?.cid || newId();
    const bubble: ChatMsg = { key, cid, sender_side: ownSide, body, created_at: new Date().toISOString(), status: "sending" };
    setMessages((p) => (existing ? p.map((m) => (m.key === key ? bubble : m)) : [...p, bubble]));
    setSending(true);
    try {
      const reply = await send(body, cid);
      setMessages((p) => {
        const without = p.filter((m) => m.key !== key);
        return without.some((m) => m.id === reply.id) ? without : [...without, reply].sort(bySeq);
      });
      lastSeq.current = Math.max(lastSeq.current, reply.seq || 0);
      return true;
    } catch (e: any) {
      setMessages((p) => p.map((m) => (m.key === key ? { ...m, status: "failed", error: e?.message } : m)));
      return false;
    } finally { setSending(false); }
  }, [send, ownSide]);

  const retry = useCallback((key: string) => {
    const m = messages.find((x) => x.key === key);
    if (m) doSend(m.body, m);
  }, [messages, doSend]);

  return { meta, messages, loading, error, sending, send: doSend, retry, reload };
}
