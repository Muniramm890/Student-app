// FILE: student-app/src/pages/Tests.tsx
//


import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { StudentApi } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";
import { SkeletonBlock } from "../components/ui/Skeleton";

// ── GAS bridge — same action/payload contract as the old module ──────────
const gasRequest = async (action: string, payload: Record<string, unknown> = {}) => {
  const res: any = await StudentApi.quickTestsGasSync(action, payload);
  if (!res?.status && !res?.success) throw new Error(res?.message || "Request failed");
  return res;
};

// ── Status meta for the question palette (colors now pull from tokens) ───
const STATUS_META: Record<string, { label: string; textVar: string; bgVar: string }> = {
  unattempted: { label: "Not Visited", textVar: "var(--text-faint)", bgVar: "var(--surface-alt)" },
  attempted: { label: "Answered", textVar: "#04120F", bgVar: "var(--success)" },
  marked: { label: "Marked", textVar: "#2A1600", bgVar: "var(--warning)" },
  "ans-marked": { label: "Answered & Marked", textVar: "#fff", bgVar: "#A78BFA" },
};

const scopedStyles = `
  .qt-full{position:fixed;inset:0;z-index:9000;background:var(--bg);display:flex;flex-direction:column;font-family:var(--font-body);color:var(--text);}
  .qt-full *{box-sizing:border-box;}
  .qt-mono{font-family:'JetBrains Mono',monospace;}
  .qt-btn{border:none;cursor:pointer;border-radius:12px;font-weight:700;transition:transform .12s,opacity .15s;display:inline-flex;align-items:center;justify-content:center;gap:8px;}
  .qt-btn:active{transform:scale(0.96);}
  .qt-btn:disabled{opacity:.4;cursor:not-allowed;}
  .qt-header{flex-shrink:0;background:var(--bg-elevated);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:calc(10px + var(--sat)) 16px 10px;gap:12px;}
  .qt-body{flex:1;display:flex;overflow:hidden;min-height:0;}
  .qt-main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;}
  .qt-scroll{flex:1;overflow-y:auto;padding:20px 16px calc(20px + var(--sab));}
  .qt-footer{flex-shrink:0;background:var(--bg-elevated);border-top:1px solid var(--border);display:flex;align-items:center;gap:8px;padding:10px 16px calc(10px + var(--sab));flex-wrap:wrap;}
  .qt-rail{background:var(--surface);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .28s var(--ease);flex-shrink:0;}
  .qt-rail.open{width:min(300px,32vw);}
  .qt-rail.closed{width:0;opacity:0;border-left:none;}
  @media(max-width:900px){ .qt-rail{display:none;} }
  .qt-palette-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:7px;}
  .qt-pnum{aspect-ratio:1;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;cursor:pointer;border:1.5px solid transparent;}
  .qt-pnum:active{transform:scale(0.9);}
  .qt-opt{display:flex;align-items:flex-start;gap:12px;padding:14px;border-radius:14px;cursor:pointer;border:1.5px solid var(--border);background:var(--surface-alt);margin-bottom:8px;font-size:14.5px;line-height:1.5;}
  .qt-opt.selected{border-color:var(--brand);background:var(--brand-light);color:var(--brand-dark);}
  .qt-opt-key{width:26px;height:26px;flex-shrink:0;border-radius:8px;background:var(--surface-hover);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:11.5px;font-weight:700;color:var(--text-muted);}
  .qt-opt.selected .qt-opt-key{background:var(--brand);color:#fff;}
  .qt-timer-pill{display:flex;align-items:center;gap:6px;background:var(--surface-alt);border:1px solid var(--border);padding:7px 12px;border-radius:100px;flex-shrink:0;}
  .qt-cam-pill{border-radius:9px;overflow:hidden;border:2px solid var(--danger);background:#000;position:relative;flex-shrink:0;width:56px;height:38px;}
  .qt-cam-pill video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);}
  .qt-live-dot{position:absolute;top:3px;right:3px;width:5px;height:5px;border-radius:50%;background:var(--danger);animation:qtBlink 1.4s infinite;}
  @keyframes qtBlink{0%,100%{opacity:1;}50%{opacity:.3;}}
  .qt-avatar{border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;background:var(--brand-light);color:var(--brand-dark);}
  .qt-input{width:100%;background:var(--surface-alt);border:1.5px solid var(--border);border-radius:12px;padding:12px 14px;color:var(--text);font-size:14.5px;outline:none;}
  .qt-input:focus{border-color:var(--brand);}
  .qt-lib-card{cursor:pointer;transition:transform .15s;}
  .qt-lib-card:active{transform:scale(0.98);}
`;

// ═══════════════════════════════════════════════════════════════
// Confirm dialog — thin wrapper over the app's own Modal
// ═══════════════════════════════════════════════════════════════
const ConfirmModal = ({ open, title, message, confirmLabel = "Yes", cancelLabel = "Cancel", danger, onConfirm, onCancel }: any) => (
  <Modal open={open} onClose={onCancel} title={title}>
    <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>{message}</p>
    <div style={{ display: "flex", gap: 10 }}>
      {onCancel && (
        <button className="btn btn-ghost" style={{ flex: 1, padding: 12 }} onClick={onCancel}>{cancelLabel}</button>
      )}
      <button
        className="btn"
        style={{ flex: 1, padding: 12, background: danger ? "var(--danger)" : "var(--brand)", color: "#fff" }}
        onClick={onConfirm}
      >
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

// ═══════════════════════════════════════════════════════════════
// Proctoring — camera pill + interval snapshots (unchanged logic)
// ═══════════════════════════════════════════════════════════════
const useProctor = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null); // the real DOM node, used for canvas drawing
  const snapshotsRef = useRef<string[]>([]);
  const intervalRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

  // Callback ref: fires whenever React actually mounts/unmounts the <video>
  // element, whenever that happens (even after the stream already exists) —
  // fixes the black-frame bug where the video tag mounts *after* start()
  // already ran, so a plain useRef never got the stream attached.
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    videoElRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play?.().catch(() => {});
    }
  }, []);

  const takeSnapshot = useCallback(() => {
    const v = videoElRef.current;
    if (!v || !streamRef.current || !v.videoWidth) return; // videoWidth=0 means no frame decoded yet — avoid black capture
    const canvas = document.createElement("canvas");
    canvas.width = 480; canvas.height = 360;
    canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
    snapshotsRef.current.push(canvas.toDataURL("image/jpeg", 0.85));
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoElRef.current) {
        videoElRef.current.srcObject = stream;
        videoElRef.current.play?.().catch(() => {});
      }
      setReady(true); setDenied(false);
      setTimeout(takeSnapshot, 2500);
      intervalRef.current = setInterval(takeSnapshot, 120000);
      return true;
    } catch {
      setDenied(true);
      return false;
    }
  }, [takeSnapshot]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null; setReady(false);
    return snapshotsRef.current;
  }, []);

  return { videoRef, ready, denied, start, stop };
};

// ═══════════════════════════════════════════════════════════════
// Palette content — reused in desktop rail + mobile Modal sheet
// ═══════════════════════════════════════════════════════════════
const PaletteContent = ({ student, status, currentIndex, onJump }: any) => {
  const initials = (student?.first_name?.[0] || "S").toUpperCase();
  const counts: Record<string, number> = { attempted: 0, marked: 0, "ans-marked": 0, unattempted: 0 };
  status.forEach((s: string) => { counts[s] = (counts[s] || 0) + 1; });

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div className="qt-avatar" style={{ width: 44, height: 44, fontSize: 16 }}>
          {student?.photo_url ? <img src={student.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student?.first_name} {student?.last_name || ""}</div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{student?.class_name} · {student?.section_name}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {(["attempted", "unattempted", "marked", "ans-marked"] as const).map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_META[k].bgVar, border: k === "unattempted" ? "1px solid var(--border)" : "none", flexShrink: 0 }} />
            {STATUS_META[k].label} · {counts[k] || 0}
          </div>
        ))}
      </div>

      <div className="qt-palette-grid">
        {status.map((st: string, i: number) => {
          const isCurrent = i === currentIndex;
          const meta = STATUS_META[st];
          return (
            <button
              key={i}
              className="qt-pnum qt-mono"
              onClick={() => onJump(i)}
              style={{
                background: isCurrent ? "transparent" : meta.bgVar,
                color: isCurrent ? "var(--brand)" : meta.textVar,
                borderColor: isCurrent ? "var(--brand)" : "transparent",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// Question render — type-aware (MCQ / True-False / Fill-blank / Descriptive)
// ═══════════════════════════════════════════════════════════════
const QuestionView = ({ q, value, onChange }: any) => {
  const type = (q.qType || q.type || "MCQ").toUpperCase();
  const isMcqLike = type === "MCQ" || type === "TF";
  const opts = Array.isArray(q.options) ? q.options.filter((o: string) => o && o !== "N/A") : [];

  return (
    <div className="enter">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span className="qt-mono" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--brand)", background: "var(--brand-light)", padding: "5px 12px", borderRadius: 100 }}>{type}</span>
        {q.marks != null && <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 700 }}>{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600, lineHeight: 1.6, marginBottom: 20, whiteSpace: "pre-wrap" }}>{q.text}</div>
      {q.image && <img src={q.image} alt="" style={{ maxWidth: "100%", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 20 }} />}

      {isMcqLike && opts.length > 0 && opts.map((opt: string, i: number) => {
        const selected = value === opt;
        return (
          <label key={i} className={`qt-opt ${selected ? "selected" : ""}`}>
            <input type="radio" name="qt-ans" checked={selected} onChange={() => onChange(opt)} style={{ display: "none" }} />
            <div className="qt-opt-key">{String.fromCharCode(65 + i)}</div>
            <span>{opt}</span>
          </label>
        );
      })}

      {type === "FIB" && <input className="qt-input" placeholder="Type your answer…" value={value || ""} onChange={(e) => onChange(e.target.value)} />}
      {type === "DESC" && <textarea className="qt-input" rows={6} placeholder="Write your answer…" value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ resize: "vertical" }} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Test Engine — full-screen exam-taking experience
// ═══════════════════════════════════════════════════════════════
const TestEngine = ({ testId, student, onExit, onSubmitted }: any) => {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [answers, setAnswers] = useState<any[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [timeSpent, setTimeSpent] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [railOpen, setRailOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qElapsed, setQElapsed] = useState(0);
  const [showCamDenied, setShowCamDenied] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const proctor = useProctor();
  const endTimeRef = useRef(0);
  const qStartRef = useRef(Date.now());
  const timerRef = useRef<any>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setLoadError("");
      try {
        const res: any = await gasRequest("fetchTest", {
          testId, verifiedRole: "STUDENT",
          studentClass: student?.class_name, studentSection: student?.section_name,
        });
        const data = res.data || res;
        if (cancelled) return;
        if (!data?.questions?.length) throw new Error("This test has no questions.");

        const camOk = await proctor.start();
        if (cancelled) return;
        if (!camOk) { setShowCamDenied(true); setLoading(false); return; }

        setQuestions(data.questions);
        setMeta(data.meta || {});
        setAnswers(new Array(data.questions.length).fill(null));
        setStatus(new Array(data.questions.length).fill("unattempted"));
        setTimeSpent(new Array(data.questions.length).fill(0));

        const key = `qt_end_${testId}`;
        const saved = localStorage.getItem(key);
        const durationMin = Number(data.meta?.duration || data.meta?.time || 20);
        let end;
        if (saved && Number(saved) > Date.now()) end = Number(saved);
        else { end = Date.now() + durationMin * 60000; localStorage.setItem(key, String(end)); }
        endTimeRef.current = end;
        setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
        qStartRef.current = Date.now();
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) { setLoadError(e.message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [testId]); // eslint-disable-line

  useEffect(() => {
    if (loading || loadError) return;
    timerRef.current = setInterval(() => {
      const diff = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      setTimeLeft(Math.max(0, diff));
      setQElapsed(Math.floor((Date.now() - qStartRef.current) / 1000));
      if (diff <= 0) { clearInterval(timerRef.current); handleSubmit(true); }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, loadError]); // eslint-disable-line

  const recordTime = useCallback(() => {
    const spent = Math.floor((Date.now() - qStartRef.current) / 1000);
    if (spent > 0) setTimeSpent((prev) => { const n = [...prev]; n[currentIndex] += spent; return n; });
  }, [currentIndex]);

  const goTo = (idx: number) => {
    if (idx === currentIndex) return;
    recordTime();
    setCurrentIndex(idx);
    qStartRef.current = Date.now();
    setQElapsed(0);
    setSheetOpen(false);
  };

  const handleAnswer = (val: any) => {
    setAnswers((prev) => { const n = [...prev]; n[currentIndex] = val; return n; });
    setStatus((prev) => {
      const n = [...prev];
      n[currentIndex] = (n[currentIndex] === "marked" || n[currentIndex] === "ans-marked") ? "ans-marked" : "attempted";
      return n;
    });
  };

  const clearAnswer = () => {
    setAnswers((prev) => { const n = [...prev]; n[currentIndex] = null; return n; });
    setStatus((prev) => { const n = [...prev]; n[currentIndex] = "unattempted"; return n; });
  };

  const toggleMark = () => {
    setStatus((prev) => { const n = [...prev]; n[currentIndex] = answers[currentIndex] ? "ans-marked" : "marked"; return n; });
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1); else recordTime();
  };

  const handleSubmit = async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    recordTime();
    clearInterval(timerRef.current);
    localStorage.removeItem(`qt_end_${testId}`);

    let correct = 0, incorrect = 0, unattempted = 0;
    const listC: number[] = [], listI: number[] = [], listU: number[] = [];
    questions.forEach((q, i) => {
      const ans = answers[i];
      const type = (q.qType || q.type || "MCQ").toUpperCase();
      const key = String(q.correctAnswer || q.correct || "").trim();
      if (!ans) { unattempted++; listU.push(i + 1); return; }
      if (type === "DESC") return;
      const isCorrect = type === "FIB" ? String(ans).trim().toLowerCase() === key.toLowerCase() : ans === key;
      if (isCorrect) { correct++; listC.push(i + 1); } else { incorrect++; listI.push(i + 1); }
    });

    const durationMin = Number(meta.duration || meta.time || 20);
    const spentTotal = timeLeft <= 0 ? durationMin * 60 : durationMin * 60 - timeLeft;
    const mm = Math.floor(spentTotal / 60), ss = spentTotal % 60;
    const snapshots = proctor.stop();

    try {
      await gasRequest("submitResult", {
        uid: student?.id, name: `${student?.first_name || ""} ${student?.last_name || ""}`.trim(),
        testId, testname: meta.testName, chapter: meta.chapterName, chapterNumber: meta.chapterNo || 0,
        total: questions.length, correct, incorrect, unattempted,
        score: Math.round((correct / questions.length) * 100),
        qCorrect: listC.join(","), qIncorrect: listI.join(","), qNotAttempted: listU.join(","),
        timeTaken: `${mm}m ${ss}s`, totalTime: `${durationMin}m`,
        className: student?.class_name,
        userAnswers: JSON.stringify(answers),
        timeSpent: JSON.stringify(timeSpent),
        proctorSnapshots: JSON.stringify(snapshots),
      });
      onSubmitted({ score: Math.round((correct / questions.length) * 100), correct, incorrect, unattempted, total: questions.length, auto });
    } catch (e: any) {
      submittedRef.current = false;
      setSubmitting(false);
      show(`Submission failed: ${e.message}. Please try again.`, "error");
    }
  };

  const fmtTime = (secs: number) => {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    const mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };
  const timerColor = timeLeft < 60 ? "var(--danger)" : timeLeft < 300 ? "var(--warning)" : "var(--text-muted)";
  const answeredCount = status.filter((s) => s === "attempted" || s === "ans-marked").length;

  if (loadError) {
    return (
      <div className="qt-full" style={{ alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{scopedStyles}</style>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <Icon name="alert" size={40} color="var(--danger)" />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: "14px 0 8px" }}>Couldn't load test</div>
          <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 20 }}>{loadError}</p>
          <button className="btn btn-primary" style={{ padding: "12px 24px" }} onClick={onExit}>Go Back</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="qt-full" style={{ alignItems: "center", justifyContent: "center", gap: 16 }}>
        <style>{scopedStyles}</style>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "qtSpin 0.8s linear infinite" }} />
        <style>{`@keyframes qtSpin{to{transform:rotate(360deg);}}`}</style>
        <div style={{ color: "var(--text-muted)", fontSize: 13.5, fontWeight: 600 }}>Preparing your exam…</div>
        <ConfirmModal
          open={showCamDenied} danger title="Camera access required"
          message="This exam is proctored and needs your camera to begin. Please allow camera access in your browser settings, then try again."
          confirmLabel="Try Again" cancelLabel="Exit"
          onConfirm={async () => { setShowCamDenied(false); setLoading(true); const ok = await proctor.start(); if (!ok) setShowCamDenied(true); else setLoading(false); }}
          onCancel={onExit}
        />
      </div>
    );
  }

  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="qt-full">
      <style>{scopedStyles}</style>
      <div className="qt-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
            {(meta.subject || "T")[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.testName || "Assessment"}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".03em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.chapterName || meta.subject}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div className="qt-cam-pill">
            <video ref={proctor.videoRef} muted playsInline autoPlay />
            <div className="qt-live-dot" />
          </div>
          <div className="qt-timer-pill">
            <Icon name="clock" size={14} color={timerColor} />
            <span className="qt-mono" style={{ fontWeight: 700, fontSize: 13.5, color: timerColor }}>{fmtTime(timeLeft)}</span>
          </div>
          <button className="qt-btn" onClick={() => { if (window.innerWidth < 900) setSheetOpen(true); else setRailOpen((o) => !o); }} style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", padding: 9, borderRadius: 10 }}>
            <Icon name="grid" size={16} />
          </button>
        </div>
      </div>

      <div className="qt-body">
        <div className="qt-main">
          <div className="qt-scroll">
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span className="qt-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)", background: "var(--brand-light)", padding: "6px 14px", borderRadius: 100 }}>
                  Q {currentIndex + 1} / {questions.length}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="qt-mono" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-faint)", fontWeight: 600 }} title="Time spent on this question">
                    <Icon name="clock" size={12} /> {fmtTime(qElapsed)}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
                    <div style={{ width: 60, height: 5, borderRadius: 3, background: "var(--surface-alt)", overflow: "hidden" }}>
                      <div style={{ width: `${(answeredCount / questions.length) * 100}%`, height: "100%", background: "var(--success)", transition: "width .3s" }} />
                    </div>
                    {answeredCount}/{questions.length}
                  </div>
                </div>
              </div>
              <QuestionView key={currentIndex} q={q} value={answers[currentIndex]} onChange={handleAnswer} />
            </div>
          </div>

          <div className="qt-footer">
            <button className="btn btn-ghost" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)} style={{ padding: "12px 16px", fontSize: 13 }}>
              <Icon name="chevronLeft" size={14} /> Prev
            </button>
            <button className="btn btn-ghost" onClick={clearAnswer} style={{ padding: "12px 16px", fontSize: 13 }}>
              <Icon name="eraser" size={14} /> Clear
            </button>
            <button className="btn" onClick={toggleMark} style={{ padding: "12px 16px", fontSize: 13, background: "color-mix(in srgb, var(--warning) 16%, transparent)", color: "var(--warning)" }}>
              <Icon name="flag" size={14} /> Review
            </button>
            <button
              className="btn"
              style={{ flex: 1, minWidth: 140, padding: "12px 18px", fontSize: 13.5, background: isLast ? "var(--success)" : "var(--brand)", color: "#fff" }}
              onClick={() => { if (isLast) { recordTime(); setShowSubmitConfirm(true); } else goTo(currentIndex + 1); }}
            >
              {isLast ? <>Finish <Icon name="check" size={15} /></> : <>Next <Icon name="chevronRight" size={15} /></>}
            </button>
          </div>
        </div>

        <div className={`qt-rail ${railOpen ? "open" : "closed"}`}>
          <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
            <PaletteContent student={student} status={status} currentIndex={currentIndex} onJump={goTo} />
          </div>
          <div style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
            <button className="btn" style={{ width: "100%", padding: 12, background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }} onClick={() => setShowSubmitConfirm(true)}>
              Submit Test
            </button>
          </div>
        </div>
      </div>

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Question palette">
        <PaletteContent student={student} status={status} currentIndex={currentIndex} onJump={goTo} />
        <button className="btn" style={{ width: "100%", padding: 12, marginTop: 16, background: "color-mix(in srgb, var(--danger) 14%, transparent)", color: "var(--danger)" }} onClick={() => { setSheetOpen(false); setShowSubmitConfirm(true); }}>
          Submit Test
        </button>
      </Modal>

      <ConfirmModal
        open={showSubmitConfirm} title="Submit your test?"
        message={`You've answered ${answeredCount} of ${questions.length} questions. Once submitted, you cannot make further changes.`}
        confirmLabel={submitting ? "Submitting…" : "Yes, Submit"} cancelLabel="Keep Reviewing"
        onConfirm={() => { setShowSubmitConfirm(false); handleSubmit(false); }}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {submitting && (
        <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, border: "3px solid var(--border)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "qtSpin 0.8s linear infinite" }} />
            <div style={{ color: "var(--text)", fontWeight: 700, fontSize: 14 }}>Submitting securely…</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Result screen — shown right after submit
// ═══════════════════════════════════════════════════════════════
const ResultScreen = ({ result, onDone }: any) => {
  const pct = result.score;
  const color = pct >= 75 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="qt-full" style={{ alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{scopedStyles}</style>
      <div className="enter" style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ width: 116, height: 116, borderRadius: "50%", border: `6px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, color }}>{pct}%</span>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, marginBottom: 8 }}>
          {result.auto ? "Time's up — Test Submitted" : "Test Submitted Successfully"}
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 22 }}>Your responses have been recorded. Results may be released by your teacher separately.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
          {[["Correct", result.correct, "var(--success)"], ["Wrong", result.incorrect, "var(--danger)"], ["Skipped", result.unattempted, "var(--warning)"]].map(([label, val, c]: any) => (
            <div key={label} className="card" style={{ padding: 14 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 800, color: c }}>{val}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".03em" }}>{label}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ padding: "14px 32px", width: "100%" }} onClick={onDone}>Back to Test Library</button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// Test Library — normal in-app page: browse + "your performance"
// ═══════════════════════════════════════════════════════════════
const TestLibrary = ({ student, onStart }: any) => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await gasRequest("getTestRegistry");
        const list = (res.data || res || []).filter((t: any) => {
          const statusOk = t.status === "PUBLISHED";
          const visOk = !t.visibleTo || t.visibleTo === "ALL" || (student?.class_name && t.visibleTo.includes(String(student.class_name).replace(/[^0-9]/g, "")));
          const classOk = !t.classVal || !student?.class_name || t.classVal.toLowerCase().includes(String(student.class_name).toLowerCase().replace("class ", "")) || String(student.class_name).toLowerCase().includes(t.classVal.toLowerCase());
          return statusOk && visOk && classOk;
        });
        setTests(list);
      } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line

  const subjects = useMemo(() => [...new Set(tests.map((t) => t.subject))], [tests]);
  const chapters = useMemo(() => [...new Set(tests.filter((t) => !subject || t.subject === subject).map((t) => t.chapterName || "Mix"))], [tests, subject]);
  const filtered = tests.filter((t) => (!subject || t.subject === subject) && (!chapter || (t.chapterName || "Mix") === chapter));

  // "Your performance" — built from whatever attempt data the registry
  // sends back per test (field names guessed as myResult/attempted/score;
  // confirm exact GAS field names and adjust here once known).
  const attempted = tests.filter((t) => t.attempted || t.myResult);
  const trend = attempted.map((t, i) => ({
    name: t.testName?.slice(0, 10) || `Test ${i + 1}`,
    score: Number(t.myResult?.score ?? t.myScore ?? t.score ?? 0),
  }));
  const avgScore = trend.length ? Math.round(trend.reduce((s, t) => s + t.score, 0) / trend.length) : null;
  const bestScore = trend.length ? Math.max(...trend.map((t) => t.score)) : null;

  return (
    <div className="enter">
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Tests</h1>
      {error && <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", fontSize: 13.5, marginBottom: 16 }}>{error}</div>}

      {loading && !error && <SkeletonBlock height={220} />}

      {!loading && !error && (
        <>
          {attempted.length > 0 && (
            <div className="card" style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Your performance</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: trend.length > 1 ? 14 : 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>{attempted.length}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".03em" }}>Tests Taken</div>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--brand)" }}>{avgScore}%</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".03em" }}>Average</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "var(--success)" }}>{bestScore}%</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".03em" }}>Best Score</div>
                </div>
              </div>

              {trend.length > 1 && (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-faint)" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {tests.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13.5 }}>
              <Icon name="book" size={30} color="var(--text-faint)" />
              <p style={{ marginTop: 12 }}>No tests available right now. Check back once your teacher publishes one.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 10, paddingBottom: 2 }}>
                <FilterPill active={!subject} onClick={() => { setSubject(""); setChapter(""); }} label="All Subjects" />
                {subjects.map((s) => <FilterPill key={s} active={subject === s} onClick={() => { setSubject(s); setChapter(""); }} label={s} />)}
              </div>
              {subject && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 18, paddingBottom: 2 }}>
                  <FilterPill subtle active={!chapter} onClick={() => setChapter("")} label="All Chapters" />
                  {chapters.map((c) => <FilterPill key={c} subtle active={chapter === c} onClick={() => setChapter(c)} label={c} />)}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
                {filtered.map((t) => (
                  <div key={t.testId} className="card qt-lib-card" onClick={() => onStart(t.testId)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, background: "var(--brand-light)", color: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{(t.subject || "T")[0]}</div>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", background: "var(--surface-alt)", padding: "4px 9px", borderRadius: 8 }}>{t.duration || 20}m</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{t.testName}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{t.subject} · {t.chapterName || "Mix"}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--border)", fontSize: 11, fontWeight: 700, color: "var(--text-faint)" }}>
                      <span>{t.questionCount || "—"} Questions</span>
                      {(t.attempted || t.myResult) ? (
                        <span style={{ color: "var(--success)" }}>Attempted</span>
                      ) : (
                        <span style={{ color: "var(--brand)", display: "flex", alignItems: "center", gap: 4 }}>Start <Icon name="chevronRight" size={12} /></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const FilterPill = ({ active, onClick, label, subtle }: any) => (
  <button
    onClick={onClick}
    style={{
      whiteSpace: "nowrap", padding: subtle ? "6px 12px" : "8px 14px", borderRadius: 100,
      fontSize: subtle ? 11.5 : 12.5, fontWeight: 700, cursor: "pointer",
      border: `1.5px solid ${active ? "var(--brand)" : "var(--border)"}`,
      background: active ? "var(--brand-light)" : "transparent",
      color: active ? "var(--brand-dark)" : "var(--text-muted)",
    }}
  >
    {label}
  </button>
);

// ═══════════════════════════════════════════════════════════════
// Root page — wired into the router as a normal AppShell route
// ═══════════════════════════════════════════════════════════════
export const Tests = () => {
  const { student } = useAuth();
  const [view, setView] = useState<"library" | "engine" | "result">("library");
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  if (view === "engine" && activeTestId) {
    return (
      <TestEngine
        testId={activeTestId}
        student={student}
        onExit={() => setView("library")}
        onSubmitted={(res: any) => { setLastResult(res); setView("result"); }}
      />
    );
  }

  if (view === "result" && lastResult) {
    return <ResultScreen result={lastResult} onDone={() => setView("library")} />;
  }

  return (
    <TestLibrary
      student={student}
      onStart={(id: string) => { setActiveTestId(id); setView("engine"); }}
    />
  );
};
