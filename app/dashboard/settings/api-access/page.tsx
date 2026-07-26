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
  Gift, Star, ArrowRight, Server, Cpu, Globe, Eye, EyeOff,
  Calendar, Timer, TrendingDown, List, Save, ChevronDown,
  FileText, MessageCircle, Video as YoutubeIcon
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
  gcp_project_number?: string;
  gcp_location?: string;
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
  gcp_quota_reset_at?: string;
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
  gcp_requests_today?: number;
  gcp_requests_endpoints?: number;
  gcp_usage_history?: { date: string; units: number }[];
  gcp_top_methods?: { name: string; units: number; pct: number }[];
}

// ─── Setup Steps ──────────────────────────────────────────────────────────────
const SETUP_STEPS = [
  { label: "Create Project", key: "create_project" },
  { label: "Enable YouTube Data API v3", key: "enable_api" },
  { label: "OAuth Consent Screen", key: "oauth_consent" },
  { label: "Create OAuth Client ID", key: "oauth_client" },
  { label: "Add Redirect URI", key: "copy_credentials" },
  { label: "Copy Project Details", key: "save_project" },
  { label: "Save & Connect", key: "authorization" },
];

const STEP_DETAILS: Record<string, { title: string; desc: string; bullets: string[]; action: string; url: string; tip?: string; duration: string }> = {
  create_project: {
    title: "Create a New Google Cloud Project",
    desc: "A project is required to use Google APIs.",
    bullets: [
      "Go to Google Cloud Console",
      "Click on the project dropdown at the top",
      'Click "New Project"',
      "Enter project name",
      'Click "Create"',
    ],
    action: "Open Google Cloud Console",
    url: "https://console.cloud.google.com",
    tip: "Use a unique name that you will remember easily.",
    duration: "3:45",
  },
  enable_api: {
    title: "Enable YouTube Data API v3",
    desc: "Go to APIs & Services > Library search for \"YouTube Data API v3\" and click \"Enable\".",
    bullets: [
      'Go to APIs & Services > Library',
      'Search for "YouTube Data API v3"',
      'Click "Enable"',
    ],
    action: "Open API Library",
    url: "https://console.cloud.google.com/apis/library",
    duration: "2:30",
  },
  oauth_consent: {
    title: "Configure OAuth Consent Screen",
    desc: "Go to OAuth consent screen and fill in the required details.",
    bullets: [
      "Go to APIs & Services > OAuth consent screen",
      "Select External user type",
      "Fill in app name and support email",
      'Click "Save and Continue"',
    ],
    action: "Open OAuth Consent Screen",
    url: "https://console.cloud.google.com/apis/credentials/consent",
    duration: "2:15",
  },
  oauth_client: {
    title: "Create OAuth Client ID",
    desc: "Go to Credentials and create a new OAuth 2.0 Client ID.",
    bullets: [
      "Go to APIs & Services > Credentials",
      'Click "+ CREATE CREDENTIALS"',
      'Select "OAuth client ID"',
      "Choose Web application",
      "Add the redirect URI below",
    ],
    action: "Open Credentials",
    url: "https://console.cloud.google.com/apis/credentials",
    duration: "2:00",
  },
  copy_credentials: {
    title: "Add Redirect URI",
    desc: "Copy your Client ID and Client Secret. You'll need these in the next step.",
    bullets: [
      "After creating OAuth client, a popup appears",
      "Copy your Client ID",
      "Copy your Client Secret",
      "Keep these safe — you'll paste them below",
    ],
    action: "Open Credentials",
    url: "https://console.cloud.google.com/apis/credentials",
    duration: "1:30",
  },
  save_project: {
    title: "Copy Project Details",
    desc: "Add the Callback URL in Google Console and paste all details below.",
    bullets: [
      "Copy the Callback URL below",
      "Add it in Google Console under Authorized redirect URIs",
      "Paste your Project Name, Project ID, Client ID, Client Secret",
      'Click "Save & Connect Project"',
    ],
    action: "Save & Connect Project",
    url: "",
    duration: "1:45",
  },
  authorization: {
    title: "Save & Connect",
    desc: "Sign in with your Google account to authorize ModerateAI.",
    bullets: [
      "Click the button below to start authorization",
      "Sign in with your Google account",
      "Allow the required permissions",
      "You'll be redirected back to ModerateAI",
    ],
    action: "Connect YouTube",
    url: "/api/auth/youtube",
    duration: "1:00",
  },
};

// ─── Demo Screenshots ─────────────────────────────────────────────────────────
const DemoScreenshots: Record<string, React.FC> = {
  create_project: memo(function CreateProjectDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#1a73e8", padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 8px", color: "rgba(255,255,255,0.9)", fontSize: 8 }}>console.cloud.google.com</div>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          <div style={{ width: 80, background: "#f8f9fa", borderRight: "1px solid #e8eaed", padding: "6px 4px", fontSize: 7.5, color: "#5f6368" }}>
            {["Cloud overview","APIs & Services","Billing","IAM & Admin","Marketplace"].map(s => (
              <div key={s} style={{ padding: "3px 4px", borderRadius: 3, marginBottom: 2 }}>{s}</div>
            ))}
          </div>
          <div style={{ flex: 1, padding: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#202124" }}>Select a project</div>
              <div style={{ background: "#1a73e8", color: "#fff", fontSize: 7, padding: "2px 6px", borderRadius: 3, fontWeight: 600 }}>NEW PROJECT</div>
            </div>
            <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: "3px 6px", fontSize: 8, color: "#5f6368", marginBottom: 6 }}>🔍 Search projects and folders</div>
            <div style={{ display: "flex", gap: 20, marginBottom: 4 }}>
              {["RECENT","STARRED","ALL"].map((t,i) => (
                <span key={t} style={{ fontSize: 7, color: i===0?"#1a73e8":"#5f6368", fontWeight: i===0?700:400, borderBottom: i===0?"2px solid #1a73e8":"none", paddingBottom: 2 }}>{t}</span>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px", marginBottom: 2 }}>
              <span style={{ fontSize: 7, color: "#5f6368" }}>Name</span>
              <span style={{ fontSize: 7, color: "#5f6368" }}>ID</span>
            </div>
            {[["My Project 1","1234567890"],["ModerateAI","8070564421"],["Test Project","12255442033"]].map(([n,id]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "3px 4px", borderBottom: "1px solid #f0f0f0", fontSize: 8 }}>
                <span style={{ color: "#202124" }}>⚙ {n}</span>
                <span style={{ color: "#5f6368" }}>{id}</span>
              </div>
            ))}
            <div style={{ fontSize: 7, color: "#1a73e8", marginTop: 6, cursor: "pointer" }}>View all projects</div>
          </div>
        </div>
        <div style={{ background: "#f0f7ff", borderTop: "1px solid #e8eaed", padding: "6px 10px", fontSize: 7.5, color: "#3c4043", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#1a73e8" }}>ℹ</span> After creating the project, you will be redirected to the Google Cloud Console dashboard.
        </div>
      </div>
    );
  }),
  enable_api: memo(function EnableAPIDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ background: "#1a73e8", padding: "5px 10px" }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 8px", color: "rgba(255,255,255,0.9)", fontSize: 8 }}>console.cloud.google.com/apis/library</div>
        </div>
        <div style={{ padding: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 9, color: "#5f6368" }}>APIs &amp; Services <span style={{ color: "#5f6368" }}>&gt;</span> <span style={{ color: "#1a73e8" }}>Library</span></div>
          <div style={{ border: "1px solid #e8eaed", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 8, padding: "6px 8px", background: "#fafafa", alignItems: "center" }}>
              <div style={{ width: 24, height: 24, background: "#ff0000", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "#fff", fontSize: 7, fontWeight: 700 }}>▶</div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#202124" }}>YouTube Data API v3</div>
                <div style={{ fontSize: 7, color: "#5f6368" }}>Google Enterprise API</div>
              </div>
              <button style={{ marginLeft: "auto", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 8, fontWeight: 600 }}>ENABLE</button>
            </div>
          </div>
        </div>
      </div>
    );
  }),
  oauth_consent: memo(function OAuthConsentDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#202124", marginBottom: 6 }}>OAuth consent screen</div>
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 8 }}>
            {["OAuth consent screen","Scopes","Test users","Summary"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: i === 0 ? "#1a73e8" : "#e8eaed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: i === 0 ? "#fff" : "#5f6368", fontWeight: 700 }}>{i + 1}</div>
                <span style={{ fontSize: 7.5, color: i === 0 ? "#1a73e8" : "#5f6368" }}>{s}</span>
                {i < 3 && <span style={{ color: "#e8eaed", fontSize: 8 }}>—</span>}
              </div>
            ))}
          </div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 6 }}>
            <div style={{ fontSize: 7, color: "#5f6368", marginBottom: 2 }}>App name</div>
            <div style={{ fontSize: 8, color: "#202124", fontWeight: 500 }}>ModerateAI</div>
          </div>
        </div>
      </div>
    );
  }),
  oauth_client: memo(function OAuthClientDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#202124", marginBottom: 6 }}>Create OAuth 2.0 Client ID</div>
          <div style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: 5, marginBottom: 4 }}>
            <div style={{ fontSize: 7, color: "#5f6368", marginBottom: 1 }}>Application type</div>
            <div style={{ fontSize: 8, color: "#202124" }}>Web application ▾</div>
          </div>
          <div style={{ background: "#e8f0fe", border: "1px solid #1a73e8", borderRadius: 4, padding: 5, marginBottom: 4 }}>
            <div style={{ fontSize: 7, color: "#5f6368", marginBottom: 1 }}>Authorised redirect URI</div>
            <div style={{ fontSize: 7, color: "#1a73e8", fontFamily: "monospace" }}>https://moderateai.site/api/auth/youtube/callback</div>
          </div>
          <button style={{ background: "#1a73e8", color: "#fff", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 8, fontWeight: 600 }}>Create</button>
        </div>
      </div>
    );
  }),
  copy_credentials: memo(function CopyCredentialsDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ padding: 8 }}>
          <div style={{ background: "#e6f4ea", border: "1px solid #34a853", borderRadius: 4, padding: "3px 6px", fontSize: 8, color: "#137333", marginBottom: 6 }}>✓ OAuth client created successfully</div>
          <div style={{ fontSize: 8, color: "#5f6368", marginBottom: 4 }}>OAuth client</div>
          {[["Client ID", "123456789-abcd.apps.googleusercontent.com"], ["Client Secret", "GOCSPX-••••••••••••••"]].map(([k, v]) => (
            <div key={k} style={{ background: "#f8f9fa", border: "1px solid #e8eaed", borderRadius: 4, padding: "5px 6px", marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><div style={{ fontSize: 7, color: "#5f6368" }}>{k}</div><div style={{ fontSize: 7, color: "#202124", fontFamily: "monospace" }}>{v}</div></div>
                <div style={{ background: "#1a73e8", color: "#fff", fontSize: 7, padding: "2px 5px", borderRadius: 3 }}>Copy</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }),
  save_project: memo(function SaveProjectDemo() {
    return (
      <div style={{ background: "#1a1a2e", borderRadius: 8, overflow: "hidden", fontSize: 9 }}>
        <div style={{ padding: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Save Your Project Details</div>
          {[["Project Name","e.g. ModerateAI User Project"],["Project ID","e.g. moderateai-user-project-123456"],["Client ID","e.g. 1234567890-abcd.apps.googleusercontent.com"],["Client Secret","e.g. GOCSPX-abcde12345-xxxxxxxxxx"]].map(([k, p]) => (
            <div key={k} style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 7.5, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>{k}</div>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "3px 6px", fontSize: 7, color: "rgba(255,255,255,0.3)" }}>{p}</div>
            </div>
          ))}
          <button style={{ width: "100%", background: "#7C3AED", color: "#fff", border: "none", borderRadius: 5, padding: "5px", fontSize: 8, fontWeight: 700, marginTop: 4 }}>Save &amp; Connect Project</button>
        </div>
      </div>
    );
  }),
  authorization: memo(function AuthorizationDemo() {
    return (
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", fontFamily: "Google Sans, sans-serif", fontSize: 10 }}>
        <div style={{ padding: "8px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}><span style={{ color: "#4285f4" }}>G</span><span style={{ color: "#ea4335" }}>o</span><span style={{ color: "#fbbc04" }}>o</span><span style={{ color: "#4285f4" }}>g</span><span style={{ color: "#34a853" }}>l</span><span style={{ color: "#ea4335" }}>e</span></div>
          <div style={{ fontSize: 9, color: "#5f6368", marginBottom: 4 }}>ModerateAI wants to access your Google Account</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#202124", marginBottom: 6 }}>user@gmail.com</div>
          <div style={{ textAlign: "left", marginBottom: 6 }}>
            {["See your YouTube channel","Manage your YouTube videos","View and manage your comments"].map(p => (
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

// ─── Mini Sparkline Chart ─────────────────────────────────────────────────────
const SparklineChart = memo(function SparklineChart({ data, color = "#7C3AED", height = 120 }: { data: { date: string; units: number }[]; color?: string; height?: number }) {
  const w = 500, h = height;
  const maxVal = Math.max(...data.map(d => d.units), 1);
  const xs = data.map((_, i) => (i / (data.length - 1)) * w);
  const ys = data.map(d => h - (d.units / maxVal) * (h - 20) - 10);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const id = `sg-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 5 : 3} fill={color} opacity={i === xs.length - 1 ? 1 : 0.5} />
      ))}
    </svg>
  );
});

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const DonutChart = memo(function DonutChart({ used, limit, color = "#7C3AED", size = 100 }: { used: number; limit: number; color?: string; size?: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const r = size * 0.38, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.1} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.1}
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: size * 0.17, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{used.toLocaleString()}</div>
        <div style={{ fontSize: size * 0.09, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>/ {(limit/1000).toFixed(0)}K</div>
        <div style={{ fontSize: size * 0.1, fontWeight: 700, color, marginTop: 1 }}>{pct.toFixed(1)}%</div>
      </div>
    </div>
  );
});

// ─── MiniChart ────────────────────────────────────────────────────────────────
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

// ─── Connection Test Button ───────────────────────────────────────────────────
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

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({ resetAt }: { resetAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const target = new Date(resetAt);
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("Resetting…"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [resetAt]);
  return <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#A78BFA" }}>{timeLeft || "—"}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED API TAB (untouched)
// ═══════════════════════════════════════════════════════════════════════════════
function SharedAPITab({ userData, user, router, showToast }: { userData: UserData; user: User; router: ReturnType<typeof useRouter>; showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [activeChart, setActiveChart] = useState<"7D" | "30D" | "90D">("7D");
  const [testState, setTestState] = useState<TestState>("idle");
  const [reconnecting, setReconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const aiCreditsRemaining = userData.ai_credits ?? 250;
  const aiLimit = 250;
  const aiUsed = Math.max(0, aiLimit - aiCreditsRemaining);
  const remaining = aiCreditsRemaining;
  const pct = aiLimit > 0 ? Math.min((aiUsed / aiLimit) * 100, 100) : 0;
  const planName = userData.plan_display_name || "Free Trial";
  const subscriptionStatus = userData.subscription_status || "trial";
  const isFreeTrialPlan = subscriptionStatus === "trial" || userData.plan === "free";
  const expiryTimestamp = userData.trial_ends_at ?? userData.plan_expires_at;
  const planExpiry = expiryTimestamp
    ? new Date(expiryTimestamp.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";
  const trialDaysLeft = expiryTimestamp
    ? Math.max(0, Math.ceil((expiryTimestamp.seconds * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const daysUntilReset = trialDaysLeft;
  const successRate = userData.moderation_accuracy ?? 99.9;
  const avgResponseMs = userData.avg_response_ms ?? 0;
  const avgResponseSec = avgResponseMs > 0 ? (avgResponseMs / 1000).toFixed(1) + "s" : "—";
  const channelConnected = userData.youtube_connected ?? false;
  const lastSync = userData.youtube_stats_refreshed_at
    ? new Date(userData.youtube_stats_refreshed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

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
            <div className="hero-shield" style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" }}>
              <Shield size={28} color="white" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="hero-title" style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.3px" }}>ModerateAI Shared API</span>
                <span style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, boxShadow: "0 2px 8px rgba(124,58,237,0.4)" }}>Recommended</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>We handle everything for you. No setup required.</div>
              <div className="hero-badges" style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {[{ icon: <Shield size={11} />, label: "Secure" },{ icon: <CheckCircle size={11} />, label: "Reliable" },{ icon: <Zap size={11} />, label: "Always On" },{ icon: <Star size={11} />, label: "Optimized" }].map(b => (
                  <span key={b.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                    <span style={{ color: "#22C55E" }}>{b.icon}</span> {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="cloud-box-hide" style={{ width: 90, height: 90, flexShrink: 0, background: "radial-gradient(circle at 40% 40%, rgba(124,58,237,0.35), rgba(79,70,229,0.15))", borderRadius: 20, border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Cloud size={42} color="#A78BFA" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(124,58,237,0.06)", border: "1.5px solid rgba(124,58,237,0.25)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }} className="shared-stats-grid">
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 20, padding: "14px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 12 }} className="health-row">
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
        <div style={{ display: "flex", gap: 10 }} className="action-btns">
          <button onClick={handleReconnect} disabled={reconnecting} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {reconnecting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />} Reconnect
          </button>
          <ConnectionTestBtn state={testState} onClick={handleTestConnection} />
          <button onClick={() => router.push("/analytics")} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <BarChart2 size={13} /> View Usage
          </button>
        </div>
      </div>

      {isFreeTrialPlan && (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gift size={22} color="#A78BFA" />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>You're on Free Trial! 🎉</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Explore all features with {aiLimit} free AI actions.</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 100 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#A78BFA" }}>{remaining} <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>/ {aiLimit}</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>AI Actions Left</div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, marginTop: 6 }}>
              <div style={{ width: `${(remaining / aiLimit) * 100}%`, height: "100%", background: "linear-gradient(90deg,#7C3AED,#A78BFA)", borderRadius: 3, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>© {planExpiry}</div>
          </div>
          <div style={{ textAlign: "center", minWidth: 100, borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Trial ends in</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#FAFAFA", lineHeight: 1 }}>{trialDaysLeft}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Days</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Clock size={9} /> {planExpiry}</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="usage-cards-grid">
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>AI Actions Used</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#FAFAFA", lineHeight: 1 }}>{aiUsed.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>/ {aiLimit.toLocaleString()}</div>
          <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct > 80 ? "#F43F5E" : "#7C3AED", borderRadius: 2, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: pct > 80 ? "#F43F5E" : "rgba(255,255,255,0.35)", marginTop: 5, fontWeight: 600 }}>{pct.toFixed(0)}% Used</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>AI Actions Remaining</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#A78BFA", lineHeight: 1 }}>{remaining.toLocaleString()}</div>
          <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
            <div style={{ width: `${100 - pct}%`, height: "100%", background: "#7C3AED", borderRadius: 2, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "#A78BFA", marginTop: 5, fontWeight: 600 }}>{(100 - pct).toFixed(0)}% Remaining</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{isFreeTrialPlan ? "Trial Ends In" : "Resets In"}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: isFreeTrialPlan && trialDaysLeft <= 3 ? "#F43F5E" : "#FAFAFA", lineHeight: 1 }}>{trialDaysLeft}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Days</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {planExpiry}</div>
          {isFreeTrialPlan && (
            <button onClick={() => router.push("/billing?offer=trial-extension")} style={{ marginTop: 8, width: "100%", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 8, padding: "5px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              Extend ₹69
            </button>
          )}
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Current Plan</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#22C55E" }}>{planName}</div>
          <button onClick={() => router.push("/billing")} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            <Zap size={11} /> Upgrade
          </button>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>AI Actions Usage Over Time</div>
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
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Shared API Status</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 16 }}>Real-time status of our shared infrastructure</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[{ label: "API Server", ok: true },{ label: "Database", ok: true },{ label: "YouTube Data API", ok: channelConnected },{ label: "AI Engine", ok: userData.live_monitoring ?? false },{ label: "Rate Limiting", ok: true, label2: "Optimal" }].map(h => (
            <div key={h.label} style={{ flex: 1, minWidth: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
              <CheckCircle size={18} color={h.ok ? "#22C55E" : "#F59E0B"} />
              <div style={{ fontSize: 12, fontWeight: 600, color: "#FAFAFA", textAlign: "center" }}>{h.label}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: h.ok ? "#22C55E" : "#F59E0B" }}>{h.label2 || (h.ok ? "Operational" : "Not Connected")}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="activity-grid">
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Recent Activity</div>
            <button style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All</button>
          </div>
          {[{ msg: "YouTube API request successful", time: "25s ago" },{ msg: "Comments data fetched", time: "1m ago" },{ msg: "AI reply sent to comment", time: "2m ago" },{ msg: "Channel statistics updated", time: "3m ago" },{ msg: "Daily usage counter updated", time: "5m ago" }].map((a, i) => (
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
            {["No API key setup required","Higher quota & better reliability","Fully managed by ModerateAI","Automatic optimizations","24/7 monitoring & support"].map(item => (
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

      {isFreeTrialPlan && (
        <div style={{ background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Trial Extension Offer 🎉</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 16 }}>Need more time? Extend your trial and get 30 more days + {aiLimit} AI actions.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 20, fontWeight: 900, color: "#FAFAFA" }}>30 Days</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Extra validity</div></div>
              <div><div style={{ fontSize: 20, fontWeight: 900, color: "#FAFAFA" }}>{aiLimit} AI Actions</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Full access</div></div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "12px 18px", textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>One-time Offer</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#F59E0B" }}>₹69</div>
            </div>
          </div>
          <button onClick={() => router.push("/billing?offer=trial-extension")} style={{ marginTop: 16, width: "100%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
            Extend Trial Now <ArrowRight size={16} />
          </button>
        </div>
      )}

      <div style={{ background: "rgba(124,58,237,0.08)", border: "1.5px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Need More AI Actions?</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 12 }}>Upgrade your plan to get more AI actions and unlimited access to all features.</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} color="#22C55E" />
              <div><span style={{ fontSize: 13, fontWeight: 700 }}>Starter</span><span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>  1,900 AI actions/month</span><span style={{ background: "#7C3AED", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20, marginLeft: 6 }}>Popular</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} color="#22C55E" />
              <div><span style={{ fontSize: 13, fontWeight: 700 }}>Pro Agency</span><span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>  15,000 AI actions/month</span><span style={{ background: "#22C55E", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 20, marginLeft: 6 }}>Best Value</span></div>
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
// GCP TAB — V2
// ═══════════════════════════════════════════════════════════════════════════════
function GCPTab({ userData, user, router, showToast }: { userData: UserData; user: User; router: ReturnType<typeof useRouter>; showToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [activeChart, setActiveChart] = useState<"7D" | "30D" | "90D">("7D");
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [gcpRefreshing, setGcpRefreshing] = useState(false);
  const [gcpDisconnecting, setGcpDisconnecting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formProjectName, setFormProjectName] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formClientSecret, setFormClientSecret] = useState("");

  const CALLBACK_URL = "https://moderateai.site/api/auth/youtube/callback";

  const gcpConnected = userData.gcp_connected ?? false;
  const gcpProjectName = userData.gcp_project_name || "—";
  const gcpProjectId = userData.gcp_project_id || "—";
  const gcpProjectNumber = userData.gcp_project_number || "—";
  const gcpLocation = userData.gcp_location || "us-central1";
  const gcpAccount = userData.gcp_google_account || "—";
  const gcpDailyQuota = userData.gcp_daily_quota ?? 10000;
  const gcpUsedToday = userData.gcp_used_today ?? 0;
  const gcpRemaining = gcpDailyQuota - gcpUsedToday;
  const gcpResetTime = userData.gcp_quota_reset_time || "Midnight UTC";
  const gcpResetAt = userData.gcp_quota_reset_at || "";
  const gcpLastSync = userData.gcp_last_sync
    ? new Date(userData.gcp_last_sync).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "Never";
  const gcpLastSyncShort = userData.gcp_last_sync
    ? (() => {
        const diff = Date.now() - new Date(userData.gcp_last_sync).getTime();
        const m = Math.floor(diff / 60000);
        return m < 1 ? "Just now" : m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ago`;
      })()
    : "Never";
  const gcpOAuthStatus = userData.gcp_oauth_status || "Not Configured";
  const gcpOAuthVerification = userData.gcp_oauth_verification || "Pending";
  const gcpApiStatus = userData.gcp_api_status || "Unknown";
  const gcpApiBilling = userData.gcp_api_billing || "Not Configured";
  const gcpApiVersion = userData.gcp_api_version || "v3";
  const gcpClientId = userData.gcp_client_id || "";
  const gcpClientIdMasked = gcpClientId ? gcpClientId.slice(0, 8) + "••••••••" + gcpClientId.slice(-4) : "—";
  const gcpClientSecret = userData.gcp_client_secret_masked || "—";
  const gcpCredUpdated = userData.gcp_credentials_updated || "—";
  const gcpLastVerification = userData.gcp_last_verification || "2m ago";
  const gcpConnectedDate = userData.gcp_connected_date || "—";
  const gcpAccountAvatar = userData.gcp_account_avatar || "";
  const gcpRequestsToday = userData.gcp_requests_today ?? 312;
  const gcpRequestsEndpoints = userData.gcp_requests_endpoints ?? 6;
  const channelConnected = userData.youtube_connected ?? false;

  const usageHistory: { date: string; units: number }[] = userData.gcp_usage_history ?? [
    { date: "May 15", units: 2000 }, { date: "May 16", units: 4200 },
    { date: "May 17", units: 3800 }, { date: "May 18", units: 5500 },
    { date: "May 19", units: 4700 }, { date: "May 20", units: 7200 },
    { date: "May 21", units: gcpUsedToday || 1240 },
  ];

  const topMethods: { name: string; units: number; pct: number }[] = userData.gcp_top_methods ?? [
    { name: "search.list", units: Math.round(gcpUsedToday * 0.645) || 800, pct: 64.5 },
    { name: "commentThreads.list", units: Math.round(gcpUsedToday * 0.177) || 220, pct: 17.7 },
    { name: "videos.list", units: Math.round(gcpUsedToday * 0.121) || 150, pct: 12.1 },
    { name: "channels.list", units: Math.round(gcpUsedToday * 0.04) || 50, pct: 4.0 },
    { name: "others", units: Math.round(gcpUsedToday * 0.016) || 20, pct: 1.6 },
  ];

  // Dynamic progress %
  const progressPct = Math.round((completedSteps.size / SETUP_STEPS.length) * 100);

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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(null), 1500); showToast("Copied!", "success"); });
  };

  const handleSaveProject = async () => {
    if (!formProjectName || !formProjectId || !formClientId || !formClientSecret) {
      showToast("Please fill in all fields.", "error"); return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        gcp_project_name: formProjectName,
        gcp_project_id: formProjectId,
        gcp_client_id: formClientId,
        gcp_client_secret_masked: formClientSecret.slice(0, 8) + "••••••••",
        gcp_connected: false,
        gcp_credentials_updated: new Date().toISOString(),
      });
      showToast("Project details saved! Now authorize.", "success");
      setCompletedSteps(prev => new Set([...prev, 5]));
      setCurrentStep(6);
    } catch { showToast("Failed to save. Try again.", "error"); }
    finally { setSaving(false); }
  };

  const handleStepAction = (stepKey: string) => {
    const detail = STEP_DETAILS[stepKey];
    if (stepKey === "save_project") return;
    if (stepKey === "authorization") { window.location.href = `/api/auth/youtube?uid=${user.uid}`; return; }
    if (detail?.url?.startsWith("/")) { router.push(detail.url); return; }
    if (detail?.url) window.open(detail.url, "_blank", "noopener noreferrer");
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < SETUP_STEPS.length - 1) setCurrentStep(s => s + 1);
  };

  const currentStepKey = SETUP_STEPS[currentStep]?.key ?? "create_project";
  const currentStepDetail = STEP_DETAILS[currentStepKey];
  const DemoScreenshot = DemoScreenshots[currentStepKey];

  // ── Connected State (untouched) ────────────────────────────────────────────
  if (gcpConnected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5.5l4.5 7.8H7.5L12 5.5z" fill="#FBBC04"/>
                  <path d="M7.5 13.3L5 17.5h14l-2.5-4.2H7.5z" fill="#EA4335"/>
                  <circle cx="18.5" cy="9" r="3" fill="#4285F4"/>
                </svg>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 17 }}>My Google Cloud Project</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} /> Connected
                  </span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 2 }}>Use your own Google Cloud project &amp; get higher limits.</div>
              </div>
            </div>
            <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Settings2 size={13} /> Manage Project
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="gcp-info-grid">
            <style>{`@media (max-width: 700px) { .gcp-info-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 3 }}>Project Name</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700 }}>
                  {gcpProjectName}
                  <button onClick={() => handleCopy(gcpProjectName, "pname")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: copiedKey === "pname" ? "#22C55E" : "rgba(255,255,255,0.3)" }}>
                    {copiedKey === "pname" ? <CheckCircle size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 3 }}>Project ID</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.7)" }}>{gcpProjectId}</span>
                  <button onClick={() => handleCopy(gcpProjectId, "pid")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: copiedKey === "pid" ? "#22C55E" : "rgba(255,255,255,0.3)" }}>
                    {copiedKey === "pid" ? <CheckCircle size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 5 }}>Google Account</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {gcpAccountAvatar
                    ? <img src={gcpAccountAvatar} style={{ width: 28, height: 28, borderRadius: "50%" }} alt="" />
                    : <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4285f4,#ea4335)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{gcpAccount !== "—" ? gcpAccount[0].toUpperCase() : "G"}</div>
                  }
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{gcpAccount !== "—" ? gcpAccount : "Google Account"}</span>
                    <button onClick={() => handleCopy(gcpAccount, "gacc")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: copiedKey === "gacc" ? "#22C55E" : "rgba(255,255,255,0.3)" }}>
                      {copiedKey === "gacc" ? <CheckCircle size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 2 }}>Connected On</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{gcpConnectedDate}</div>
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 2 }}>Last Sync</div>
                  <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    {gcpLastSyncShort}
                    <button onClick={handleGcpRefresh} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <RefreshCw size={10} color="rgba(255,255,255,0.3)" style={gcpRefreshing ? { animation: "spin 1s linear infinite" } : {}} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "OAuth Status", ok: gcpOAuthStatus !== "Not Configured", val: gcpOAuthStatus !== "Not Configured" ? "Verified" : "Not Configured" },
                { label: "API Status", ok: gcpApiStatus === "Enabled", val: gcpApiStatus === "Enabled" ? "Enabled" : gcpApiStatus },
                { label: "Billing Status", ok: gcpApiBilling === "Active", val: gcpApiBilling === "Active" ? "Active" : gcpApiBilling },
                { label: "Credentials", ok: !!userData.gcp_client_id, val: userData.gcp_client_id ? "Valid" : "Missing" },
                { label: "Quota Reset", ok: true, val: gcpResetTime, noIcon: true },
                { label: "Last Verification", ok: true, val: gcpLastVerification, noIcon: true },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {!item.noIcon && <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.ok ? "#22C55E" : "#F43F5E", display: "inline-block" }} />}
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.noIcon ? "rgba(255,255,255,0.7)" : item.ok ? "#22C55E" : "#F43F5E" }}>{item.val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", alignSelf: "flex-start" }}>Daily Quota Usage</div>
              <DonutChart used={gcpUsedToday} limit={gcpDailyQuota} color="#7C3AED" size={120} />
              <button onClick={() => {}} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <BarChart2 size={13} /> View Full Usage
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            {[
              { label: "Open Google Cloud Console", icon: <Globe size={13} />, href: "https://console.cloud.google.com", color: "#4285F4" },
              { label: "Open API Library", icon: <Database size={13} />, href: "https://console.cloud.google.com/apis/library", color: "#A78BFA" },
              { label: "Open Credentials", icon: <Key size={13} />, href: "https://console.cloud.google.com/apis/credentials", color: "#F59E0B" },
              { label: "Refresh Status", icon: gcpRefreshing ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />, onClick: handleGcpRefresh, color: "#22C55E" },
            ].map(item =>
              item.href ? (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", flex: 1, minWidth: 120 }}>
                  <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "10px 8px", cursor: "pointer", color: item.color, fontSize: 12, fontWeight: 600 }}>
                    {item.icon} {item.label}
                  </button>
                </a>
              ) : (
                <button key={item.label} onClick={item.onClick} style={{ flex: 1, minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "10px 8px", cursor: "pointer", color: item.color, fontSize: 12, fontWeight: 600 }}>
                  {item.icon} {item.label}
                </button>
              )
            )}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>YouTube Data API Usage <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>(Daily Quota)</span></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["7D", "30D", "90D"] as const).map(t => (
                <button key={t} onClick={() => setActiveChart(t)} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", background: activeChart === t ? "#7C3AED" : "rgba(255,255,255,0.06)", color: activeChart === t ? "#fff" : "rgba(255,255,255,0.4)", border: activeChart === t ? "none" : "1px solid rgba(255,255,255,0.08)" }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }} className="quota-cards">
            <style>{`@media (max-width: 700px) { .quota-cards { grid-template-columns: 1fr 1fr !important; } }`}</style>
            {[
              { label: "Daily Quota", val: `${gcpDailyQuota.toLocaleString()} units`, sub: "Hard limit per day", color: "#FAFAFA" },
              { label: "Used Today", val: `${gcpUsedToday.toLocaleString()} units`, sub: `${((gcpUsedToday/gcpDailyQuota)*100).toFixed(1)}% of daily quota`, color: "#F59E0B" },
              { label: "Remaining", val: `${gcpRemaining.toLocaleString()} units`, sub: `${((gcpRemaining/gcpDailyQuota)*100).toFixed(1)}% remaining`, color: "#22C55E" },
              { label: "Requests Today", val: gcpRequestsToday.toLocaleString(), sub: `Across ${gcpRequestsEndpoints} endpoints`, color: "#A78BFA" },
            ].map(card => (
              <div key={card.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 14px" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{card.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{card.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }} className="chart-methods-grid">
            <style>{`@media (max-width: 700px) { .chart-methods-grid { grid-template-columns: 1fr !important; } }`}</style>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>API Usage Over Time (Units)</span>
              </div>
              <div style={{ display: "flex", gap: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingRight: 8, paddingBottom: 16, height: 140 }}>
                  {["10K","8K","6K","4K","2K","0"].map(l => (
                    <span key={l} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>{l}</span>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <SparklineChart data={usageHistory} color="#7C3AED" height={120} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {usageHistory.map(d => (
                      <span key={d.date} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{d.date}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top API Methods (Today)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topMethods.map(method => (
                  <div key={method.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.7)" }}>{method.name}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{method.units} units ({method.pct}%)</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ width: `${method.pct}%`, height: "100%", background: "#7C3AED", borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>{gcpUsedToday.toLocaleString()} units</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="about-creds-grid">
          <style>{`@media (max-width: 700px) { .about-creds-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>About Your Google Cloud Project</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>You are using your own Google Cloud project. All quota and billing are managed by Google.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Project Number", val: gcpProjectNumber },
                { label: "Location", val: gcpLocation },
                { label: "OAuth Client ID", val: gcpClientIdMasked, mono: true, eye: true },
                { label: "Quota Type", val: "Standard", color: "#A78BFA" },
                { label: "API Version", val: gcpApiVersion },
                { label: "Ownership", val: "You", color: "#22C55E" },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: item.color || "rgba(255,255,255,0.8)", fontFamily: item.mono ? "monospace" : "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                    {item.eye ? (showSecret ? gcpClientId || gcpClientIdMasked : gcpClientIdMasked) : item.val}
                    {item.eye && (
                      <button onClick={() => setShowSecret(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.3)" }}>
                        {showSecret ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <Info size={14} color="#A78BFA" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Using your own project gives you higher quota limits and better reliability.</span>
              <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>Learn More <ExternalLink size={10} /></button>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Shield size={14} color="#22C55E" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Credentials</span>
            </div>
            {!userData.gcp_client_id ? (
              <EmptyState icon={<Shield size={18} color="#22C55E" />} title="No Credentials" desc="Add credentials in Settings." onCta={() => router.push("/dashboard/settings")} cta="Go to Settings" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Client ID", gcpClientIdMasked, "cid"], ["Client Secret", gcpClientSecret, "csec"]].map(([label, val, key]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{val}</span>
                      <button onClick={() => handleCopy(val, key)} style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === key ? "#22C55E" : "rgba(255,255,255,0.3)", padding: 0 }}>
                        {copiedKey === key ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Secret Status</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>Saved &amp; Encrypted</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Updated</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{gcpCredUpdated}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => router.push("/dashboard/settings")} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Update Credentials</button>
                  <button onClick={handleGcpDisconnect} disabled={gcpDisconnecting} style={{ flex: 1, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#F43F5E", borderRadius: 8, padding: "8px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {gcpDisconnecting ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <WifiOff size={11} />} Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="bottom-three-grid">
          <style>{`@media (max-width: 700px) { .bottom-three-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>How It Works</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Connect your Google Cloud project","We use your credentials to access YouTube Data API","All quota is charged to your Google Cloud","You get higher limits & better reliability"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <CheckCircle size={10} color="#A78BFA" />
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Quota Reset</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={28} color="#A78BFA" />
              </div>
            </div>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#FAFAFA" }}>
                {gcpResetAt ? new Date(gcpResetAt).toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : gcpResetTime}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>12:00 AM (IST)</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Time remaining</div>
              {gcpResetAt ? <CountdownTimer resetAt={gcpResetAt} /> : <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#A78BFA" }}>—</span>}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Need More Quota?</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.6 }}>If you need higher quota limits, you can request an increase from Google.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", color: "#A78BFA", borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Request Quota Increase <ExternalLink size={11} />
                </button>
              </a>
              <a href="https://developers.google.com/youtube/v3/getting-started#quota" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Learn how quota works <ExternalLink size={11} />
                </button>
              </a>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <Star size={18} color="#F59E0B" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>You're using your own Google Cloud project</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>You have full control over your quota and billing. ModerateAI will only access the YouTube Data API on your behalf.</div>
          </div>
          <button onClick={() => window.open("https://console.cloud.google.com", "_blank")} style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#A78BFA", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
            Learn More <ExternalLink size={12} />
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOT CONNECTED — V2 LAPTOP LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <style>{`
        .gcp-v2-laptop { display: grid; grid-template-columns: 260px 1fr 300px; gap: 20px; }
        .gcp-v2-mobile { display: none; }
        .step-pill-bar { display: flex; align-items: center; gap: 0; overflow-x: auto; padding-bottom: 2px; }
        .step-pill-bar::-webkit-scrollbar { height: 0; }
        @media (pointer: coarse), (max-width: 900px) {
          .gcp-v2-laptop { display: none !important; }
          .gcp-v2-mobile { display: flex !important; flex-direction: column; gap: 16px; }
        }
        .gcp-input:focus { outline: none; border-color: rgba(124,58,237,0.6) !important; background: rgba(124,58,237,0.06) !important; }
        @keyframes gcpFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .gcp-step-body { animation: gcpFadeIn 0.2s ease; }
      `}</style>

      {/* ── LAPTOP LAYOUT ── */}
      <div className="gcp-v2-laptop">

        {/* LEFT SIDEBAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Progress card — V2 upgraded */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Cloud size={18} color="#3B82F6" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Google Cloud</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Setup Guide</div>
              </div>
            </div>

            {/* "Your Setup Progress" label row */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Your Setup Progress</div>

            {/* Progress bar */}
            <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, marginBottom: 8 }}>
              <div style={{
                width: `${progressPct}%`,
                height: "100%",
                background: progressPct === 100
                  ? "#22C55E"
                  : "linear-gradient(90deg,#7C3AED,#A78BFA)",
                borderRadius: 3,
                transition: "width 0.4s ease"
              }} />
            </div>

            {/* % and X of 7 row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA" }}>{progressPct}% Completed</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{completedSteps.size} of {SETUP_STEPS.length} Completed</span>
            </div>
          </div>

          {/* Steps list */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            {SETUP_STEPS.map((s, i) => {
              const done = completedSteps.has(i);
              const active = i === currentStep;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 14px", background: active ? "rgba(124,58,237,0.15)" : "transparent",
                    border: "none", borderBottom: i < SETUP_STEPS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    borderLeft: active ? "3px solid #7C3AED" : "3px solid transparent",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "#22C55E" : active ? "#7C3AED" : "rgba(255,255,255,0.08)",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                  }}>
                    {done ? <CheckCircle size={13} /> : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#fff" : done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)" }}>{s.label}</div>
                    {done && <div style={{ fontSize: 10, color: "#22C55E", fontWeight: 600 }}>Completed</div>}
                    {active && !done && <div style={{ fontSize: 10, color: "#A78BFA" }}>In progress</div>}
                    {!active && !done && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Pending</div>}
                  </div>
                  {active && <ChevronRight size={14} color="#A78BFA" />}
                </button>
              );
            })}
          </div>

          {/* Need Help */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Need Help?</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Read our documentation or watch the step-by-step demo.</div>
            {[
              { icon: <FileText size={14} color="#3B82F6" />, label: "Documentation", href: "https://docs.moderateai.site" },
            ].map(item => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 12px", cursor: "pointer" }}>
                  {item.icon}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{item.label}</span>
                  <ExternalLink size={10} color="rgba(255,255,255,0.2)" style={{ marginLeft: "auto" }} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* CENTER — main step content */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Top pill step bar */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <div className="step-pill-bar">
              {SETUP_STEPS.map((s, i) => {
                const done = completedSteps.has(i);
                const active = i === currentStep;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => setCurrentStep(i)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 20,
                        background: active ? "#7C3AED" : done ? "rgba(34,197,94,0.12)" : "transparent",
                        border: active ? "none" : done ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.1)",
                        color: active ? "#fff" : done ? "#22C55E" : "rgba(255,255,255,0.4)",
                        fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      {done ? <CheckCircle size={11} /> : <span style={{ fontSize: 11 }}>{i + 1}</span>}
                      {s.label}
                    </button>
                    {i < SETUP_STEPS.length - 1 && (
                      <div style={{ width: 20, height: 1, background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step body */}
          <div className="gcp-step-body" key={currentStep} style={{ flex: 1, padding: 24, display: "flex", gap: 24 }}>

            {/* Left — instructions */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Step badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#A78BFA", fontWeight: 600, marginBottom: 14 }}>
                Step {currentStep + 1} of {SETUP_STEPS.length}
              </div>

              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>{currentStepDetail.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>{currentStepDetail.desc}</div>

              {/* "What you'll do" label — V2 NEW */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: 12 }}>What you'll do</div>

              {/* Bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {currentStepDetail.bullets.map((b, bi) => (
                  <div key={bi} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 1
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#A78BFA" }}>{bi + 1}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>

              {/* Tip */}
              {currentStepDetail.tip && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 20 }}>
                  <span style={{ fontSize: 14 }}>💡</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}><strong style={{ color: "#F59E0B" }}>Tip:</strong> {currentStepDetail.tip}</span>
                </div>
              )}

              {/* Callback URL (save_project step) */}
              {currentStepKey === "save_project" && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Your Callback URL <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>(Copy this)</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ flex: 1, fontSize: 12, fontFamily: "monospace", color: "#A78BFA", wordBreak: "break-all" }}>{CALLBACK_URL}</span>
                    <button onClick={() => handleCopy(CALLBACK_URL, "cburl")} style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === "cburl" ? "#22C55E" : "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                      {copiedKey === "cburl" ? <CheckCircle size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#22C55E" }}>
                    <CheckCircle size={12} /> Add this URL in Google Console under Authorized redirect URIs.
                  </div>
                </div>
              )}

              {/* Save Project Form */}
              {currentStepKey === "save_project" && (
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Save Your Project Details</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Project Name", placeholder: "e.g. ModerateAI User Project", value: formProjectName, onChange: setFormProjectName },
                      { label: "Project ID", placeholder: "e.g. moderateai-user-project-123456", value: formProjectId, onChange: setFormProjectId },
                      { label: "Client ID", placeholder: "e.g. 1234567890-abcd.apps.googleusercontent.com", value: formClientId, onChange: setFormClientId },
                      { label: "Client Secret", placeholder: "e.g. GOCSPX-abcde12345-xxxxxxxx", value: formClientSecret, onChange: setFormClientSecret },
                    ].map(field => (
                      <div key={field.label}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>{field.label}</div>
                        <input
                          className="gcp-input"
                          value={field.value}
                          onChange={e => field.onChange(e.target.value)}
                          placeholder={field.placeholder}
                          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 12, boxSizing: "border-box", transition: "all 0.15s" }}
                        />
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>Callback URL</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px" }}>
                        <span style={{ flex: 1, fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>{CALLBACK_URL}</span>
                        <button onClick={() => handleCopy(CALLBACK_URL, "cburl2")} style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === "cburl2" ? "#22C55E" : "rgba(255,255,255,0.3)", padding: 0 }}>
                          {copiedKey === "cburl2" ? <CheckCircle size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action button */}
              {currentStepKey === "save_project" ? (
                <button
                  onClick={handleSaveProject}
                  disabled={saving}
                  style={{ width: "100%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
                >
                  {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
                  {saving ? "Saving…" : "Save & Connect Project"}
                </button>
              ) : (
                <button
                  onClick={() => handleStepAction(currentStepKey)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
                >
                  {currentStepDetail.action} <ExternalLink size={13} />
                </button>
              )}

              {/* Doc + video links row */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
                <a href="https://docs.moderateai.site" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  <FileText size={13} color="#3B82F6" /> Documentation
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  <Play size={13} color="#EF4444" /> Watch Video
                </a>
              </div>
            </div>

            {/* Right — preview screenshot */}
            <div style={{ width: 300, flexShrink: 0 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Preview</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 7px" }}>{currentStepDetail.duration}</span>
                </div>
                <div style={{ padding: 12 }}>
                  {DemoScreenshot ? <DemoScreenshot /> : <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No preview</div>}
                </div>
                {/* Info note below preview — V2 NEW */}
                <div style={{ padding: "0 12px 12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 7, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "8px 10px" }}>
                    <Info size={12} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                      After completing this step, you will proceed to the next step automatically.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom navigation — V2 upgraded */}
          <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.01)" }}>
            <button
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: currentStep === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600,
                cursor: currentStep === 0 ? "default" : "pointer",
                opacity: currentStep === 0 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={15} /> Previous
            </button>

            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              Step {currentStep + 1} of {SETUP_STEPS.length}
            </span>

            <button
              onClick={() => {
                setCompletedSteps(prev => new Set([...prev, currentStep]));
                setCurrentStep(s => Math.min(SETUP_STEPS.length - 1, s + 1));
              }}
              disabled={currentStep === SETUP_STEPS.length - 1}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: currentStep === SETUP_STEPS.length - 1
                  ? "rgba(255,255,255,0.04)"
                  : "linear-gradient(135deg,#7C3AED,#4F46E5)",
                border: "none",
                color: currentStep === SETUP_STEPS.length - 1 ? "rgba(255,255,255,0.2)" : "#fff",
                borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 700,
                cursor: currentStep === SETUP_STEPS.length - 1 ? "default" : "pointer",
                boxShadow: currentStep === SETUP_STEPS.length - 1 ? "none" : "0 4px 14px rgba(124,58,237,0.4)",
                opacity: currentStep === SETUP_STEPS.length - 1 ? 0.4 : 1,
              }}
            >
              Next Step <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Step Video Guide — V2 */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Step Video Guide</div>
            </div>
            {/* Video thumbnail */}
            <div
              style={{ position: "relative", background: "linear-gradient(135deg,#1a0533,#0d1b3e)", paddingTop: "56%", cursor: "pointer" }}
              onClick={() => window.open("https://youtube.com", "_blank")}
            >
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 20px rgba(124,58,237,0.3)"
                }}>
                  <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                </div>
                {/* Duration badge — V2 NEW */}
                <div style={{
                  background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600,
                  color: "rgba(255,255,255,0.8)", fontFamily: "monospace"
                }}>
                  {currentStepDetail.duration}
                </div>
              </div>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>How to Create Google Cloud Project</div>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#A78BFA", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                Watch on YouTube <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Quick Links</div>
            {[
              { icon: <Cloud size={13} color="#4285F4" />, label: "Google Cloud Console", href: "https://console.cloud.google.com" },
              { icon: <FileText size={13} color="#A78BFA" />, label: "Google Cloud Docs", href: "https://cloud.google.com/docs" },
              { icon: <YoutubeIcon size={13} color="#EF4444" />, label: "YouTube Data API Docs", href: "https://developers.google.com/youtube/v3" },
            ].map(item => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                  {item.icon}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", flex: 1 }}>{item.label}</span>
                  <ExternalLink size={10} color="rgba(255,255,255,0.2)" />
                </div>
              </a>
            ))}
          </div>

          {/* All Steps sidebar — V2 NEW (matches reference image) */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>All Steps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {SETUP_STEPS.map((s, i) => {
                const done = completedSteps.has(i);
                const active = i === currentStep;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: active ? "rgba(124,58,237,0.12)" : "transparent",
                      border: "none",
                      borderRadius: 8, padding: "8px 6px",
                      cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                    }}
                  >
                    {/* Step number circle */}
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? "#22C55E" : active ? "#7C3AED" : "rgba(255,255,255,0.08)",
                      fontSize: 10, fontWeight: 700, color: "#fff",
                    }}>
                      {done ? <CheckCircle size={11} /> : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: active ? 700 : 500,
                        color: active ? "#fff" : done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.5)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {s.label}
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 600,
                        color: done ? "#22C55E" : active ? "#A78BFA" : "rgba(255,255,255,0.25)",
                        marginTop: 1
                      }}>
                        {done ? "Completed" : active ? "In Progress" : "Pending"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Need Help */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13 }}>?</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Need Help?</div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Our support team is here to help you.</div>
          </div>
        </div>
      </div>

      {/* ── MOBILE LAYOUT (untouched) ── */}
      <div className="gcp-v2-mobile">
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={18} color="#A78BFA" fill="#A78BFA" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Connect Google Cloud – Step by Step</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Watch this 4-min demo to connect your own Google Cloud project and increase your quota.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => window.open("https://youtube.com", "_blank")} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Play size={13} fill="#fff" /> Watch Video
            </button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px" }}>4:32</span>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ position: "relative", background: "linear-gradient(135deg,#1a0533,#0d1b3e)", paddingTop: "52%", cursor: "pointer" }} onClick={() => window.open("https://youtube.com", "_blank")}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase" }}>ModerateAI Setup Guide</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>Connect Google Cloud Project</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Step by Step</div>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
              </div>
            </div>
          </div>
          <div style={{ padding: "8px 14px" }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}><div style={{ width: "0%", height: "100%", background: "#7C3AED", borderRadius: 2 }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, color: "rgba(255,255,255,0.3)", fontSize: 10 }}><span>0:00</span><span>4:32</span></div>
          </div>
        </div>

        {SETUP_STEPS.map((s, i) => {
          const done = completedSteps.has(i);
          const detail = STEP_DETAILS[s.key];
          const DemoComp = DemoScreenshots[s.key];
          return (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 16px 14px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: done ? "#22C55E" : "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(124,58,237,0.35)" }}>
                  {done ? <CheckCircle size={16} color="#fff" /> : <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{i + 1}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{detail.title}</div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 8px" }}>{detail.duration}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, lineHeight: 1.5 }}>{detail.desc}</div>
                </div>
              </div>
              <div style={{ margin: "0 16px 14px", borderRadius: 10, overflow: "hidden", background: "#0d0d1a" }}>
                {DemoComp ? <DemoComp /> : <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Preview</div>}
              </div>
              {s.key === "save_project" && (
                <div style={{ margin: "0 16px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Save Your Project Details</div>
                  {[
                    { label: "Project Name", placeholder: "e.g. ModerateAI User Project", value: formProjectName, onChange: setFormProjectName },
                    { label: "Project ID", placeholder: "e.g. moderateai-user-project-123456", value: formProjectId, onChange: setFormProjectId },
                    { label: "Client ID", placeholder: "e.g. 1234567890-abcd.apps.googleusercontent.com", value: formClientId, onChange: setFormClientId },
                    { label: "Client Secret", placeholder: "e.g. GOCSPX-abcde12345-xxxxxxxx", value: formClientSecret, onChange: setFormClientSecret },
                  ].map(field => (
                    <div key={field.label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{field.label}</div>
                      <input className="gcp-input" value={field.value} onChange={e => field.onChange(e.target.value)} placeholder={field.placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 12, boxSizing: "border-box" }} />
                    </div>
                  ))}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Callback URL</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 10px" }}>
                      <span style={{ flex: 1, fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", wordBreak: "break-all" }}>{CALLBACK_URL}</span>
                      <button onClick={() => handleCopy(CALLBACK_URL, "mcburl")} style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey === "mcburl" ? "#22C55E" : "rgba(255,255,255,0.3)", padding: 0, flexShrink: 0 }}>
                        {copiedKey === "mcburl" ? <CheckCircle size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <button onClick={handleSaveProject} disabled={saving} style={{ width: "100%", background: "linear-gradient(135deg,#7C3AED,#4F46E5)", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 13, cursor: saving ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
                    {saving ? "Saving…" : "Save & Connect Project"}
                  </button>
                </div>
              )}
              {s.key !== "save_project" && (
                <div style={{ padding: "0 16px 16px" }}>
                  <button onClick={() => handleStepAction(s.key)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: done ? "rgba(34,197,94,0.1)" : "rgba(124,58,237,0.15)", border: `1px solid ${done ? "rgba(34,197,94,0.3)" : "rgba(124,58,237,0.3)"}`, color: done ? "#22C55E" : "#A78BFA", borderRadius: 10, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {done ? <CheckCircle size={14} /> : <ExternalLink size={14} />}
                    {done ? "Completed" : detail.action}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>?</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Need Help?</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Check our documentation or watch the demo video.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href="https://docs.moderateai.site" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <button style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#A78BFA", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <FileText size={13} /> Documentation
              </button>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <button style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <YoutubeIcon size={13} />
              </button>
            </a>
          </div>
        </div>
      </div>
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
        .cloud-box-hide { display: flex; }
        @media (max-width: 768px) { .cloud-box-hide { display: none !important; } }
        @media (max-width: 600px) {
          .shared-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .health-row { grid-template-columns: repeat(3,1fr) !important; }
          .action-btns { flex-wrap: wrap; }
          .action-btns > * { flex: 1 1 calc(50% - 5px) !important; }
          .usage-cards-grid { grid-template-columns: 1fr 1fr !important; }
          .activity-grid { grid-template-columns: 1fr !important; }
        }
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
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#22C55E", fontSize: 13, fontWeight: 600, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "6px 14px" }}>
                  <CheckCircle size={14} /> All Systems Normal
                </span>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "center" }}>Last checked: 2m ago</div>
              </div>
              <button onClick={() => showToast("Status refreshed.", "success")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <Activity size={13} />
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4, border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setActiveTab("shared")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: activeTab === "shared" ? "rgba(255,255,255,0.06)" : "transparent", color: activeTab === "shared" ? "#fff" : "rgba(255,255,255,0.5)" }}>
              <Share2 size={15} /> ModerateAI Shared API
              <span style={{ background: activeTab === "shared" ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.15)", color: "#A78BFA", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>Recommended</span>
            </button>
            <button onClick={() => setActiveTab("gcp")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", transition: "all 0.2s", background: activeTab === "gcp" ? "linear-gradient(135deg,#7C3AED,#4F46E5)" : "transparent", color: activeTab === "gcp" ? "#fff" : "rgba(255,255,255,0.5)", boxShadow: activeTab === "gcp" ? "0 4px 16px rgba(124,58,237,0.35)" : "none" }}>
              <Cloud size={15} /> My Google Cloud Project
            </button>
          </div>

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