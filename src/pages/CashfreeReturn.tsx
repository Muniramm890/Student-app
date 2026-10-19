// FILE: student-app/src/pages/CashfreeReturn.tsx
// Landing page for /fees/cashfree-return?order_id=...
// Cashfree sends the browser here after redirect-style payments (UPI app, 3-D Secure, popup blocked). In that case the
// in-page verify in Fees.tsx never ran, so this page verifies with the server (idempotent: opening it twice can never
// record the payment twice) and shows the result.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StudentApi } from "../api/client";
import { Icon } from "../components/ui/Icon";

type Status = "verifying" | "success" | "pending" | "failed";

export const CashfreeReturn = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("order_id");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!orderId) { setStatus("failed"); setMessage("This payment link is missing its order id."); return; }
    if (started.current) return;
    started.current = true;
    StudentApi.cashfreeVerifyWithRetry({ cf_order_id: orderId })
      .then((res: any) => {
        setStatus("success");
        setMessage(res?.message || "Payment verified and recorded.");
        setTimeout(() => navigate("/fees", { replace: true }), 2500);
      })
      .catch((e: any) => {
        // 409 = Cashfree is still processing it; anything else = the payment did not go through
        if (e?.status === 409) { setStatus("pending"); setMessage(e.message); }
        else { setStatus("failed"); setMessage(e?.message || "We could not verify this payment."); }
      });
  }, [orderId, navigate]);

  const meta = {
    verifying: { color: "var(--brand)", title: "Verifying your payment…", sub: "Please wait, do not close this page." },
    success: { color: "var(--success, #22c55e)", title: "Payment successful", sub: message },
    pending: { color: "var(--warning, #f59e0b)", title: "Payment is still processing", sub: message + " If money was deducted, it will reflect shortly — you do not need to pay again." },
    failed: { color: "var(--danger)", title: "Payment not confirmed", sub: message + " If money was deducted, contact the school office with this order id: " + (orderId || "—") },
  }[status];

  return (
    <div className="enter" style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", textAlign: "center", padding: "32px 24px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          background: `color-mix(in srgb, ${meta.color} 15%, transparent)`, color: meta.color,
        }}>
          <Icon name={status === "success" ? "check" : status === "verifying" ? "clock" : "alert"} size={28} />
        </div>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>{meta.title}</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20 }}>{meta.sub}</p>
        {status !== "verifying" && (
          <Link to="/fees" replace className="btn" style={{ display: "inline-block", textDecoration: "none" }}>Back to Fees</Link>
        )}
      </div>
    </div>
  );
};
