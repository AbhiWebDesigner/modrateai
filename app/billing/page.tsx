"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DashboardSidebar, DashboardBottomNav } from "@/app/components/DashboardLayout";

// ─── Types ───────────────────────────────────────────────────────────────────

type PlanId = "free" | "pro" | "agency";

interface FirestoreUser {
  plan: PlanId;
  trial_active?: boolean;
}

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free" as PlanId,
    name: "Free Trial ✦",
    tagline: "Test before you commit",
    price: "₹0",
    period: "/month",
    badge: null as string | null,
    trialNote: "✦ 19-day free trial · Extend for ₹69",
    color: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.09)",
    btnStyle: { background: "rgba(255,255,255,0.08)", color: "#FAFAFA" } as React.CSSProperties,
    btnLabel: "Start free trial →",
    features: [
      "19-day free trial",
      "1 YouTube channel",
      "2,000 comments scanned",
      "AI toxic detection",
      "AI spam detection",
      "Review queue",
      "250 AI actions",
      "AI auto replies (max 3 per video)",
      "55s smart reply delay",
      "Basic analytics dashboard",
      "10+ languages",
      "Email support",
      "Extend trial: ₹69 for 30 more days",
    ],
  },
  {
    id: "pro" as PlanId,
    name: "Pro ✦",
    tagline: "For growing creators",
    price: "₹349",
    period: "/month",
    badge: "MOST POPULAR" as string | null,
    trialNote: null as string | null,
    color: "rgba(245,158,11,0.07)",
    borderColor: "rgba(245,158,11,0.35)",
    btnStyle: { background: "linear-gradient(135deg,#F59E0B,#EA580C)", color: "white" } as React.CSSProperties,
    btnLabel: "Get Pro →",
    features: [
      "1 YouTube channel",
      "25,000 comments scanned / month",
      "AI toxic detection",
      "AI spam detection",
      "Auto hide",
      "Review queue",
      "Live chat moderation",
      "Progressive live chat timeouts",
      "1,900 AI actions / month",
      "AI auto replies (max 3 per video)",
      "55s smart reply delay",
      "Unlimited automation rules",
      "Full analytics dashboard",
      "50+ languages",
      "Priority email support",
    ],
  },
  {
    id: "agency" as PlanId,
    name: "Agency ✦",
    tagline: "Built for businesses & agencies",
    price: "₹2,499",
    period: "/month",
    badge: null as string | null,
    trialNote: null as string | null,
    color: "rgba(124,58,237,0.07)",
    borderColor: "rgba(124,58,237,0.30)",
    btnStyle: { background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "white" } as React.CSSProperties,
    btnLabel: "Get Agency →",
    features: [
      "2 YouTube channels",
      "150,000 comments scanned / month",
      "AI toxic detection",
      "AI spam detection",
      "Auto hide",
      "Review queue",
      "Live chat moderation",
      "Progressive live chat timeouts",
      "15,000 AI actions / month",
      "AI auto replies (max 3 per video)",
      "55s smart reply delay",
      "Unlimited automation rules",
      "Advanced analytics dashboard",
      "Telegram alerts",
      "100+ languages",
      "Dedicated priority support",
    ],
  },
] as const;

type Plan = typeof PLANS[number];

// ─── Plan badge label ─────────────────────────────────────────────────────────

function planBadgeLabel(plan: PlanId, trialActive: boolean): string {
  if (plan === "free") return trialActive ? "FREE · Trial" : "FREE";
  if (plan === "pro") return "PRO";
  return "AGENCY";
}

// ─── Razorpay modal ───────────────────────────────────────────────────────────

function RazorpayModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const [step, setStep] = useState<"confirm" | "processing" | "done">("confirm");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => setStep("done"), 2200);
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: "#0D0A1A", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, width: "100%", maxWidth: 420, padding: 28, position: "relative" }}>

        <div style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.30)", borderRadius: 10, padding: "8px 14px", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🧪</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#eab308" }}>Razorpay TEST MODE — no real payment</span>
        </div>

        {step === "confirm" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ background: "#072654", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#3395FF", fontWeight: 900, fontSize: 18 }}>R</span>
                <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>azorpay</span>
              </div>
              <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 12 }}>Secure Payment</span>
            </div>

            <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 4, color: "#FAFAFA" }}>{plan.name.replace(" ✦", "")}</h3>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 24 }}>{plan.tagline}</p>

            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{plan.name.replace(" ✦", "")} Plan</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#FAFAFA" }}>{plan.price}/mo</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 10 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>GST (18%)</span>
                <span style={{ fontSize: 14, color: "#FAFAFA" }}>Included</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6 }}>Card Number</label>
              <input defaultValue="4111 1111 1111 1111" readOnly style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "rgba(255,255,255,0.60)", width: "100%", padding: "10px 14px", fontSize: 14, letterSpacing: 2 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6 }}>Expiry</label>
                <input defaultValue="12/26" readOnly style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "rgba(255,255,255,0.60)", width: "100%", padding: "10px 14px", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 6 }}>CVV</label>
                <input defaultValue="•••" readOnly style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "rgba(255,255,255,0.60)", width: "100%", padding: "10px 14px", fontSize: 14 }} />
              </div>
            </div>

            <button onClick={handlePay} style={{ background: "linear-gradient(135deg,#3395FF,#1a6fd4)", borderRadius: 14, width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, color: "white", border: "none", cursor: "pointer", marginBottom: 12 }}>
              Pay {plan.price}
            </button>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", width: "100%", padding: "8px" }}>Cancel</button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
              <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ color: "rgba(255,255,255,0.30)", fontSize: 11 }}>256-bit SSL encrypted · Powered by Razorpay</span>
            </div>
          </>
        )}

        {step === "processing" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: 48, height: 48, border: "3px solid rgba(51,149,255,0.20)", borderTop: "3px solid #3395FF", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#FAFAFA" }}>Processing payment…</div>
            <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 13 }}>Please wait, do not close this window</div>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 64, height: 64, background: "rgba(34,197,94,0.15)", border: "2px solid rgba(34,197,94,0.40)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12, color: "#22c55e" }}>Test Payment Successful</div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>🧪</span>
                <span style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: 1.5 }}>This is a Razorpay Test Mode simulation.</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>💳</span>
                <span style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: 1.5 }}>No real payment was processed.</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>🔒</span>
                <span style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: 1.5 }}>Your subscription has <strong style={{ color: "#FAFAFA" }}>NOT</strong> been upgraded.</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)", borderRadius: 12, padding: "12px 32px", fontSize: 14, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>
              Back to Billing
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [trialActive, setTrialActive] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [modalPlan, setModalPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoadingUser(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as FirestoreUser;
          setCurrentPlan(data.plan ?? "free");
          setTrialActive(data.trial_active ?? false);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load user plan:", err);
        }
      } finally {
        setLoadingUser(false);
      }
    });
    return () => unsub();
  }, []);

  const openModal = useCallback((plan: Plan) => {
    if (plan.id === "free" || plan.id === currentPlan) return;
    setModalPlan(plan);
  }, [currentPlan]);

  const closeModal = useCallback(() => setModalPlan(null), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07030F; color: white; }
        .desktop-sidebar { display: none; }
        .bottom-nav-wrap { display: flex; }
        .main-content { margin-left: 0; padding: 20px 16px 100px; }
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; flex-direction: column; }
          .bottom-nav-wrap { display: none !important; }
          .main-content { margin-left: 240px; padding: 36px 48px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Orange glow background (matches Automation page) ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse 55% 50% at 5% 15%, rgba(245,158,11,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 55% at 5% 95%, rgba(109,40,217,0.18) 0%, transparent 62%), #07030F",
        pointerEvents: "none",
      }} />

      <div className="desktop-sidebar"><DashboardSidebar /></div>
      <div className="bottom-nav-wrap"><DashboardBottomNav /></div>

      <main className="main-content" style={{ position: "relative", zIndex: 10 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FAFAFA", marginBottom: 4 }}>Subscription</h1>
          <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 12 }}>Your current plan & billing</p>
          {loadingUser ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "5px 14px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.20)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.30)" }}>Loading…</span>
            </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "5px 14px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>{planBadgeLabel(currentPlan, trialActive)}</span>
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 48 }}>
          {PLANS.map(plan => {
            const isCurrentPlan = plan.id === currentPlan;
            const isDisabled = isCurrentPlan || plan.id === "free";
            return (
              <div key={plan.id} style={{
                background: plan.color,
                border: `1.5px solid ${isCurrentPlan ? "rgba(245,158,11,0.50)" : plan.borderColor}`,
                borderRadius: 20, padding: "24px 22px",
                position: "relative",
                boxShadow: plan.id === "pro"
                  ? "0 0 40px rgba(245,158,11,0.12), 0 0 80px rgba(245,158,11,0.06)"
                  : plan.id === "agency"
                  ? "0 0 40px rgba(124,58,237,0.08)"
                  : "none",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#F59E0B,#EA580C)", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontWeight: 800, color: "white", whiteSpace: "nowrap" }}>
                    ✦ {plan.badge}
                  </div>
                )}
                {isCurrentPlan && (
                  <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.30)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#F59E0B" }}>
                    Current
                  </div>
                )}

                <div style={{ fontSize: 16, fontWeight: 800, color: "#FAFAFA", marginBottom: 3 }}>{plan.name}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 16 }}>{plan.tagline}</div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#FAFAFA" }}>{plan.price}</span>
                  <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, paddingBottom: 5 }}>{plan.period}</span>
                </div>

                {plan.trialNote && (
                  <div style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#FBBF24", fontWeight: 600, marginBottom: 16 }}>
                    {plan.trialNote}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <span style={{ color: "#F59E0B", fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                      <span style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => openModal(plan)}
                  disabled={isDisabled}
                  style={{
                    ...plan.btnStyle,
                    width: "100%", padding: "12px", borderRadius: 12,
                    fontSize: 14, fontWeight: 700, border: "none",
                    cursor: isDisabled ? "default" : "pointer",
                    opacity: isDisabled ? 0.6 : 1,
                  }}
                >
                  {isCurrentPlan ? "Current Plan" : plan.btnLabel}
                </button>
              </div>
            );
          })}
        </div>

        {/* Invoices */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#FAFAFA", marginBottom: 4 }}>Billing</h2>
          <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 20 }}>Payment method & invoices</p>

          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#FAFAFA", marginBottom: 16 }}>Invoices</div>
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No invoices yet</div>
              <div style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, marginTop: 4 }}>Invoices will appear here after your first payment</div>
            </div>
          </div>
        </div>

      </main>

      {modalPlan && <RazorpayModal plan={modalPlan} onClose={closeModal} />}
    </>
  );
}