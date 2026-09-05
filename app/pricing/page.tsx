"use client";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free Trial ✦",
    tagline: "Test before you commit",
    price: "₹0",
    period: "/19 days",
    badge: null,
    trialNote: "✦ 19-day free trial · Extend for ₹69",
    color: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.09)",
    btnStyle: { background: "rgba(255,255,255,0.08)", color: "#FAFAFA" },
    btnLabel: "Start Free Trial",
    btnHref: "/login",
    features: [
      "19-Day Free Trial",
      "1 YouTube Channel",
      "YouTube API Quota: 500 units / day",
      "GCP Connected: +10,000 units / day",
      "2 Videos Scan (Automation Selected)",
      "5 Automation Rules",
      "Specific Video Selection Only",
      "250 AI Credits / 19 Days",
      "1 AI Reply Per User",
      "Bad / Toxic / Spam → Hide for Review",
      "Review Queue",
      "Basic Analytics Dashboard",
      "25 Languages",
      "Email Support",
      "Extend Trial: ₹69 for 30 More Days",
    ],
  },
  {
    id: "pro",
    name: "Pro ✦",
    tagline: "For growing creators",
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
      "YouTube API Quota: 1,500 units / day",
      "GCP Connected: +10,000 units / day",
      "100 Videos / Shorts / Posts Scan",
      "Unlimited Live Stream Moderation (Quota Based)",
      "20 Automation Rules",
      "Specific + Future + Latest Video Selection",
      "1,900 AI Credits / Month",
      "3 AI Replies Per User",
      "Bad / Toxic / Spam → Hide for Review",
      "Review Queue",
      "Full Analytics Dashboard",
      "65 Languages",
      "Priority Email Support",
      "Scan Interval: 100 Seconds",
    ],
  },
  {
    id: "agency",
    name: "Agency ✦",
    tagline: "Built for businesses & agencies",
    price: "₹2,499",
    period: "/month",
    badge: "COMING SOON",
    trialNote: null,
    color: "rgba(124,58,237,0.07)",
    borderColor: "rgba(124,58,237,0.30)",
    btnStyle: { background: "rgba(124,58,237,0.10)", color: "rgba(255,255,255,0.25)" },
    btnLabel: "🔒 Coming Soon",
    btnHref: "#",
    features: [
      "Multiple YouTube Channels",
      "Custom YouTube API Quota",
      "GCP Connected: +10,000 units / day",
      "Unlimited Videos / Shorts / Posts Scan",
      "Unlimited Live Stream Moderation",
      "Unlimited Automation Rules",
      "All Video Selection Types",
      "Custom AI Credits",
      "Unlimited AI Replies",
      "Bad / Toxic / Spam → Hide for Review",
      "Advanced Analytics Dashboard",
      "100+ Languages",
      "Team Access",
      "Dedicated Priority Support",
    ],
  },
];

const COMPARISON = [
  { feature: "Bad / Toxic / Spam Hide",       free: true,  pro: true,  agency: true  },
  { feature: "Review Queue",                  free: true,  pro: true,  agency: true  },
  { feature: "Automation Rules",              free: "5",   pro: "20",  agency: "Unlimited" },
  { feature: "Videos Scan",                   free: "2",   pro: "100", agency: "Unlimited" },
  { feature: "AI Credits",                    free: "250", pro: "1,900", agency: "Custom" },
  { feature: "AI Replies Per User",           free: "1",   pro: "3",   agency: "Unlimited" },
  { feature: "Live Stream Moderation",        free: false, pro: true,  agency: true  },
  { feature: "Future + Latest Video Select",  free: false, pro: true,  agency: true  },
  { feature: "Working Hours Setting",         free: false, pro: true,  agency: true  },
  { feature: "Full Analytics",                free: false, pro: true,  agency: true  },
  { feature: "65+ Languages",                 free: false, pro: true,  agency: true  },
  { feature: "Team Access",                   free: false, pro: false, agency: true  },
  { feature: "Priority Support",              free: false, pro: true,  agency: true  },
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

              {plan.id === 'agency'
                ? <span style={{ ...plan.btnStyle, display: "block", width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", cursor: "not-allowed", textAlign: "center", textDecoration: "none" }}>
                    {plan.btnLabel}
                  </span>
                : <Link href={plan.btnHref} style={{ ...plan.btnStyle, display: "block", width: "100%", padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", textAlign: "center", textDecoration: "none" }}>
                    {plan.btnLabel} →
                  </Link>
              }
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
                    <td>{typeof row.free   === 'boolean' ? (row.free   ? "✅" : "❌") : row.free}</td>
                    <td>{typeof row.pro    === 'boolean' ? (row.pro    ? "✅" : "❌") : row.pro}</td>
                    <td>{typeof row.agency === 'boolean' ? (row.agency ? "✅" : "❌") : row.agency}</td>
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