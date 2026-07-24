"use client";
import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DashboardSidebar, DashboardBottomNav } from "@/app/components/DashboardLayout";
import {
  Shield, RefreshCw, CheckCircle, Zap,
  BarChart2, MessageSquare, Video, Clock, TrendingUp,
  Activity, BookOpen, Headphones, ChevronLeft, ChevronRight,
  Lock, AlertCircle, ExternalLink, Wifi, WifiOff, Loader2,
  Cloud, Key, Database, Settings2, Play, X, Maximize2,
  CheckSquare, XCircle, Info, Copy, Trash2, Link2, Share2,
  Gift, Calendar, Star, Server, Cpu, Globe
} from "lucide-react";

interface UserData {
  ai_credits: number;
  ai_replies: number;
  avg_response_ms: number;
  channel_status: string;
  comments_hidden: number;
  comments_limit: number;
  comments_remaining: number;
  comments_scanned: number;
  comments_used: number;
  plan: string;
  plan_display_name: string;
  plan_expires_at: { seconds: number } | null;
  subscription_status: string;
  youtube_connected: boolean;
  youtube_channel_id: string;
  youtube_channel_name: string;
  youtube_channel_handle: string;
  youtube_channel_thumbnail: string;
  youtube_subscriber_count: string;
  youtube_video_count: string;
  youtube_view_count: string;
  youtube_stats_refreshed_at: string;
  last_scan_at: { seconds: number } | null;
  last_comment_at: { seconds: number } | null;
  moderation_accuracy: number;
  spam_detected: number;
  hidden_count: number;
  protection_score: number;
  usage_percent: number;
  live_monitoring: boolean;
  gcp_project_name?: string;
  gcp_project_id?: string;
  gcp_google_account?: string;
  gcp_oauth_status?: string;
  gcp_oauth_redirect_uri?: string;
  gcp_oauth_scopes?: string[];
  gcp_oauth_verification?: string;
  gcp_api_status?: string;
  gcp_api_quota?: number;
  gcp_api_billing?: string;
  gcp_api_last_checked?: string;
  gcp_daily_quota?: number;
  gcp_used_today?: number;
  gcp_quota_reset_time?: string;
  gcp_client_id?: string;
  gcp_client_secret_masked?: string;
  gcp_credentials_updated?: string;
  gcp_connected?: boolean;
  gcp_last_sync?: string;
  gcp_api_version?: string;
  gcp_account_avatar?: string;
  gcp_project_created?: string;
  gcp_connected_date?: string;
  gcp_last_verification?: string;
  gcp_client_secret_saved?: boolean;
  gcp_client_id_saved?: boolean;
}

const SETUP_STEPS = [
  { label: "Watch Video", key: "watch_video" },
  { label: "Google Console", key: "google_console" },
  { label: "Enable API", key: "enable_api" },
  { label: "OAuth Client", key: "oauth_client" },
  { label: "Add Credentials", key: "add_credential" },
  { label: "Connect YouTube", key: "connect_youtube" },
];

const STEP_DETAILS: Record<string, { title: string; desc: string; action?: string; url?: string }> = {
  watch_video: { title: "Step 1: Watch Setup Video", desc: "Watch the complete setup guide video before proceeding to Google Cloud Console.", action: "Watch Video", url: "https://youtube.com" },
  google_console: { title: "Step 2: Google Cloud Console", desc: "Create a new project in Google Cloud Console. Use project name 'ModerateAI Project'.", action: "Open Console", url: "https://console.cloud.google.com" },
  enable_api: { title: "Step 3: Enable YouTube Data API", desc: "In your Google Cloud project, go to APIs & Services > Library and enable 'YouTube Data API v3'.", action: "Open API Library", url: "https://console.cloud.google.com/apis/library" },
  oauth_client: { title: "Step 4: Create OAuth Client", desc: "Go to APIs & Services > Credentials and create an OAuth 2.0 Client ID for a Web Application.", action: "Open Credentials", url: "https://console.cloud.google.com/apis/credentials" },
  add_credential: { title: "Step 5: Add Credential to ModerateAI", desc: "Copy your Client ID and Client Secret from Google Cloud and paste them into ModerateAI Settings.", action: "Go to Settings", url: "/dashboard/settings" },
  connect_youtube: { title: "Step 6: Connect YouTube", desc: "Authorize ModerateAI to access your YouTube channel using the credentials you just added.", action: "Connect YouTube", url: "/api/auth/youtube" },
};

// ─── Mini Line Chart ──────────────────────────────────────────────────────────
const MiniLineChart = memo(function MiniLineChart({
  used, limit, color = "#7C3AED", days = 7
}: { used: number; limit: number; color?: string; days?: number }) {
  const pts = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const progress = i / (days - 1);
      return Math.round(used * progress * (0.6 + 0.4 * Math.sin(i * 1.2)));
    });
  }, [used, days]);

  const w = 300, h = 80;
  const maxVal = Math.max(...pts, 1);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - (v / maxVal) * (h - 12) - 6);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const gradId = `lg-${color.replace("#", "")}`;

  const today = new Date();
  const labels = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return `${d.toLocaleString("default", { month: "short" })} ${d.getDate()}`;
  });

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 80, overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 4 : 2.5} fill={color} opacity={i === xs.length - 1 ? 1 : 0.5} />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {[0, Math.floor(days / 2), days - 1].map(i => (
          <span key={i} style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{labels[i]}</span>
        ))}
      </div>
    </div>
  );
});

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const DonutChart = memo(function DonutChart({ used, limit, color = "#7C3AED", size = 80 }: { used: number; limit: number; color?: string; size?: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const r = size * 0.38, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.1} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.1}
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: size * 0.18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{used.toLocaleString()}</div>
        <div style={{ fontSize: size * 0.1, color: "rgba(255,255,255,0.4)" }}>/{limit.toLocaleString()}</div>
        <div style={{ fontSize: size * 0.11, fontWeight: 700, color, marginTop: 1 }}>{pct.toFixed(0)}%</div>
      </div>
    </div>
  );
});

// ─── Status Pill ─────────────────────────────────────────────────────────────
function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: ok ? "rgba(34,197,94,0.12)" : "rgba(244,63,94,0.12)",
      color: ok ? "#22C55E" : "#F43F5E",
      border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(244,63,94,0.3)"}`,
      borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: ok ? "#22C55E" : "#F43F5E", display: "inline-block" }} />
      {label}
    </span>
  );
}

type TestState = "idle" | "checking" | "success" | "failed";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED API TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SharedAPITab({ userData, user, router, showToast }: {
  userData: UserData; user: User;
  router: ReturnType<typeof useRouter>;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [chartRange, setChartRange] = useState<"7D" | "30D" | "90D">("7D");
  const [testState, setTestState] = useState<TestState>("idle");
  const [reconnecting, setReconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const aiLimit = userData.comments_limit ?? 250;
  const aiUsed = Math.max(0, aiLimit - (userData.ai_credits ?? aiLimit));
  const aiRemaining = aiLimit - aiUsed;
  const pct = aiLimit > 0 ? Math.min((aiUsed / aiLimit) * 100, 100) : 0;
  const planName = userData.plan_display_name || "Free Trial";
  const isFree = planName.toLowerCase().includes("free") || planName.toLowerCase().includes("trial");
  const daysLeft = userData.plan_expires_at
    ? Math.max(0, Math.round((userData.plan_expires_at.seconds * 1000 - Date.now()) / 86400000))
    : 19;
  const resetDate = userData.plan_expires_at
    ? new Date(userData.plan_expires_at.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "Jun 07, 2025";
  const successRate = userData.moderation_accuracy ?? 99.9;
  const channelConnected = userData.youtube_connected ?? false;
  const lastSync = userData.youtube_stats_refreshed_at
    ? new Date(userData.youtube_stats_refreshed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "24 Jul 2026";

  const chartDays = chartRange === "7D" ? 7 : chartRange === "30D" ? 30 : 90;

  const handleReconnect = async () => {
    setReconnecting(true);
    try { window.location.href = `/api/auth/youtube?uid=${user.uid}`; }
    catch { showToast("Reconnect failed.", "error"); setReconnecting(false); }
  };

  const handleTestConnection = async () => {
    setTestState("checking");
    try {
      if (!userData.youtube_connected) { setTestState("failed"); showToast("No YouTube channel connected.", "error"); return; }
      const res = await fetch(`/api/auth/youtube/refresh-stats?uid=${user.uid}`);
      if (res.ok) {
        await updateDoc(doc(db, "users", user.uid), { youtube_stats_refreshed_at: new Date().toISOString() });
        setTestState("success"); showToast("Connection verified!", "success");
      } else { setTestState("failed"); showToast("Connection test failed.", "error"); }
    } catch { setTestState("failed"); showToast("Connection test failed.", "error"); }
    finally { setTimeout(() => setTestState("idle"), 4000); }
  };

  const handleRefreshStats = async () => {
    if (!userData.youtube_connected) { showToast("Connect a YouTube channel first.", "error"); return; }
    setRefreshing(true);
    try {
      const res = await fetch(`/api/auth/youtube/refresh-stats?uid=${user.uid}`);
      if (res.ok) showToast("Stats refreshed.", "success");
      else showToast("Failed to refresh.", "error");
    } catch { showToast("Failed to refresh.", "error"); }
    finally { setRefreshing(false); }
  };

  const testConfig = {
    idle: { label: "Test Connection", bg: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" },
    checking: { label: "Checking…", bg: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" },
    success: { label: "Live!", bg: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" },
    failed: { label: "Failed", bg: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.3)" },
  }[testState];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Hero Card ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.12) 100%)",
        border: "1.5px solid rgba(124,58,237,0.4)",
        borderRadius: 20, padding: 20, position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", borderRadius: 14, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 24px rgba(124,58,237,0.5)" }}>
            <Shield size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>ModerateAI Shared API</span>
              <span style={{ background: "rgba(124,58,237,0.3)", color: "#C4B5FD", border: "1px solid rgba(124,58,237,0.5)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Recommended</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>We handle everything for you. No setup required.</div>
          </div>
          {/* Cloud illustration */}
          <div style={{ flexShrink: 0, opacity: 0.7 }}>
            <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
              <ellipse cx="22" cy="28" rx="18" ry="10" fill="rgba(124,58,237,0.3)" />
              <circle cx="16" cy="22" r="9" fill="rgba(124,58,237,0.4)" />
              <circle cx="26" cy="18" r="12" fill="rgba(124,58,237,0.5)" />
              <circle cx="36" cy="23" r="8" fill="rgba(124,58,237,0.4)" />
              <circle cx="38" cy="30" r="7" fill="#22C55E" opacity="0.9" />
              <path d="M35 30 L37.5 32.5 L42 27" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Feature badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { icon: <Shield size={12} />, label: "Secure" },
            { icon: <CheckCircle size={12} />, label: "Reliable" },
            { icon: <Zap size={12} />, label: "Always On" },
            { icon: <Star size={12} />, label: "Optimized" },
          ].map(b => (
            <span key={b.label} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Free Trial Banner ── */}
      {isFree && (
        <div style={{ background: "rgba(124,58,237,0.1)", border: "1.5px solid rgba(124,58,237,0.35)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: "rgba(124,58,237,0.2)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Gift size={18} color="#A78BFA" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>You're on Free Trial! 🎉</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Explore all features with {aiLimit} free AI actions.</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{aiRemaining}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>/ {aiLimit}</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>AI Actions Left</div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, width: 80 }}>
              <div style={{ width: `${100 - pct}%`, height: "100%", background: "linear-gradient(90deg,#7C3AED,#A78BFA)", borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Trial ends in</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{daysLeft} Days</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 3 }}>
              <Calendar size={9} /> {resetDate}
            </div>
          </div>
        </div>
      )}

      {/* ── Usage Stats Grid ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Shared API Usage <span style={{ fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>(This Month)</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "AI Actions Used", val: `${aiUsed}`, sub: `/ ${aiLimit}`, subColor: "rgba(255,255,255,0.4)", note: `${pct.toFixed(0)}% Used`, noteColor: pct > 80 ? "#F43F5E" : "rgba(255,255,255,0.35)", bar: true, barPct: pct, barColor: pct > 80 ? "#F43F5E" : "#7C3AED" },
            { label: "AI Actions Remaining", val: `${aiRemaining}`, sub: "", note: "100% Remaining", noteColor: "#A78BFA", bar: true, barPct: 100 - pct, barColor: "#A78BFA" },
            { label: "Resets In", val: `${daysLeft} Days`, sub: "", note: resetDate, noteColor: "rgba(255,255,255,0.35)" },
            { label: "Current Plan", val: planName, sub: "", note: "", noteColor: "", isUpgrade: true },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 14px 12px" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{s.val}</span>
                {s.sub && <span style={{ fontSize: 12, color: s.subColor }}>{s.sub}</span>}
              </div>
              {s.bar && (
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 4 }}>
                  <div style={{ width: `${s.barPct}%`, height: "100%", background: s.barColor, borderRadius: 2, transition: "width 0.6s" }} />
                </div>
              )}
              {s.note && <div style={{ fontSize: 11, color: s.noteColor, fontWeight: 600 }}>{s.note}</div>}
              {s.isUpgrade && (
                <button onClick={() => router.push("/billing")} style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#A78BFA", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                  <Zap size={11} /> Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Actions Usage Over Time Chart ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>AI Actions Usage Over Time</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["7D", "30D", "90D"] as const).map(t => (
              <button key={t} onClick={() => setChartRange(t)} style={{ padding: "4px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", background: chartRange === t ? "#7C3AED" : "rgba(255,255,255,0.06)", color: chartRange === t ? "#fff" : "rgba(255,255,255,0.4)", border: "none" }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <MiniLineChart used={aiUsed} limit={aiLimit} color="#7C3AED" days={chartDays} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 110 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Daily Average</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{Math.round(aiUsed / Math.max(chartDays, 1))}</div>
              <div style={{ fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>AI Actions</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Peak Usage</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{Math.round(aiUsed * 0.3)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{resetDate}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 1 }}>Today's Usage</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{Math.round(aiUsed / Math.max(chartDays, 1))}</div>
              <div style={{ fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>AI Actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Shared API Status ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Shared API Status</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Real-time status of our shared infrastructure</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {[
            { label: "API Server", ok: true },
            { label: "Database", ok: true },
            { label: "YouTube Data API", ok: channelConnected },
            { label: "AI Engine", ok: userData.live_monitoring ?? false },
            { label: "Rate Limiting", ok: true },
          ].map(item => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <CheckCircle size={16} color={item.ok ? "#22C55E" : "#F59E0B"} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.3, marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: item.ok ? "#22C55E" : "#F59E0B" }}>{item.ok ? "Operational" : "Inactive"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom 2 cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Why Use */}
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 20, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: "#fff" }}>Why Use ModerateAI Shared API?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {[
              "No API key setup required",
              "Higher quota & better reliability",
              "Fully managed by ModerateAI",
              "Automatic optimizations",
              "24/7 monitoring & support",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckCircle size={13} color="#22C55E" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{f}</span>
              </div>
            ))}
          </div>
          {/* Illustration */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" opacity="0.6">
              <circle cx="30" cy="30" r="28" fill="rgba(124,58,237,0.15)" stroke="rgba(124,58,237,0.3)" strokeWidth="1" />
              <path d="M20 38 L30 18 L40 38" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="30" cy="30" r="12" fill="rgba(124,58,237,0.3)" />
              <Shield size={16} color="#A78BFA" x="22" y="22" />
            </svg>
          </div>
        </div>

        {/* Trial Extension */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "#fff" }}>Trial Extension Offer 🎉</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Need more time? Extend your trial and get 30 more days + 250 AI actions.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>30</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Days</div>
              <div style={{ fontSize: 10, color: "#A78BFA" }}>Extra validity</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>250</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>AI Actions</div>
              <div style={{ fontSize: 10, color: "#22C55E" }}>Full access</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>One-time Offer</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>₹</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>69</span>
            </div>
          </div>
          <button onClick={() => router.push("/billing")} style={{ width: "100%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Extend Trial Now →
          </button>
        </div>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GCP TAB
// ═══════════════════════════════════════════════════════════════════════════════
function GCPTab({ userData, user, router, showToast }: {
  userData: UserData; user: User;
  router: ReturnType<typeof useRouter>;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [chartRange, setChartRange] = useState<"7D" | "30D" | "90D">("7D");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [gcpRefreshing, setGcpRefreshing] = useState(false);
  const [gcpDisconnecting, setGcpDisconnecting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const gcpConnected = userData.gcp_connected ?? false;
  const gcpProjectName = userData.gcp_project_name || "ModerateAI User Project";
  const gcpProjectId = userData.gcp_project_id || "moderateai-user-123456";
  const gcpAccount = userData.gcp_google_account || "abhi@example.com";
  const gcpDailyQuota = userData.gcp_daily_quota ?? 10000;
  const gcpUsedToday = userData.gcp_used_today ?? 1240;
  const gcpRemaining = gcpDailyQuota - gcpUsedToday;
  const gcpResetTime = userData.gcp_quota_reset_time || "May 22, 2025, 12:00 AM";
  const gcpLastSync = userData.gcp_last_sync ? new Date(userData.gcp_last_sync).toLocaleDateString("en-IN") : "2m ago";
  const gcpOAuthStatus = userData.gcp_oauth_status || "Verified";
  const gcpApiStatus = userData.gcp_api_status || "Enabled";
  const gcpApiBilling = userData.gcp_api_billing || "Active";
  const gcpClientId = userData.gcp_client_id ? userData.gcp_client_id.slice(0, 12) + "••••••" : "—";
  const gcpConnectedDate = userData.gcp_connected_date || "May 21, 2025";
  const gcpAccountAvatar = userData.gcp_account_avatar || "";
  const channelConnected = userData.youtube_connected ?? false;
  const gcpProjectNumber = "123456789012";
  const gcpLocation = "us-central1";
  const gcpQuotaType = "Standard";
  const chartDays = chartRange === "7D" ? 7 : chartRange === "30D" ? 30 : 90;

  const timeRemaining = useMemo(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  }, []);

  const handleVideoEnded = () => {
    setVideoWatched(true);
    setCompletedSteps(prev => new Set([...prev, 0]));
    if (currentStep === 0) setCurrentStep(1);
    showToast("Video complete — Step 2 unlocked!", "success");
  };

  const isStepLocked = (i: number) => {
    if (i === 0) return false;
    for (let j = 0; j < i; j++) {
      if (!completedSteps.has(j) && !(j === 0 && videoWatched)) return true;
    }
    return false;
  };

  const handleStepAction = (stepKey: string) => {
    const detail = STEP_DETAILS[stepKey];
    if (!detail?.url) return;
    if (stepKey === "connect_youtube") { window.location.href = `/api/auth/youtube?uid=${user.uid}`; }
    else if (detail.url.startsWith("/")) router.push(detail.url);
    else window.open(detail.url, "_blank", "noopener noreferrer");
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < SETUP_STEPS.length - 1) setCurrentStep(s => s + 1);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      showToast("Copied!", "success");
    });
  };

  const handleGcpRefresh = async () => {
    setGcpRefreshing(true);
    try {
      await getDoc(doc(db, "users", user.uid));
      showToast("GCP stats refreshed.", "success");
    } catch { showToast("Failed to refresh.", "error"); }
    finally { setGcpRefreshing(false); }
  };

  const handleGcpDisconnect = async () => {
    if (!confirm("Disconnect Google Cloud Project?")) return;
    setGcpDisconnecting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        gcp_connected: false, gcp_project_name: "", gcp_project_id: "",
        gcp_client_id: "", gcp_client_secret_masked: ""
      });
      showToast("GCP disconnected.", "success");
    } catch { showToast("Failed.", "error"); }
    finally { setGcpDisconnecting(false); }
  };

  const topApiMethods = [
    { name: "search.list", units: 800, pct: 64.5 },
    { name: "commentThreads.list", units: 220, pct: 17.7 },
    { name: "videos.list", units: 150, pct: 12.1 },
    { name: "channels.list", units: 50, pct: 4.0 },
    { name: "others", units: 20, pct: 1.6 },
  ];

  const currentStepKey = SETUP_STEPS[currentStep]?.key ?? "watch_video";
  const currentStepDetail = STEP_DETAILS[currentStepKey];

  if (!gcpConnected) {
    // ── Not Connected: Setup Guide ──
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Info Card */}
        <div style={{ background: "rgba(59,130,246,0.06)", border: "1.5px solid rgba(59,130,246,0.3)", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "rgba(59,130,246,0.15)", borderRadius: 14, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cloud size={22} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>My Google Cloud Project</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Use your own Google Cloud project & get higher limits.</div>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, background: "rgba(59,130,246,0.1)", borderRadius: 16, marginBottom: 12 }}>
              <Cloud size={26} color="#3B82F6" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>No GCP Project Connected</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Connect your own Google Cloud project for higher API limits and full control.</div>
            <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Cloud size={15} /> Open Google Cloud Console
            </button>
          </div>
        </div>

        {/* Video */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Video size={14} color="rgba(255,255,255,0.5)" />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Setup Guide Video</span>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
              <RefreshCw size={10} /> Refresh
            </button>
          </div>
          <div style={{ margin: "0 12px 12px", borderRadius: 12, overflow: "hidden" }}>
            {videoError ? (
              <div style={{ background: "linear-gradient(135deg,#1a0533,#0d1b3e)", borderRadius: 12, padding: "32px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Tutorial Coming Soon</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Follow the steps below to get started.</div>
              </div>
            ) : (
              <video ref={videoRef} src="/videos/setup-demo.mp4" controls onEnded={handleVideoEnded} onError={() => setVideoError(true)} style={{ width: "100%", display: "block", borderRadius: 12 }} poster="/images/setup/step1.webp" />
            )}
          </div>
          {videoError && (
            <div style={{ padding: "0 12px 12px" }}>
              <button onClick={handleVideoEnded} style={{ width: "100%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Skip to Setup Steps</button>
            </div>
          )}
        </div>

        {/* Step by Step */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Step by Step Setup</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>(My Google Cloud Project)</div>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Steps list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 110 }}>
              {SETUP_STEPS.map((s, i) => {
                const done = completedSteps.has(i) || (i === 0 && videoWatched);
                const active = i === currentStep;
                const locked = isStepLocked(i);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, position: "relative" }}>
                    {i < SETUP_STEPS.length - 1 && (
                      <div style={{ position: "absolute", left: 10, top: 22, width: 2, height: 20, background: done ? "#22C55E" : "rgba(255,255,255,0.1)" }} />
                    )}
                    <button onClick={() => !locked && setCurrentStep(i)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: locked ? "default" : "pointer", padding: "4px 0", width: "100%" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#22C55E" : active ? "#7C3AED" : "rgba(255,255,255,0.1)", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                        {done ? <CheckCircle size={12} /> : locked ? <Lock size={10} color="rgba(255,255,255,0.3)" /> : i + 1}
                      </div>
                      <span style={{ fontSize: 11, color: locked ? "rgba(255,255,255,0.2)" : active ? "#fff" : done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.45)", fontWeight: active ? 700 : 400 }}>{s.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Step detail */}
            <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#fff" }}>{currentStepDetail.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, lineHeight: 1.5 }}>{currentStepDetail.desc}</div>
              {currentStepDetail.action && !isStepLocked(currentStep) && (
                <button onClick={() => handleStepAction(currentStepKey)} style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 8 }}>
                  {currentStepDetail.action} <ExternalLink size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Progress</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{completedSteps.size + (videoWatched ? 1 : 0)} / {SETUP_STEPS.length} steps</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, marginBottom: 12 }}>
              <div style={{ width: `${((completedSteps.size + (videoWatched ? 1 : 0)) / SETUP_STEPS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#7C3AED,#22C55E)", borderRadius: 2, transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: currentStep === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: currentStep === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                <ChevronLeft size={13} /> Previous
              </button>
              <button onClick={() => { const n = currentStep + 1; if (n < SETUP_STEPS.length && !isStepLocked(n)) setCurrentStep(n); }} disabled={currentStep === SETUP_STEPS.length - 1 || isStepLocked(currentStep + 1)} style={{ flex: 1, background: "#7C3AED", border: "none", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: (currentStep === SETUP_STEPS.length - 1 || isStepLocked(currentStep + 1)) ? 0.4 : 1 }}>
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Need Help */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Need Help?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: <BookOpen size={16} color="#3B82F6" />, label: "Documentation", sub: "View Guide", bg: "rgba(59,130,246,0.1)", href: "https://docs.moderateai.site" },
              { icon: <Video size={16} color="#EF4444" />, label: "Watch Tutorial", sub: "Step by Step", bg: "rgba(239,68,68,0.1)", href: "https://youtube.com" },
              { icon: <Headphones size={16} color="#22C55E" />, label: "Contact Support", sub: "24/7 Support", bg: "rgba(34,197,94,0.1)", href: "mailto:support@moderateai.site" },
            ].map(item => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: item.bg, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px" }}>
                  {item.icon}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#FAFAFA", fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{item.sub}</div>
                  </div>
                  <ExternalLink size={11} color="rgba(255,255,255,0.2)" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── GCP Connected ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Connected Header */}
      <div style={{ background: "rgba(59,130,246,0.06)", border: "1.5px solid rgba(59,130,246,0.3)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "rgba(59,130,246,0.15)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cloud size={18} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>My Google Cloud Project</div>
            </div>
          </div>
          <span style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>● Connected</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Project Name</div>
            <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              {gcpProjectName}
              <Copy size={11} color="rgba(255,255,255,0.3)" style={{ cursor: "pointer" }} onClick={() => handleCopy(gcpProjectName, "pn")} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Project ID</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 4 }}>
              {gcpProjectId}
              <Copy size={10} color="rgba(255,255,255,0.3)" style={{ cursor: "pointer" }} onClick={() => handleCopy(gcpProjectId, "pid")} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Google Account</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {gcpAccountAvatar ? (
                <img src={gcpAccountAvatar} style={{ width: 20, height: 20, borderRadius: "50%" }} alt="" />
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#4285f4,#ea4335)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  {gcpAccount[0]?.toUpperCase() || "G"}
                </div>
              )}
              <span style={{ fontSize: 12, fontWeight: 600 }}>{gcpAccount}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Connected On</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{gcpConnectedDate}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Last Sync</div>
            <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {gcpLastSync}
              <RefreshCw size={10} style={{ cursor: "pointer" }} onClick={handleGcpRefresh} />
            </div>
          </div>
        </div>

        {/* OAuth / API Status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "OAuth Status", val: gcpOAuthStatus, ok: gcpOAuthStatus === "Verified" },
            { label: "API Status", val: gcpApiStatus, ok: gcpApiStatus === "Enabled" },
            { label: "Billing Status", val: gcpApiBilling, ok: gcpApiBilling === "Active" },
            { label: "Credentials", val: userData.gcp_client_id_saved ? "Valid" : "Missing", ok: !!userData.gcp_client_id_saved },
            { label: "Quota Reset", val: gcpResetTime, ok: true },
            { label: "Last Verification", val: "2m ago", ok: true },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.ok ? "#22C55E" : "#F59E0B", display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: item.ok ? "#22C55E" : "#F59E0B" }}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* Daily Quota Usage */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <DonutChart used={gcpUsedToday} limit={gcpDailyQuota} color="#3B82F6" size={88} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Daily Quota Usage</div>
            <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Used</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{gcpUsedToday.toLocaleString()} / {gcpDailyQuota.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Remaining</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E" }}>{gcpRemaining.toLocaleString()}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                <div style={{ width: `${(gcpUsedToday / gcpDailyQuota) * 100}%`, height: "100%", background: "#3B82F6", borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Open Google Cloud Console", href: "https://console.cloud.google.com", color: "#3B82F6" },
            { label: "Open API Library", href: "https://console.cloud.google.com/apis/library", color: "#A78BFA" },
            { label: "Open Credentials", href: "https://console.cloud.google.com/apis/credentials", color: "#F59E0B" },
            { label: "Refresh Status", onClick: handleGcpRefresh, color: "#22C55E" },
          ].map(item => (
            item.href ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 10px", cursor: "pointer" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.label}</span>
                  <ExternalLink size={10} color="rgba(255,255,255,0.3)" />
                </div>
              </a>
            ) : (
              <button key={item.label} onClick={item.onClick} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 10px", cursor: "pointer" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: item.color }}>{item.label}</span>
                {gcpRefreshing && <Loader2 size={10} color={item.color} style={{ animation: "spin 1s linear infinite" }} />}
              </button>
            )
          ))}
        </div>
      </div>

      {/* ── YouTube Data API Usage ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>YouTube Data API Usage</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Daily Quota</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["7D", "30D", "90D"] as const).map(t => (
              <button key={t} onClick={() => setChartRange(t)} style={{ padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", background: chartRange === t ? "#7C3AED" : "rgba(255,255,255,0.06)", color: chartRange === t ? "#fff" : "rgba(255,255,255,0.4)", border: "none" }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Daily Quota", val: `${gcpDailyQuota.toLocaleString()}`, sub: "units", note: "Hard limit per day" },
            { label: "Used Today", val: `${gcpUsedToday.toLocaleString()}`, sub: "units", note: `${((gcpUsedToday / gcpDailyQuota) * 100).toFixed(1)}% of daily quota`, noteColor: "#F59E0B" },
            { label: "Remaining", val: `${gcpRemaining.toLocaleString()}`, sub: "units", note: `${((gcpRemaining / gcpDailyQuota) * 100).toFixed(1)}% remaining`, noteColor: "#22C55E" },
            { label: "Requests Today", val: "312", sub: "", note: "Across 6 endpoints" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 10px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#fff" }}>{s.val}</div>
              {s.sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.sub}</div>}
              {s.note && <div style={{ fontSize: 10, color: (s as any).noteColor || "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.note}</div>}
            </div>
          ))}
        </div>

        {/* Chart + Top Methods */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.7)" }}>API Usage Over Time (Units)</div>
            <MiniLineChart used={gcpUsedToday} limit={gcpDailyQuota} color="#3B82F6" days={chartDays} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.7)" }}>Top API Methods (Today)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topApiMethods.map(m => (
                <div key={m.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{m.units} ({m.pct}%)</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                    <div style={{ width: `${m.pct}%`, height: "100%", background: m.name === "others" ? "rgba(255,255,255,0.2)" : "#3B82F6", borderRadius: 2, opacity: m.name === "others" ? 0.5 : 1 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: 11, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{gcpUsedToday.toLocaleString()} units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── About Your Google Cloud Project ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>About Your Google Cloud Project</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>You are using your own Google Cloud project. All quota and billing are managed by Google.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { label: "Project Number", val: gcpProjectNumber },
            { label: "Location", val: gcpLocation },
            { label: "OAuth Client ID", val: "••••••••1234" },
            { label: "Quota Type", val: gcpQuotaType },
            { label: "Ownership", val: "You" },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: item.label === "Ownership" ? "#22C55E" : "#fff" }}>{item.val}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Info size={14} color="#A78BFA" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Using your own project gives you higher quota limits and better reliability.</span>
          </div>
          <button onClick={() => window.open("https://cloud.google.com/docs", "_blank")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            Learn More <ExternalLink size={10} />
          </button>
        </div>
      </div>

      {/* ── How It Works + Quota Reset + Need More Quota ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>How It Works</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Connect your Google Cloud project",
              "We use your credentials to access YouTube Data API",
              "All quota is charged to your Google Cloud",
              "You get higher limits & better reliability",
            ].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <CheckCircle size={13} color="#22C55E" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{f}</span>
              </div>
            ))}
          </div>
          {/* Cloud illustration */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <svg width="56" height="48" viewBox="0 0 56 48" fill="none" opacity="0.6">
              <ellipse cx="28" cy="36" rx="20" ry="9" fill="rgba(59,130,246,0.15)" />
              <circle cx="20" cy="26" r="10" fill="rgba(59,130,246,0.3)" />
              <circle cx="30" cy="20" r="13" fill="rgba(59,130,246,0.4)" />
              <circle cx="40" cy="26" r="9" fill="rgba(59,130,246,0.3)" />
              <circle cx="42" cy="34" r="8" fill="#22C55E" opacity="0.9" />
              <path d="M39 34 L41.5 36.5 L46 31" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Quota Reset */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Quota Reset</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ background: "rgba(124,58,237,0.15)", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={16} color="#A78BFA" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>May 22, 2025</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>12:00 AM (IST)</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Time remaining</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>{timeRemaining}</div>
          </div>

          {/* Need More Quota */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Need More Quota?</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>If you need higher quota limits, you can request an increase from Google.</div>
            <button onClick={() => window.open("https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas", "_blank")} style={{ width: "100%", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60A5FA", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
              Request Quota Increase <ExternalLink size={12} />
            </button>
            <button onClick={() => window.open("https://developers.google.com/youtube/v3/getting-started#quota", "_blank")} style={{ width: "100%", background: "none", border: "none", color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              Learn how quota works <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Disconnect */}
      <button onClick={handleGcpDisconnect} disabled={gcpDisconnecting} style={{ width: "100%", background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E", borderRadius: 14, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        {gcpDisconnecting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <WifiOff size={14} />}
        Disconnect Google Cloud Project
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function APIAccessPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shared" | "gcp">("shared");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMsg(msg); setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setUserData(snap.data() as UserData);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "#09090B", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#7C3AED" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#09090B", color: "#FAFAFA", fontFamily: "Inter,sans-serif" }}>
      {/* Desktop sidebar — untouched */}
      <div className="sidebar-desktop">
        <DashboardSidebar />
      </div>

      <style>{`
        .sidebar-desktop { display: none; }
        @media (pointer: fine) and (min-width: 768px) {
          .sidebar-desktop { display: block; }
          .main-content { margin-left: 240px !important; padding-bottom: 0 !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, right: 16, zIndex: 9999,
          background: toastType === "success" ? "rgba(34,197,94,0.15)" : toastType === "error" ? "rgba(244,63,94,0.15)" : "rgba(124,58,237,0.15)",
          border: `1px solid ${toastType === "success" ? "rgba(34,197,94,0.4)" : toastType === "error" ? "rgba(244,63,94,0.4)" : "rgba(124,58,237,0.4)"}`,
          borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
          color: "#fff", fontSize: 13, fontWeight: 600, animation: "fadeSlideIn 0.2s ease",
          backdropFilter: "blur(12px)", maxWidth: 320
        }}>
          {toastType === "success" ? <CheckCircle size={15} color="#22C55E" /> : toastType === "error" ? <AlertCircle size={15} color="#F43F5E" /> : <Zap size={15} color="#A78BFA" />}
          {toastMsg}
        </div>
      )}

      <main className="main-content" style={{ flex: 1, paddingBottom: 80, overflowX: "hidden" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 14px 40px" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", borderRadius: 14, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(124,58,237,0.35)", flexShrink: 0 }}>
                <Shield size={20} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>API Access</h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0, marginTop: 2 }}>Manage how ModerateAI connects to the YouTube Data API</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#22C55E", fontSize: 12, fontWeight: 600, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "4px 10px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                All Systems Normal
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Last checked: 2m ago</span>
            </div>
          </div>

          {/* ── Tab Switcher ── */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={() => setActiveTab("shared")}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: activeTab === "shared" ? "linear-gradient(135deg,#7C3AED,#4F46E5)" : "transparent", color: activeTab === "shared" ? "#fff" : "rgba(255,255,255,0.45)", boxShadow: activeTab === "shared" ? "0 4px 14px rgba(124,58,237,0.35)" : "none" }}
            >
              <Share2 size={14} />
              <span>ModerateAI Shared API</span>
              <span style={{ background: activeTab === "shared" ? "rgba(255,255,255,0.2)" : "rgba(124,58,237,0.2)", color: activeTab === "shared" ? "#fff" : "#A78BFA", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>Recommended</span>
            </button>
            <button
              onClick={() => setActiveTab("gcp")}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: activeTab === "gcp" ? "rgba(255,255,255,0.08)" : "transparent", color: activeTab === "gcp" ? "#fff" : "rgba(255,255,255,0.45)" }}
            >
              <Cloud size={14} /> My Google Cloud Project
            </button>
          </div>

          {/* ── Tab Content ── */}
          {userData && user ? (
            activeTab === "shared"
              ? <SharedAPITab userData={userData} user={user} router={router} showToast={showToast} />
              : <GCPTab userData={userData} user={user} router={router} showToast={showToast} />
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.3)" }}>No data available</div>
          )}
        </div>
      </main>

      <DashboardBottomNav />
    </div>
  );
}