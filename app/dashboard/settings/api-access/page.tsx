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
  CheckSquare, XCircle, Info, Copy, Trash2, Link2
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

// ─── Demo Screenshots (pure HTML/CSS) ────────────────────────────────────────
const DemoScreenshots: Record<string, React.FC> = {
  watch_video: memo(function WatchVideoDemo() {
    return (
      <div style={{ background: "#0f0f0f", borderRadius: 8, overflow: "hidden", fontFamily: "Roboto, sans-serif", fontSize: 11 }}>
        {/* YouTube-like header */}
        <div style={{ background: "#212121", padding: "6px 10px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #333" }}>
          <div style={{ display: "flex", gap: 3 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840" }} /></div>
          <div style={{ flex: 1, background: "#333", borderRadius: 12, padding: "2px 8px", color: "#aaa", fontSize: 9 }}>youtube.com/watch?v=moderateai-setup</div>
        </div>
        {/* Video area */}
        <div style={{ position: "relative", background: "#000", paddingTop: "42%" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a0533,#0d1b3e)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase" }}>ModerateAI Setup Guide</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "center" }}>Google Cloud Setup</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Full Tutorial · 12:34</div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
              <div style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "10px solid #fff", marginLeft: 2 }} />
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ padding: "4px 8px", background: "#0f0f0f" }}>
          <div style={{ height: 2, background: "#333", borderRadius: 1 }}>
            <div style={{ width: "35%", height: "100%", background: "#FF0000", borderRadius: 1 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "#aaa", fontSize: 8 }}>
            <span>4:22</span><span>12:34</span>
          </div>
        </div>
      </div>
    );
  }),

  google_console: memo(function GoogleConsoleDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#1a73e8", padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea4335" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbc04" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34a853" }} /></div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 8px", color: "rgba(255,255,255,0.9)", fontSize: 8 }}>console.cloud.google.com</div>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ width: 90, background: "#f8f9fa", borderRight: "1px solid #e8eaed", padding: "8px 6px", fontSize: 8, color: "#5f6368" }}>
            {["Home","IAM & Admin","APIs & Services","Billing","Credentials"].map(s => (
              <div key={s} style={{ padding: "3px 4px", borderRadius: 4, marginBottom: 2, cursor: "pointer", background: s === "APIs & Services" ? "#e8f0fe" : "transparent", color: s === "APIs & Services" ? "#1a73e8" : "#5f6368" }}>{s}</div>
            ))}
          </div>
          <div style={{ flex: 1, padding: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#202124", marginBottom: 6 }}>Google Cloud Console</div>
            <div style={{ background: "#e8f0fe", border: "1px solid #1a73e8", borderRadius: 4, padding: "4px 8px", fontSize: 8, color: "#1a73e8", marginBottom: 6 }}>▾ ModerateAI Project</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[["APIs","3 Enabled"],["Credentials","1 Created"],["Quota","10K/day"],["Billing","Active"]].map(([k,v]) => (
                <div key={k} style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: "5px 6px" }}>
                  <div style={{ fontSize: 7, color: "#5f6368" }}>{k}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "#202124" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }),

  enable_api: memo(function EnableAPIDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#1a73e8", padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea4335" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbc04" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34a853" }} /></div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 8px", color: "rgba(255,255,255,0.9)", fontSize: 8 }}>console.cloud.google.com/apis/library</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 20, padding: "4px 10px", fontSize: 8, color: "#5f6368", marginBottom: 6 }}>🔍 Search APIs and services…</div>
          <div style={{ border: "1px solid #e8eaed", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 8, padding: "6px 8px", background: "#fafafa" }}>
              <div style={{ width: 28, height: 28, background: "#ff0000", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "#fff", fontSize: 7, fontWeight: 700 }}>▶</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#202124" }}>YouTube Data API v3</div>
                <div style={{ fontSize: 7, color: "#5f6368" }}>Google Enterprise API</div>
              </div>
            </div>
            <div style={{ padding: "4px 8px", borderTop: "1px solid #e8eaed", background: "#fff" }}>
              <div style={{ fontSize: 7, color: "#5f6368", marginBottom: 4 }}>Allows access to YouTube data, including videos, playlists, and channels.</div>
              <button style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Enable</button>
            </div>
          </div>
        </div>
      </div>
    );
  }),

  oauth_client: memo(function OAuthClientDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#1a73e8", padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea4335" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbc04" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34a853" }} /></div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 8px", color: "rgba(255,255,255,0.9)", fontSize: 8 }}>console.cloud.google.com/apis/credentials</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#202124", marginBottom: 6 }}>Create OAuth 2.0 Client ID</div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 7, color: "#5f6368", marginBottom: 2 }}>Application type</div>
            <div style={{ fontSize: 8, color: "#202124", fontWeight: 500 }}>Web application ▾</div>
          </div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 7, color: "#5f6368", marginBottom: 2 }}>Authorised redirect URI</div>
            <div style={{ fontSize: 7, color: "#1a73e8" }}>https://app.moderateai.site/api/auth/youtube/callback</div>
          </div>
          <button style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Create</button>
        </div>
      </div>
    );
  }),

  add_credential: memo(function AddCredentialDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#1a73e8", padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea4335" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbc04" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34a853" }} /></div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 8px", color: "rgba(255,255,255,0.9)", fontSize: 8 }}>console.cloud.google.com → OAuth Client Created</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ background: "#e6f4ea", border: "1px solid #34a853", borderRadius: 4, padding: "4px 8px", fontSize: 8, color: "#137333", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <span>✓</span> OAuth client created successfully
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#202124", marginBottom: 6 }}>Your credentials</div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 6, marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 7, color: "#5f6368" }}>Client ID</div>
                <div style={{ fontSize: 7, color: "#202124", fontFamily: "monospace" }}>123456789-abcd.apps.googleusercontent.com</div>
              </div>
              <div style={{ background: "#1a73e8", color: "#fff", fontSize: 7, padding: "2px 6px", borderRadius: 3, cursor: "pointer" }}>Copy</div>
            </div>
          </div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 7, color: "#5f6368" }}>Client Secret</div>
                <div style={{ fontSize: 7, color: "#202124", fontFamily: "monospace" }}>GOCSPX-••••••••••••••••••</div>
              </div>
              <div style={{ background: "#1a73e8", color: "#fff", fontSize: 7, padding: "2px 6px", borderRadius: 3, cursor: "pointer" }}>Copy</div>
            </div>
          </div>
        </div>
      </div>
    );
  }),

  connect_youtube: memo(function ConnectYouTubeDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#fff", padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid #e8eaed" }}>
          <div style={{ display: "flex", gap: 3 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ea4335" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbc04" }} /><div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34a853" }} /></div>
          <div style={{ flex: 1, background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 10, padding: "2px 8px", fontSize: 8, color: "#5f6368" }}>accounts.google.com/oauth2/authorize</div>
        </div>
        <div style={{ padding: "8px 12px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}><span style={{ color: "#4285f4" }}>G</span><span style={{ color: "#ea4335" }}>o</span><span style={{ color: "#fbbc04" }}>o</span><span style={{ color: "#4285f4" }}>g</span><span style={{ color: "#34a853" }}>l</span><span style={{ color: "#ea4335" }}>e</span></div>
          </div>
          <div style={{ fontSize: 9, color: "#5f6368", marginBottom: 4 }}>ModerateAI wants to access your Google Account</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#202124", marginBottom: 6 }}>user@gmail.com</div>
          <div style={{ textAlign: "left", marginBottom: 6 }}>
            {["See your YouTube channel","Manage your YouTube videos","View your YouTube comments"].map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, fontSize: 8, color: "#202124" }}>
                <span style={{ color: "#34a853" }}>✓</span> {p}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ flex: 1, background: "#fff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: 4, padding: "4px", fontSize: 8, cursor: "pointer" }}>Cancel</button>
            <button style={{ flex: 1, background: "#1a73e8", border: "none", color: "#fff", borderRadius: 4, padding: "4px", fontSize: 8, fontWeight: 600, cursor: "pointer" }}>Allow</button>
          </div>
        </div>
      </div>
    );
  }),
};

// ─── Mini Chart ───────────────────────────────────────────────────────────────
const MiniChart = memo(function MiniChart({ used, limit, color = "#7C3AED", label = "AI Actions" }: { used: number; limit: number; color?: string; label?: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const segments = 9;
  const pts = useMemo(() => Array.from({ length: segments }, (_, i) => {
    const progress = i / (segments - 1);
    return Math.round(used * progress * (0.7 + 0.3 * Math.sin(i * 0.8)));
  }), [used]);
  pts[pts.length - 1] = used;

  const w = 340, h = 100;
  const maxVal = Math.max(...pts, 1);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - (v / maxVal) * (h - 10) - 5);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const colorRgb = color === "#7C3AED" ? "124,58,237" : color === "#3B82F6" ? "59,130,246" : "34,197,94";

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 100 }}>
        <defs>
          <linearGradient id={`cg-${colorRgb}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#cg-${colorRgb})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={5} fill={color} />
        <rect x={xs[xs.length - 1] - 58} y={ys[ys.length - 1] - 32} width={110} height={22} rx={6} fill="rgba(30,20,60,0.95)" />
        <text x={xs[xs.length - 1]} y={ys[ys.length - 1] - 16} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="700">
          {used.toLocaleString()} {label}
        </text>
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 6 }}>
          <div style={{ width: `${pct}%`, background: pct > 80 ? "#F43F5E" : color, height: "100%", borderRadius: 4, transition: "width 0.6s ease" }} />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{used.toLocaleString()} / {limit.toLocaleString()} used</span>
      </div>
    </div>
  );
});

// ─── Quota Bar ────────────────────────────────────────────────────────────────
function QuotaBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 5 }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: ok ? "rgba(34,197,94,0.12)" : "rgba(244,63,94,0.12)",
      color: ok ? "#22C55E" : "#F43F5E",
      border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(244,63,94,0.3)"}`,
      borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: ok ? "#22C55E" : "#F43F5E", display: "inline-block" }} />
      {label}
    </span>
  );
}

// ─── Screenshot Modal ─────────────────────────────────────────────────────────
const ScreenshotModal = memo(function ScreenshotModal({ stepKey, onClose }: { stepKey: string; onClose: () => void }) {
  const DemoComp = DemoScreenshots[stepKey];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, overflow: "hidden", maxWidth: 600, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{STEP_DETAILS[stepKey]?.title}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ padding: 16 }}>
          {DemoComp ? <DemoComp /> : <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 32 }}>Preview not available</div>}
        </div>
      </div>
    </div>
  );
});

// ─── GCP Status Summary ───────────────────────────────────────────────────────
const GCPStatusSummary = memo(function GCPStatusSummary({ userData }: { userData: UserData }) {
  const items = [
    { label: "Connected", ok: !!userData.gcp_connected },
    { label: "OAuth Ready", ok: userData.gcp_oauth_status === "Verified" || userData.gcp_oauth_status === "Configured" },
    { label: "API Enabled", ok: userData.gcp_api_status === "Enabled" },
    { label: "Credentials Saved", ok: !!(userData.gcp_client_id_saved) },
    { label: "Billing Active", ok: userData.gcp_api_billing === "Active" },
    { label: "Quota Available", ok: (userData.gcp_used_today ?? 0) < (userData.gcp_daily_quota ?? 10000) },
  ];
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <CheckSquare size={14} color="#3B82F6" />
        <span style={{ fontWeight: 700, fontSize: 13 }}>Google Cloud Status</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, background: item.ok ? "rgba(34,197,94,0.06)" : "rgba(244,63,94,0.06)", borderRadius: 8, padding: "6px 8px", border: `1px solid ${item.ok ? "rgba(34,197,94,0.15)" : "rgba(244,63,94,0.15)"}` }}>
            {item.ok ? <CheckCircle size={12} color="#22C55E" /> : <XCircle size={12} color="#F43F5E" />}
            <span style={{ fontSize: 11, color: item.ok ? "#22C55E" : "#F43F5E", fontWeight: 600 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Connection Test States ────────────────────────────────────────────────────
type TestState = "idle" | "checking" | "success" | "failed";

function ConnectionTestBtn({ state, onClick }: { state: TestState; onClick: () => void }) {
  const configs = {
    idle: { label: "Test", icon: <Wifi size={11} />, bg: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" },
    checking: { label: "Checking…", icon: <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />, bg: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" },
    success: { label: "Live!", icon: <CheckCircle size={11} />, bg: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" },
    failed: { label: "Failed", icon: <XCircle size={11} />, bg: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.3)" },
  };
  const c = configs[state];
  return (
    <button onClick={onClick} disabled={state === "checking"} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: state === "checking" ? "default" : "pointer", background: c.bg, color: c.color, border: c.border, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.2s" }}>
      {c.icon} {c.label}
    </button>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ onDashboard, onStart }: { onDashboard: () => void; onStart: () => void }) {
  return (
    <div style={{ background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.3)", borderRadius: 16, padding: 28, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#22C55E", marginBottom: 6 }}>Google Cloud Project Connected</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 6 }}>Your own API quota is now active.</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>YouTube connected successfully.</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onDashboard} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Go to Dashboard</button>
        <button onClick={onStart} style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)", border: "none", color: "#fff", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Start Moderation</button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, cta, onCta, children }: { icon: React.ReactNode; title: string; desc: string; cta?: string; onCta?: () => void; children?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 16px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, background: "rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: cta ? 14 : 0 }}>{desc}</div>
      {cta && onCta && (
        <button onClick={onCta} style={{ background: "#7C3AED", border: "none", color: "#fff", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{cta}</button>
      )}
      {children}
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
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [testState, setTestState] = useState<TestState>("idle");
  const [reconnecting, setReconnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [gcpRefreshing, setGcpRefreshing] = useState(false);
  const [gcpDisconnecting, setGcpDisconnecting] = useState(false);
  const [deletingCreds, setDeletingCreds] = useState(false);
  const [modalStepKey, setModalStepKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleVideoEnded = useCallback(() => {
    setVideoWatched(true);
    setCompletedSteps(prev => new Set([...prev, 0]));
    if (currentStep === 0) setCurrentStep(1);
    showToast("Video complete — Step 2 unlocked!", "success");
  }, [currentStep, showToast]);

  const handleReconnect = useCallback(async () => {
    if (!user) return;
    setReconnecting(true);
    try { window.location.href = `/api/auth/youtube?uid=${user.uid}`; }
    catch { showToast("Reconnect failed. Try again.", "error"); setReconnecting(false); }
  }, [user, showToast]);

  const handleTestConnection = useCallback(async () => {
    if (!user || !userData) return;
    setTestState("checking");
    try {
      if (!userData.youtube_connected) { setTestState("failed"); showToast("No YouTube channel connected.", "error"); return; }
      const res = await fetch(`/api/auth/youtube/refresh-stats?uid=${user.uid}`);
      if (res.ok) {
        await updateDoc(doc(db, "users", user.uid), { youtube_stats_refreshed_at: new Date().toISOString() });
        setTestState("success");
        showToast("Connection verified — channel is live!", "success");
      } else { setTestState("failed"); showToast("Connection test failed.", "error"); }
    } catch { setTestState("failed"); showToast("Connection test failed.", "error"); }
    finally { setTimeout(() => setTestState("idle"), 4000); }
  }, [user, userData, showToast]);

  const handleDisconnect = useCallback(async () => {
    if (!user) return;
    if (!confirm("Disconnect your YouTube channel? Moderation will stop.")) return;
    setDisconnecting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        youtube_connected: false, channel_status: "disconnected",
        youtube_channel_id: "", youtube_channel_name: "", youtube_channel_handle: "",
        youtube_channel_thumbnail: "", youtube_access_token: "", youtube_refresh_token: "",
      });
      showToast("YouTube channel disconnected.", "success");
    } catch { showToast("Failed to disconnect. Try again.", "error"); }
    finally { setDisconnecting(false); }
  }, [user, showToast]);

  const handleRefreshStats = useCallback(async () => {
    if (!user || !userData?.youtube_connected) { showToast("Connect a YouTube channel first.", "error"); return; }
    setRefreshing(true);
    try {
      const res = await fetch(`/api/auth/youtube/refresh-stats?uid=${user.uid}`);
      if (res.ok) showToast("Stats refreshed successfully.", "success");
      else showToast("Failed to refresh stats.", "error");
    } catch { showToast("Failed to refresh stats.", "error"); }
    finally { setRefreshing(false); }
  }, [user, userData, showToast]);

  const handleConnectYouTube = useCallback(() => {
    if (!user) return;
    window.location.href = `/api/auth/youtube?uid=${user.uid}`;
  }, [user]);

  const handleGcpRefresh = useCallback(async () => {
    if (!user) return;
    setGcpRefreshing(true);
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserData(snap.data() as UserData);
      showToast("GCP stats refreshed.", "success");
    } catch { showToast("Failed to refresh.", "error"); }
    finally { setGcpRefreshing(false); }
  }, [user, showToast]);

  const handleGcpDisconnect = useCallback(async () => {
    if (!user) return;
    if (!confirm("Disconnect Google Cloud Project?")) return;
    setGcpDisconnecting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        gcp_connected: false, gcp_project_name: "", gcp_project_id: "",
        gcp_client_id: "", gcp_client_secret_masked: "",
      });
      showToast("Google Cloud Project disconnected.", "success");
    } catch { showToast("Failed to disconnect.", "error"); }
    finally { setGcpDisconnecting(false); }
  }, [user, showToast]);

  const handleDeleteCredentials = useCallback(async () => {
    if (!user) return;
    if (!confirm("Delete GCP credentials? You will need to re-add them.")) return;
    setDeletingCreds(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        gcp_client_id: "", gcp_client_secret_masked: "",
        gcp_client_id_saved: false, gcp_client_secret_saved: false,
        gcp_credentials_updated: "",
      });
      showToast("Credentials deleted.", "success");
    } catch { showToast("Failed to delete credentials.", "error"); }
    finally { setDeletingCreds(false); }
  }, [user, showToast]);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      showToast("Copied to clipboard.", "success");
    });
  }, [showToast]);

  const handleStepAction = useCallback((stepKey: string) => {
    const detail = STEP_DETAILS[stepKey];
    if (!detail?.url) return;
    if (stepKey === "connect_youtube") handleConnectYouTube();
    else if (detail.url.startsWith("/")) router.push(detail.url);
    else window.open(detail.url, "_blank", "noopener noreferrer");
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < SETUP_STEPS.length - 1) setCurrentStep(s => s + 1);
  }, [currentStep, handleConnectYouTube, router]);

  const isStepLocked = useCallback((i: number) => {
    if (i === 0) return false;
    for (let j = 0; j < i; j++) {
      if (!completedSteps.has(j) && !(j === 0 && videoWatched)) return true;
    }
    return false;
  }, [completedSteps, videoWatched]);

  // ─── Derived ──────────────────────────────────────────────────────────────
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

  const gcpConnected = userData?.gcp_connected ?? false;
  const gcpProjectName = userData?.gcp_project_name || "—";
  const gcpProjectId = userData?.gcp_project_id || "—";
  const gcpAccount = userData?.gcp_google_account || "—";
  const gcpDailyQuota = userData?.gcp_daily_quota ?? 10000;
  const gcpUsedToday = userData?.gcp_used_today ?? 0;
  const gcpRemaining = gcpDailyQuota - gcpUsedToday;
  const gcpResetTime = userData?.gcp_quota_reset_time || "Midnight UTC";
  const gcpLastSync = userData?.gcp_last_sync
    ? new Date(userData.gcp_last_sync).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "Never";
  const gcpOAuthStatus = userData?.gcp_oauth_status || "Not Configured";
  const gcpOAuthRedirect = userData?.gcp_oauth_redirect_uri || "—";
  const gcpOAuthScopes = userData?.gcp_oauth_scopes ?? [];
  const gcpOAuthVerification = userData?.gcp_oauth_verification || "Pending";
  const gcpApiStatus = userData?.gcp_api_status || "Unknown";
  const gcpApiQuota = userData?.gcp_api_quota ?? 0;
  const gcpApiBilling = userData?.gcp_api_billing || "Not Configured";
  const gcpApiLastChecked = userData?.gcp_api_last_checked || "Never";
  const gcpApiVersion = userData?.gcp_api_version || "v3";
  const gcpClientId = userData?.gcp_client_id ? userData.gcp_client_id.slice(0, 12) + "••••••••••" : "—";
  const gcpClientSecret = userData?.gcp_client_secret_masked || "—";
  const gcpCredUpdated = userData?.gcp_credentials_updated || "—";
  const gcpLastVerification = userData?.gcp_last_verification || "—";
  const gcpProjectCreated = userData?.gcp_project_created || "—";
  const gcpConnectedDate = userData?.gcp_connected_date || "—";
  const gcpAccountAvatar = userData?.gcp_account_avatar || "";

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
    userData?.youtube_stats_refreshed_at && { msg: `YouTube stats refreshed`, time: lastSync },
    channelConnected && userData?.youtube_channel_name && { msg: `Channel "${userData.youtube_channel_name}" connected`, time: "Active" },
    userData?.last_scan_at && { msg: "Moderation scan completed", time: new Date(userData.last_scan_at.seconds * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) },
    userData?.last_comment_at && { msg: "Last comment processed", time: new Date(userData.last_comment_at.seconds * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) },
  ].filter(Boolean) as { msg: string; time: string }[];

  const currentStepKey = SETUP_STEPS[currentStep]?.key ?? "watch_video";
  const currentStepDetail = STEP_DETAILS[currentStepKey];
  const DemoScreenshot = DemoScreenshots[currentStepKey];

  const showSuccessScreen = gcpConnected && channelConnected && userData?.gcp_connected;

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
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
        .screenshot-hover:hover { transform: scale(1.02); box-shadow: 0 8px 32px rgba(0,0,0,0.4); cursor: zoom-in; }
        .step-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08) !important; }
        .plan-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
      `}</style>

      {/* Screenshot Modal */}
      {modalStepKey && <ScreenshotModal stepKey={modalStepKey} onClose={() => setModalStepKey(null)} />}

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

            {/* ═══ LEFT ═══════════════════════════════════════════════════════ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* API Mode Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="api-cards">
                <style>{`@media (max-width: 560px) { .api-cards { grid-template-columns: 1fr !important; } }`}</style>

                {/* ── Shared API Card ── */}
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Current Plan</div><span style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{planName}</span></div>
                    <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>AI Actions</div><div style={{ fontSize: 12, fontWeight: 600 }}>{aiUsed} / {aiLimit}</div></div>
                    <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Reset Date</div><div style={{ fontSize: 12, fontWeight: 600 }}>{planExpiry}</div></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Success Rate</div>
                      <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 600 }}>{successRate > 0 ? `${successRate}%` : "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Avg Latency</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{avgResponseSec}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Health</div>
                      <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "pulse 2s infinite" }} /> Healthy
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Status</div>
                      <div style={{ color: "#22C55E", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Active
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Channels</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{channelConnected ? "1 Connected" : "None"}</div>
                    </div>
                    <div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Last Sync</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{lastSync.split(",")[0]}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleReconnect} disabled={reconnecting} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      {reconnecting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />} Reconnect
                    </button>
                    <ConnectionTestBtn state={testState} onClick={handleTestConnection} />
                    <button onClick={() => router.push("/dashboard/analytics")} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none" }}>
                      View Usage
                    </button>
                  </div>
                </div>

                {/* ── GCP Card ── */}
                <div style={{ background: gcpConnected ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${gcpConnected ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 16, padding: 18, position: "relative" }}>
                  <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(59,130,246,0.15)", color: "#3B82F6", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>Advanced</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "rgba(59,130,246,0.15)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Cloud size={16} color="#3B82F6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>My Google Cloud Project</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Use your own Google Cloud</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>project &amp; get higher limits.</div>
                    </div>
                  </div>

                  {gcpConnected ? (
                    <>
                      {/* Project info */}
                      <div style={{ background: "rgba(59,130,246,0.08)", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Project</div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{gcpProjectName}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{gcpProjectId}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Status</div><StatusBadge ok={true} label="Connected" /></div>
                        <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Daily Quota</div><div style={{ fontSize: 12, fontWeight: 600 }}>{gcpDailyQuota.toLocaleString()}</div></div>
                        <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Used Today</div><div style={{ fontSize: 12, fontWeight: 600 }}>{gcpUsedToday.toLocaleString()}</div></div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                        <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>OAuth</div><StatusBadge ok={gcpOAuthStatus !== "Not Configured"} label={gcpOAuthStatus} /></div>
                        <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>API</div><StatusBadge ok={gcpApiStatus === "Enabled"} label={gcpApiStatus} /></div>
                        <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>Channel</div><div style={{ fontSize: 12, fontWeight: 600 }}>{channelConnected ? "1 Connected" : "None"}</div></div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Quota Usage</div>
                        <QuotaBar used={gcpUsedToday} total={gcpDailyQuota} color="#3B82F6" />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <Settings2 size={11} /> Manage
                        </button>
                        <button onClick={handleGcpRefresh} disabled={gcpRefreshing} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          {gcpRefreshing ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />} Refresh
                        </button>
                        <button onClick={handleGcpDisconnect} disabled={gcpDisconnecting} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          {gcpDisconnecting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <WifiOff size={11} />} Disconnect
                        </button>
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      icon={<Cloud size={22} color="#3B82F6" />}
                      title="No GCP Project Connected"
                      desc="Connect your own Google Cloud project for higher API limits and full control."
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                        <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ width: "100%", background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Cloud size={13} /> Open Google Console
                        </button>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => window.open("https://console.cloud.google.com/apis/credentials", "_blank")} style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 4px", fontWeight: 700, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <Key size={10} /> Credentials
                          </button>
                          <button onClick={() => window.open("https://console.cloud.google.com/apis/library", "_blank")} style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 4px", fontWeight: 700, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <Database size={10} /> API Library
                          </button>
                          <button onClick={handleGcpRefresh} disabled={gcpRefreshing} style={{ flex: 1, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 4px", fontWeight: 700, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            {gcpRefreshing ? <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={10} />} Refresh
                          </button>
                        </div>
                      </div>
                    </EmptyState>
                  )}
                </div>
              </div>

              {/* ── GCP Detail Panels (connected) ── */}
              {gcpConnected && (
                <>
                  {/* GCP Status Summary */}
                  <GCPStatusSummary userData={userData!} />

                  {/* Success Screen */}
                  {showSuccessScreen && (
                    <SuccessScreen
                      onDashboard={() => router.push("/dashboard")}
                      onStart={() => router.push("/dashboard/automation")}
                    />
                  )}

                  {/* Google Account Info */}
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Cloud size={14} color="#3B82F6" />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Google Account</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      {gcpAccountAvatar ? (
                        <img src={gcpAccountAvatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#4285f4,#ea4335)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff" }}>
                          {gcpAccount !== "—" ? gcpAccount[0].toUpperCase() : "G"}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{gcpAccount !== "—" ? gcpAccount : "Google Account"}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Project Owner</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Project Name", val: gcpProjectName },
                        { label: "Project ID", val: gcpProjectId },
                        { label: "Project Created", val: gcpProjectCreated },
                        { label: "Connected Date", val: gcpConnectedDate },
                      ].map(item => (
                        <div key={item.label}>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 2 }}>{item.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: item.val === "—" ? "rgba(255,255,255,0.3)" : "#FAFAFA" }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GCP Detail 4-grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="gcp-detail-grid">
                    <style>{`@media (max-width: 560px) { .gcp-detail-grid { grid-template-columns: 1fr !important; } }`}</style>

                    {/* Google Cloud Quota */}
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <Database size={14} color="#3B82F6" />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Google Cloud Quota</span>
                      </div>
                      {gcpDailyQuota === 0 ? (
                        <EmptyState icon={<Database size={18} color="#3B82F6" />} title="No Quota Data" desc="Quota info will appear once your GCP project is active." />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Daily Limit</span>
                              <span style={{ fontSize: 11, fontWeight: 600 }}>{gcpDailyQuota.toLocaleString()} units / day</span>
                            </div>
                            <QuotaBar used={gcpUsedToday} total={gcpDailyQuota} color="#3B82F6" />
                          </div>
                          {[
                            { label: "Today's Usage", val: `${gcpUsedToday.toLocaleString()} units` },
                            { label: "Remaining", val: `${gcpRemaining.toLocaleString()} units`, color: gcpRemaining < 1000 ? "#F43F5E" : "#22C55E" },
                            { label: "Reset Time", val: gcpResetTime },
                            { label: "Last Sync", val: gcpLastSync },
                          ].map(item => (
                            <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: (item as any).color || "#FAFAFA" }}>{item.val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* OAuth Status */}
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <Key size={14} color="#A78BFA" />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>OAuth Status</span>
                      </div>
                      {gcpOAuthStatus === "Not Configured" ? (
                        <EmptyState icon={<Key size={18} color="#A78BFA" />} title="OAuth Not Configured" desc="Add credentials in Settings to configure OAuth." />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Configured</span>
                            <StatusBadge ok={true} label={gcpOAuthStatus} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Redirect URI</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", maxWidth: 140, textAlign: "right", wordBreak: "break-all" }}>{gcpOAuthRedirect}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Client ID Added</span>
                            <StatusBadge ok={!!userData?.gcp_client_id_saved} label={userData?.gcp_client_id_saved ? "Yes" : "No"} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Secret Added</span>
                            <StatusBadge ok={!!userData?.gcp_client_secret_saved} label={userData?.gcp_client_secret_saved ? "Yes" : "No"} />
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Scopes</span>
                            <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {gcpOAuthScopes.length > 0 ? gcpOAuthScopes.map(s => (
                                <span key={s} style={{ background: "rgba(124,58,237,0.15)", color: "#A78BFA", borderRadius: 4, padding: "1px 6px", fontSize: 10 }}>{s}</span>
                              )) : <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>—</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Verification</span>
                            <StatusBadge ok={gcpOAuthVerification === "Verified"} label={gcpOAuthVerification} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* YouTube API Status */}
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <Video size={14} color="#EF4444" />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>YouTube API Status</span>
                      </div>
                      {gcpApiStatus === "Unknown" ? (
                        <EmptyState icon={<Video size={18} color="#EF4444" />} title="API Status Unknown" desc="Enable the YouTube Data API v3 in your Google Cloud project." onCta={() => window.open("https://console.cloud.google.com/apis/library", "_blank")} cta="Enable API" />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Status</span>
                            <StatusBadge ok={gcpApiStatus === "Enabled"} label={gcpApiStatus} />
                          </div>
                          {[
                            { label: "Quota", val: gcpApiQuota > 0 ? `${gcpApiQuota.toLocaleString()} units` : "—" },
                            { label: "Billing", val: gcpApiBilling },
                            { label: "API Version", val: gcpApiVersion },
                            { label: "Last Checked", val: gcpApiLastChecked },
                            { label: "Last Verification", val: gcpLastVerification },
                          ].map(item => (
                            <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 600 }}>{item.val}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client Credentials */}
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <Shield size={14} color="#22C55E" />
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Client Credentials</span>
                      </div>
                      {!userData?.gcp_client_id ? (
                        <EmptyState icon={<Shield size={18} color="#22C55E" />} title="No Credentials Saved" desc="Add your Client ID and Secret in Settings to continue." onCta={() => router.push("/dashboard/settings")} cta="Go to Settings" />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Client ID</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{gcpClientId}</span>
                              <button onClick={() => handleCopy(userData?.gcp_client_id || "", "client_id")} style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === "client_id" ? "#22C55E" : "rgba(255,255,255,0.3)", padding: 0 }}>
                                {copiedKey === "client_id" ? <CheckCircle size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Client Secret</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{gcpClientSecret}</span>
                              <button onClick={() => handleCopy(gcpClientSecret, "client_secret")} style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === "client_secret" ? "#22C55E" : "rgba(255,255,255,0.3)", padding: 0 }}>
                                {copiedKey === "client_secret" ? <CheckCircle size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Encrypted</span>
                            <StatusBadge ok={true} label="Yes" />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Save Status</span>
                            <StatusBadge ok={!!userData?.gcp_client_id_saved} label="Saved" />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Updated</span>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{gcpCredUpdated}</span>
                          </div>
                          <button onClick={handleDeleteCredentials} disabled={deletingCreds} style={{ width: "100%", marginTop: 4, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E", borderRadius: 8, padding: "7px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            {deletingCreds ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} />} Delete Credentials
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GCP Quota Chart */}
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <BarChart2 size={16} color="rgba(255,255,255,0.5)" />
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Google Cloud Daily Quota — Last 7 Days</span>
                    </div>
                    {gcpUsedToday === 0 ? (
                      <EmptyState icon={<BarChart2 size={20} color="#3B82F6" />} title="No GCP Usage Yet" desc="Quota usage will appear here once your project is active." />
                    ) : (
                      <>
                        <MiniChart used={gcpUsedToday} limit={gcpDailyQuota} color="#3B82F6" label="API Units" />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
                          {[
                            { label: "Today's Usage", val: gcpUsedToday.toLocaleString(), bg: "rgba(59,130,246,0.1)", icon: <Activity size={13} color="#3B82F6" /> },
                            { label: "Remaining", val: gcpRemaining.toLocaleString(), bg: gcpRemaining < 1000 ? "rgba(244,63,94,0.1)" : "rgba(34,197,94,0.1)", icon: <Zap size={13} color={gcpRemaining < 1000 ? "#F43F5E" : "#22C55E"} /> },
                            { label: "Reset Time", val: gcpResetTime, bg: "rgba(245,158,11,0.1)", icon: <Clock size={13} color="#F59E0B" /> },
                          ].map(s => (
                            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>{s.icon}<span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{s.label}</span></div>
                              <div style={{ fontSize: 16, fontWeight: 800 }}>{s.val}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

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
                          <div style={{ color: (item as any).color || "#FAFAFA", fontSize: 12, fontWeight: 600 }}>{item.val}</div>
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
                          <div style={{ color: (item as any).color || "#FAFAFA", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            {(item as any).color && (item as any).color !== "#FAFAFA" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: (item as any).color, display: "inline-block" }} />}
                            {item.val}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleRefreshStats} disabled={refreshing} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {refreshing ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={11} />} Refresh Stats
                      </button>
                      <button onClick={() => window.open(`https://youtube.com/channel/${userData?.youtube_channel_id}`, "_blank")} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <ExternalLink size={11} /> View Channel
                      </button>
                      <button onClick={handleDisconnect} disabled={disconnecting} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {disconnecting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <WifiOff size={11} />} Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={<Video size={22} color="#EF4444" />}
                    title="No YouTube Channel Connected"
                    desc="Connect your YouTube channel to start moderation."
                    cta="Connect YouTube Channel"
                    onCta={handleConnectYouTube}
                  />
                )}
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
                    { name: "Free Trial", icon: "✦", color: "#22C55E", rgb: "34,197,94", actions: 250, current: userData?.plan === "free" },
                    { name: "Pro", icon: "💎", color: "#7C3AED", rgb: "124,58,237", actions: 1900, badge: "Popular", current: userData?.plan === "pro" },
                    { name: "Agency", icon: "👑", color: "#F59E0B", rgb: "245,158,11", actions: 15000, current: userData?.plan === "agency" },
                  ].map(plan => (
                    <div key={plan.name} className="plan-card" onClick={() => !plan.current && router.push("/billing")} style={{
                      background: `rgba(${plan.rgb},0.07)`,
                      border: `${plan.current ? "2px" : "1px"} solid ${plan.color}${plan.current ? "88" : "33"}`,
                      borderRadius: 12, padding: 16, textAlign: "center", position: "relative",
                      cursor: plan.current ? "default" : "pointer", transition: "transform 0.15s, box-shadow 0.15s",
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
                      <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeTab === t ? "#7C3AED" : "rgba(255,255,255,0.06)", color: activeTab === t ? "#fff" : "rgba(255,255,255,0.4)", border: "none" }}>{t}</button>
                    ))}
                  </div>
                </div>
                {aiUsed === 0 && aiLimit > 0 ? (
                  <EmptyState icon={<BarChart2 size={20} color="#7C3AED" />} title="No Usage Yet" desc="Start moderating to see data here." />
                ) : (
                  <MiniChart used={aiUsed} limit={aiLimit} />
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }} className="stats-grid">
                  <style>{`@media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
                  {STATS.map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>{s.icon}<span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{s.label}</span></div>
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
                    <EmptyState icon={<Activity size={18} color="rgba(255,255,255,0.3)" />} title="No Activity Yet" desc="Activity will appear here once moderation starts." />
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
                      <span style={{ color: h.ok ? "#22C55E" : "#F59E0B", fontSize: 12, fontWeight: 600 }}>{h.ok ? "Operational" : "Not Connected"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══ RIGHT ══════════════════════════════════════════════════════ */}
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
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "pulse 2s infinite" }} /> Live
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
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
                  <button onClick={() => window.open(`https://youtube.com/channel/${userData.youtube_channel_id}`, "_blank")} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", borderRadius: 10, padding: "8px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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
                  <button onClick={handleRefreshStats} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>
                    <RefreshCw size={11} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} /> Refresh
                  </button>
                </div>
                <div style={{ margin: "0 12px 12px", borderRadius: 12, overflow: "hidden", background: "#000", position: "relative" }}>
                  {videoError ? (
                    <div style={{ background: "linear-gradient(135deg,#1a0533,#0d1b3e)", borderRadius: 12, padding: "28px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Tutorial Coming Soon</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>The setup video will be available shortly. Follow the steps below to get started.</div>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      src="/videos/setup-demo.mp4"
                      controls
                      onEnded={handleVideoEnded}
                      onError={() => setVideoError(true)}
                      style={{ width: "100%", display: "block", borderRadius: 12 }}
                      poster="/images/setup/step1.webp"
                    />
                  )}
                  {videoWatched && (
                    <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(34,197,94,0.9)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={11} /> Watched
                    </div>
                  )}
                </div>
                {!videoWatched && !videoError && (
                  <div style={{ padding: "0 12px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Play size={12} color="#F59E0B" />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Watch the full video to unlock setup steps</span>
                  </div>
                )}
                {videoError && (
                  <div style={{ padding: "0 12px 12px" }}>
                    <button onClick={handleVideoEnded} style={{ width: "100%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 8, padding: "7px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Skip to Setup Steps
                    </button>
                  </div>
                )}
              </div>

              {/* Step by Step Setup */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Step by Step Setup</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>(My Google Cloud Project)</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {/* Steps list with connector */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 130, position: "relative" }}>
                    {SETUP_STEPS.map((s, i) => {
                      const done = completedSteps.has(i) || (i === 0 && videoWatched);
                      const active = i === currentStep;
                      const locked = isStepLocked(i);
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, position: "relative" }}>
                          {/* Connector line */}
                          {i < SETUP_STEPS.length - 1 && (
                            <div style={{ position: "absolute", left: 11, top: 22, width: 2, height: 18, background: done ? "#22C55E" : "rgba(255,255,255,0.1)", borderRadius: 1, transition: "background 0.3s" }} />
                          )}
                          <button className="step-btn" onClick={() => !locked && setCurrentStep(i)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: locked ? "default" : "pointer", padding: "4px 0", textAlign: "left", width: "100%" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#22C55E" : active ? "#7C3AED" : locked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)", fontSize: 10, fontWeight: 700, color: "#fff", transition: "background 0.3s", boxShadow: active ? "0 0 12px rgba(124,58,237,0.5)" : "none" }}>
                              {done ? <CheckCircle size={12} /> : locked ? <Lock size={10} color="rgba(255,255,255,0.3)" /> : i + 1}
                            </div>
                            <span style={{ fontSize: 12, color: locked ? "rgba(255,255,255,0.2)" : active ? "#fff" : done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 400 }}>{s.label}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step detail + screenshot */}
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12 }}>
                    {/* Demo Screenshot (click to enlarge) */}
                    <div
                      className="screenshot-hover"
                      onClick={() => setModalStepKey(currentStepKey)}
                      style={{ marginBottom: 10, borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "zoom-in", position: "relative" }}
                    >
                      {DemoScreenshot ? <DemoScreenshot /> : (
                        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No preview</div>
                      )}
                      <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
                        <Maximize2 size={9} /> Expand
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{currentStepDetail.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10 }}>{currentStepDetail.desc}</div>
                    {currentStepDetail.action && !isStepLocked(currentStep) && (
                      <button onClick={() => handleStepAction(currentStepKey)} style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "7px", fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        {currentStepDetail.action} <ExternalLink size={10} />
                      </button>
                    )}
                    {isStepLocked(currentStep) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                        <Lock size={11} /> Complete previous step to unlock
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 14, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Progress</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{completedSteps.size + (videoWatched ? 1 : 0)} / {SETUP_STEPS.length} steps</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                    <div style={{ width: `${((completedSteps.size + (videoWatched ? 1 : 0)) / SETUP_STEPS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#7C3AED,#22C55E)", borderRadius: 2, transition: "width 0.4s ease" }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: currentStep === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: currentStep === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    onClick={() => {
                      const next = currentStep + 1;
                      if (next < SETUP_STEPS.length && !isStepLocked(next)) setCurrentStep(next);
                    }}
                    disabled={currentStep === SETUP_STEPS.length - 1 || isStepLocked(currentStep + 1)}
                    style={{ flex: 1, background: "#7C3AED", border: "none", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: (currentStep === SETUP_STEPS.length - 1 || isStepLocked(currentStep + 1)) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: (currentStep === SETUP_STEPS.length - 1 || isStepLocked(currentStep + 1)) ? 0.4 : 1 }}
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

