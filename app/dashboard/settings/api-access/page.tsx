"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getAuth } from "firebase/auth";
import {
  Shield, ChevronRight, ChevronLeft, Copy, Eye, EyeOff,
  ExternalLink, Check, Lock, Wifi, WifiOff, RotateCcw,
  Trash2, RefreshCw, AlertTriangle, Activity, Clock, Zap, BarChart2, X,
  Cloud, Server, Loader2, Tv2 as Youtube, ImageIcon, Key, Radio,
  TrendingUp, MessageSquare, Video, ArrowUpRight, CheckCircle2,
  AlertCircle, XCircle, Cpu,
} from "lucide-react";

// ─── YouTube OAuth redirect ───────────────────────────────────────────────────

function redirectToYouTubeAuth() {
  const uid = getAuth().currentUser?.uid;
  if (!uid) {
    console.error("[api-access] No authenticated user — cannot start OAuth.");
    return;
  }
  window.location.href = `/api/auth/youtube?uid=${encodeURIComponent(uid)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type APIMethod   = "managed" | "custom";
type LogStatus   = "success" | "warning" | "error" | "info";
type WizardStep  = "tutorial" | "gcp" | "enable" | "oauth" | "credentials" | "connect";
type HealthState = "healthy" | "warning" | "offline" | "loading";

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  status: LogStatus;
}

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

// ─── Config ───────────────────────────────────────────────────────────────────

const APP_ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://moderateai.site";

const REDIRECT_URI = `${APP_ORIGIN}/api/auth/youtube/callback`;
const JS_ORIGIN    = APP_ORIGIN;

// ─── Plan limits ──────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = {
  free_trial: 250,
  pro: 1900,
  agency: 15000,
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAPIStatus(): Promise<APIStatus> {
  const res = await fetch("/api/settings/api-access", { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function saveOAuthCredentials(clientId: string, clientSecret: string): Promise<void> {
  const res = await fetch("/api/settings/api-access/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Failed to save credentials");
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
  const res  = await fetch("/api/settings/api-access/test", { method: "POST" });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, message: body.message ?? (res.ok ? "Connection successful." : "Connection failed.") };
}

async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const res = await fetch("/api/settings/api-access/logs", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(iso: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", opts ?? {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return "—"; }
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s    = Math.floor(diff / 1000);
    if (s < 60)  return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  } catch { return "—"; }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-2.5 w-52" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 space-y-2">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-white/5 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-2 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}

function SkeletonLogs() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8">
        <Skeleton className="h-3.5 w-20" />
      </div>
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

// ─── Primitives ───────────────────────────────────────────────────────────────

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
      <AlertTriangle size={14} className="shrink-0" />
      <span className="flex-1 leading-snug">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-300 hover:text-red-200 underline underline-offset-2 transition-colors shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon, title, description,
}: { icon: React.ElementType; title: string; description: string }) {
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

// ─── Live Health Indicator ────────────────────────────────────────────────────

function HealthIndicator({ health }: { health: HealthState }) {
  const map: Record<HealthState, { label: string; icon: React.ReactNode; dot: string; ring: string; text: string }> = {
    healthy: {
      label: "Healthy",
      icon: <CheckCircle2 size={11} />,
      dot: "bg-emerald-400",
      ring: "border-emerald-500/25 bg-emerald-500/10",
      text: "text-emerald-400",
    },
    warning: {
      label: "Degraded",
      icon: <AlertCircle size={11} />,
      dot: "bg-yellow-400",
      ring: "border-yellow-500/25 bg-yellow-500/10",
      text: "text-yellow-400",
    },
    offline: {
      label: "Offline",
      icon: <XCircle size={11} />,
      dot: "bg-red-400",
      ring: "border-red-500/25 bg-red-500/10",
      text: "text-red-400",
    },
    loading: {
      label: "Checking…",
      icon: <Spinner className="w-2.5 h-2.5" />,
      dot: "bg-white/20",
      ring: "border-white/10 bg-white/5",
      text: "text-white/30",
    },
  };
  const m = map[health];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${m.ring} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot} ${health === "healthy" ? "animate-pulse" : ""}`} />
      {m.label}
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 shrink-0
        ${copied
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25"
          : "bg-purple-600/20 text-purple-300 hover:bg-purple-600/35 border border-purple-500/25"}`}
    >
      {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> {label ?? "Copy"}</>}
    </button>
  );
}

// ─── Quota Progress Bar ───────────────────────────────────────────────────────

function QuotaBar({
  used, total, label, resetLabel,
}: { used: number; total: number; label?: string; resetLabel?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const barColor =
    pct >= 90 ? "from-red-600 to-red-400" :
    pct >= 70 ? "from-yellow-600 to-yellow-400" :
    "from-purple-600 to-purple-400";

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] text-white/30">
        <span>{label ?? `${pct}% of limit used`}</span>
        <span className="font-mono">{used.toLocaleString()} / {total.toLocaleString()}{resetLabel ? ` · ${resetLabel}` : ""}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 90 && (
        <p className="text-[10px] text-red-400/80 flex items-center gap-1">
          <AlertTriangle size={9} /> Approaching limit — consider upgrading your plan.
        </p>
      )}
    </div>
  );
}

// ─── Stat Cell ────────────────────────────────────────────────────────────────

function StatCell({
  label, value, icon, valueClass = "text-white", border = "",
}: {
  label: string; value: string; icon: React.ReactNode;
  valueClass?: string; border?: string;
}) {
  return (
    <div className={`px-4 py-3.5 flex flex-col gap-1.5 ${border}`}>
      <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium uppercase tracking-wide">
        {icon}{label}
      </div>
      <p className={`text-sm font-semibold truncate ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<WizardStep, string> = {
  tutorial: "Tutorial",
  gcp: "Cloud Project",
  enable: "Enable API",
  oauth: "OAuth Client",
  credentials: "Credentials",
  connect: "Connect",
};

const WIZARD_FLOW: WizardStep[] = ["tutorial", "gcp", "enable", "oauth", "credentials", "connect"];

function StepIndicator({ current }: { current: number }) {
  const labels = WIZARD_FLOW.map((s) => STEP_LABELS[s]);
  return (
    <div className="w-full overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
      <div className="flex items-start min-w-max gap-0">
        {labels.map((label, i) => {
          const num    = i + 1;
          const done   = num < current;
          const active = num === current;
          return (
            <div key={label} className="flex items-start">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                    ${done   ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/40" : ""}
                    ${active ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40 ring-4 ring-purple-500/15" : ""}
                    ${!done && !active ? "bg-transparent border-white/15 text-white/25" : ""}`}
                >
                  {done ? <Check size={12} /> : num}
                </div>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-300
                    ${active ? "text-purple-300" : done ? "text-emerald-500" : "text-white/20"}`}
                >
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div className={`h-px w-8 mx-2 mt-3.5 shrink-0 transition-all duration-500 ${done ? "bg-emerald-600/60" : "bg-white/8"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nav Buttons ──────────────────────────────────────────────────────────────

function NavButtons({
  onPrev, onNext, nextLabel = "Continue", nextDisabled = false, loading = false,
}: {
  onPrev?: () => void; onNext?: () => void;
  nextLabel?: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div className="flex gap-2.5 pt-2">
      {onPrev && (
        <button
          onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
        >
          <ChevronLeft size={15} /> Back
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${!nextDisabled && !loading
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"}`}
        >
          {loading
            ? <><Spinner className="w-3.5 h-3.5" /> Processing…</>
            : <>{nextLabel} <ChevronRight size={15} /></>}
        </button>
      )}
    </div>
  );
}

// ─── Screenshot Placeholder ───────────────────────────────────────────────────

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full rounded-xl border border-white/8 bg-[#0d0c14] overflow-hidden aspect-[16/5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center px-4">
        <ImageIcon size={18} className="text-white/12" />
        <p className="text-[10px] text-white/18 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Step 1: Tutorial ─────────────────────────────────────────────────────────

function TutorialStep({ onNext, onPrev }: { onNext: () => void; onPrev?: () => void }) {
  const videoRef              = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);
  const [watched,  setWatched]  = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    fetch("/videos/google-cloud-setup.mp4", { method: "HEAD" })
      .then((r) => setHasVideo(r.ok))
      .catch(() => setHasVideo(false));
  }, []);

  const canContinue = isDev || hasVideo === false || watched;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Setup tutorial</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          Watch this quick walkthrough before connecting your Google Cloud Project.
        </p>
      </div>

      <div className="rounded-xl border border-white/8 bg-[#0d0c14] overflow-hidden">
        <div className="relative aspect-video flex items-center justify-center">
          {hasVideo === null && <Spinner className="w-4 h-4 text-white/20" />}
          {hasVideo === false && (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
                <ImageIcon size={16} className="text-white/20" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/35">Tutorial video coming soon</p>
                <p className="text-xs text-white/20 mt-0.5">Continue with the written guide below.</p>
              </div>
            </div>
          )}
          {hasVideo === true && (
            <>
              <video
                ref={videoRef}
                src="/videos/google-cloud-setup.mp4"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-0"}`}
                onEnded={() => setWatched(true)}
              />
              {!playing && (
                <button
                  onClick={() => { setPlaying(true); videoRef.current?.play(); }}
                  className="relative z-10 w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-900/60 hover:bg-purple-500 transition-all duration-200 hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              )}
              {watched && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-semibold">
                  <Check size={10} /> Watched
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isDev && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/6 text-xs text-purple-400">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Development mode — tutorial auto-completed. Video will be added later.
        </div>
      )}

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Continue" nextDisabled={!canContinue} />
    </div>
  );
}

// ─── Step 2: GCP ──────────────────────────────────────────────────────────────

function GCPStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Create a Google Cloud Project</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          You need a Google Cloud Project to generate API credentials. Create one if you don't have it already.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud Console · New Project" />
      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center shrink-0">
          <Cloud size={15} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Google Cloud Console</p>
          <p className="text-xs text-white/35">Go to <span className="text-white/50 font-mono">console.cloud.google.com</span> and create a new project.</p>
        </div>
        <a
          href="https://console.cloud.google.com/projectcreate"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-[10px] font-semibold transition-all duration-200 shrink-0"
        >
          Open <ExternalLink size={10} />
        </a>
      </div>
      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Project created" />
    </div>
  );
}

// ─── Step 3: Enable API ───────────────────────────────────────────────────────

function EnableStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Enable YouTube Data API v3</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          Find and enable the YouTube Data API v3 in the API Library. Required before credentials will work.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud API Library · YouTube Data API v3" />
      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <Youtube size={15} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">YouTube Data API v3</p>
          <p className="text-xs text-white/35">Search in the API Library, then click <span className="text-white/50">Enable</span>.</p>
        </div>
        <a
          href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-[10px] font-semibold transition-all duration-200 shrink-0"
        >
          Open <ExternalLink size={10} />
        </a>
      </div>
      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="API enabled" />
    </div>
  );
}

// ─── Step 4: OAuth Client ─────────────────────────────────────────────────────

function OAuthStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Create an OAuth 2.0 Client</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          Set up an OAuth consent screen, then create a Web Application client. Add the values below exactly.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud · OAuth Client Credentials" />
      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center shrink-0">
          <Shield size={15} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">OAuth Consent Screen</p>
          <p className="text-xs text-white/35">Configure as <span className="text-white/50">External</span> and add your app details.</p>
        </div>
        <a
          href="https://console.cloud.google.com/apis/credentials/consent"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-[10px] font-semibold transition-all duration-200 shrink-0"
        >
          Open <ExternalLink size={10} />
        </a>
      </div>
      <div className="space-y-3">
        {[
          { label: "Authorized JavaScript Origin", value: JS_ORIGIN },
          { label: "Authorized Redirect URI",       value: REDIRECT_URI },
        ].map(({ label, value }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{label}</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3">
              <code className="flex-1 text-purple-300 text-xs font-mono truncate">{value}</code>
              <CopyButton value={value} />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-500/20 flex items-center justify-center shrink-0">
          <Key size={15} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Create OAuth Client ID</p>
          <p className="text-xs text-white/35">Application type: <span className="text-white/50">Web application</span>.</p>
        </div>
        <a
          href="https://console.cloud.google.com/apis/credentials"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-[10px] font-semibold transition-all duration-200 shrink-0"
        >
          Open <ExternalLink size={10} />
        </a>
      </div>
      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Client created" />
    </div>
  );
}

// ─── Step 5: Credentials ──────────────────────────────────────────────────────

function CredentialsStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [clientId,     setClientId]     = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret,   setShowSecret]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const canSave = clientId.trim().length > 0 && clientSecret.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveOAuthCredentials(clientId.trim(), clientSecret.trim());
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Paste your credentials</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          Copy the Client ID and Client Secret from the OAuth client you just created.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud · OAuth Client · Credentials" />
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
            className="w-full rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/4 transition-all duration-200 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Client Secret</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3 pr-11 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/4 transition-all duration-200 font-mono"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors duration-150"
            >
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center gap-2 text-xs text-white/25">
        <Lock size={11} className="text-emerald-500/50 shrink-0" />
        Encrypted before storage. Never logged or exposed via the API.
      </div>
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${canSave && !saving
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"}`}
        >
          {saving ? <><Spinner className="w-3.5 h-3.5" /> Saving…</> : <><Lock size={13} /> Save & Continue</>}
        </button>
      </div>
    </div>
  );
}

// ─── Step 6: Connect YouTube ──────────────────────────────────────────────────

function ConnectStep({ onPrev }: { onPrev?: () => void }) {
  const [connecting, setConnecting] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Connect YouTube</h2>
        <p className="text-white/40 text-xs leading-relaxed">
          Authorize ModerateAI to read and moderate comments on your YouTube channel.
        </p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-8 flex flex-col items-center gap-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Youtube size={26} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">Authorize via Google OAuth</p>
          <p className="text-xs text-white/35 leading-relaxed max-w-xs mx-auto">
            A Google sign-in window will open. Select the account that owns your YouTube channel, then grant the requested permissions.
          </p>
        </div>
        <button
          onClick={() => { setConnecting(true); redirectToYouTubeAuth(); }}
          disabled={connecting}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:scale-[1.02] disabled:opacity-60"
        >
          {connecting
            ? <><Spinner className="w-3.5 h-3.5" /> Redirecting…</>
            : <><Youtube size={15} /> Connect YouTube</>}
        </button>
      </div>
      {onPrev && (
        <button
          onClick={onPrev}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 font-medium text-sm transition-all duration-200"
        >
          <ChevronLeft size={15} /> Back
        </button>
      )}
    </div>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizard({ onConnected }: { onConnected: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = WIZARD_FLOW[stepIndex];
  const next = () => setStepIndex((i) => Math.min(i + 1, WIZARD_FLOW.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));
  void onConnected;

  return (
    <div className="rounded-2xl border border-purple-500/15 bg-[#0d0c14] overflow-hidden shadow-2xl shadow-purple-900/15">
      <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Google Cloud Setup</span>
        <span className="ml-auto text-[10px] text-white/20 font-medium">Step {stepIndex + 1} of {WIZARD_FLOW.length}</span>
      </div>
      <div className="px-5 py-4 border-b border-white/5">
        <StepIndicator current={stepIndex + 1} />
      </div>
      <div className="px-5 py-5">
        {step === "tutorial"    && <TutorialStep    onNext={next} onPrev={stepIndex > 0 ? prev : undefined} />}
        {step === "gcp"         && <GCPStep         onNext={next} onPrev={prev} />}
        {step === "enable"      && <EnableStep      onNext={next} onPrev={prev} />}
        {step === "oauth"       && <OAuthStep       onNext={next} onPrev={prev} />}
        {step === "credentials" && <CredentialsStep onNext={next} onPrev={prev} />}
        {step === "connect"     && <ConnectStep     onPrev={prev} />}
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  onCancel, onConfirm, loading, error,
}: {
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
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0c14] shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onCancel} disabled={loading} className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors disabled:opacity-40">
          <X size={15} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Delete credentials?</h3>
          <p className="text-sm text-white/40 leading-relaxed">
            This removes your OAuth credentials from ModerateAI. Active moderation will stop immediately. You can reconnect at any time.
          </p>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2"
          >
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
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide shrink-0 ${map[status].c}`}>
      {map[status].label}
    </span>
  );
}

// ─── Managed Dashboard Card ───────────────────────────────────────────────────

function ManagedCard({ managed, onRefresh }: { managed: ManagedUsage; onRefresh: () => void }) {
  const planLimit  = PLAN_LIMITS[managed.plan] ?? managed.actionsTotal;
  const used       = managed.actionsUsed;
  const health: HealthState =
    managed.apiStatus === "operational" ? "healthy" :
    managed.apiStatus === "degraded"    ? "warning" :
    "offline";

  // Auto-refresh every 30 s
  useEffect(() => {
    const t = setInterval(onRefresh, 30_000);
    return () => clearInterval(t);
  }, [onRefresh]);

  const [lastSyncDisplay, setLastSyncDisplay] = useState(fmtRelative(managed.lastSync));
  useEffect(() => {
    const t = setInterval(() => setLastSyncDisplay(fmtRelative(managed.lastSync)), 10_000);
    return () => clearInterval(t);
  }, [managed.lastSync]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/12 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Server size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">ModerateAI Shared API</p>
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

      {/* Main stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.04]">
        <StatCell label="Current Plan"      value={managed.planLabel}                       icon={<Server    size={11} className="text-purple-400"  />} border="" />
        <StatCell label="Actions Used"      value={used.toLocaleString()}                   icon={<Zap       size={11} className="text-yellow-400"  />} />
        <StatCell label="Remaining Credits" value={managed.actionsRemaining.toLocaleString()} icon={<BarChart2 size={11} className="text-emerald-400" />} />
        <StatCell label="Monthly Reset"     value={fmt(managed.resetDate, { month: "short", day: "numeric" })} icon={<Clock size={11} className="text-blue-400" />} />
      </div>

      {/* Secondary stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.04] border-t border-white/[0.04]">
        <StatCell label="Today's Requests"   value={managed.todayRequests.toLocaleString()}    icon={<TrendingUp    size={11} className="text-blue-400"    />} />
        <StatCell label="Comments Moderated" value={managed.commentsModerated.toLocaleString()} icon={<MessageSquare size={11} className="text-purple-400"  />} />
        <StatCell label="Replies Generated"  value={managed.repliesGenerated.toLocaleString()}  icon={<Zap           size={11} className="text-yellow-400"  />} />
        <StatCell label="Videos Monitored"   value={managed.videosMonitored.toLocaleString()}   icon={<Video         size={11} className="text-red-400"     />} />
      </div>

      {/* API Health row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.04] border-t border-white/[0.04]">
        <StatCell
          label="Success Rate"
          value={`${managed.successRate}%`}
          icon={<CheckCircle2 size={11} className="text-emerald-400" />}
          valueClass={managed.successRate >= 99 ? "text-emerald-400" : managed.successRate >= 95 ? "text-yellow-400" : "text-red-400"}
        />
        <StatCell
          label="Avg Latency"
          value={`${managed.latencyMs}ms`}
          icon={<Cpu size={11} className="text-blue-400" />}
          valueClass={managed.latencyMs < 200 ? "text-emerald-400" : managed.latencyMs < 500 ? "text-yellow-400" : "text-red-400"}
        />
        <StatCell
          label="Connected Channels"
          value={managed.connectedChannels.toLocaleString()}
          icon={<Youtube size={11} className="text-red-400" />}
        />
        <StatCell
          label="Last Sync"
          value={lastSyncDisplay}
          icon={<Radio size={11} className="text-purple-400" />}
          valueClass="text-white/70"
        />
      </div>

      {/* Quota progress bar */}
      <div className="px-5 py-4 border-t border-white/5">
        <QuotaBar
          used={used}
          total={planLimit}
          label={`${Math.min(100, Math.round((used / planLimit) * 100))}% of monthly limit used`}
          resetLabel={`resets ${fmt(managed.resetDate, { month: "short", day: "numeric" })}`}
        />
      </div>

      {/* Upgrade CTA — only when near limit */}
      {used / planLimit >= 0.8 && managed.plan !== "agency" && (
        <div className="px-5 py-3.5 border-t border-white/5 flex items-center justify-between gap-3 bg-purple-500/5">
          <p className="text-xs text-white/50 leading-snug">
            You're using <span className="text-white/70 font-semibold">{Math.round((used / planLimit) * 100)}%</span> of your monthly limit.
            Upgrade to avoid interruptions.
          </p>
          <a
            href="/billing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all duration-200 shrink-0 hover:scale-[1.02]"
          >
            Upgrade <ArrowUpRight size={11} />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Custom Project Card ──────────────────────────────────────────────────────

function CustomProjectCard({ custom, onRefresh }: { custom: CustomProjectInfo; onRefresh: () => void }) {
  const used = custom.dailyQuota - custom.remainingQuota;

  // Auto-refresh every 30 s
  useEffect(() => {
    const t = setInterval(onRefresh, 30_000);
    return () => clearInterval(t);
  }, [onRefresh]);

  const [lastSyncDisplay, setLastSyncDisplay] = useState(fmtRelative(custom.lastSync));
  useEffect(() => {
    const t = setInterval(() => setLastSyncDisplay(fmtRelative(custom.lastSync)), 10_000);
    return () => clearInterval(t);
  }, [custom.lastSync]);

  const oauthColor =
    custom.oauthStatus === "connected" ? "text-emerald-400" :
    custom.oauthStatus === "expired"   ? "text-yellow-400" : "text-red-400";
  const apiColor = custom.apiStatus === "enabled" ? "text-emerald-400" : "text-red-400";

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
        <StatCell label="Connected Account"  value={custom.connectedAccount || "—"}   icon={<Wifi         size={11} className="text-blue-400"   />} />
        <StatCell label="OAuth Status"       value={custom.oauthStatus === "connected" ? "Connected" : custom.oauthStatus === "expired" ? "Expired" : "Disconnected"} icon={<Lock size={11} className="text-purple-400" />} valueClass={oauthColor} />
        <StatCell label="API Status"         value={custom.apiStatus === "enabled" ? "Enabled" : "Disabled"} icon={<Youtube size={11} className="text-red-400" />} valueClass={apiColor} />
        <StatCell label="Last Sync"          value={lastSyncDisplay}                  icon={<Clock        size={11} className="text-blue-400"   />} valueClass="text-white/70" />
        <StatCell label="Daily Quota Used"   value={`${used.toLocaleString()} / ${custom.dailyQuota.toLocaleString()}`} icon={<BarChart2 size={11} className="text-emerald-400" />} />
        <StatCell label="Remaining Today"    value={custom.remainingQuota.toLocaleString()} icon={<Zap   size={11} className="text-yellow-400"  />} />
      </div>

      <div className="px-5 py-4 border-t border-white/5">
        <QuotaBar
          used={used}
          total={custom.dailyQuota}
          label={`${Math.min(100, Math.round((used / custom.dailyQuota) * 100))}% of daily quota used`}
          resetLabel="resets midnight PT"
        />
      </div>
    </div>
  );
}

// ─── Management Actions ───────────────────────────────────────────────────────

function ManagementSection({ onRefresh }: { onRefresh: () => void }) {
  const [testState,     setTestState]  = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testMessage,   setTestMsg]    = useState("");
  const [rotating,      setRotating]   = useState(false);
  const [rotateError,   setRotateErr]  = useState<string | null>(null);
  const [disconnecting, setDisc]       = useState(false);
  const [discError,     setDiscErr]    = useState<string | null>(null);
  const [showDelete,    setShowDelete] = useState(false);
  const [deleting,      setDeleting]   = useState(false);
  const [deleteError,   setDeleteErr]  = useState<string | null>(null);

  const handleTest = async () => {
    setTestState("loading");
    try {
      const r = await testConnection();
      setTestState(r.ok ? "ok" : "fail");
      setTestMsg(r.message);
    } catch {
      setTestState("fail");
      setTestMsg("Could not reach the server.");
    }
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
      {showDelete && (
        <DeleteModal
          onCancel={() => { setShowDelete(false); setDeleteErr(null); }}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          error={deleteError}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
        {/* Test */}
        <div className="px-5 py-4 border-b border-white/8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-white">Test connection</p>
              <p className="text-xs text-white/30 mt-0.5">Verify the API is responding correctly.</p>
            </div>
            <button
              onClick={handleTest}
              disabled={testState === "loading"}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              {testState === "loading" ? <><Spinner className="w-3 h-3" /> Testing…</> : <><Wifi size={12} /> Test</>}
            </button>
          </div>
          {testState === "ok" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-4 py-2.5">
              <Check size={12} /> {testMessage}
            </div>
          )}
          {testState === "fail" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-2.5">
              <WifiOff size={12} /> {testMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Management</p>
          {discError   && <ErrorBanner message={discError} />}
          {rotateError && <ErrorBanner message={rotateError} />}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { redirectToYouTubeAuth(); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-purple-500/30 text-purple-300 hover:border-purple-500/50 text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
            >
              <RefreshCw size={12} /> Reconnect
            </button>
            <button
              onClick={handleRotate}
              disabled={rotating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-yellow-500/20 text-yellow-400/70 hover:text-yellow-300 hover:border-yellow-500/35 text-xs font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              {rotating ? <><Spinner className="w-3 h-3 text-yellow-300" /> Rotating…</> : <><RotateCcw size={12} /> Rotate credentials</>}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/8 text-white/40 hover:text-red-400 hover:border-red-500/25 text-xs font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              {disconnecting ? <><Spinner className="w-3 h-3" /> Disconnecting…</> : <><WifiOff size={12} /> Disconnect</>}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/15 text-red-400/60 hover:text-red-400 hover:border-red-500/35 text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
            >
              <Trash2 size={12} /> Delete credentials
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

function ActivityLogsSection() {
  const [logs,     setLogs]    = useState<ActivityLog[]>([]);
  const [loading,  setLoading] = useState(true);
  const [expanded, setExp]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setLogs(await fetchActivityLogs()); }
    catch { setLogs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const visible = expanded ? logs : logs.slice(0, 5);

  if (loading) return <SkeletonLogs />;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/70">Activity</p>
        {logs.length > 0 && (
          <span className="text-[10px] text-white/25 font-medium">{logs.length} events</span>
        )}
      </div>

      {logs.length === 0 && (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Activity will appear here as ModerateAI moderates your channel."
        />
      )}

      {logs.length > 0 && (
        <>
          <div className="divide-y divide-white/5">
            {visible.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors duration-150 group"
              >
                <StatusBadge status={log.status} />
                <p className="flex-1 text-sm text-white/55 leading-snug group-hover:text-white/70 transition-colors duration-150 truncate">
                  {log.action}
                </p>
                <span className="text-[10px] text-white/20 whitespace-nowrap shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
          {logs.length > 5 && (
            <div className="px-5 py-3 border-t border-white/8">
              <button
                onClick={() => setExp(!expanded)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-150"
              >
                {expanded ? "Show less" : `Show ${logs.length - 5} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Connection Method Selector ───────────────────────────────────────────────

function MethodSelector({
  method, onChange,
}: { method: APIMethod; onChange: (m: APIMethod) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {(["managed", "custom"] as const).map((m) => {
        const active = method === m;
        const cfg = {
          managed: {
            icon: <Server size={16} className="text-purple-400" />,
            label: "ModerateAI Shared API",
            sub: "Recommended · Zero setup",
            badge: "Recommended",
            badgeColor: "text-purple-400 border-purple-500/25 bg-purple-500/8",
            ring: "border-purple-500/40 bg-purple-500/6",
          },
          custom: {
            icon: <Cloud size={16} className="text-emerald-400" />,
            label: "My Google Cloud Project",
            sub: "Advanced · Your own quota",
            badge: "Advanced",
            badgeColor: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8",
            ring: "border-emerald-500/30 bg-emerald-500/4",
          },
        }[m];

        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200
              ${active ? cfg.ring : "border-white/8 bg-white/[0.02] hover:border-white/15"}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
              ${active ? "bg-white/8 border border-white/10" : "bg-white/4 border border-white/6"}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-white">{cfg.label}</p>
                <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full uppercase tracking-wide ${cfg.badgeColor}`}>
                  {cfg.badge}
                </span>
              </div>
              <p className="text-xs text-white/30">{cfg.sub}</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
              ${active ? "border-purple-500 bg-purple-500" : "border-white/15 bg-transparent"}`}>
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
      setMethod(data.method);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const connected = !!status?.youtubeConnected;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3.5 w-72" />
          </div>
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
            <button
              onClick={loadStatus}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 text-xs font-medium transition-all duration-200"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          )}
        </div>

        {/* Connection method selector — always visible */}
        {!connected && (
          <div className="space-y-4">
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Connection Method</p>
            <MethodSelector method={activeMethod} onChange={setMethod} />
          </div>
        )}

        {/* Pre-connection state */}
        {!connected && activeMethod === "managed" && (
          <div className="rounded-2xl border border-purple-500/15 bg-[#0d0c14] p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Server size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-1.5">Connect with ModerateAI Shared API</p>
              <p className="text-sm text-white/35 leading-relaxed max-w-sm mx-auto">
                No Google Cloud setup required. We manage the API quota and infrastructure for you.
              </p>
            </div>
            <button
              onClick={() => { redirectToYouTubeAuth(); }}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.02]"
            >
              <Youtube size={15} /> Connect YouTube
            </button>
            <p className="text-[10px] text-white/20">You&apos;ll be redirected to Google to authorize your channel.</p>
          </div>
        )}

        {!connected && activeMethod === "custom" && (
          <SetupWizard onConnected={loadStatus} />
        )}

        {/* Connected state */}
        {connected && status && (
          <>
            {/* Method indicator */}
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Connection Method</p>
              <span className="text-[10px] font-semibold text-purple-400 border border-purple-500/25 bg-purple-500/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {status.method === "managed" ? "ModerateAI Shared API" : "My Google Cloud Project"}
              </span>
            </div>

            {status.method === "managed" && status.managed && (
              <ManagedCard managed={status.managed} onRefresh={loadStatus} />
            )}
            {status.method === "custom" && status.custom && (
              <CustomProjectCard custom={status.custom} onRefresh={loadStatus} />
            )}

            <ManagementSection onRefresh={loadStatus} />
            <ActivityLogsSection />

            {/* Security footer */}
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