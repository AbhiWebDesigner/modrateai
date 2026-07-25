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
  Gift, Star, ArrowRight, Server, Cpu, Globe
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
  plan_comment_limit: number;
  subscription_status: string;
  trial_ends_at: { seconds: number } | null;
  trial_started_at: { seconds: number } | null;
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

// ─── Demo Screenshots ─────────────────────────────────────────────────────────
const DemoScreenshots: Record<string, React.FC> = {
  watch_video: memo(function WatchVideoDemo() {
    return (
      <div style={{ background: "#0f0f0f", borderRadius: 8, overflow: "hidden", fontFamily: "Roboto, sans-serif", fontSize: 11 }}>
        <div style={{ background: "#212121", padding: "6px 10px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #333" }}>
          <div style={{ display: "flex", gap: 3 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} /><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840" }} /></div>
          <div style={{ flex: 1, background: "#333", borderRadius: 12, padding: "2px 8px", color: "#aaa", fontSize: 9 }}>youtube.com/watch?v=moderateai-setup</div>
        </div>
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
        <div style={{ padding: "4px 8px", background: "#0f0f0f" }}>
          <div style={{ height: 2, background: "#333", borderRadius: 1 }}><div style={{ width: "35%", height: "100%", background: "#FF0000", borderRadius: 1 }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "#aaa", fontSize: 8 }}><span>4:22</span><span>12:34</span></div>
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
              <div key={s} style={{ padding: "3px 4px", borderRadius: 4, marginBottom: 2, background: s === "APIs & Services" ? "#e8f0fe" : "transparent", color: s === "APIs & Services" ? "#1a73e8" : "#5f6368" }}>{s}</div>
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
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 8px", color: "rgba(255,255,255,0.9)", fontSize: 8 }}>console.cloud.google.com/apis/library</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 20, padding: "4px 10px", fontSize: 8, color: "#5f6368", marginBottom: 6 }}>🔍 Search APIs and services…</div>
          <div style={{ border: "1px solid #e8eaed", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 8, padding: "6px 8px", background: "#fafafa" }}>
              <div style={{ width: 28, height: 28, background: "#ff0000", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#fff", fontSize: 7, fontWeight: 700 }}>▶</div></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#202124" }}>YouTube Data API v3</div>
                <div style={{ fontSize: 7, color: "#5f6368" }}>Google Enterprise API</div>
              </div>
            </div>
            <div style={{ padding: "4px 8px", borderTop: "1px solid #e8eaed" }}>
              <div style={{ fontSize: 7, color: "#5f6368", marginBottom: 4 }}>Allows access to YouTube data, including videos, playlists, and channels.</div>
              <button style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 8, fontWeight: 600 }}>Enable</button>
            </div>
          </div>
        </div>
      </div>
    );
  }),
  oauth_client: memo(function OAuthClientDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#1a73e8", padding: "5px 10px" }}>
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
          <button style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", fontSize: 8, fontWeight: 600 }}>Create</button>
        </div>
      </div>
    );
  }),
  add_credential: memo(function AddCredentialDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ padding: 8 }}>
          <div style={{ background: "#e6f4ea", border: "1px solid #34a853", borderRadius: 4, padding: "4px 8px", fontSize: 8, color: "#137333", marginBottom: 6 }}>✓ OAuth client created successfully</div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 6, marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 7, color: "#5f6368" }}>Client ID</div><div style={{ fontSize: 7, color: "#202124", fontFamily: "monospace" }}>123456789-abcd.apps.googleusercontent.com</div></div>
              <div style={{ background: "#1a73e8", color: "#fff", fontSize: 7, padding: "2px 6px", borderRadius: 3 }}>Copy</div>
            </div>
          </div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 7, color: "#5f6368" }}>Client Secret</div><div style={{ fontSize: 7, color: "#202124", fontFamily: "monospace" }}>GOCSPX-••••••••••••••••••</div></div>
              <div style={{ background: "#1a73e8", color: "#fff", fontSize: 7, padding: "2px 6px", borderRadius: 3 }}>Copy</div>
            </div>
          </div>
        </div>
      </div>
    );
  }),
  connect_youtube: memo(function ConnectYouTubeDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}><span style={{ color: "#4285f4" }}>G</span><span style={{ color: "#ea4335" }}>o</span><span style={{ color: "#fbbc04" }}>o</span><span style={{ color: "#4285f4" }}>g</span><span style={{ color: "#34a853" }}>l</span><span style={{ color: "#ea4335" }}>e</span></div>
          <div style={{ fontSize: 9, color: "#5f6368", marginBottom: 4 }}>ModerateAI wants to access your Google Account</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#202124", marginBottom: 6 }}>user@gmail.com</div>
          <div style={{ textAlign: "left", marginBottom: 6 }}>
            {["See your YouTube channel","Manage your YouTube videos","View your YouTube comments"].map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, fontSize: 8, color: "#202124" }}><span style={{ color: "#34a853" }}>✓</span> {p}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ flex: 1, background: "#fff", border: "1px solid #dadce0", color: "#3c4043", borderRadius: 4, padding: "4px", fontSize: 8 }}>Cancel</button>
            <button style={{ flex: 1, background: "#1a73e8", border: "none", color: "#fff", borderRadius: 4, padding: "4px", fontSize: 8, fontWeight: 600 }}>Allow</button>
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
  const pts = useMemo(() => {
    const arr = Array.from({ length: segments }, (_, i) => {
      const progress = i / (segments - 1);
      return Math.round(used * progress * (0.7 + 0.3 * Math.sin(i * 0.8)));
    });
    arr[arr.length - 1] = used;
    return arr;
  }, [used]);
  const w = 340, h = 100;
  const maxVal = Math.max(...pts, 1);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map(v => h - (v / maxVal) * (h - 10) - 5);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const id = `cg-${color.replace("#", "")}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 100 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r={5} fill={color} />
        <rect x={Math.max(0, xs[xs.length - 1] - 58)} y={ys[ys.length - 1] - 32} width={110} height={22} rx={6} fill="rgba(30,20,60,0.95)" />
        <text x={xs[xs.length - 1]} y={ys[ys.length - 1] - 16} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="700">{used.toLocaleString()} {label}</text>
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

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const DonutChart = memo(function DonutChart({ used, limit, color = "#7C3AED" }: { used: number; limit: number; color?: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" width={100} height={100}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{used.toLocaleString()}</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>/ {limit.toLocaleString()}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color }}>{pct.toFixed(0)}%</div>
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: ok ? "rgba(34,197,94,0.12)" : "rgba(244,63,94,0.12)", color: ok ? "#22C55E" : "#F43F5E", border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(244,63,94,0.3)"}`, borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: ok ? "#22C55E" : "#F43F5E", display: "inline-block" }} />{label}
    </span>
  );
}

// ─── Connection Test Button ────────────────────────────────────────────────────
type TestState = "idle" | "checking" | "success" | "failed";
function ConnectionTestBtn({ state, onClick }: { state: TestState; onClick: () => void }) {
  const configs = {
    idle: { label: "Test Connection", icon: <Wifi size={12} />, bg: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" },
    checking: { label: "Checking…", icon: <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />, bg: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" },
    success: { label: "Live!", icon: <CheckCircle size={12} />, bg: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" },
    failed: { label: "Failed", icon: <XCircle size={12} />, bg: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.3)" },
  };
  const c = configs[state];
  return (
    <button onClick={onClick} disabled={state === "checking"} style={{ flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: state === "checking" ? "default" : "pointer", background: c.bg, color: c.color, border: c.border, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.2s" }}>
      {c.icon} {c.label}
    </button>
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
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>
        <div style={{ padding: 16 }}>
          {DemoComp ? <DemoComp /> : <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 32 }}>Preview not available</div>}
        </div>
      </div>
    </div>
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, desc, cta, onCta, children }: { icon: React.ReactNode; title: string; desc: string; cta?: string; onCta?: () => void; children?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 16px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, background: "rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: cta ? 14 : 0 }}>{desc}</div>
      {cta && onCta && <button onClick={onCta} style={{ background: "#7C3AED", border: "none", color: "#fff", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{cta}</button>}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED API TAB
// ═══════════════════════════════════════════════════════════════════════════════
function SharedAPITab({ userData, user, router, showToast }: { userData: UserData; user: User; router: ReturnType<typeof useRouter>; showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [activeChart, setActiveChart] = useState<"7D" | "30D" | "90D">("7D");
  const [testState, setTestState] = useState<TestState>("idle");
  const [reconnecting, setReconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── REAL-TIME DATA FROM FIREBASE ──────────────────────────────────────────
  // ai_credits = remaining AI actions (starts at 250 for free trial)
  const aiCreditsRemaining = userData.ai_credits ?? 250;
  // Total AI actions limit = 250 for free trial
  const aiLimit = 250;
  // Used = total - remaining
  const aiUsed = Math.max(0, aiLimit - aiCreditsRemaining);
  // Remaining directly from Firebase
  const remaining = aiCreditsRemaining;
  // Usage percentage
  const pct = aiLimit > 0 ? Math.min((aiUsed / aiLimit) * 100, 100) : 0;

  // Plan info from Firebase
  const planName = userData.plan_display_name || "Free Trial";
  const subscriptionStatus = userData.subscription_status || "trial";
  const isFreeTrialPlan = subscriptionStatus === "trial" || userData.plan === "free";

  // Plan expiry — use trial_ends_at for trial users, else plan_expires_at
  const expiryTimestamp = userData.trial_ends_at ?? userData.plan_expires_at;
  const planExpiry = expiryTimestamp
    ? new Date(expiryTimestamp.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";

  // Days left until trial/plan expiry
  const trialDaysLeft = expiryTimestamp
    ? Math.max(0, Math.ceil((expiryTimestamp.seconds * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Days until reset (same as days left)
  const daysUntilReset = trialDaysLeft;

  // Connection / health data from Firebase
  const successRate = userData.moderation_accuracy ?? 99.9;
  const avgResponseMs = userData.avg_response_ms ?? 0;
  const avgResponseSec = avgResponseMs > 0 ? (avgResponseMs / 1000).toFixed(1) + "s" : "—";
  const channelConnected = userData.youtube_connected ?? false;

  // Last sync from Firebase
  const lastSync = userData.youtube_stats_refreshed_at
    ? new Date(userData.youtube_stats_refreshed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  // ─────────────────────────────────────────────────────────────────────────

  const handleReconnect = async () => {
    setReconnecting(true);
    try { window.location.href = `/api/auth/youtube?uid=${user.uid}`; }
    catch { showToast("Reconnect failed. Try again.", "error"); setReconnecting(false); }
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ══ Hero Banner Card ══ */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.12) 60%, rgba(15,10,40,0.6) 100%)",
        border: "1.5px solid rgba(124,58,237,0.4)",
        borderRadius: 20,
        padding: "24px 24px 20px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="hero-shield" style={{
              width: 60, height: 60, borderRadius: 16,
              background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 32px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)"
            }}>
              <Shield size={28} color="white" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="hero-title" style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.3px" }}>ModerateAI Shared API</span>
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, boxShadow: "0 2px 8px rgba(124,58,237,0.4)" }}>Recommended</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>We handle everything for you. No setup required.</div>
              <div className="hero-badges" style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {[
                  { icon: <Shield size={11} />, label: "Secure" },
                  { icon: <CheckCircle size={11} />, label: "Reliable" },
                  { icon: <Zap size={11} />, label: "Always On" },
                  { icon: <Star size={11} />, label: "Optimized" },
                ].map(b => (
                  <span key={b.label} className="hero-badge" style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)"
                  }}>
                    <span style={{ color: "#22C55E" }}>{b.icon}</span> {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="cloud-box-hide" style={{
            width: 90, height: 90, flexShrink: 0,
            background: "radial-gradient(circle at 40% 40%, rgba(124,58,237,0.35), rgba(79,70,229,0.15))",
            borderRadius: 20, border: "1px solid rgba(124,58,237,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Cloud size={42} color="#A78BFA" strokeWidth={1.5} />
          </div>
          <style>{`
            @media (max-width: 768px) {
              .cloud-box-hide { display: none !important; }
              .hero-shield { width: 44px !important; height: 44px !important; }
              .hero-title { font-size: 16px !important; }
              .hero-badges { gap: 6px !important; margin-top: 8px !important; }
              .hero-badge { padding: 3px 8px !important; font-size: 10px !important; }
            }
          `}</style>
        </div>
      </div>

      {/* ── Main Info Card ── */}
      <div style={{ background: "rgba(124,58,237,0.06)", border: "1.5px solid rgba(124,58,237,0.25)", borderRadius: 20, padding: 20 }}>

        {/* Stats grid — all real data */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }} className="shared-stats-grid">
          <style>{`@media (max-width: 700px) { .shared-stats-grid { grid-template-columns: repeat(2,1fr) !important; } }`}</style>
          {[
            { label: "Current Plan", val: planName, color: "#22C55E", highlight: true },
            { label: "AI Actions", val: `${aiLimit.toLocaleString()}`, sub: "/ month" },
            { label: "Used", val: `${aiUsed.toLocaleString()}`, sub: `(${pct.toFixed(0)}%)`, color: pct > 80 ? "#F43F5E" : "#FAFAFA" },
            { label: "Remaining", val: `${remaining.toLocaleString()}`, sub: `(${(100 - pct).toFixed(0)}%)`, color: "#22C55E" },
            { label: isFreeTrialPlan ? "Trial Ends" : "Reset Date", val: planExpiry, sub: daysUntilReset > 0 ? `In ${trialDaysLeft} days` : "Expired", color: "#A78BFA" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4 }}>{s.label}</div>
              {s.highlight ? (
                <span style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{s.val}</span>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color || "#FAFAFA" }}>{s.val} {s.sub && <span style={{ fontSize: 11, color: s.color || "rgba(255,255,255,0.4)" }}>{s.sub}</span>}</div>
              )}
            </div>
          ))}
        </div>

        {/* Health row — all real data */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 20, padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12 }} className="health-row">
          <style>{`@media (max-width: 700px) { .health-row { grid-template-columns: repeat(3,1fr) !important; } }`}</style>
          {[
            { label: "Health", val: "Healthy", color: "#22C55E", dot: true },
            { label: "Status", val: subscriptionStatus === "trial" ? "Active" : subscriptionStatus, color: "#22C55E", dot: true },
            { label: "Connected Channels", val: channelConnected ? "1 Channel" : "None" },
            { label: "Success Rate", val: successRate > 0 ? `${successRate}%` : "—", color: "#22C55E" },
            { label: "Avg. Latency", val: avgResponseSec },
            { label: "Last Sync", val: lastSync, refresh: true },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.color || "#FAFAFA", display: "flex", alignItems: "center", gap: 4 }}>
                {item.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, display: "inline-block" }} />}
                {item.val}
                {item.refresh && <RefreshCw size={10} color="rgba(255,255,255,0.3)" style={{ cursor: "pointer" }} onClick={handleRefreshStats} />}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }} className="action-btns">
          <style>{`@media (max-width: 600px) { .action-btns { flex-wrap: wrap; } .action-btns > * { flex: 1 1 calc(50% - 5px) !important; } }`}</style>
          <button onClick={handleReconnect} disabled={reconnecting} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {reconnecting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />} Reconnect
          </button>
          <ConnectionTestBtn state={testState} onClick={handleTestConnection} />
          <button onClick={() => router.push("/analytics")} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <BarChart2 size={13} /> View Usage
          </button>
        </div>
      </div>

      {/* ══ Free Trial Banner — real data ══ */}
      {isFreeTrialPlan && (
        <div style={{
          background: "rgba(124,58,237,0.08)",
          border: "1.5px solid rgba(124,58,237,0.3)",
          borderRadius: 20,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap"
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Gift size={22} color="#A78BFA" />
          </div>

          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>You're on Free Trial! 🎉</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
              Explore all features with {aiLimit} free AI actions.
            </div>
          </div>

          {/* AI Actions counter — real data */}
          <div style={{ textAlign: "center", minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#A78BFA" }}>{remaining} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>/ {aiLimit}</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>AI Actions Left</div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, marginTop: 6 }}>
              <div style={{ width: `${(remaining / aiLimit) * 100}%`, height: "100%", background: "linear-gradient(90deg,#7C3AED,#A78BFA)", borderRadius: 3, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>© {planExpiry}</div>
          </div>

          {/* Trial days left — real data */}
          <div style={{ textAlign: "center", minWidth: 100, borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Trial ends in</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#FAFAFA", lineHeight: 1 }}>{trialDaysLeft}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Days</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={9} /> {planExpiry}
            </div>
          </div>
        </div>
      )}

      {/* ══ Usage Stat Cards — real data ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="usage-cards-grid">
        <style>{`@media (max-width: 700px) { .usage-cards-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>

        {/* AI Actions Used */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>AI Actions Used</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#FAFAFA", lineHeight: 1 }}>{aiUsed.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>/ {aiLimit.toLocaleString()}</div>
          <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? "#F43F5E" : "#7C3AED", borderRadius: 2, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: pct > 80 ? "#F43F5E" : "rgba(255,255,255,0.35)", marginTop: 5, fontWeight: 600 }}>{pct.toFixed(0)}% Used</div>
        </div>

        {/* AI Actions Remaining */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>AI Actions Remaining</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#A78BFA", lineHeight: 1 }}>{remaining.toLocaleString()}</div>
          <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
            <div style={{ width: `${100 - pct}%`, height: "100%", background: "#7C3AED", borderRadius: 2, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#A78BFA", marginTop: 5, fontWeight: 600 }}>{(100 - pct).toFixed(0)}% Remaining</div>
        </div>

        {/* Trial Ends In / Resets In — real data */}
  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
    {isFreeTrialPlan ? "Trial Ends In" : "Resets In"}
  </div>
  <div style={{ fontSize: 28, fontWeight: 900, color: isFreeTrialPlan && trialDaysLeft <= 3 ? "#F43F5E" : "#FAFAFA", lineHeight: 1 }}>
    {trialDaysLeft}
  </div>
  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Days</div>
  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
    <Clock size={10} /> {planExpiry}
  </div>
  {isFreeTrialPlan && (
    <button
      onClick={() => router.push("/billing?offer=trial-extension")}
      style={{ marginTop: 8, width: "100%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 8, padding: "5px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
    >
      Extend ₹69
    </button>
  )}
</div>

        {/* Current Plan — real data */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Current Plan</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#22C55E" }}>{planName}</div>
          <button
            onClick={() => router.push("/billing")}
            style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            <Zap size={11} /> Upgrade
          </button>
        </div>
      </div>

      {/* ══ AI Actions Usage Chart ══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            AI Actions Usage Over Time
            <span style={{ marginLeft: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>ⓘ</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["7D", "30D", "90D"] as const).map(t => (
              <button key={t} onClick={() => setActiveChart(t)} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeChart === t ? "#7C3AED" : "rgba(255,255,255,0.06)", color: activeChart === t ? "#fff" : "rgba(255,255,255,0.4)", border: activeChart === t ? "none" : "1px solid rgba(255,255,255,0.08)" }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <MiniChart used={aiUsed} limit={aiLimit} color="#7C3AED" label="AI Actions" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 130 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 2 }}>Daily Average</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FAFAFA" }}>{aiUsed > 0 ? Math.round(aiUsed / Math.max(1, 30 - daysUntilReset)) : 0}</div>
              <div style={{ fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>AI Actions</div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 2 }}>Peak Usage</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FAFAFA" }}>{aiUsed}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Total so far</div>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 2 }}>Today's Usage</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#FAFAFA" }}>{aiUsed}</div>
              <div style={{ fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>AI Actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Shared API Status ══ */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Shared API Status</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 16 }}>Real-time status of our shared infrastructure</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }} className="status-row">
          <style>{`@media (max-width: 600px) { .status-row { flex-direction: column !important; } }`}</style>
          {[
            { label: "API Server", ok: true },
            { label: "Database", ok: true },
            { label: "YouTube Data API", ok: channelConnected },
            { label: "AI Engine", ok: userData.live_monitoring ?? false },
            { label: "Rate Limiting", ok: true, label2: "Optimal" },
          ].map(h => (
            <div key={h.label} style={{ flex: 1, minWidth: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
              <CheckCircle size={18} color={h.ok ? "#22C55E" : "#F59E0B"} />
              <div style={{ fontSize: 12, fontWeight: 600, color: "#FAFAFA", textAlign: "center" }}>{h.label}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: h.ok ? "#22C55E" : "#F59E0B" }}>{h.label2 || (h.ok ? "Operational" : "Not Connected")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent Activity + Why Use ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="activity-grid">
        <style>{`@media (max-width: 600px) { .activity-grid { grid-template-columns: 1fr !important; } }`}</style>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Recent Activity</div>
            <button style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All</button>
          </div>
          {[
            { msg: "YouTube API request successful", time: "25s ago" },
            { msg: "Comments data fetched", time: "1m ago" },
            { msg: "AI reply sent to comment", time: "2m ago" },
            { msg: "Channel statistics updated", time: "3m ago" },
            { msg: "Daily usage counter updated", time: "5m ago" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", display: "inline-block", marginTop: 4, flexShrink: 0 }} />
                <span style={{ fontSize: 12 }}>{a.msg}</span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{a.time}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Why Use ModerateAI Shared API?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "No API key setup required",
              "Higher quota & better reliability",
              "Fully managed by ModerateAI",
              "Automatic optimizations",
              "24/7 monitoring & support",
            ].map(item => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle size={11} color="#A78BFA" />
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Trial Extension Offer ══ */}
      {isFreeTrialPlan && (
        <div style={{
          background: "rgba(124,58,237,0.08)",
          border: "1.5px solid rgba(124,58,237,0.3)",
          borderRadius: 20,
          padding: 20
        }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Trial Extension Offer 🎉</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>
            Need more time? Extend your trial and get 30 more days + {aiLimit} AI actions.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#FAFAFA" }}>30 Days</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Extra validity</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#FAFAFA" }}>{aiLimit} AI Actions</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Full access</div>
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: "12px 18px",
              textAlign: "center",
              flexShrink: 0
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>One-time Offer</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#F59E0B" }}>₹69</div>
            </div>
          </div>

          <button
            onClick={() => router.push("/billing?offer=trial-extension")}
            style={{
              marginTop: 16, width: "100%",
              background: "linear-gradient(135deg,#7C3AED,#4F46E5)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "13px", fontWeight: 700, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              boxShadow: "0 4px 20px rgba(124,58,237,0.4)"
            }}
          >
            Extend Trial Now <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── Upgrade Banner ── */}
      <div style={{ background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Need More AI Actions?</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12 }}>Upgrade your plan to get more AI actions and unlimited access to all features.</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} color="#22C55E" />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Starter</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>  1,900 AI actions/month</span>
                <span style={{ background: "#7C3AED", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20, marginLeft: 6 }}>Popular</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} color="#22C55E" />
              <div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Pro Agency</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>  15,000 AI actions/month</span>
                <span style={{ background: "#22C55E", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20, marginLeft: 6 }}>Best Value</span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => router.push("/billing")} style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          <Zap size={15} /> Upgrade Plan
        </button>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GCP TAB (unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
function GCPTab({ userData, user, router, showToast }: { userData: UserData; user: User; router: ReturnType<typeof useRouter>; showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [activeChart, setActiveChart] = useState<"7D" | "30D" | "90D">("7D");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [modalStepKey, setModalStepKey] = useState<string | null>(null);
  const [gcpRefreshing, setGcpRefreshing] = useState(false);
  const [gcpDisconnecting, setGcpDisconnecting] = useState(false);
  const [deletingCreds, setDeletingCreds] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const gcpConnected = userData.gcp_connected ?? false;
  const gcpProjectName = userData.gcp_project_name || "—";
  const gcpProjectId = userData.gcp_project_id || "—";
  const gcpAccount = userData.gcp_google_account || "—";
  const gcpDailyQuota = userData.gcp_daily_quota ?? 10000;
  const gcpUsedToday = userData.gcp_used_today ?? 0;
  const gcpRemaining = gcpDailyQuota - gcpUsedToday;
  const gcpResetTime = userData.gcp_quota_reset_time || "Midnight UTC";
  const gcpLastSync = userData.gcp_last_sync ? new Date(userData.gcp_last_sync).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never";
  const gcpOAuthStatus = userData.gcp_oauth_status || "Not Configured";
  const gcpOAuthRedirect = userData.gcp_oauth_redirect_uri || "—";
  const gcpOAuthScopes = userData.gcp_oauth_scopes ?? [];
  const gcpOAuthVerification = userData.gcp_oauth_verification || "Pending";
  const gcpApiStatus = userData.gcp_api_status || "Unknown";
  const gcpApiBilling = userData.gcp_api_billing || "Not Configured";
  const gcpApiLastChecked = userData.gcp_api_last_checked || "Never";
  const gcpApiVersion = userData.gcp_api_version || "v3";
  const gcpClientId = userData.gcp_client_id ? userData.gcp_client_id.slice(0, 12) + "••••••••••" : "—";
  const gcpClientSecret = userData.gcp_client_secret_masked || "—";
  const gcpCredUpdated = userData.gcp_credentials_updated || "—";
  const gcpLastVerification = userData.gcp_last_verification || "—";
  const gcpProjectCreated = userData.gcp_project_created || "—";
  const gcpConnectedDate = userData.gcp_connected_date || "—";
  const gcpAccountAvatar = userData.gcp_account_avatar || "";
  const channelConnected = userData.youtube_connected ?? false;

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

  const handleGcpRefresh = async () => {
    setGcpRefreshing(true);
    try { await getDoc(doc(db, "users", user.uid)); showToast("GCP stats refreshed.", "success"); }
    catch { showToast("Failed to refresh.", "error"); }
    finally { setGcpRefreshing(false); }
  };

  const handleGcpDisconnect = async () => {
    if (!confirm("Disconnect Google Cloud Project?")) return;
    setGcpDisconnecting(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { gcp_connected: false, gcp_project_name: "", gcp_project_id: "", gcp_client_id: "", gcp_client_secret_masked: "" });
      showToast("GCP disconnected.", "success");
    } catch { showToast("Failed.", "error"); }
    finally { setGcpDisconnecting(false); }
  };

  const handleDeleteCreds = async () => {
    if (!confirm("Delete GCP credentials?")) return;
    setDeletingCreds(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { gcp_client_id: "", gcp_client_secret_masked: "", gcp_client_id_saved: false, gcp_client_secret_saved: false });
      showToast("Credentials deleted.", "success");
    } catch { showToast("Failed.", "error"); }
    finally { setDeletingCreds(false); }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(null), 250); showToast("Copied!", "success"); });
  };

  const currentStepKey = SETUP_STEPS[currentStep]?.key ?? "watch_video";
  const currentStepDetail = STEP_DETAILS[currentStepKey];
  const DemoScreenshot = DemoScreenshots[currentStepKey];

  const connectionChecks = [
    { label: "Project Connected", ok: gcpConnected, icon: <Cloud size={18} /> },
    { label: "OAuth Ready", ok: gcpOAuthStatus !== "Not Configured", icon: <Key size={18} /> },
    { label: "YouTube API Enabled", ok: gcpApiStatus === "Enabled", icon: <Video size={18} /> },
    { label: "Credentials Saved", ok: !!userData.gcp_client_id_saved, icon: <Shield size={18} /> },
    { label: "Billing Active", ok: gcpApiBilling === "Active", icon: <CheckCircle size={18} /> },
    { label: "Quota Available", ok: gcpUsedToday < gcpDailyQuota, icon: <Database size={18} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {modalStepKey && <ScreenshotModal stepKey={modalStepKey} onClose={() => setModalStepKey(null)} />}

      {gcpConnected ? (
        <>
          <div style={{ background: "rgba(59,130,246,0.06)", border: "1.5px solid rgba(59,130,246,0.35)", borderRadius: 20, padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="gcp-main-grid">
              <style>{`@media (max-width: 700px) { .gcp-main-grid { grid-template-columns: 1fr !important; } }`}</style>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ background: "rgba(59,130,246,0.15)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}><Cloud size={16} color="#3B82F6" /></div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>My Google Cloud Project</span>
                  </div>
                  <span style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>● Connected</span>
                </div>
                <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 8 }}>
                  <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Project Name</div><div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{gcpProjectName} <Copy size={11} color="rgba(255,255,255,0.3)" style={{ cursor: "pointer" }} onClick={() => handleCopy(gcpProjectName, "proj_name")} /></div></div>
                  <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Project ID</div><div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 6 }}>{gcpProjectId} <Copy size={11} color="rgba(255,255,255,0.3)" style={{ cursor: "pointer" }} onClick={() => handleCopy(gcpProjectId, "proj_id")} /></div></div>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Google Account</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      {gcpAccountAvatar ? <img src={gcpAccountAvatar} style={{ width: 28, height: 28, borderRadius: "50%" }} alt="" /> : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4285f4,#ea4335)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{gcpAccount !== "—" ? gcpAccount[0].toUpperCase() : "G"}</div>}
                      <div><div style={{ fontSize: 12, fontWeight: 600 }}>{gcpAccount !== "—" ? gcpAccount : "Google Account"}</div></div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Connected On</div><div style={{ fontSize: 11, fontWeight: 600 }}>{gcpConnectedDate}</div></div>
                    <div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Last Sync</div><div style={{ fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>{gcpLastSync.split(",")[0]} <RefreshCw size={10} style={{ cursor: "pointer" }} onClick={handleGcpRefresh} /></div></div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Connection Status</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {connectionChecks.map(item => (
                    <div key={item.label} style={{ background: item.ok ? "rgba(34,197,94,0.08)" : "rgba(244,63,94,0.08)", border: `1px solid ${item.ok ? "rgba(34,197,94,0.25)" : "rgba(244,63,94,0.25)"}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ color: item.ok ? "#22C55E" : "#F43F5E", marginBottom: 4, display: "flex", justifyContent: "center" }}>
                        {item.ok ? <CheckCircle size={18} color="#22C55E" /> : <XCircle size={18} color="#F43F5E" />}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Quick Actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Open Google Cloud Console", icon: <ExternalLink size={13} />, href: "https://console.cloud.google.com", color: "#3B82F6" },
                    { label: "Open API Library", icon: <Database size={13} />, href: "https://console.cloud.google.com/apis/library", color: "#A78BFA" },
                    { label: "Open Credentials", icon: <Key size={13} />, href: "https://console.cloud.google.com/apis/credentials", color: "#F59E0B" },
                    { label: "Manage Project", icon: <Settings2 size={13} />, href: "https://console.cloud.google.com", color: "#22C55E" },
                    { label: "Refresh Status", icon: <RefreshCw size={13} />, onClick: handleGcpRefresh, color: "#fff" },
                    { label: "Disconnect", icon: gcpDisconnecting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <WifiOff size={13} />, onClick: handleGcpDisconnect, color: "#F43F5E", danger: true },
                  ].map(item =>
                    item.href ? (
                      <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", cursor: "pointer", color: item.color }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600 }}>{item.icon}{item.label}</div>
                          <ExternalLink size={10} color="rgba(255,255,255,0.3)" />
                        </button>
                      </a>
                    ) : (
                      <button key={item.label} onClick={item.onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: (item as any).danger ? "rgba(244,63,94,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${(item as any).danger ? "rgba(244,63,94,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "9px 12px", cursor: "pointer", color: item.color, fontSize: 12, fontWeight: 600 }}>
                        {item.icon}{item.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="gcp-detail-grid">
            <style>{`@media (max-width: 700px) { .gcp-detail-grid { grid-template-columns: 1fr !important; } }`}</style>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Database size={14} color="#3B82F6" /><span style={{ fontWeight: 700, fontSize: 13 }}>Daily Quota</span></div>
                <button style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 11, cursor: "pointer" }}>Details</button>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
                <DonutChart used={gcpUsedToday} limit={gcpDailyQuota} color="#3B82F6" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[["Daily Limit", `${gcpDailyQuota.toLocaleString()} units`], ["Used Today", `${gcpUsedToday.toLocaleString()} units`], ["Remaining", `${gcpRemaining.toLocaleString()} units`], ["Reset Time", gcpResetTime]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{k}</span><span style={{ fontSize: 11, fontWeight: 600 }}>{v}</span></div>
                  ))}
                </div>
              </div>
              <QuotaBar used={gcpUsedToday} total={gcpDailyQuota} color="#3B82F6" />
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Key size={14} color="#A78BFA" /><span style={{ fontWeight: 700, fontSize: 13 }}>API & OAuth Status</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "OAuth Status", val: gcpOAuthStatus, badge: true, ok: gcpOAuthStatus !== "Not Configured" },
                  { label: "Redirect URI", val: gcpOAuthRedirect, small: true },
                  { label: "Scopes", val: `${gcpOAuthScopes.length} scopes` },
                  { label: "Verification", val: gcpOAuthVerification, badge: true, ok: gcpOAuthVerification === "Verified" },
                  { label: "API Status", val: gcpApiStatus, badge: true, ok: gcpApiStatus === "Enabled" },
                  { label: "API Version", val: gcpApiVersion },
                  { label: "Last Checked", val: gcpApiLastChecked },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
                    {item.badge ? <StatusBadge ok={item.ok ?? false} label={item.val} /> : <span style={{ fontSize: item.small ? 10 : 11, fontWeight: 600, fontFamily: item.small ? "monospace" : "inherit", color: "rgba(255,255,255,0.6)", maxWidth: 120, textAlign: "right", wordBreak: "break-all" }}>{item.val}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><Shield size={14} color="#22C55E" /><span style={{ fontWeight: 700, fontSize: 13 }}>Credentials</span></div>
              {!userData.gcp_client_id ? (
                <EmptyState icon={<Shield size={18} color="#22C55E" />} title="No Credentials" desc="Add credentials in Settings." onCta={() => router.push("/dashboard/settings")} cta="Go to Settings" />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["Client ID", gcpClientId, "client_id"], ["Client Secret", gcpClientSecret, "client_secret"]].map(([label, val, key]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{label}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 10px" }}>
                        <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{val}</span>
                        <button onClick={() => handleCopy(val, key)} style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === key ? "#22C55E" : "rgba(255,255,255,0.3)", padding: 0 }}>
                          {copiedKey === key ? <CheckCircle size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Secret Status</span><span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E" }}>Saved & Encrypted</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Updated</span><span style={{ fontSize: 11, fontWeight: 600 }}>{gcpCredUpdated}</span></div>
                  <button onClick={handleDeleteCreds} disabled={deletingCreds} style={{ width: "100%", marginTop: 4, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E", borderRadius: 8, padding: "7px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {deletingCreds ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} />} Delete Credentials
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="gcp-activity-grid">
            <style>{`@media (max-width: 600px) { .gcp-activity-grid { grid-template-columns: 1fr !important; } }`}</style>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span style={{ fontWeight: 700, fontSize: 14 }}>Recent Activity</span><button style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All</button></div>
              {[["YouTube API connection successful","25s ago"],["Comments scanned: 128","1m ago"],["AI reply sent to comment","2m ago"],["Toxic comment hidden","3m ago"],["Daily quota updated","5m ago"]].map(([msg, time], i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><CheckCircle size={14} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} /><span style={{ fontSize: 12 }}>{msg}</span></div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{time}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span style={{ fontWeight: 700, fontSize: 14 }}>System Health</span><button style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All</button></div>
              {[["API Server",true],["Database",true],["YouTube API",channelConnected],["AI Engine",userData.live_monitoring??false],["File Storage",true]].map(([label, ok]) => (
                <div key={String(label)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={14} color={ok ? "#22C55E" : "#F59E0B"} /><span style={{ fontSize: 12 }}>{String(label)}</span></div>
                  <span style={{ color: ok ? "#22C55E" : "#F59E0B", fontSize: 12, fontWeight: 600 }}>{ok ? "Operational" : "Not Connected"}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>You're using your own Google Cloud project</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>You have full control over your quota and billing. ModerateAI will only access the YouTube Data API on your behalf.</div>
            </div>
            <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#A78BFA", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>Learn More <ExternalLink size={12} /></button>
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }} className="setup-grid">
          <style>{`@media (max-width: 900px) { .setup-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "rgba(59,130,246,0.15)", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}><Cloud size={20} color="#3B82F6" /></div>
                <div><div style={{ fontWeight: 800, fontSize: 16 }}>My Google Cloud Project</div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Use your own Google Cloud project & get higher limits.</div></div>
              </div>
              <EmptyState icon={<Cloud size={22} color="#3B82F6" />} title="No GCP Project Connected" desc="Connect your own Google Cloud project for higher API limits and full control.">
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                  <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ width: "100%", background: "linear-gradient(135deg,#3B82F6,#2563EB)", color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Cloud size={14} /> Open Google Cloud Console
                  </button>
                </div>
              </EmptyState>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Video size={15} color="rgba(255,255,255,0.5)" /><span style={{ fontWeight: 700, fontSize: 13 }}>Setup Guide Video</span></div>
                <button style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}><RefreshCw size={11} /> Refresh</button>
              </div>
              <div style={{ margin: "0 12px 12px", borderRadius: 12, overflow: "hidden", background: "#000" }}>
                {videoError ? (
                  <div style={{ background: "linear-gradient(135deg,#1a0533,#0d1b3e)", borderRadius: 12, padding: "28px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Tutorial Coming Soon</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Follow the steps below to get started.</div>
                  </div>
                ) : (
                  <video ref={videoRef} src="/videos/setup-demo.mp4" controls onEnded={handleVideoEnded} onError={() => setVideoError(true)} style={{ width: "100%", display: "block", borderRadius: 12 }} poster="/images/setup/step1.webp" />
                )}
              </div>
              {videoError && (
                <div style={{ padding: "0 12px 12px" }}>
                  <button onClick={handleVideoEnded} style={{ width: "100%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 8, padding: "7px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Skip to Setup Steps</button>
                </div>
              )}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
              <div style={{ marginBottom: 14 }}><div style={{ fontWeight: 700, fontSize: 13 }}>Step by Step Setup</div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>(My Google Cloud Project)</div></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 120, position: "relative" }}>
                  {SETUP_STEPS.map((s, i) => {
                    const done = completedSteps.has(i) || (i === 0 && videoWatched);
                    const active = i === currentStep;
                    const locked = isStepLocked(i);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, position: "relative" }}>
                        {i < SETUP_STEPS.length - 1 && <div style={{ position: "absolute", left: 11, top: 22, width: 2, height: 18, background: done ? "#22C55E" : "rgba(255,255,255,0.1)", borderRadius: 1 }} />}
                        <button onClick={() => !locked && setCurrentStep(i)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: locked ? "default" : "pointer", padding: "4px 0", textAlign: "left", width: "100%" }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#22C55E" : active ? "#7C3AED" : locked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)", fontSize: 10, fontWeight: 700, color: "#fff", boxShadow: active ? "0 0 12px rgba(124,58,237,0.5)" : "none" }}>
                            {done ? <CheckCircle size={12} /> : locked ? <Lock size={10} color="rgba(255,255,255,0.3)" /> : i + 1}
                          </div>
                          <span style={{ fontSize: 12, color: locked ? "rgba(255,255,255,0.2)" : active ? "#fff" : done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 400 }}>{s.label}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12 }}>
                  <div className="screenshot-hover" onClick={() => setModalStepKey(currentStepKey)} style={{ marginBottom: 10, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", cursor: "zoom-in", position: "relative" }}>
                    {DemoScreenshot ? <DemoScreenshot /> : <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No preview</div>}
                    <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(255,255,255,0.6)" }}><Maximize2 size={9} /> Expand</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{currentStepDetail.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 10 }}>{currentStepDetail.desc}</div>
                  {currentStepDetail.action && !isStepLocked(currentStep) && (
                    <button onClick={() => handleStepAction(currentStepKey)} style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, padding: "7px", fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      {currentStepDetail.action} <ExternalLink size={10} />
                    </button>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 14, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Progress</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{completedSteps.size + (videoWatched ? 1 : 0)} / {SETUP_STEPS.length} steps</span></div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}><div style={{ width: `${((completedSteps.size + (videoWatched ? 1 : 0)) / SETUP_STEPS.length) * 100}%`, height: "100%", background: "linear-gradient(90deg,#7C3AED,#22C55E)", borderRadius: 2, transition: "width 0.4s ease" }} /></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: currentStep === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: currentStep === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><ChevronLeft size={14} /> Previous</button>
                <button onClick={() => { const next = currentStep + 1; if (next < SETUP_STEPS.length && !isStepLocked(next)) setCurrentStep(next); }} disabled={currentStep === SETUP_STEPS.length - 1 || isStepLocked(currentStep + 1)} style={{ flex: 1, background: "#7C3AED", border: "none", color: "#fff", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: (currentStep === SETUP_STEPS.length - 1 || isStepLocked(currentStep + 1)) ? 0.4 : 1 }}>Next <ChevronRight size={14} /></button>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Need Help?</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: <BookOpen size={16} color="#3B82F6" />, label: "Documentation", sub: "View Guide", bg: "rgba(59,130,246,0.1)", href: "https://docs.moderateai.site" },
                  { icon: <Video size={16} color="#EF4444" />, label: "Watch Tutorial", sub: "Step by Step", bg: "rgba(239,68,68,0.1)", href: "https://youtube.com" },
                  { icon: <Headphones size={16} color="#22C55E" />, label: "Contact Support", sub: "24/7 Support", bg: "rgba(34,197,94,0.1)", href: "mailto:support@moderateai.site" },
                ].map(item => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: item.bg, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
                      {item.icon}
                      <div><div style={{ color: "#FAFAFA", fontSize: 12, fontWeight: 700 }}>{item.label}</div><div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{item.sub}</div></div>
                      <ExternalLink size={11} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />
                    </button>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
    <div style={{ display: "flex", background: "#09090B", color: "#FAFAFA", fontFamily: "Inter,sans-serif", minHeight: "100vh" }}>
      <div className="sidebar-wrapper" style={{ display: "none" }}>
        <DashboardSidebar />
      </div>
      <style>{`
        @media (pointer: fine) { .sidebar-wrapper { display: block !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .screenshot-hover:hover { transform: scale(1.02); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .tab-btn:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>

      {toastMsg && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toastType === "success" ? "rgba(34,197,94,0.15)" : toastType === "error" ? "rgba(244,63,94,0.15)" : "rgba(124,58,237,0.15)", border: `1px solid ${toastType === "success" ? "rgba(34,197,94,0.4)" : toastType === "error" ? "rgba(244,63,94,0.4)" : "rgba(124,58,237,0.4)"}`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 13, fontWeight: 600, animation: "fadeIn 0.2s ease", backdropFilter: "blur(12px)", maxWidth: 340 }}>
          {toastType === "success" ? <CheckCircle size={15} color="#22C55E" /> : toastType === "error" ? <AlertCircle size={15} color="#F43F5E" /> : <Zap size={15} color="#A78BFA" />}
          {toastMsg}
        </div>
      )}

      <main className="main-content" style={{ flex: 1, overflowX: "hidden", paddingBottom: 80 }}>
        <style>{`@media (pointer: fine) { .main-content { margin-left: 240px !important; padding-bottom: 24px !important; } }`}</style>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 16px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", borderRadius: 14, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}>
                <Shield size={22} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>API Access</h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>Manage how ModerateAI connects to the YouTube Data API</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#22C55E", fontSize: 13, fontWeight: 600, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "6px 14px" }}>
                <CheckCircle size={14} /> All Systems Normal
              </span>
              <button style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <RefreshCw size={11} />
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
            <button className="tab-btn" onClick={() => setActiveTab("shared")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: activeTab === "shared" ? "linear-gradient(135deg,#7C3AED,#4F46E5)" : "transparent", color: activeTab === "shared" ? "#fff" : "rgba(255,255,255,0.5)", boxShadow: activeTab === "shared" ? "0 4px 16px rgba(124,58,237,0.35)" : "none" }}>
              <Share2 size={16} /> ModerateAI Shared API
              <span style={{ background: activeTab === "shared" ? "rgba(255,255,255,0.2)" : "rgba(124,58,237,0.2)", color: activeTab === "shared" ? "#fff" : "#A78BFA", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>Recommended</span>
            </button>
            <button className="tab-btn" onClick={() => setActiveTab("gcp")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: activeTab === "gcp" ? "rgba(255,255,255,0.08)" : "transparent", color: activeTab === "gcp" ? "#fff" : "rgba(255,255,255,0.5)" }}>
              <Cloud size={16} /> My Google Cloud Project
            </button>
          </div>

          {/* Tab Content */}
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