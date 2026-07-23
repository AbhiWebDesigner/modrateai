"use client";
import { useState } from "react";
import { DashboardSidebar, DashboardBottomNav } from "@/app/components/DashboardLayout";
import {
  Shield, RefreshCw, CheckCircle, Zap,
  BarChart2, MessageSquare, Video, Clock, TrendingUp,
  Activity, BookOpen, Headphones, ChevronLeft, ChevronRight, Lock
} from "lucide-react";

const PLAN_LIMITS = [
  { name: "Free Trial", color: "#22C55E", actions: 250, badge: null },
  { name: "Pro", color: "#7C3AED", actions: 1900, badge: "Popular" },
  { name: "Agency", color: "#F59E0B", actions: 15000, badge: null },
];

const SETUP_STEPS = [
  { label: "Watch Video", done: true },
  { label: "Google Console", done: true, active: true, step: 2 },
  { label: "Enable API", done: false, locked: true },
  { label: "OAuth Client", done: false, locked: true },
  { label: "Add Credential", done: false, locked: true },
  { label: "Connect YouTube", done: false, locked: true },
];

const STATS = [
  { icon: <Zap size={16} color="#7C3AED" />, label: "AI Actions Used", value: "1,240", change: "+12.5%", bg: "rgba(124,58,237,0.1)" },
  { icon: <MessageSquare size={16} color="#22C55E" />, label: "Comments Moderated", value: "3,542", change: "+18.6%", bg: "rgba(34,197,94,0.1)" },
  { icon: <TrendingUp size={16} color="#3B82F6" />, label: "Replies Generated", value: "928", change: "+8.3%", bg: "rgba(59,130,246,0.1)" },
  { icon: <Video size={16} color="#F59E0B" />, label: "Videos Monitored", value: "128", change: "+6.7%", bg: "rgba(245,158,11,0.1)" },
  { icon: <Clock size={16} color="#10B981" />, label: "Avg. Response Time", value: "1.2s", change: "Excellent", bg: "rgba(16,185,129,0.1)" },
  { icon: <Activity size={16} color="#F43F5E" />, label: "Success Rate", value: "99.6%", change: "Excellent", bg: "rgba(244,63,94,0.1)" },
];

const ACTIVITY = [
  { msg: "YouTube channel connected successfully", time: "2 minutes ago" },
  { msg: "OAuth token verified", time: "5 minutes ago" },
  { msg: "YouTube Data API enabled", time: "12 minutes ago" },
  { msg: "Moderation started on latest video", time: "15 minutes ago" },
];

const HEALTH = [
  { label: "API Server", ok: true },
  { label: "Database", ok: true },
  { label: "YouTube API", ok: true },
  { label: "AI Engine", ok: true },
];

const CHART_POINTS = [320, 480, 560, 820, 740, 980, 1100, 950, 1240];

function MiniChart() {
  const w = 340, h = 100;
  const max = 1400, min = 0;
  const pts = CHART_POINTS;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - ((v - min) / (max - min)) * h);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const tooltip = { x: xs[xs.length - 1], y: ys[ys.length - 1] };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 100 }}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cg)" />
      <path d={path} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#7C3AED" />
      <rect x={tooltip.x - 44} y={tooltip.y - 30} width={88} height={22} rx={6} fill="rgba(30,20,60,0.95)" />
      <text x={tooltip.x} y={tooltip.y - 14} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="700">1,240 AI Actions</text>
    </svg>
  );
}

export default function APIAccessPage() {
  const [activeTab, setActiveTab] = useState<"24H" | "7D" | "30D" | "90D">("30D");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090B", color: "#FAFAFA", fontFamily: "Inter,sans-serif" }}>
      {/* Sidebar */}
      <div className="sidebar-wrapper" style={{ display: "none" }}>
        <DashboardSidebar />
      </div>
      <style>{`
        @media (pointer: fine) { .sidebar-wrapper { display: block !important; } }
      `}</style>

      {/* Main */}
      <main style={{ flex: 1, paddingBottom: 80, overflowX: "hidden" }}
        className="main-content">
        <style>{`
          @media (pointer: fine) { .main-content { margin-left: 240px !important; padding-bottom: 0 !important; } }
        `}</style>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 16px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", borderRadius: 14, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}>
                <Shield size={22} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>API Access</h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>Manage how ModerateAI connects to the YouTube Data API</p>
              </div>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#22C55E", fontSize: 13, fontWeight: 600, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "6px 14px" }}>
              <CheckCircle size={14} /> All Systems Normal
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }} className="grid-layout">
            <style>{`@media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr !important; } }`}</style>

            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* API Mode Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="api-cards">
                <style>{`@media (max-width: 560px) { .api-cards { grid-template-columns: 1fr !important; } }`}</style>

                {/* Shared API Card */}
                <div style={{ background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.4)", borderRadius: 16, padding: 18, position: "relative" }}>
                  <div style={{ position: "absolute", top: 14, right: 14, background: "#7C3AED", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>Recommended</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "rgba(124,58,237,0.2)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={16} color="#7C3AED" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>ModerateAI Shared API</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>We handle everything for you.</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>No setup required.</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "Current Plan", val: "Free Trial", badge: true },
                      { label: "AI Actions / Month", val: "250 / 250" },
                      { label: "Reset Date", val: "Aug 01, 2026" },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{item.label}</div>
                        {item.badge
                          ? <span style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>Free Trial</span>
                          : <div style={{ fontSize: 12, fontWeight: 600 }}>{item.val}</div>
                        }
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "Health", val: "Healthy", color: "#22C55E" },
                      { label: "Status", val: "Active", color: "#22C55E" },
                      { label: "Connected", val: "1 Channel", color: "#FAFAFA" },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ color: item.color, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          {item.color !== "#FAFAFA" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />}
                          {item.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Reconnect", "Test Connection", "View Usage"].map((btn, i) => (
                      <button key={btn} style={{
                        flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        background: i === 2 ? "linear-gradient(135deg,#7C3AED,#4F46E5)" : "rgba(255,255,255,0.06)",
                        color: "#fff", border: i === 2 ? "none" : "1px solid rgba(255,255,255,0.12)",
                      }}>{btn}</button>
                    ))}
                  </div>
                </div>

                {/* My Google Cloud Card */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 18, position: "relative" }}>
                  <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(59,130,246,0.2)", color: "#3B82F6", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Advanced</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "rgba(59,130,246,0.15)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <BarChart2 size={16} color="#3B82F6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>My Google Cloud Project</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Use your own Google Cloud project</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>&amp; get higher limits.</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "Project Status", val: "Connected", color: "#22C55E" },
                      { label: "Daily Quota", val: "10,000 units" },
                      { label: "Used Today", val: "1,240 units" },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ color: item.color || "#FAFAFA", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          {item.color && <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />}
                          {item.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      { label: "OAuth Status", val: "Verified", color: "#22C55E" },
                      { label: "API Status", val: "Enabled", color: "#22C55E" },
                      { label: "Channel", val: "1 Connected" },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ color: item.color || "#FAFAFA", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          {item.color && <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />}
                          {item.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>Manage Project</button>
                    <button style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.25)" }}>Disconnect</button>
                  </div>
                </div>
              </div>

              {/* Plan Limits */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <BarChart2 size={16} color="rgba(255,255,255,0.5)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>ModerateAI Shared API – Plan Limits</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="plan-grid">
                  <style>{`@media (max-width: 480px) { .plan-grid { grid-template-columns: 1fr !important; } }`}</style>
                  {PLAN_LIMITS.map(plan => (
                    <div key={plan.name} style={{ background: `rgba(${plan.color === "#22C55E" ? "34,197,94" : plan.color === "#7C3AED" ? "124,58,237" : "245,158,11"},0.07)`, border: `1px solid ${plan.color}33`, borderRadius: 12, padding: 16, textAlign: "center", position: "relative" }}>
                      {plan.badge && <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>{plan.badge}</span>}
                      <div style={{ color: plan.color, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{plan.name === "Free Trial" ? "✦ Free Trial" : plan.name === "Pro" ? "💎 Pro" : "👑 Agency"}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "#FAFAFA" }}>{plan.actions.toLocaleString()}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>AI Actions / month</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Overview Chart */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BarChart2 size={16} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Usage Overview</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["24H", "7D", "30D", "90D"] as const).map(t => (
                      <button key={t} onClick={() => setActiveTab(t)} style={{
                        padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: activeTab === t ? "#7C3AED" : "rgba(255,255,255,0.06)",
                        color: activeTab === t ? "#fff" : "rgba(255,255,255,0.4)",
                        border: "none",
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <MiniChart />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }} className="stats-grid">
                  <style>{`@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
                  {STATS.map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>{s.icon}<span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{s.label}</span></div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>{s.change}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity + System Health */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="bottom-grid">
                <style>{`@media (max-width: 560px) { .bottom-grid { grid-template-columns: 1fr !important; } }`}</style>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Activity size={15} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Recent Activity</span>
                  </div>
                  {ACTIVITY.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                      <CheckCircle size={14} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{a.msg}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Zap size={15} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>System Health</span>
                  </div>
                  {HEALTH.map((h, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CheckCircle size={14} color="#22C55E" />
                        <span style={{ fontSize: 13 }}>{h.label}</span>
                      </div>
                      <span style={{ color: "#22C55E", fontSize: 12, fontWeight: 600 }}>Operational</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Setup Guide Video */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Video size={15} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Setup Guide Video</span>
                  </div>
                  <button style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
                    <RefreshCw size={11} /> Refresh
                  </button>
                </div>
                <div style={{ background: "linear-gradient(135deg,#1E1B4B,#4C1D95)", margin: "0 12px 12px", borderRadius: 12, padding: "24px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ background: "rgba(124,58,237,0.3)", borderRadius: 10, padding: 8 }}><Shield size={20} color="#A78BFA" /></div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>ModerateAI</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Complete Setup Guide</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#FF0000", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Video size={16} color="#fff" /></div>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>→</span>
                    <div style={{ background: "#4285F4", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><BarChart2 size={16} color="#fff" /></div>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>→</span>
                    <div style={{ background: "#7C3AED", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={16} color="#fff" /></div>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>0:00 / 0:58</div>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 3, margin: "8px 0", position: "relative" }}>
                    <div style={{ background: "#7C3AED", width: "30%", height: "100%", borderRadius: 4 }} />
                  </div>
                </div>
              </div>

              {/* Step by Step Setup */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Step by Step Setup</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>(My Google Cloud Project)</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {/* Steps */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
                    {SETUP_STEPS.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: s.done ? "#22C55E" : s.active ? "#7C3AED" : "rgba(255,255,255,0.1)",
                          fontSize: 10, fontWeight: 700, color: "#fff",
                        }}>
                          {s.done && !s.active ? <CheckCircle size={12} /> : s.locked ? <Lock size={10} /> : i + 1}
                        </div>
                        <span style={{ fontSize: 12, color: s.active ? "#fff" : s.done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", fontWeight: s.active ? 700 : 400 }}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Step detail */}
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>Step 2: Google Cloud Console</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10 }}>Create a new project in Google Cloud Console.</div>
                    <div style={{ background: "#fff", borderRadius: 8, padding: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 16, height: 16, background: "#4285F4", borderRadius: 4 }} />
                        <span style={{ color: "#333", fontSize: 10, fontWeight: 700 }}>Google Cloud</span>
                      </div>
                      <div style={{ color: "#555", fontSize: 9, marginBottom: 4 }}>Project name</div>
                      <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: "3px 6px", fontSize: 9, color: "#333", marginBottom: 4 }}>ModerateAI Project</div>
                      <div style={{ color: "#555", fontSize: 9, marginBottom: 4 }}>Project ID</div>
                      <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: "3px 6px", fontSize: 9, color: "#333", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                        <span>moderateai-123456</span><span style={{ color: "#4285F4", fontWeight: 700 }}>EDIT</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ flex: 1, background: "#4285F4", color: "#fff", fontSize: 9, fontWeight: 700, textAlign: "center", padding: "4px", borderRadius: 4 }}>CREATE</div>
                        <div style={{ flex: 1, color: "#4285F4", fontSize: 9, fontWeight: 700, textAlign: "center", padding: "4px", borderRadius: 4, border: "1px solid #ddd" }}>CANCEL</div>
                      </div>
                    </div>
                  </div>
                </div>
                <button style={{ width: "100%", marginTop: 12, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  Open Google Cloud Console ↗
                </button>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button style={{ flex: 1, background: "#7C3AED", border: "none", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Need Help */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Need Help?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: <BookOpen size={16} color="#3B82F6" />, label: "Documentation", sub: "View Guide", bg: "rgba(59,130,246,0.1)" },
                    { icon: <Video size={16} color="#EF4444" />, label: "Watch Tutorial", sub: "Step by Step", bg: "rgba(239,68,68,0.1)" },
                    { icon: <Headphones size={16} color="#22C55E" />, label: "Contact Support", sub: "24/7 Support", bg: "rgba(34,197,94,0.1)" },
                  ].map(item => (
                    <button key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, background: item.bg, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ flexShrink: 0 }}>{item.icon}</div>
                      <div>
                        <div style={{ color: "#FAFAFA", fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{item.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <DashboardBottomNav />
    </div>
  );
}