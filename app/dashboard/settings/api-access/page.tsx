"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  Shield, Copy, Eye, EyeOff,
  ExternalLink, Check, Lock, Wifi, WifiOff, RotateCcw,
  Trash2, RefreshCw, AlertTriangle, Activity, Clock, Zap, BarChart2, X,
  Cloud, Server, Loader2, Key,
  TrendingUp, MessageSquare, Video, ArrowUpRight, CheckCircle2,
  AlertCircle, Cpu, Radio, Tv2 as Youtube,
  Play, Pause, Volume2, VolumeX, Maximize, SkipForward,
  Plus, ChevronDown, Search, Settings, HelpCircle, Bell,
  Globe, Layers,
} from "lucide-react";

// ─── Origin helpers (lazy, never runs at module scope) ────────────────────────

function getAppOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://moderateai.site";
}
function getRedirectUri(): string { return `${getAppOrigin()}/api/auth/youtube/callback`; }
function getJsOrigin(): string { return getAppOrigin(); }

// ─── YouTube OAuth redirect ───────────────────────────────────────────────────

function redirectToYouTubeAuth() {
  const uid = getAuth().currentUser?.uid;
  if (!uid) { console.error("[api-access] No authenticated user."); return; }
  window.location.href = `/api/auth/youtube?uid=${encodeURIComponent(uid)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type APIMethod   = "managed" | "custom";
type LogStatus   = "success" | "warning" | "error" | "info";
type WizardStep  = "tutorial" | "gcp" | "enable" | "oauth" | "credentials" | "connect";
type HealthState = "healthy" | "warning" | "offline" | "loading";
type GraphRange  = "daily" | "weekly" | "monthly";

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  status: LogStatus;
}

interface UsagePoint { label: string; value: number; }

interface ManagedUsage {
  plan: "free_trial" | "pro" | "agency";
  planLabel: string;
  actionsUsed: number;
  actionsTotal: number;
  actionsRemaining: number;
  resetDate: string;
  apiStatus: "operational" | "degraded" | "down";
  todayRequests: number;
  commentsModerated: number;
  repliesGenerated: number;
  videosMonitored: number;
  lastSync: string | null;
  successRate: number;
  latencyMs: number;
  connectedChannels: number;
  billingStatus: "active" | "overdue" | "trial";
  channelName?: string;
  channelAvatar?: string;
  usageGraph?: { daily: UsagePoint[]; weekly: UsagePoint[]; monthly: UsagePoint[] };
}

interface CustomProjectInfo {
  projectName: string;
  connectedAccount: string;
  oauthStatus: "connected" | "disconnected" | "expired";
  connectionStatus: "active" | "inactive" | "error";
  apiStatus: "enabled" | "disabled" | "unknown";
  dailyQuota: number;
  remainingQuota: number;
  lastVerified: string | null;
  lastSync: string | null;
}

interface APIStatus {
  method: APIMethod;
  youtubeConnected: boolean;
  managed?: ManagedUsage;
  custom?: CustomProjectInfo;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = {
  free_trial: 250,
  pro: 1900,
  agency: 15000,
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAPIStatus(): Promise<APIStatus> {
  try {
    const auth = getAuth();
    const uid  = auth.currentUser?.uid;
    if (uid) {
      const db   = getFirestore();
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data() ?? {};
        const connected = (data.youtube_connected as boolean) || false;
        const plan      = (data.plan as string) || "free_trial";
        const planLabel = plan === "pro" ? "Pro" : plan === "agency" ? "Agency" : "Free Trial";
        if (connected) {
          return {
            method:           (data.api_method as APIMethod) || "managed",
            youtubeConnected: true,
            managed: {
              plan:              plan as ManagedUsage["plan"],
              planLabel,
              actionsUsed:       Number(data.actions_used       ?? 0),
              actionsTotal:      PLAN_LIMITS[plan]              ?? 250,
              actionsRemaining:  Number(data.actions_remaining  ?? PLAN_LIMITS[plan] ?? 250),
              resetDate:         (data.reset_date as string)    || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
              apiStatus:         (data.api_status as ManagedUsage["apiStatus"]) || "operational",
              todayRequests:     Number(data.today_requests     ?? 0),
              commentsModerated: Number(data.comments_moderated ?? 0),
              repliesGenerated:  Number(data.replies_generated  ?? 0),
              videosMonitored:   Number(data.videos_monitored   ?? 0),
              lastSync:          (data.last_sync as string)     || null,
              successRate:       Number(data.success_rate       ?? 100),
              latencyMs:         Number(data.latency_ms         ?? 0),
              connectedChannels: Number(data.connected_channels ?? 1),
              billingStatus:     (data.billing_status as ManagedUsage["billingStatus"]) || "trial",
              channelName:       (data.channel_name as string)  || undefined,
              channelAvatar:     (data.channel_avatar as string)|| undefined,
              usageGraph:        (data.usage_graph as ManagedUsage["usageGraph"]) || undefined,
            },
          };
        }
        return { method: "managed", youtubeConnected: false };
      }
    }
  } catch (e) {
    console.warn("[api-access] Firestore read failed, falling back to REST", e);
  }
  try {
    const res = await fetch("/api/settings/api-access", { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  } catch {
    return { method: "managed", youtubeConnected: false };
  }
}

async function saveOAuthCredentials(clientId: string, clientSecret: string): Promise<void> {
  const res = await fetch("/api/settings/api-access/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? "Failed to save credentials");
  }
}

async function rotateCredentials(): Promise<void> {
  const res = await fetch("/api/settings/api-access/rotate", { method: "POST" });
  if (!res.ok) throw new Error("Rotation failed");
}

async function deleteCredentials(): Promise<void> {
  const res = await fetch("/api/settings/api-access/credentials", { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
}

async function disconnectChannel(): Promise<void> {
  const res = await fetch("/api/settings/api-access/disconnect", { method: "POST" });
  if (!res.ok) throw new Error("Disconnect failed");
}

async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res  = await fetch("/api/settings/api-access/test", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    return { ok: res.ok, message: (body as { message?: string }).message ?? (res.ok ? "Connection successful." : "Connection failed.") };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}

async function fetchActivityLogs(): Promise<ActivityLog[]> {
  try {
    const res = await fetch("/api/settings/api-access/logs", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function fetchUsageGraph(range: GraphRange): Promise<UsagePoint[]> {
  try {
    const res = await fetch(`/api/settings/api-access/usage?range=${range}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", opts ?? {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return "—"; }
}

function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s    = Math.floor(diff / 1000);
    if (s < 60)   return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  } catch { return "—"; }
}

function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Safe number helpers ──────────────────────────────────────────────────────

function safeNum(v: number | undefined | null, fallback = 0): number {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <div className="space-y-1.5 flex-1"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-2.5 w-52" /></div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 space-y-2"><Skeleton className="h-2 w-20" /><Skeleton className="h-4 w-16" /></div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-white/5 space-y-2">
        <div className="flex justify-between"><Skeleton className="h-2 w-24" /><Skeleton className="h-2 w-16" /></div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

function SkeletonLogs() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8"><Skeleton className="h-3.5 w-20" /></div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-2 w-16" />
        </div>
      ))}
    </div>
  );
}

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
      <AlertTriangle size={14} className="shrink-0" />
      <span className="flex-1 leading-snug">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold text-red-300 hover:text-red-200 underline underline-offset-2 transition-colors shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={18} className="text-white/20" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/40">{title}</p>
        <p className="text-xs text-white/25 mt-0.5 max-w-[240px] mx-auto leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Health Indicator ─────────────────────────────────────────────────────────

function HealthIndicator({ health }: { health: HealthState }) {
  const map: Record<HealthState, { label: string; dot: string; ring: string; text: string }> = {
    healthy: { label: "Healthy",   dot: "bg-emerald-400", ring: "border-emerald-500/25 bg-emerald-500/10", text: "text-emerald-400" },
    warning: { label: "Degraded",  dot: "bg-yellow-400",  ring: "border-yellow-500/25 bg-yellow-500/10",   text: "text-yellow-400" },
    offline: { label: "Offline",   dot: "bg-red-400",     ring: "border-red-500/25 bg-red-500/10",         text: "text-red-400"    },
    loading: { label: "Checking…", dot: "bg-white/20",    ring: "border-white/10 bg-white/5",              text: "text-white/30"   },
  };
  const m = map[health];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${m.ring} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot} ${health === "healthy" ? "animate-pulse" : ""}`} />
      {m.label}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 shrink-0
        ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25" : "bg-purple-600/20 text-purple-300 hover:bg-purple-600/35 border border-purple-500/25"}`}>
      {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> {label ?? "Copy"}</>}
    </button>
  );
}

function QuotaBar({ used, total, label, resetLabel }: { used: number; total: number; label?: string; resetLabel?: string }) {
  const safeUsed  = safeNum(used);
  const safeTotal = safeNum(total, 1);
  const pct = safeTotal > 0 ? Math.min(100, Math.round((safeUsed / safeTotal) * 100)) : 0;
  const barColor = pct >= 90 ? "from-red-600 to-red-400" : pct >= 70 ? "from-yellow-600 to-yellow-400" : "from-purple-600 to-purple-400";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] text-white/30">
        <span>{label ?? `${pct}% of limit used`}</span>
        <span className="font-mono">{safeUsed.toLocaleString()} / {safeTotal.toLocaleString()}{resetLabel ? ` · ${resetLabel}` : ""}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      {pct >= 90 && (
        <p className="text-[10px] text-red-400/80 flex items-center gap-1">
          <AlertTriangle size={9} /> Approaching limit — consider upgrading your plan.
        </p>
      )}
    </div>
  );
}

function StatCell({ label, value, icon, valueClass = "text-white" }: {
  label: string; value: string; icon: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="px-4 py-3.5 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium uppercase tracking-wide">{icon}{label}</div>
      <p className={`text-sm font-semibold truncate ${valueClass}`}>{value ?? "—"}</p>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<WizardStep, string> = {
  tutorial: "Watch Video", gcp: "Google Console", enable: "Enable API",
  oauth: "OAuth Client", credentials: "Add Credentials", connect: "Connect YouTube",
};
const WIZARD_FLOW: WizardStep[] = ["tutorial", "gcp", "enable", "oauth", "credentials", "connect"];

function StepIndicator({ current, videoWatched, onStepClick }: {
  current: number;
  videoWatched: boolean;
  onStepClick?: (index: number) => void;
}) {
  const labels = WIZARD_FLOW.map((s) => STEP_LABELS[s]);
  return (
    <div className="flex flex-col gap-1">
      {labels.map((label, i) => {
        const num    = i + 1;
        const done   = num < current;
        const active = num === current;
        const locked = i > 0 && !videoWatched;
        return (
          <button
            key={label}
            onClick={() => !locked && onStepClick?.(i)}
            disabled={locked}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 w-full
              ${active ? "bg-purple-600/15 border border-purple-500/25" : done ? "hover:bg-white/[0.03]" : locked ? "opacity-40 cursor-not-allowed" : "hover:bg-white/[0.03] cursor-pointer"}
            `}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 transition-all duration-300
              ${done   ? "bg-purple-600 border-purple-600 text-white" : ""}
              ${active ? "bg-purple-600 border-purple-500 text-white ring-4 ring-purple-500/15" : ""}
              ${locked && !done && !active ? "bg-transparent border-white/8 text-white/15" : ""}
              ${!locked && !done && !active ? "bg-transparent border-white/15 text-white/25" : ""}`}>
              {done ? <Check size={10} /> : locked ? <Lock size={9} /> : num}
            </div>
            <span className={`text-xs font-medium transition-colors duration-200 truncate
              ${active ? "text-purple-300" : done ? "text-white/60" : "text-white/25"}`}>
              {label}
            </span>
            {done && <Check size={12} className="text-purple-400 ml-auto shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function NavButtons({ onPrev, onNext, nextLabel = "Next →", nextDisabled = false, loading = false }: {
  onPrev?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div className="flex gap-2.5 pt-2">
      {onPrev && (
        <button onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200">
          ← Previous
        </button>
      )}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${!nextDisabled && !loading ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]" : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"}`}>
          {loading ? <><Spinner className="w-3.5 h-3.5" /> Processing…</> : nextLabel}
        </button>
      )}
    </div>
  );
}

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({ onWatched }: { onWatched: () => void }) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume,   setVolume]   = useState(1);
  const [watched,  setWatched]  = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [showCtrl, setShowCtrl] = useState(true);
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);
  const [ended,    setEnded]    = useState(false);

  useEffect(() => {
    fetch("/videos/google-cloud-setup.mp4", { method: "HEAD" })
      .then((r) => setHasVideo(r.ok))
      .catch(() => setHasVideo(false));
  }, []);

  const showControls = useCallback(() => {
    setShowCtrl(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
  }, [playing]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); setShowCtrl(true); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
    showControls();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(v.currentTime);
    try { if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1)); } catch {}
    const dur = v.duration;
    if (!watched && isFinite(dur) && dur > 0 && v.currentTime / dur > 0.9) {
      setWatched(true);
      onWatched();
    }
  };

  const handleEnded = () => {
    setPlaying(false); setEnded(true); setShowCtrl(true);
    if (!watched) { setWatched(true); onWatched(); }
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current?.duration ?? 0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
    showControls();
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !muted;
    setMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const fullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else containerRef.current.requestFullscreen?.().catch(() => {});
  };

  const skip10 = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    showControls();
  };

  const pct    = duration > 0 ? (progress / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  if (hasVideo === false) {
    return (
      <div className="relative w-full aspect-video bg-[#181829] rounded-xl border border-white/8 flex flex-col items-center justify-center gap-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-purple-600/90 flex items-center justify-center shadow-2xl shadow-purple-900/60 cursor-default">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white mb-1">Complete Setup in <span className="text-purple-400">58 Seconds</span></p>
            <p className="text-xs text-white/40">Quick walkthrough to connect Google Cloud with ModerateAI</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            1:00 / 1:00
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400" style={{ width: "100%" }} />
        </div>
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => { setWatched(true); onWatched(); }}
            className="absolute top-3 right-3 z-20 px-3 py-1 rounded-lg bg-purple-600/20 border border-purple-500/25 text-purple-300 text-[10px] font-semibold hover:bg-purple-600/30 transition-all">
            Dev: Skip
          </button>
        )}
      </div>
    );
  }

  if (hasVideo === null) {
    return (
      <div className="relative w-full aspect-video bg-[#0a0a0f] rounded-xl border border-white/8 flex items-center justify-center">
        <Spinner className="w-6 h-6 text-white/20" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/8 group cursor-pointer select-none"
      onMouseMove={showControls}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src="/videos/google-cloud-setup.mp4"
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      {!playing && !ended && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-200">
          <div className="w-16 h-16 rounded-full bg-purple-600/90 flex items-center justify-center shadow-2xl shadow-purple-900/60 hover:bg-purple-500/90 transition-all duration-200 hover:scale-105">
            <Play size={22} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}
      {ended && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <RotateCcw size={18} className="text-white" />
            </div>
            <p className="text-white/60 text-sm font-medium">Replay</p>
          </div>
        </div>
      )}
      {watched && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-semibold">
          <Check size={10} /> Video Completed!
        </div>
      )}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300 ${showCtrl ? "opacity-100" : "opacity-0"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/bar" onClick={seek}>
          <div className="absolute inset-y-0 left-0 bg-white/20 rounded-full" style={{ width: `${bufPct}%` }} />
          <div className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all duration-100" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150" style={{ left: `calc(${pct}% - 6px)` }} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white/80 hover:text-white transition-colors">
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>
          <button onClick={skip10} className="text-white/50 hover:text-white/80 transition-colors">
            <SkipForward size={14} />
          </button>
          <div className="flex items-center gap-1.5 group/vol">
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={changeVolume}
              className="w-0 group-hover/vol:w-16 overflow-hidden transition-all duration-200 accent-purple-500 cursor-pointer" />
          </div>
          <span className="text-[10px] text-white/40 font-mono ml-auto">{fmtSeconds(progress)} / {fmtSeconds(duration)}</span>
          <button onClick={fullscreen} className="text-white/60 hover:text-white transition-colors"><Maximize size={13} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Usage Graph ──────────────────────────────────────────────────────────────

function UsageGraph({ managed }: { managed: ManagedUsage }) {
  const [range,   setRange]   = useState<GraphRange>("daily");
  const [points,  setPoints]  = useState<UsagePoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsageGraph(range);
      if (Array.isArray(data) && data.length > 0) { setPoints(data); return; }
      const embedded = managed?.usageGraph?.[range];
      if (Array.isArray(embedded) && embedded.length > 0) { setPoints(embedded); return; }
      setPoints([]);
    } catch {
      const embedded = managed?.usageGraph?.[range];
      setPoints(Array.isArray(embedded) ? embedded : []);
    } finally {
      setLoading(false);
    }
  }, [range, managed]);

  useEffect(() => { load(); }, [load]);

  const safePoints = Array.isArray(points) ? points : [];
  const vals   = safePoints.map((p) => safeNum(p?.value));
  const max    = vals.length > 0 ? Math.max(...vals, 1) : 1;
  const total  = vals.reduce((s, v) => s + v, 0);
  const avgVal = safePoints.length > 0 ? Math.round(total / safePoints.length) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-purple-400" />
          <p className="text-sm font-semibold text-white/70">Usage</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/8">
          {(["daily", "weekly", "monthly"] as GraphRange[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all duration-200
                ${range === r ? "bg-purple-600 text-white shadow-sm shadow-purple-900/40" : "text-white/30 hover:text-white/60"}`}>
              {r === "daily" ? "24h" : r === "weekly" ? "7d" : "30d"}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="px-5 py-10 flex items-center justify-center"><Spinner className="w-5 h-5 text-white/20" /></div>
      ) : safePoints.length === 0 ? (
        <EmptyState icon={BarChart2} title="No usage data yet" description="Data appears here once moderation activity is recorded." />
      ) : (
        <div className="px-5 pt-5 pb-4">
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[{ label: "Total", value: total.toLocaleString() }, { label: "Average", value: avgVal.toLocaleString() }, { label: "Peak", value: max.toLocaleString() }].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/6 px-3 py-2.5">
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-base font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 h-24">
            {safePoints.map((p, i) => {
              const val = safeNum(p?.value);
              const h   = max > 0 ? Math.max(4, (val / max) * 96) : 4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity duration-150">
                    <div className="bg-[#1a1825] border border-white/15 rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
                      <p className="text-[10px] font-semibold text-white">{val.toLocaleString()}</p>
                      <p className="text-[9px] text-white/35 mt-0.5">{p?.label ?? ""}</p>
                    </div>
                  </div>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-purple-700 to-purple-500 group-hover/bar:from-purple-600 group-hover/bar:to-purple-400 transition-all duration-200" style={{ height: `${h}%` }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center mt-2">
            {safePoints.map((p, i) => {
              const show = i === 0 || i === Math.floor(safePoints.length / 2) || i === safePoints.length - 1;
              return (
                <div key={i} className="flex-1 text-center">
                  {show && <span className="text-[9px] text-white/20 font-mono">{p?.label ?? ""}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GCP Console Mock UI Components ──────────────────────────────────────────

function GCPTopBar({ projectName = "my-moderateai-project" }: { projectName?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#202124] border-b border-white/10">
      <div className="flex items-center gap-1.5 mr-1">
        <div className="flex gap-0.5">
          <div className="w-2 h-2 rounded-full bg-[#4285F4]" />
          <div className="w-2 h-2 rounded-full bg-[#EA4335]" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-2 h-2 rounded-full bg-[#FBBC05]" />
          <div className="w-2 h-2 rounded-full bg-[#34A853]" />
        </div>
      </div>
      <span className="text-[10px] font-semibold text-white/70 mr-1">Google Cloud</span>
      <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10 flex-1 max-w-[180px]">
        <span className="text-[9px] text-white/50 truncate">{projectName}</span>
        <ChevronDown size={9} className="text-white/30 shrink-0" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Search size={11} className="text-white/30" />
        <Bell size={11} className="text-white/30" />
        <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">Y</span>
        </div>
      </div>
    </div>
  );
}

function GCPNavItem({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors duration-150
      ${active ? "bg-[#4285F4]/20 text-[#8ab4f8]" : "text-white/40 hover:bg-white/5 hover:text-white/60"}`}>
      <Icon size={11} />
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

function GCPConsoleShell({ children, activeNav }: { children: React.ReactNode; activeNav?: string }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-[#1a1b1e] shadow-2xl">
      <GCPTopBar />
      <div className="flex" style={{ minHeight: 220 }}>
        <div className="w-36 bg-[#202124] border-r border-white/8 py-2 shrink-0">
          <GCPNavItem icon={Layers} label="Dashboard" />
          <div className="px-3 py-1 mt-1">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">APIs & Services</p>
          </div>
          <GCPNavItem icon={Globe} label="Library" active={activeNav === "library"} />
          <GCPNavItem icon={Key} label="Credentials" active={activeNav === "credentials"} />
          <GCPNavItem icon={Shield} label="OAuth consent" active={activeNav === "consent"} />
          <div className="px-3 py-1 mt-1">
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">IAM & Admin</p>
          </div>
          <GCPNavItem icon={Settings} label="Settings" />
        </div>
        <div className="flex-1 p-4 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

function GCPNewProjectUI() {
  return (
    <GCPConsoleShell>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-full bg-[#4285F4]" />
            <div className="w-3 h-3 rounded-full bg-[#EA4335]" />
            <div className="w-3 h-3 rounded-full bg-[#FBBC05]" />
            <div className="w-3 h-3 rounded-full bg-[#34A853]" />
          </div>
          <span className="text-xs font-semibold text-white/80">New Project</span>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-white/40 block mb-1">Project name *</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2e31] border border-[#4285F4]/60 rounded text-xs text-white/80">
              <span className="flex-1">my-moderateai-project</span>
              <div className="w-1 h-3 bg-[#4285F4] animate-pulse" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/40 block mb-1">Project ID</label>
            <div className="px-3 py-2 bg-[#2d2e31] border border-white/10 rounded text-[10px] text-white/40 font-mono">
              my-moderateai-project-491023
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/40 block mb-1">Organization</label>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2e31] border border-white/10 rounded text-[10px] text-white/50">
              No organization
              <ChevronDown size={9} className="ml-auto text-white/30" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button className="px-4 py-1.5 bg-[#4285F4] text-white text-[10px] font-semibold rounded">CREATE</button>
          <button className="px-4 py-1.5 text-[#8ab4f8] text-[10px] font-semibold rounded">CANCEL</button>
        </div>
      </div>
    </GCPConsoleShell>
  );
}

function GCPAPILibraryUI() {
  return (
    <GCPConsoleShell activeNav="library">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-white/70">API Library</p>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2e31] border border-white/10 rounded">
          <Search size={11} className="text-white/30" />
          <span className="text-[10px] text-white/40">Search APIs & Services</span>
        </div>
        <div className="rounded border border-[#4285F4]/40 bg-[#4285F4]/5 p-3 flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-[#FF0000] flex items-center justify-center shrink-0">
            <Youtube size={14} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-white/80">YouTube Data API v3</p>
            <p className="text-[9px] text-white/40 mt-0.5">Google · youtube.googleapis.com</p>
            <p className="text-[9px] text-white/30 mt-1 leading-relaxed">Access YouTube data including videos, playlists, and channels.</p>
            <div className="flex items-center gap-2 mt-2">
              <button className="px-3 py-1 bg-[#4285F4] text-white text-[9px] font-bold rounded uppercase tracking-wide">ENABLE</button>
              <span className="text-[9px] text-[#34A853] font-medium flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34A853]" /> Currently disabled
              </span>
            </div>
          </div>
        </div>
        {["YouTube Analytics API", "YouTube Reporting API"].map((api) => (
          <div key={api} className="rounded border border-white/6 bg-[#2d2e31]/50 p-2.5 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center shrink-0">
              <Youtube size={10} className="text-white/30" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/35">{api}</p>
              <p className="text-[9px] text-white/20">Google</p>
            </div>
          </div>
        ))}
      </div>
    </GCPConsoleShell>
  );
}

function GCPOAuthUI() {
  // Use a static date string to avoid hydration mismatch
  const dateStr = "1/1/2025";
  return (
    <GCPConsoleShell activeNav="credentials">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/70">Credentials</p>
          <button className="flex items-center gap-1 px-2.5 py-1 bg-[#4285F4] text-white text-[9px] font-bold rounded uppercase tracking-wide">
            <Plus size={9} /> Create credentials
          </button>
        </div>
        <div className="rounded border border-white/10 overflow-hidden">
          <div className="px-3 py-2 bg-[#2d2e31] border-b border-white/8">
            <p className="text-[10px] font-semibold text-white/50">OAuth 2.0 Client IDs</p>
          </div>
          <div className="divide-y divide-white/5">
            <div className="grid grid-cols-3 px-3 py-1.5 gap-2">
              <span className="text-[9px] text-white/25 uppercase tracking-wide font-semibold">Name</span>
              <span className="text-[9px] text-white/25 uppercase tracking-wide font-semibold">Type</span>
              <span className="text-[9px] text-white/25 uppercase tracking-wide font-semibold">Created</span>
            </div>
            <div className="grid grid-cols-3 px-3 py-2 gap-2 bg-[#4285F4]/8 border-l-2 border-[#4285F4]">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                <span className="text-[10px] text-[#8ab4f8] font-medium truncate">Web client 1</span>
              </div>
              <span className="text-[10px] text-white/50">Web application</span>
              <span className="text-[10px] text-white/40 font-mono">{dateStr}</span>
            </div>
          </div>
        </div>
        <div className="rounded border border-white/8 bg-[#2d2e31]/60 p-2.5 space-y-1.5">
          <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wide">Authorized JavaScript origins</p>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#202124] rounded border border-white/8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
            <span className="text-[9px] text-white/50 font-mono truncate">https://moderateai.site</span>
          </div>
        </div>
      </div>
    </GCPConsoleShell>
  );
}

function GCPCredentialsDetailUI() {
  const [showSecret, setShowSecret] = useState(false);
  return (
    <GCPConsoleShell activeNav="credentials">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-white/70">OAuth Client · Web client 1</p>
        <div className="space-y-2">
          <div className="rounded border border-white/8 bg-[#2d2e31]/60 p-2.5 space-y-1">
            <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wide">Client ID</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/60 font-mono flex-1 truncate">
                491023874561-abcdefghijklmnopqrstuv.apps.googleusercontent.com
              </span>
              <button className="text-[#8ab4f8] text-[9px] flex items-center gap-0.5">
                <Copy size={9} /> Copy
              </button>
            </div>
          </div>
          <div className="rounded border border-white/8 bg-[#2d2e31]/60 p-2.5 space-y-1">
            <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wide">Client Secret</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/60 font-mono flex-1 truncate">
                {showSecret ? "GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" : "GOCSPX-••••••••••••••••••••••••••••••••"}
              </span>
              <button onClick={() => setShowSecret(!showSecret)} className="text-[#8ab4f8] text-[9px]">
                {showSecret ? <EyeOff size={9} /> : <Eye size={9} />}
              </button>
              <button className="text-[#8ab4f8] text-[9px] flex items-center gap-0.5">
                <Copy size={9} /> Copy
              </button>
            </div>
          </div>
          <div className="rounded border border-white/8 bg-[#2d2e31]/60 p-2.5 space-y-1">
            <p className="text-[9px] font-semibold text-white/30 uppercase tracking-wide">Authorized Redirect URI</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/60 font-mono flex-1 truncate">https://moderateai.site/api/auth/youtube/callback</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#34A853] shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </GCPConsoleShell>
  );
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

function TutorialStep({ onNext, onPrev, onWatched, watched }: {
  onNext: () => void; onPrev?: () => void; onWatched: () => void; watched: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Watch Setup Video</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          Watch this quick walkthrough before connecting your Google Cloud Project. Steps 2–6 unlock after completion.
        </p>
      </div>
      <VideoPlayer onWatched={onWatched} />
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Shield size={13} className="text-emerald-400" />, label: "100% Secure", sub: "Credentials encrypted & safe" },
          { icon: <Zap size={13} className="text-yellow-400" />, label: "10,000 Units/Day", sub: "Your own YouTube API quota" },
          { icon: <HelpCircle size={13} className="text-blue-400" />, label: "24/7 Support", sub: "We're here to help" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/6 bg-white/[0.02] px-3 py-3 flex flex-col items-center gap-1.5 text-center">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">{item.icon}</div>
            <p className="text-[10px] font-semibold text-white/70">{item.label}</p>
            <p className="text-[9px] text-white/30 leading-tight">{item.sub}</p>
          </div>
        ))}
      </div>
      {watched && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/6 text-xs text-emerald-400">
          <CheckCircle2 size={13} className="shrink-0" />
          <div>
            <span className="font-semibold">Great! Video Completed 🎉</span>
            <span className="text-emerald-400/70 ml-1">You are all set to connect your Google Cloud project.</span>
          </div>
        </div>
      )}
      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Continue →" nextDisabled={!watched} />
    </div>
  );
}

function GCPStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Open Google Cloud Console</h2>
        <p className="text-white/40 text-xs leading-relaxed">Create a new project in Google Cloud Console.</p>
      </div>
      <GCPNewProjectUI />
      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">Steps</p>
        <ol className="space-y-2">
          {["Go to console.cloud.google.com", "Click the project dropdown at the top", 'Click "New Project"', 'Name it "ModerateAI" and click Create'].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-white/45">
              <span className="w-4 h-4 rounded-full bg-purple-600/20 border border-purple-500/25 text-purple-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40">
        Open Google Console <ExternalLink size={13} />
      </a>
      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Next →" />
    </div>
  );
}

function EnableStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Enable YouTube Data API v3</h2>
        <p className="text-white/40 text-xs leading-relaxed">Enable the YouTube Data API in your project.</p>
      </div>
      <GCPAPILibraryUI />
      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">Steps</p>
        <ol className="space-y-2">
          {["Open APIs & Services → Library", 'Search for "YouTube Data API v3"', "Click the result, then press Enable"].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-white/45">
              <span className="w-4 h-4 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40">
        Open API Library <ExternalLink size={13} />
      </a>
      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Next →" />
    </div>
  );
}

function OAuthStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [redirectUri, setRedirectUri] = useState("");
  const [jsOrigin,    setJsOrigin]    = useState("");
  useEffect(() => { setRedirectUri(getRedirectUri()); setJsOrigin(getJsOrigin()); }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Create OAuth Client ID</h2>
        <p className="text-white/40 text-xs leading-relaxed">Create an OAuth 2.0 Client ID in the Credentials page.</p>
      </div>
      <GCPOAuthUI />
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Add these to your OAuth client</p>
        {[
          { label: "Authorized JavaScript Origin", value: jsOrigin },
          { label: "Authorized Redirect URI",      value: redirectUri },
        ].map(({ label, value }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{label}</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3">
              <code className="flex-1 text-purple-300 text-xs font-mono truncate">{value}</code>
              {value && <CopyButton value={value} />}
            </div>
          </div>
        ))}
      </div>
      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40">
        Open Credentials <ExternalLink size={13} />
      </a>
      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Next →" />
    </div>
  );
}

function CredentialsStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [clientId,     setClientId]     = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret,   setShowSecret]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [redirectUri,  setRedirectUri]  = useState("");
  useEffect(() => { setRedirectUri(getRedirectUri()); }, []);

  const canSave = clientId.trim().length > 0 && clientSecret.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true); setError(null);
    try { await saveOAuthCredentials(clientId.trim(), clientSecret.trim()); onNext(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Add Your Credentials</h2>
        <p className="text-white/40 text-xs leading-relaxed">Paste your OAuth Client ID and Client Secret below.</p>
      </div>
      <GCPCredentialsDetailUI />
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Client ID</label>
          <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)}
            placeholder="Paste your Client ID"
            className="w-full rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/50 transition-all duration-200 font-mono" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Client Secret</label>
          <div className="relative">
            <input type={showSecret ? "text" : "password"} value={clientSecret} onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Paste your Client Secret"
              className="w-full rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3 pr-11 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/50 transition-all duration-200 font-mono" />
            <button onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors duration-150">
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Redirect URI (Copy this)</label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3">
            <code className="flex-1 text-white/40 text-xs font-mono truncate">{redirectUri}</code>
            {redirectUri && <CopyButton value={redirectUri} />}
          </div>
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center gap-2 text-xs text-white/25">
        <Lock size={11} className="text-emerald-500/50 shrink-0" />
        Encrypted before storage. Never logged or exposed via the API.
      </div>
      <div className="flex gap-2.5 pt-1">
        <button onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200">
          ← Previous
        </button>
        <button onClick={handleSave} disabled={!canSave || saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${canSave && !saving ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40" : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"}`}>
          {saving ? <><Spinner className="w-3.5 h-3.5" /> Saving…</> : "Validate"}
        </button>
      </div>
    </div>
  );
}

function ConnectStep({ onPrev }: { onPrev?: () => void }) {
  const [connecting, setConnecting] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Connect Your YouTube Channel</h2>
        <p className="text-white/40 text-xs leading-relaxed">Authorize ModerateAI to access your YouTube channel.</p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-8 flex flex-col items-center gap-5 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#FF0000] flex items-center justify-center shadow-2xl shadow-red-900/40">
            <Youtube size={28} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] flex items-center justify-center">
            <Check size={10} className="text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">Connect Your YouTube Channel</p>
          <p className="text-xs text-white/35 leading-relaxed max-w-xs mx-auto">
            Authorize ModerateAI to access your YouTube channel for comment moderation.
          </p>
        </div>
        <div className="w-full space-y-2 text-left">
          {["We will only access data required for moderation.", "Your data is secure and encrypted.", "You can disconnect anytime."].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-white/40">
              <Check size={11} className="text-emerald-400 shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <button
          onClick={() => { setConnecting(true); redirectToYouTubeAuth(); }}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#FF0000] hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 disabled:opacity-60">
          {connecting ? <><Spinner className="w-3.5 h-3.5" /> Redirecting…</> : <><Youtube size={15} /> Connect YouTube</>}
        </button>
      </div>
      {onPrev && (
        <button onClick={onPrev}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 font-medium text-sm transition-all duration-200">
          ← Previous
        </button>
      )}
    </div>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizard({ onConnected }: { onConnected: () => void }) {
  const [stepIndex,    setStepIndex]    = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  const step = WIZARD_FLOW[stepIndex] ?? "tutorial";
  void onConnected;

  const next = () => {
    if (stepIndex > 0 && !videoWatched) return;
    setStepIndex((i) => Math.min(i + 1, WIZARD_FLOW.length - 1));
  };
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

  return (
    <div className="rounded-2xl border border-purple-500/15 bg-[#0d0c14] overflow-hidden shadow-2xl shadow-purple-900/15">
      <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Google Cloud Setup</span>
        <span className="ml-auto text-[10px] text-white/20 font-medium">Step {stepIndex + 1} of {WIZARD_FLOW.length}</span>
      </div>
      <div className="flex">
        <div className="w-44 border-r border-white/8 py-3 px-2 shrink-0">
          <StepIndicator
            current={stepIndex + 1}
            videoWatched={videoWatched}
            onStepClick={(i) => { if (i > 0 && !videoWatched) return; setStepIndex(i); }}
          />
        </div>
        <div className="flex-1 px-5 py-5 min-w-0">
          {step === "tutorial"    && <TutorialStep    onNext={next} onPrev={stepIndex > 0 ? prev : undefined} onWatched={() => setVideoWatched(true)} watched={videoWatched} />}
          {step === "gcp"         && <GCPStep         onNext={next} onPrev={prev} />}
          {step === "enable"      && <EnableStep      onNext={next} onPrev={prev} />}
          {step === "oauth"       && <OAuthStep       onNext={next} onPrev={prev} />}
          {step === "credentials" && <CredentialsStep onNext={next} onPrev={prev} />}
          {step === "connect"     && <ConnectStep     onPrev={prev} />}
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ onCancel, onConfirm, loading, error }: {
  onCancel: () => void; onConfirm: () => void; loading: boolean; error: string | null;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel, loading]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !loading && onCancel()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0c14] shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} disabled={loading} className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors disabled:opacity-40">
          <X size={15} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Delete credentials?</h3>
          <p className="text-sm text-white/40 leading-relaxed">This removes your OAuth credentials. Active moderation will stop immediately.</p>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Spinner className="w-3.5 h-3.5" /> Deleting…</> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LogStatus }) {
  const map: Record<LogStatus, { label: string; c: string }> = {
    success: { label: "Success", c: "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" },
    warning: { label: "Warning", c: "bg-yellow-500/12 text-yellow-400 border-yellow-500/20"   },
    error:   { label: "Error",   c: "bg-red-500/12 text-red-400 border-red-500/20"             },
    info:    { label: "Info",    c: "bg-blue-500/12 text-blue-400 border-blue-500/20"           },
  };
  const m = map[status] ?? map.info;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide shrink-0 ${m.c}`}>
      {m.label}
    </span>
  );
}

// ─── Plan Limits ──────────────────────────────────────────────────────────────

function PlanLimitsInfo({ activePlan }: { activePlan?: string }) {
  const plans = [
    { key: "free_trial", label: "Free Trial", actions: PLAN_LIMITS.free_trial },
    { key: "pro",        label: "Pro",         actions: PLAN_LIMITS.pro        },
    { key: "agency",     label: "Agency",      actions: PLAN_LIMITS.agency     },
  ];
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/8">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Plan Limits</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
        {plans.map((p) => {
          const isActive = activePlan === p.key;
          return (
            <div key={p.key} className={`px-4 py-3.5 flex flex-col gap-1 ${isActive ? "bg-purple-500/5" : ""}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest border rounded-full px-1.5 py-0.5 w-fit bg-transparent
                ${isActive ? "text-purple-400 border-purple-500/40" : "text-white/50 border-white/10"}`}>
                {p.label}
              </span>
              <p className={`text-sm font-semibold mt-1 ${isActive ? "text-purple-300" : "text-white"}`}>{p.actions.toLocaleString()}</p>
              <p className="text-[10px] text-white/25">AI Actions / mo</p>
              {isActive && <span className="text-[9px] text-purple-400 font-semibold">← Current</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Managed Dashboard Card ───────────────────────────────────────────────────

function ManagedCard({ managed, onRefresh }: { managed: ManagedUsage; onRefresh: () => void }) {
  const planLimit = PLAN_LIMITS[managed.plan] ?? safeNum(managed.actionsTotal, 250);
  const used      = safeNum(managed.actionsUsed);
  const health: HealthState =
    managed.apiStatus === "operational" ? "healthy" :
    managed.apiStatus === "degraded"    ? "warning" : "offline";

  const [lastSyncDisplay, setLastSyncDisplay] = useState(() => fmtRelative(managed.lastSync));

  useEffect(() => { const t = setInterval(onRefresh, 30_000); return () => clearInterval(t); }, [onRefresh]);
  useEffect(() => {
    setLastSyncDisplay(fmtRelative(managed.lastSync));
    const t = setInterval(() => setLastSyncDisplay(fmtRelative(managed.lastSync)), 10_000);
    return () => clearInterval(t);
  }, [managed.lastSync]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {managed.channelAvatar ? (
            <img src={managed.channelAvatar} alt={managed.channelName ?? "Channel"} className="w-8 h-8 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-purple-500/12 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Server size={14} className="text-purple-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{managed.channelName ?? "ModerateAI Shared API"}</p>
            <p className="text-xs text-white/30">YouTube Data API v3 · Managed by ModerateAI</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <HealthIndicator health={health} />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-purple-500/25 bg-purple-500/8 text-purple-400 uppercase tracking-wide">
            {managed.planLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.04]">
        <StatCell label="Current Plan"    value={managed.planLabel}                                                          icon={<Server    size={11} className="text-purple-400"  />} />
        <StatCell label="AI Actions Used" value={used.toLocaleString()}                                                      icon={<Zap       size={11} className="text-yellow-400"  />} />
        <StatCell label="AI Actions Left" value={safeNum(managed.actionsRemaining).toLocaleString()}                         icon={<BarChart2 size={11} className="text-emerald-400" />} />
        <StatCell label="Reset Date"      value={fmt(managed.resetDate, { month: "short", day: "numeric" })}                 icon={<Clock     size={11} className="text-blue-400"    />} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.04] border-t border-white/[0.04]">
        <StatCell label="Today's Requests"   value={safeNum(managed.todayRequests).toLocaleString()}     icon={<TrendingUp    size={11} className="text-blue-400"   />} />
        <StatCell label="Comments Moderated" value={safeNum(managed.commentsModerated).toLocaleString()} icon={<MessageSquare size={11} className="text-purple-400" />} />
        <StatCell label="Replies Generated"  value={safeNum(managed.repliesGenerated).toLocaleString()}  icon={<Zap           size={11} className="text-yellow-400" />} />
        <StatCell label="Videos Monitored"   value={safeNum(managed.videosMonitored).toLocaleString()}   icon={<Video         size={11} className="text-red-400"    />} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.04] border-t border-white/[0.04]">
        <StatCell label="Success Rate" value={`${safeNum(managed.successRate, 100)}%`} icon={<CheckCircle2 size={11} className="text-emerald-400" />}
          valueClass={safeNum(managed.successRate, 100) >= 99 ? "text-emerald-400" : safeNum(managed.successRate, 100) >= 95 ? "text-yellow-400" : "text-red-400"} />
        <StatCell label="Avg Latency" value={`${safeNum(managed.latencyMs)}ms`} icon={<Cpu size={11} className="text-blue-400" />}
          valueClass={safeNum(managed.latencyMs) < 200 ? "text-emerald-400" : safeNum(managed.latencyMs) < 500 ? "text-yellow-400" : "text-red-400"} />
        <StatCell label="Channels" value={safeNum(managed.connectedChannels, 1).toLocaleString()} icon={<Youtube size={11} className="text-red-400" />} />
        <StatCell label="Last Sync" value={lastSyncDisplay} icon={<Radio size={11} className="text-purple-400" />} valueClass="text-white/70" />
      </div>

      {managed.billingStatus === "overdue" && (
        <div className="px-5 py-3 border-t border-red-500/15 bg-red-500/5 flex items-center gap-2.5">
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-400">Payment overdue — moderation may pause soon.</p>
          <a href="/billing" className="ml-auto text-xs font-semibold text-red-300 hover:text-red-200 underline underline-offset-2 transition-colors shrink-0">Update billing</a>
        </div>
      )}

      <div className="px-5 py-4 border-t border-white/5">
        <QuotaBar
          used={used}
          total={planLimit}
          label={`${Math.min(100, Math.round((used / Math.max(planLimit, 1)) * 100))}% of monthly limit used`}
          resetLabel={`resets ${fmt(managed.resetDate, { month: "short", day: "numeric" })}`}
        />
      </div>

      {planLimit > 0 && used / planLimit >= 0.8 && managed.plan !== "agency" && (
        <div className="px-5 py-3.5 border-t border-white/5 flex items-center justify-between gap-3 bg-purple-500/5">
          <p className="text-xs text-white/50 leading-snug">
            You&apos;re using <span className="text-white/70 font-semibold">{Math.round((used / planLimit) * 100)}%</span> of your monthly limit.
          </p>
          <a href="/billing" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all duration-200 shrink-0">
            Upgrade <ArrowUpRight size={11} />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Custom Project Card ──────────────────────────────────────────────────────

function CustomProjectCard({ custom, onRefresh }: { custom: CustomProjectInfo; onRefresh: () => void }) {
  const dailyQuota     = safeNum(custom.dailyQuota, 10000);
  const remainingQuota = safeNum(custom.remainingQuota);
  const used           = Math.max(0, dailyQuota - remainingQuota);

  const [lastSyncDisplay, setLastSyncDisplay] = useState(() => fmtRelative(custom.lastSync));

  useEffect(() => { const t = setInterval(onRefresh, 30_000); return () => clearInterval(t); }, [onRefresh]);
  useEffect(() => {
    setLastSyncDisplay(fmtRelative(custom.lastSync));
    const t = setInterval(() => setLastSyncDisplay(fmtRelative(custom.lastSync)), 10_000);
    return () => clearInterval(t);
  }, [custom.lastSync]);

  const oauthColor = custom.oauthStatus === "connected" ? "text-emerald-400" : custom.oauthStatus === "expired" ? "text-yellow-400" : "text-red-400";
  const apiColor   = custom.apiStatus === "enabled" ? "text-emerald-400" : "text-red-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Cloud size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{custom.projectName || "My Google Cloud Project"}</p>
            <p className="text-xs text-white/30">Google Cloud · YouTube Data API v3</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-emerald-500/25 bg-emerald-500/8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400">Connected</span>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-white/[0.04]">
        <StatCell label="Connected Account" value={custom.connectedAccount || "—"} icon={<Wifi size={11} className="text-blue-400" />} />
        <StatCell label="OAuth Status" value={custom.oauthStatus === "connected" ? "Connected" : custom.oauthStatus === "expired" ? "Expired" : "Disconnected"} icon={<Lock size={11} className="text-purple-400" />} valueClass={oauthColor} />
        <StatCell label="API Status" value={custom.apiStatus === "enabled" ? "Enabled" : "Disabled"} icon={<Youtube size={11} className="text-red-400" />} valueClass={apiColor} />
        <StatCell label="Last Sync" value={lastSyncDisplay} icon={<Clock size={11} className="text-blue-400" />} valueClass="text-white/70" />
        <StatCell label="Daily Quota Used" value={`${used.toLocaleString()} / ${dailyQuota.toLocaleString()}`} icon={<BarChart2 size={11} className="text-emerald-400" />} />
        <StatCell label="Remaining Today" value={remainingQuota.toLocaleString()} icon={<Zap size={11} className="text-yellow-400" />} />
      </div>
      <div className="px-5 py-4 border-t border-white/5">
        <QuotaBar used={used} total={dailyQuota} label={`${Math.min(100, Math.round((used / Math.max(dailyQuota, 1)) * 100))}% of daily quota used`} resetLabel="resets midnight PT" />
      </div>
    </div>
  );
}

// ─── Management Section ───────────────────────────────────────────────────────

function ManagementSection({ onRefresh }: { onRefresh: () => void }) {
  const [testState,     setTestState] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testMessage,   setTestMsg]   = useState("");
  const [rotating,      setRotating]  = useState(false);
  const [rotateError,   setRotateErr] = useState<string | null>(null);
  const [disconnecting, setDisc]      = useState(false);
  const [discError,     setDiscErr]   = useState<string | null>(null);
  const [showDelete,    setShowDelete]= useState(false);
  const [deleting,      setDeleting]  = useState(false);
  const [deleteError,   setDeleteErr] = useState<string | null>(null);

  const handleTest = async () => {
    setTestState("loading");
    const r = await testConnection();
    setTestState(r.ok ? "ok" : "fail");
    setTestMsg(r.message);
  };

  const handleRotate = async () => {
    setRotating(true); setRotateErr(null);
    try { await rotateCredentials(); onRefresh(); }
    catch (e) { setRotateErr(e instanceof Error ? e.message : "Rotation failed."); }
    finally { setRotating(false); }
  };

  const handleDisconnect = async () => {
    setDisc(true); setDiscErr(null);
    try { await disconnectChannel(); onRefresh(); }
    catch (e) { setDiscErr(e instanceof Error ? e.message : "Disconnect failed."); }
    finally { setDisc(false); }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true); setDeleteErr(null);
    try { await deleteCredentials(); setShowDelete(false); onRefresh(); }
    catch (e) { setDeleteErr(e instanceof Error ? e.message : "Delete failed."); }
    finally { setDeleting(false); }
  };

  return (
    <>
      {showDelete && <DeleteModal onCancel={() => { setShowDelete(false); setDeleteErr(null); }} onConfirm={handleDeleteConfirm} loading={deleting} error={deleteError} />}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-white">Test connection</p>
              <p className="text-xs text-white/30 mt-0.5">Verify the API is responding correctly.</p>
            </div>
            <button onClick={handleTest} disabled={testState === "loading"}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-xs font-semibold transition-all duration-200 disabled:opacity-50">
              {testState === "loading" ? <><Spinner className="w-3 h-3" /> Testing…</> : <><Wifi size={12} /> Test</>}
            </button>
          </div>
          {testState === "ok"   && <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-4 py-2.5"><Check size={12} /> {testMessage}</div>}
          {testState === "fail" && <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-2.5"><WifiOff size={12} /> {testMessage}</div>}
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Management</p>
          {discError   && <ErrorBanner message={discError} />}
          {rotateError && <ErrorBanner message={rotateError} />}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => redirectToYouTubeAuth()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-500/30 text-purple-300 hover:border-purple-500/50 text-xs font-medium transition-all duration-200">
              <RefreshCw size={12} /> Reconnect
            </button>
            <button onClick={handleRotate} disabled={rotating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-yellow-500/20 text-yellow-400/70 hover:text-yellow-300 hover:border-yellow-500/35 text-xs font-medium transition-all duration-200 disabled:opacity-50">
              {rotating ? <><Spinner className="w-3 h-3 text-yellow-300" /> Rotating…</> : <><RotateCcw size={12} /> Rotate credentials</>}
            </button>
            <button onClick={handleDisconnect} disabled={disconnecting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/8 text-white/40 hover:text-red-400 hover:border-red-500/25 text-xs font-medium transition-all duration-200 disabled:opacity-50">
              {disconnecting ? <><Spinner className="w-3 h-3" /> Disconnecting…</> : <><WifiOff size={12} /> Disconnect</>}
            </button>
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/15 text-red-400/60 hover:text-red-400 hover:border-red-500/35 text-xs font-medium transition-all duration-200">
              <Trash2 size={12} /> Delete credentials
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityLogsSection() {
  const [logs,    setLogs]   = useState<ActivityLog[]>([]);
  const [loading, setLoading]= useState(true);
  const [expanded,setExp]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivityLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]);

  const safeLogs = Array.isArray(logs) ? logs : [];
  const visible  = expanded ? safeLogs : safeLogs.slice(0, 5);

  if (loading) return <SkeletonLogs />;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-white/30" />
          <p className="text-sm font-semibold text-white/70">Activity</p>
        </div>
        <div className="flex items-center gap-3">
          {safeLogs.length > 0 && <span className="text-[10px] text-white/25 font-medium">{safeLogs.length} events</span>}
          <button onClick={load} className="text-white/20 hover:text-white/50 transition-colors duration-150">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>
      {safeLogs.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" description="Events appear here as ModerateAI moderates your channel." />
      ) : (
        <>
          <div className="divide-y divide-white/5">
            {visible.map((log, idx) => (
              <div key={log.id ?? idx} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors duration-150 group">
                <StatusBadge status={log.status ?? "info"} />
                <p className="flex-1 text-sm text-white/55 leading-snug group-hover:text-white/70 transition-colors duration-150 truncate">{log.action ?? "—"}</p>
                <span className="text-[10px] text-white/20 whitespace-nowrap shrink-0">{log.timestamp ?? "—"}</span>
              </div>
            ))}
          </div>
          {safeLogs.length > 5 && (
            <div className="px-5 py-3 border-t border-white/8">
              <button onClick={() => setExp(!expanded)} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-150">
                {expanded ? "Show less" : `Show ${safeLogs.length - 5} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Method Selector ──────────────────────────────────────────────────────────

function MethodSelector({ method, onChange }: { method: APIMethod; onChange: (m: APIMethod) => void }) {
  const options = [
    { key: "managed" as APIMethod, icon: <Server size={16} className="text-purple-400" />, label: "ModerateAI Shared API",    sub: "Recommended · Zero setup",    badge: "Recommended", badgeColor: "text-purple-400 border-purple-500/25 bg-purple-500/8", ring: "border-purple-500/40 bg-purple-500/6" },
    { key: "custom"  as APIMethod, icon: <Cloud  size={16} className="text-emerald-400" />, label: "My Google Cloud Project", sub: "Advanced · Your own quota",  badge: "Advanced",     badgeColor: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8", ring: "border-emerald-500/30 bg-emerald-500/4" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const active = method === opt.key;
        return (
          <button key={opt.key} onClick={() => onChange(opt.key)}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${active ? opt.ring : "border-white/8 bg-white/[0.02] hover:border-white/15"}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${active ? "bg-white/8 border border-white/10" : "bg-white/4 border border-white/6"}`}>
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-white">{opt.label}</p>
                <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full uppercase tracking-wide ${opt.badgeColor}`}>{opt.badge}</span>
              </div>
              <p className="text-xs text-white/30">{opt.sub}</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200 ${active ? "border-purple-500 bg-purple-500" : "border-white/15 bg-transparent"}`}>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function APIAccessPage() {
  const [status,       setStatus]  = useState<APIStatus | null>(null);
  const [loading,      setLoading] = useState(true);
  const [activeMethod, setMethod]  = useState<APIMethod>("managed");

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchAPIStatus();
      setStatus(data);
      setMethod(data.method ?? "managed");
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const auth = getAuth();
      if (auth.currentUser) { loadStatus(); return; }
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) loadStatus(); else setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error("[api-access] Auth init failed", e);
      setLoading(false);
    }
  }, [loadStatus]);

  const connected = !!status?.youtubeConnected;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="space-y-1.5"><Skeleton className="h-7 w-32" /><Skeleton className="h-3.5 w-72" /></div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonLogs />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">API Access</h1>
            <p className="text-white/35 text-sm">
              {connected
                ? "Manage how ModerateAI connects to the YouTube Data API."
                : "Connect your account to start moderating comments."}
            </p>
          </div>
          {connected && (
            <button onClick={loadStatus}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 text-xs font-medium transition-all duration-200">
              <RefreshCw size={12} /> Refresh
            </button>
          )}
        </div>

        {/* Not connected */}
        {!connected && (
          <>
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Connection Method</p>
              <MethodSelector method={activeMethod} onChange={setMethod} />
            </div>

            {activeMethod === "managed" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-purple-500/15 bg-[#0d0c14] p-8 flex flex-col items-center gap-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Server size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white mb-1.5">ModerateAI Shared API</p>
                    <p className="text-sm text-white/35 leading-relaxed max-w-sm mx-auto">
                      No Google Cloud setup required. We manage the API quota and infrastructure for you.
                    </p>
                  </div>
                  <button onClick={() => redirectToYouTubeAuth()}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40">
                    <Youtube size={15} /> Connect YouTube
                  </button>
                  <p className="text-[10px] text-white/20">You&apos;ll be redirected to Google to authorize your channel.</p>
                </div>
                <PlanLimitsInfo />
              </div>
            )}

            {activeMethod === "custom" && <SetupWizard onConnected={loadStatus} />}
          </>
        )}

        {/* Connected */}
        {connected && status && (
          <>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Connection Method</p>
              <span className="text-[10px] font-semibold text-purple-400 border border-purple-500/25 bg-purple-500/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {status.method === "managed" ? "ModerateAI Shared API" : "My Google Cloud Project"}
              </span>
            </div>

            {status.method === "managed" && status.managed && (
              <>
                <ManagedCard managed={status.managed} onRefresh={loadStatus} />
                <UsageGraph managed={status.managed} />
                <PlanLimitsInfo activePlan={status.managed.plan} />
              </>
            )}

            {status.method === "custom" && status.custom && (
              <CustomProjectCard custom={status.custom} onRefresh={loadStatus} />
            )}

            <ManagementSection onRefresh={loadStatus} />
            <ActivityLogsSection />

            <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/12 bg-emerald-500/4 px-5 py-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/12 border border-emerald-500/15 flex items-center justify-center shrink-0">
                <Shield size={15} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300 mb-0.5">Security</p>
                <p className="text-xs text-white/30 leading-relaxed">
                  Credentials are encrypted at rest and never exposed via the API. Remove them from your account at any time.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}