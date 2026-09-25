// FILE: student-app/src/pages/Fees.tsx

import React, { useEffect, useState } from "react";
import { StudentApi } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useDialog } from "../contexts/DialogContext";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";
import { SkeletonBlock } from "../components/ui/Skeleton";
import { loadRazorpayScript, loadCashfreeScript, CASHFREE_MODE } from "../api/paymentScripts";

const rupees = (paise = 0) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const toPaise = (v: string) => Math.round((parseFloat(v) || 0) * 100);

type FeeAccount = {
  account: { total_fee_paise: number; paid_paise: number; pending_paise: number; student_name: string };
  payments: { id: string; receipt_no: string; amount_paise: number; payment_method: string; payment_date: string; gateway?: string }[];
  pending_items: { fee_category_id: string; category_name: string; pending_paise: number }[];
};

export const Fees = () => {
  const [data, setData] = useState<FeeAccount | null>(null);
  const [error, setError] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  const load = () => {
    StudentApi.feeAccount().then((res) => setData(res.data as FeeAccount)).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  return (
    <div className="enter">
      <h1 style={{ fontSize: 24, marginBottom: 18 }}>Fees</h1>

      {error && <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)", fontSize: 13.5, marginBottom: 16 }}>{error}</div>}
      {!data && !error && <SkeletonBlock height={160} />}

      {data && (
        <>
          <div className="card" style={{
            background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
            color: "#fff", marginBottom: 18, border: "none",
          }}>
            <p style={{ fontSize: 12.5, opacity: 0.85 }}>Pending balance</p>
            <p style={{ fontSize: 32, fontWeight: 700, marginBottom: 14, fontFamily: "var(--font-display)" }}>
              {rupees(data.account.pending_paise)}
            </p>
            <div style={{ display: "flex", gap: 18, fontSize: 12.5, opacity: 0.9, marginBottom: data.account.pending_paise > 0 ? 16 : 0 }}>
              <span>Total: {rupees(data.account.total_fee_paise)}</span>
              <span>Paid: {rupees(data.account.paid_paise)}</span>
            </div>
            {data.account.pending_paise > 0 && (
              <button onClick={() => setPayOpen(true)} className="btn"
                style={{ width: "100%", background: "#fff", color: "var(--brand-dark)", padding: 13 }}>
                Pay now
              </button>
            )}
          </div>

          {data.pending_items.length > 0 && (
            <>
              <h2 style={{ fontSize: 15.5, marginBottom: 10 }}>Due breakdown</h2>
              <div className="card" style={{ marginBottom: 22, padding: 4 }}>
                {data.pending_items.map((it, i) => (
                  <div key={it.fee_category_id} style={{
                    display: "flex", justifyContent: "space-between", padding: "12px 14px",
                    borderTop: i > 0 ? "1px solid var(--border-soft)" : "none", fontSize: 13.5,
                  }}>
                    <span style={{ color: "var(--text-muted)" }}>{it.category_name}</span>
                    <span style={{ fontWeight: 600 }}>{rupees(it.pending_paise)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 style={{ fontSize: 15.5, marginBottom: 10 }}>Payment history</h2>
          {data.payments.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13.5 }}>
              No payments recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.payments.map((p) => <PaymentRow key={p.id} payment={p} />)}
            </div>
          )}

          <PayModal
            open={payOpen}
            onClose={() => setPayOpen(false)}
            pendingPaise={data.account.pending_paise}
            onPaid={() => { setPayOpen(false); load(); }}
          />
        </>
      )}
    </div>
  );
};

const PaymentRow = ({ payment }: { payment: FeeAccount["payments"][number] }) => {
  const { show } = useToast();
  const [loading, setLoading] = useState(false);

  const openReceipt = async () => {
    setLoading(true);
    try {
      const res: any = await StudentApi.receipt(payment.id);
      window.open(res.data.receipt_url, "_blank");
    } catch (e: any) {
      show(e.message || "Could not open receipt", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: "var(--brand-light)", color: "var(--brand)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name="receipt" size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{rupees(payment.amount_paise)}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {payment.receipt_no} · {payment.payment_method} · {new Date(payment.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>
      <button onClick={openReceipt} disabled={loading} className="btn btn-ghost" style={{ padding: "8px 12px", fontSize: 12 }}>
        {loading ? "…" : "Receipt"}
      </button>
    </div>
  );
};

// ── Pay modal: choose amount → choose gateway → checkout ──────────────────
const PayModal = ({ open, onClose, pendingPaise, onPaid }: {
  open: boolean; onClose: () => void; pendingPaise: number; onPaid: () => void;
}) => {
  const { student, refreshProfile } = useAuth();
  const { show } = useToast();
  const { dialogAlert } = useDialog();
  const [amountStr, setAmountStr] = useState(String((pendingPaise / 100).toFixed(0)));
  const [busyGateway, setBusyGateway] = useState<"razorpay" | "cashfree" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { setAmountStr(String((pendingPaise / 100).toFixed(0))); setError(""); }, [pendingPaise, open]);

  const amountPaise = toPaise(amountStr);
  const validAmount = amountPaise > 0 && amountPaise <= pendingPaise;

  const payWithRazorpay = async () => {
    setError(""); setBusyGateway("razorpay");
    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Couldn't load Razorpay. Check your connection.");

      const orderRes: any = await StudentApi.razorpayCreateOrder(amountPaise);
      const order = orderRes.data;

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: student?.school_name || "School Fee Payment",
        description: `Fee payment — ${order.student_name}`,
        order_id: order.order_id,
        prefill: {
          name: order.student_name,
          contact: order.guardian_phone || "",
          email: order.guardian_email || "",
        },
        theme: { color: "#E8600A" },
        handler: async (response: any) => {
          try {
            await StudentApi.razorpayVerify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount_paise: amountPaise,
            });
            show("Payment successful!", "success");
            onPaid();
          } catch (e: any) {
            await dialogAlert("Your payment was captured but we couldn't confirm it automatically. It will reflect shortly — contact the school office if it doesn't.", "Verification pending");
          } finally { setBusyGateway(null); }
        },
        modal: { ondismiss: () => setBusyGateway(null) },
      });
      rzp.on("payment.failed", (resp: any) => {
        setError(resp.error?.description || "Payment failed. Please try again.");
        setBusyGateway(null);
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message || "Could not start payment.");
      setBusyGateway(null);
    }
  };

  const payWithCashfree = async () => {
    setError(""); setBusyGateway("cashfree");
    try {
      const ok = await loadCashfreeScript();
      if (!ok) throw new Error("Couldn't load Cashfree. Check your connection.");

      const orderRes: any = await StudentApi.cashfreeCreateOrder(amountPaise);
      const order = orderRes.data;
      if (!order?.payment_session_id) throw new Error("Could not create payment order.");

      const cashfree = window.Cashfree({ mode: CASHFREE_MODE });
      const result = await cashfree.checkout({ paymentSessionId: order.payment_session_id, redirectTarget: "_modal" });

      if (result?.error) {
        setError(result.error.message || "Payment failed. Please try again.");
        setBusyGateway(null);
        return;
      }

      try {
        await StudentApi.cashfreeVerify({ cf_order_id: order.order_id, amount_paise: amountPaise });
        show("Payment successful!", "success");
        onPaid();
      } catch (e: any) {
        await dialogAlert("Your payment went through but we couldn't confirm it automatically. It will reflect shortly — contact the school office if it doesn't.", "Verification pending");
      }
    } catch (e: any) {
      setError(e.message || "Could not start payment.");
    } finally {
      setBusyGateway(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Pay fees">
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>
          Amount to pay (pending: {rupees(pendingPaise)})
        </label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", fontSize: 15 }}>₹</span>
          <input
            className="input" inputMode="numeric" value={amountStr}
            onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
            style={{ paddingLeft: 28, fontSize: 17, fontWeight: 600 }}
          />
        </div>
        {!validAmount && amountStr !== "" && (
          <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>Enter an amount between ₹1 and {rupees(pendingPaise)}.</p>
        )}
      </div>

      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 14 }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <GatewayButton
          icon="upi" label="Pay with Razorpay" sub="UPI, Cards, Netbanking"
          disabled={!validAmount || !!busyGateway} busy={busyGateway === "razorpay"} onClick={payWithRazorpay}
        />
        <GatewayButton
          icon="bank" label="Pay with Cashfree" sub="UPI, Cards, Wallets"
          disabled={!validAmount || !!busyGateway} busy={busyGateway === "cashfree"} onClick={payWithCashfree}
        />
      </div>
      <p style={{ fontSize: 11.5, color: "var(--text-faint)", textAlign: "center", marginTop: 16 }}>
        🔒 Payments are processed securely. Your card details are never stored by the school.
      </p>
    </Modal>
  );
};

const GatewayButton = ({ icon, label, sub, disabled, busy, onClick }: {
  icon: any; label: string; sub: string; disabled: boolean; busy: boolean; onClick: () => void;
}) => (
  <button onClick={onClick} disabled={disabled} className="btn btn-ghost" style={{
    justifyContent: "flex-start", padding: 14, height: "auto", textAlign: "left",
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: "var(--brand-light)", color: "var(--brand)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon name={icon} size={17} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{busy ? "Opening checkout…" : label}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 400 }}>{sub}</div>
    </div>
    <Icon name="chevronRight" size={16} />
  </button>
);
