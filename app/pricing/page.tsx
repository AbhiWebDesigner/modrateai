"use client";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free Trial ✦",
    tagline: "Perfect for trying ModerateAI",
    price: "₹0",
    period: "/month",
    badge: null,
    trialNote: "✦ 19-day free trial",
    color: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.09)",
    btnStyle: { background: "rgba(255,255,255,0.08)", color: "#FAFAFA" },
    btnLabel: "Start Free Trial",
    btnHref: "/login",
    features: [
      "19-Day Free Trial",
      "1 YouTube Channel",
      "2,000 Comments Scanned",
      "AI Toxic Detection",
      "AI Spam Detection",
      "Review Queue",
      "250 AI Actions",
      "Smart AI Replies (Max 3 Per Video)",
      "Basic Analytics Dashboard",
      "10+ Languages",
      "Email Support",
    ],
  },
  {
    id: "pro",
    name: "Pro ✦",
    tagline: "Perfect for growing creators",
    price: "₹349",
    period: "/month",
    badge: "MOST POPULAR",
    trialNote: null,
    color: "rgba(245,158,11,0.07)",
    borderColor: "rgba(245,158,11,0.35)",
    btnStyle: { background: "linear-gradient(135deg,#F59E0B,#EA580C)", color: "white" },
    btnLabel: "Get Pro",
    btnHref: "/login",
    features: [
      "1 YouTube Channel",
      "25,000 Comments Scanned / Month",
      "AI Toxic Detection",
      "AI Spam Detection",
      "Auto Hide",
      "Review Queue",
      "Live Chat Moderation",
      "Progressive Live Chat Timeouts",
      "1,900 AI Actions / Month",
      "Smart AI Replies (Max 3 Per Video)",
      "Unlimited Automation Rules",
      "Full Analytics Dashboard",
      "50+ Languages",
      "Priority Email Support",
    ],
  },
  {
    id: "agency",
    name: "Agency ✦",
    tagline: "Built for businesses & agencies",
    price: "₹2,499",
    period: "/month",
    badge: null,
    trialNote: null,
    color: "rgba(124,58,237,0.07)",
    borderColor: "rgba(124,58,237,0.30)",
    btnStyle: { background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "white" },
    btnLabel: "Get Agency",
    btnHref: "/login",
    features: [
      "2 YouTube Channels",
      "150,000 Comments Scanned / Month",
      "AI Toxic Detection",
      "AI Spam Detection",
      "Auto Hide",
      "Review Queue",
      "Live Chat Moderation",
      "Progressive Live Chat Timeouts",
      "15,000 AI Actions / Month",
      "Smart AI Replies (Max 3 Per Video)",
      "Unlimited Automation Rules",
      "Advanced Analytics Dashboard",
      "Telegram Alerts",
      "100+ Languages",
      "Dedicated Priority Support",
    ],
  },
];

const COMPARISON = [
  { feature: "AI Spam Detection",        free: true,  pro: true,  agency: true  },
  { feature: "AI Toxic Detection",       free: true,  pro: true,  agency: true  },
  { feature: "Review Queue",             free: true,  pro: true,  agency: true  },
  { feature: "Auto Hide",                free: false, pro: true,  agency: true  },
  { feature: "Live Chat Moderation",     free: false, pro: true,  agency: true  },
  { feature: "Unlimited Automation Rules", free: false, pro: true, agency: true },
  { feature: "Telegram Alerts",          free: false, pro: false, agency: true  },
  { feature: "Export Reports",           free: false, pro: false, agency: true  },
  { feature: "Priority Support",         free: false, pro: true,  agency: true  },
];

export default function PricingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #09090B; color: white; }
        .pricing-wrap { max-width: 1100px; margin: 0 auto; padding: 72px 20px 100px; }
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .compare-table { width: 100%; border-collapse: collapse; }
        .compare-table th, .compare-table td { padding: 13px 16px; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .compare-table th { font-weight: 700; color: rgba(255,255,255,0.45); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; text-align: center; }
        .compare-table th:first-child { text-align: left; }
        .compare-table td { color: rgba(255,255,255,0.70); text-align: center; }
        .compare-table td:first-child { text-align: left; color: rgba(255,255,255,0.80); font-weight: 500; }
        .compare-table tr:last-child td { border-bottom: none; }
        @media (max-width: 640px) {
          .pricing-wrap { padding: 48px 16px 80px; }
          .compare-table th, .compare-table td { padding: 11px 10px; font-size: 12px; }
        }
      `}</style>

      <div className="pricing-wrap">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, padding: "5px 16px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>Simple, transparent pricing</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#FAFAFA", marginBottom: 12, lineHeight: 1.1 }}>
            Plans for every creator
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
            Start free. Upgrade when you're ready. No hidden fees.
          </p>
        </div>

        {/* Plans */}
        <div className="plans-grid">
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: plan.color,
              border: `1.5px solid ${plan.borderColor}`,
              borderRadius: 20,
              padding: "24px 22px",
              position: "relative",
              boxShadow: plan.id === "pro" ? "0 0 40px rgba(245,158,11,0.08)" : "none",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#F59E0B,#EA580C)", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontWeight: 800, color: "white", whiteSpace: "nowrap" }}>
                  ✦ {plan.badge}
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

              <Link href={plan.btnHref} style={{
                ...plan.btnStyle,
                display: "block",
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                textAlign: "center",
                textDecoration: "none",
              }}>
                {plan.btnLabel} →
              </Link>
            </div>
          ))}
        </div>

        {/* Fair usage note */}
        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, textAlign: "center", marginBottom: 52, lineHeight: 1.6, maxWidth: 680, margin: "16px auto 52px" }}>
          All plans are subject to our Fair Usage Policy. ModerateAI optimizes API usage to ensure reliable service while complying with YouTube platform limits.
        </p>

        {/* Comparison table */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#FAFAFA", marginBottom: 4, textAlign: "center" }}>Compare plans</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>See exactly what's included in each plan</p>

          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
            <table className="compare-table">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <th style={{ textAlign: "left" }}>Feature</th>
                  <th>Free</th>
                  <th style={{ color: "#F59E0B" }}>Pro</th>
                  <th style={{ color: "#A78BFA" }}>Agency</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(row => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>{row.free  ? "✅" : "❌"}</td>
                    <td>{row.pro   ? "✅" : "❌"}</td>
                    <td>{row.agency ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}