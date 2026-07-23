"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DashboardSidebar, DashboardBottomNav } from "@/app/components/DashboardLayout";
import {
  Shield, RefreshCw, CheckCircle, Zap,
  BarChart2, MessageSquare, Video, Clock, TrendingUp,
  Activity, BookOpen, Headphones, ChevronLeft, ChevronRight,
  Lock, AlertCircle, ExternalLink, Wifi, WifiOff, Loader2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
}

// ─── Setup Steps ──────────────────────────────────────────────────────────────
const SETUP_STEPS = [
  { label: "Watch Video", key: "watch_video" },
  { label: "Google Console", key: "google_console" },
  { label: "Enable API", key: "enable_api" },
  { label: "OAuth Client", key: "oauth_client" },
  { label: "Add Credential", key: "add_credential" },
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

// ─── Mini Chart ───────────────────────────────────────────────────────────────
function MiniChart({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const segments = 9;
  const pts = Array.from({ length: segments }, (_, i) => {
    const progress = i / (segments - 1);
    return Math.round(used * progress * (0.7 + Math.random() * 0.3));
  });
  pts[pts.length - 1] = used;

  const w = 340, h = 100;
  const maxVal = Math.max(...pts, 1);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - (v / maxVal) * (h - 10) - 5);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 100 }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cg)" />
        <path d={path} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={5} fill="#7C3AED" />
        <rect x={xs[xs.length - 1] - 52} y={ys[ys.length - 1] - 32} width={96} height={22} rx={6} fill="rgba(30,20,60,0.95)" />
        <text x={xs[xs.length - 1]} y={ys[ys.length - 1] - 16} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="700">
          {used.toLocaleString()} AI Actions
        </text>
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 6 }}>
          <div style={{ width: `${pct}%`, background: pct > 80 ? "#F43F5E" : "#7C3AED", height: "100%", borderRadius: 4, transition: "width 0.6s ease" }} />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{used} / {limit} used</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function APIAccessPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"24H" | "7D" | "30D" | "90D">("30D");
  const [currentStep, setCurrentStep] = useState(1);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [testingConnection, setTestingConnection] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = useCallback((msg: string, type: "success" | "error" | "info" = "info") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  // Realtime Firestore listener
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setUserData(snap.data() as UserData);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  // ─── Button Handlers ──────────────────────────────────────────────────────

  const handleReconnect = async () => {
    if (!user) return;
    setReconnecting(true);
    try {
      window.location.href = `/api/auth/youtube?uid=${user.uid}`;
    } catch {
      showToast("Reconnect failed. Try again.", "error");
      setReconnecting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!user || !userData) return;
    setTestingConnection(true);
    try {
      if (!userData.youtube_connected) {
        showToast("No YouTube channel connected.", "error");
        return;
      }
      const res = await fetch(`/api/auth/youtube/refresh-stats?uid=${user.uid}`);
      if (res.ok) {
        await updateDoc(doc(db, "users", user.uid), {
          youtube_stats_refreshed_at: new Date().toISOString(),
        });
        showToast("Connection verified — channel is live!", "success");
      } else {
        showToast("Connection test failed. Check your API credentials.", "error");
      }
    } catch {
      showToast("Connection test failed. Check your API credentials.", "error");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleViewUsage = () => {
    router.push("/dashboard/analytics");
  };

  const handleDisconnect = async () => {
    if (!user) return;
    if (!confirm("Disconnect your YouTube channel? Moderation will stop.")) return;
    setDisconnecting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        youtube_connected: false,
        channel_status: "disconnected",
        youtube_channel_id: "",
        youtube_channel_name: "",
        youtube_channel_handle: "",
        youtube_channel_thumbnail: "",
        youtube_access_token: "",
        youtube_refresh_token: "",
      });
      showToast("YouTube channel disconnected.", "success");
    } catch {
      showToast("Failed to disconnect. Try again.", "error");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleRefreshStats = async () => {
    if (!user || !userData?.youtube_connected) {
      showToast("Connect a YouTube channel first.", "error");
      return;
    }
    setRefreshing(true);
    try {
      const res = await fetch(`/api/auth/youtube/refresh-stats?uid=${user.uid}`);
      if (res.ok) {
        showToast("Stats refreshed successfully.", "success");
      } else {
        showToast("Failed to refresh stats.", "error");
      }
    } catch {
      showToast("Failed to refresh stats.", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectYouTube = () => {
    if (!user) return;
    window.location.href = `/api/auth/youtube?uid=${user.uid}`;
  };

  const handleStepAction = (stepKey: string) => {
    const detail = STEP_DETAILS[stepKey];
    if (!detail?.url) return;
    if (stepKey === "connect_youtube") {
      handleConnectYouTube();
    } else if (detail.url.startsWith("/")) {
      router.push(detail.url);
    } else {
      window.open(detail.url, "_blank", "noopener noreferrer");
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const aiUsed = userData ? (userData.comments_limit - userData.ai_credits) : 0;
  const aiLimit = userData?.comments_limit ?? 250;
  const channelConnected = userData?.youtube_connected ?? false;
  const channelName = userData?.youtube_channel_name || "Not connected";
  const channelHandle = userData?.youtube_channel_handle || "";
  const planName = userData?.plan_display_name || "Free Trial";
  const planExpiry = userData?.plan_expires_at
    ? new Date(userData.plan_expires_at.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";
  const lastSync = userData?.youtube_stats_refreshed_at
    ? new Date(userData.youtube_stats_refreshed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "Never";
  const successRate = userData?.moderation_accuracy ?? 0;
  const avgResponseSec = userData?.avg_response_ms ? (userData.avg_response_ms / 1000).toFixed(1) + "s" : "—";

  const STATS = [
    { icon: <Zap size={15} color="#7C3AED" />, label: "AI Actions Used", value: aiUsed.toLocaleString(), sub: `of ${aiLimit.toLocaleString()}`, bg: "rgba(124,58,237,0.1)" },
    { icon: <MessageSquare size={15} color="#22C55E" />, label: "Comments Scanned", value: (userData?.comments_scanned ?? 0).toLocaleString(), sub: "total", bg: "rgba(34,197,94,0.1)" },
    { icon: <TrendingUp size={15} color="#3B82F6" />, label: "AI Replies", value: (userData?.ai_replies ?? 0).toLocaleString(), sub: "generated", bg: "rgba(59,130,246,0.1)" },
    { icon: <Video size={15} color="#F59E0B" />, label: "Subscribers", value: userData?.youtube_subscriber_count ? Number(userData.youtube_subscriber_count).toLocaleString() : "—", sub: "channel", bg: "rgba(245,158,11,0.1)" },
    { icon: <Clock size={15} color="#10B981" />, label: "Avg Response", value: avgResponseSec, sub: "per comment", bg: "rgba(16,185,129,0.1)" },
    { icon: <Activity size={15} color="#F43F5E" />, label: "Accuracy", value: successRate > 0 ? `${successRate}%` : "—", sub: "moderation", bg: "rgba(244,63,94,0.1)" },
  ];

  const HEALTH = [
    { label: "API Server", ok: true },
    { label: "Database", ok: true },
    { label: "YouTube API", ok: channelConnected },
    { label: "AI Engine", ok: userData?.live_monitoring ?? false },
  ];

  const ACTIVITY = [
    userData?.youtube_stats_refreshed_at && {
      msg: `YouTube stats refreshed`,
      time: lastSync,
    },
    channelConnected && userData?.youtube_channel_name && {
      msg: `Channel "${userData.youtube_channel_name}" connected`,
      time: "Active",
    },
    userData?.last_scan_at && {
      msg: "Moderation scan completed",
      time: userData.last_scan_at
        ? new Date(userData.last_scan_at.seconds * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
        : "—",
    },
    userData?.last_comment_at && {
      msg: "Last comment processed",
      time: userData.last_comment_at
        ? new Date(userData.last_comment_at.seconds * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
        : "—",
    },
  ].filter(Boolean) as { msg: string; time: string }[];

  const currentStepKey = SETUP_STEPS[currentStep]?.key ?? "google_console";
  const currentStepDetail = STEP_DETAILS[currentStepKey];

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
      <div className="sidebar-wrapper" style={{ display: "none" }}>
        <DashboardSidebar />
      </div>
      <style>{`
        @media (pointer: fine) { .sidebar-wrapper { display: block !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toastType === "success" ? "rgba(34,197,94,0.15)" : toastType === "error" ? "rgba(244,63,94,0.15)" : "rgba(124,58,237,0.15)",
          border: `1px solid ${toastType === "success" ? "rgba(34,197,94,0.4)" : toastType === "error" ? "rgba(244,63,94,0.4)" : "rgba(124,58,237,0.4)"}`,
          borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8,
          color: "#fff", fontSize: 13, fontWeight: 600, animation: "fadeIn 0.2s ease",
          backdropFilter: "blur(12px)", maxWidth: 340,
        }}>
          {toastType === "success" ? <CheckCircle size={15} color="#22C55E" /> : toastType === "error" ? <AlertCircle size={15} color="#F43F5E" /> : <Zap size={15} color="#A78BFA" />}
          {toastMsg}
        </div>
      )}

      <main style={{ flex: 1, paddingBottom: 80, overflowX: "hidden" }} className="main-content">
        <style>{`@media (pointer: fine) { .main-content { margin-left: 240px !important; padding-bottom: 0 !important; } }`}</style>

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

            {/* LEFT */}
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
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Current Plan</div>
                      <span style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{planName}</span>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>AI Actions / Month</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{aiUsed} / {aiLimit}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Reset Date</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{planExpiry}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Health</div>
                      <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Healthy
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Status</div>
                      <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Active
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Connected</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {channelConnected ? "1 Channel" : "None"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleReconnect}
                      disabled={reconnecting}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    >
                      {reconnecting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />} Reconnect
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    >
                      {testingConnection ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Wifi size={11} />} Test
                    </button>
                    <button
                      onClick={handleViewUsage}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none" }}
                    >
                      View Usage
                    </button>
                  </div>
                </div>

                {/* YouTube Channel Card */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 18, position: "relative" }}>
                  <div style={{ position: "absolute", top: 14, right: 14, background: channelConnected ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", color: channelConnected ? "#22C55E" : "#F59E0B", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                    {channelConnected ? "Connected" : "Not Connected"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    {channelConnected && userData?.youtube_channel_thumbnail ? (
                      <img src={userData.youtube_channel_thumbnail} alt="channel" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
                    ) : (
                      <div style={{ background: "rgba(239,68,68,0.15)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Video size={16} color="#EF4444" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>YouTube Channel</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{channelConnected ? channelName : "No channel linked"}</div>
                      {channelHandle && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{channelHandle}</div>}
                    </div>
                  </div>

                  {channelConnected ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                        {[
                          { label: "Subscribers", val: Number(userData?.youtube_subscriber_count ?? 0).toLocaleString(), color: "#22C55E" },
                          { label: "Videos", val: userData?.youtube_video_count ?? "0" },
                          { label: "Total Views", val: Number(userData?.youtube_view_count ?? 0).toLocaleString() },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{item.label}</div>
                            <div style={{ color: item.color || "#FAFAFA", fontSize: 12, fontWeight: 600 }}>{item.val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                        {[
                          { label: "Channel Status", val: "Active", color: "#22C55E" },
                          { label: "Moderation", val: userData?.live_monitoring ? "Live" : "Paused", color: userData?.live_monitoring ? "#22C55E" : "#F59E0B" },
                          { label: "Last Sync", val: lastSync.split(",")[0] },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{item.label}</div>
                            <div style={{ color: item.color || "#FAFAFA", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                              {item.color && item.color !== "#FAFAFA" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />}
                              {item.val}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={handleRefreshStats}
                          disabled={refreshing}
                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                        >
                          {refreshing ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />} Refresh Stats
                        </button>
                        <button
                          onClick={handleDisconnect}
                          disabled={disconnecting}
                          style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                        >
                          {disconnecting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <WifiOff size={11} />} Disconnect
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 14 }}>Connect your YouTube channel to start moderation</div>
                      <button
                        onClick={handleConnectYouTube}
                        style={{ width: "100%", background: "linear-gradient(135deg,#EF4444,#DC2626)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                      >
                        Connect YouTube Channel
                      </button>
                    </div>
                  )}
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
                  {[
                    { name: "Free Trial", icon: "✦", color: "#22C55E", actions: 250, current: userData?.plan === "free" },
                    { name: "Pro", icon: "💎", color: "#7C3AED", actions: 1900, badge: "Popular", current: userData?.plan === "pro" },
                    { name: "Agency", icon: "👑", color: "#F59E0B", actions: 15000, current: userData?.plan === "agency" },
                  ].map(plan => (
                    <div key={plan.name} onClick={() => !plan.current && router.push("/billing")} style={{
                      background: `rgba(${plan.color === "#22C55E" ? "34,197,94" : plan.color === "#7C3AED" ? "124,58,237" : "245,158,11"},0.07)`,
                      border: `${plan.current ? "2px" : "1px"} solid ${plan.color}${plan.current ? "88" : "33"}`,
                      borderRadius: 12, padding: 16, textAlign: "center", position: "relative",
                      cursor: plan.current ? "default" : "pointer",
                      transition: "transform 0.15s",
                    }}>
                      {plan.badge && <span style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>{plan.badge}</span>}
                      {plan.current && <span style={{ position: "absolute", top: 8, right: 8, background: plan.color, color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>Current</span>}
                      <div style={{ color: plan.color, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{plan.icon} {plan.name}</div>
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
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Last synced: {lastSync}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["24H", "7D", "30D", "90D"] as const).map(t => (
                      <button key={t} onClick={() => setActiveTab(t)} style={{
                        padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: activeTab === t ? "#7C3AED" : "rgba(255,255,255,0.06)",
                        color: activeTab === t ? "#fff" : "rgba(255,255,255,0.4)", border: "none",
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                {aiUsed === 0 && aiLimit > 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    No usage yet. Start moderating to see data here.
                  </div>
                ) : (
                  <MiniChart used={aiUsed} limit={aiLimit} />
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }} className="stats-grid">
                  <style>{`@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
                  {STATS.map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {s.icon}<span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{s.sub}</div>
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
                  {ACTIVITY.length === 0 ? (
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No activity yet.</div>
                  ) : ACTIVITY.map((a, i) => (
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
                        {h.ok ? <CheckCircle size={14} color="#22C55E" /> : <AlertCircle size={14} color="#F59E0B" />}
                        <span style={{ fontSize: 13 }}>{h.label}</span>
                      </div>
                      <span style={{ color: h.ok ? "#22C55E" : "#F59E0B", fontSize: 12, fontWeight: 600 }}>
                        {h.ok ? "Operational" : "Not Connected"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* YouTube Channel Info Card */}
              {channelConnected && userData?.youtube_channel_thumbnail && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <img src={userData.youtube_channel_thumbnail} alt="channel" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{userData.youtube_channel_name}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{userData.youtube_channel_handle}</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: "#22C55E", fontSize: 11, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Live
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Subscribers", val: Number(userData.youtube_subscriber_count).toLocaleString() },
                      { label: "Videos", val: userData.youtube_video_count },
                      { label: "Views", val: Number(userData.youtube_view_count).toLocaleString() },
                    ].map(item => (
                      <div key={item.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 4px" }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{item.val}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => window.open(`https://youtube.com/channel/${userData.youtube_channel_id}`, "_blank")}
                    style={{ width: "100%", marginTop: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", borderRadius: 10, padding: "8px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <ExternalLink size={12} /> View on YouTube
                  </button>
                </div>
              )}

              {/* Setup Guide Video */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Video size={15} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Setup Guide Video</span>
                  </div>
                  <button
                    onClick={handleRefreshStats}
                    disabled={refreshing}
                    style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}
                  >
                    <RefreshCw size={11} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} /> Refresh
                  </button>
                </div>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ background: "linear-gradient(135deg,#1E1B4B,#4C1D95)", margin: "0 12px 12px", borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ background: "rgba(124,58,237,0.3)", borderRadius: 10, padding: 8 }}><Shield size={20} color="#A78BFA" /></div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>ModerateAI</div>
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
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Click to watch setup guide ↗</div>
                  </div>
                </a>
              </div>

              {/* Step by Step Setup */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Step by Step Setup</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>(My Google Cloud Project)</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
                    {SETUP_STEPS.map((s, i) => {
                      const done = i < currentStep;
                      const active = i === currentStep;
                      const locked = i > currentStep;
                      return (
                        <button
                          key={i}
                          onClick={() => !locked && setCurrentStep(i)}
                          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: locked ? "default" : "pointer", padding: 0, textAlign: "left" }}
                        >
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: done ? "#22C55E" : active ? "#7C3AED" : "rgba(255,255,255,0.1)",
                            fontSize: 10, fontWeight: 700, color: "#fff",
                          }}>
                            {done ? <CheckCircle size={12} /> : locked ? <Lock size={10} /> : i + 1}
                          </div>
                          <span style={{ fontSize: 12, color: active ? "#fff" : done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)", fontWeight: active ? 700 : 400 }}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{currentStepDetail.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10 }}>{currentStepDetail.desc}</div>
                    {currentStepDetail.action && (
                      <button
                        onClick={() => handleStepAction(currentStepKey)}
                        style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "7px", fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                      >
                        {currentStepDetail.action} <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: currentStep === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: currentStep === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentStep(s => Math.min(SETUP_STEPS.length - 1, s + 1))}
                    disabled={currentStep === SETUP_STEPS.length - 1}
                    style={{ flex: 1, background: "#7C3AED", border: "none", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: currentStep === SETUP_STEPS.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: currentStep === SETUP_STEPS.length - 1 ? 0.5 : 1 }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Need Help */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Need Help?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: <BookOpen size={16} color="#3B82F6" />, label: "Documentation", sub: "View Guide", bg: "rgba(59,130,246,0.1)", href: "https://docs.moderateai.site" },
                    { icon: <Video size={16} color="#EF4444" />, label: "Watch Tutorial", sub: "Step by Step", bg: "rgba(239,68,68,0.1)", href: "https://youtube.com" },
                    { icon: <Headphones size={16} color="#22C55E" />, label: "Contact Support", sub: "24/7 Support", bg: "rgba(34,197,94,0.1)", href: "mailto:support@moderateai.site" },
                  ].map(item => (
                    <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                      <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: item.bg, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ flexShrink: 0 }}>{item.icon}</div>
                        <div>
                          <div style={{ color: "#FAFAFA", fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{item.sub}</div>
                        </div>
                        <ExternalLink size={11} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />
                      </button>
                    </a>
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