"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getAuth } from "firebase/auth";
import {
  Shield, ChevronRight, ChevronLeft, Copy, Eye, EyeOff,
  ExternalLink, Check, Lock, Wifi, WifiOff, RotateCcw,
  Trash2, RefreshCw, AlertTriangle, Activity, Clock, Zap, BarChart2, X,
  Cloud, Server, Loader2, Tv2 as Youtube, ImageIcon, Key, Radio,
  TrendingUp, MessageSquare, Video, ArrowUpRight, CheckCircle2,
  AlertCircle, XCircle, Cpu, Sparkles,
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

const PLAN_META: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  free_trial: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    glow: "shadow-blue-900/20",
  },
  pro: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    glow: "shadow-purple-900/20",
  },
  agency: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    glow: "shadow-amber-900/20",
  },
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
    if (s < 60)   return `${s}s ago`;
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
      <div className="px-6 py-5 border-b border-white/8 flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-5 space-y-2.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <div className="px-6 py-5 border-t border-white/5 space-y-2.5">
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

function SkeletonLogs() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/8">
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/5 last:border-0">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-2.5 w-20" />
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
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
        <Icon size={20} className="text-white/15" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/35">{title}</p>
        <p className="text-xs text-white/20 mt-1 max-w-[240px] mx-auto leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Live Health Indicator ────────────────────────────────────────────────────

function HealthIndicator({ health }: { health: HealthState }) {
  const map: Record<HealthState, { label: string; dot: string; ring: string; text: string }> = {
    healthy: {
      label: "Operational",
      dot: "bg-emerald-400",
      ring: "border-emerald-500/20 bg-emerald-500/8",
      text: "text-emerald-400",
    },
    warning: {
      label: "Degraded",
      dot: "bg-yellow-400",
      ring: "border-yellow-500/20 bg-yellow-500/8",
      text: "text-yellow-400",
    },
    offline: {
      label: "Offline",
      dot: "bg-red-400",
      ring: "border-red-500/20 bg-red-500/8",
      text: "text-red-400",
    },
    loading: {
      label: "Checking…",
      dot: "bg-white/20",
      ring: "border-white/10 bg-white/4",
      text: "text-white/30",
    },
  };
  const m = map[health];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${m.ring} ${m.text}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${m.dot} ${health === "healthy" ? "animate-pulse" : ""}`} />
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0
        ${copied
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 border border-white/10"}`}
    >
      {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> {label ?? "Copy"}</>}
    </button>
  );
}

// ─── Quota Progress Bar ───────────────────────────────────────────────────────

function QuotaBar({
  used, total, label, resetLabel,
}: { used: number; total: number; label?: string; resetLabel?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const barColor =
    pct >= 90 ? "from-red-500 to-red-400" :
    pct >= 70 ? "from-amber-500 to-amber-400" :
    "from-violet-600 via-purple-500 to-purple-400";

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center text-xs text-white/30">
        <span>{label ?? `${pct}% of limit used`}</span>
        <span className="font-mono text-white/40">{used.toLocaleString()} / {total.toLocaleString()}{resetLabel ? ` · ${resetLabel}` : ""}</span>
      </div>
      <div className="h-2 rounded-full bg-white/6 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 relative overflow-hidden`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
      {pct >= 90 && (
        <p className="text-xs text-red-400/80 flex items-center gap-1.5">
          <AlertTriangle size={10} /> Approaching limit — consider upgrading your plan.
        </p>
      )}
    </div>
  );
}

// ─── Stat Cell ────────────────────────────────────────────────────────────────

function StatCell({
  label, value, icon, valueClass = "text-white",
}: {
  label: string; value: string; icon: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="px-6 py-5 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[11px] text-white/30 font-medium">
        {icon}
        <span className="uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-base font-semibold truncate leading-tight ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS: Record<WizardStep, string> = {
  tutorial: "Watch Video",
  gcp: "Cloud Console",
  enable: "Enable API",
  oauth: "OAuth Client",
  credentials: "Add Credentials",
  connect: "Connect YouTube",
};

const WIZARD_FLOW: WizardStep[] = ["tutorial", "gcp", "enable", "oauth", "credentials", "connect"];

function StepIndicator({ current }: { current: number }) {
  const labels = WIZARD_FLOW.map((s) => STEP_LABELS[s]);
  return (
    <div className="w-full overflow-x-auto scrollbar-none pb-1">
      <div className="flex items-start min-w-max">
        {labels.map((label, i) => {
          const num    = i + 1;
          const done   = num < current;
          const active = num === current;
          return (
            <div key={label} className="flex items-start">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${done   ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/40" : ""}
                    ${active ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50 ring-4 ring-purple-500/20" : ""}
                    ${!done && !active ? "bg-white/5 border border-white/10 text-white/20" : ""}`}
                >
                  {done ? <Check size={13} /> : num}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-300 text-center max-w-[64px] leading-tight
                    ${active ? "text-purple-300" : done ? "text-emerald-500" : "text-white/18"}`}
                >
                  {label}
                </span>
              </div>
              {i < labels.length - 1 && (
                <div className={`h-px w-6 mx-1.5 mt-4 shrink-0 transition-all duration-500 ${done ? "bg-emerald-500/50" : "bg-white/6"}`} />
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
    <div className="flex gap-3 pt-2">
      {onPrev && (
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 font-medium text-sm transition-all duration-200"
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
              ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/4 text-white/18 cursor-not-allowed border border-white/8"}`}
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
    <div className="w-full rounded-xl border border-white/6 bg-white/[0.02] overflow-hidden aspect-[16/6] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2.5 text-center px-4">
        <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center">
          <ImageIcon size={14} className="text-white/15" />
        </div>
        <p className="text-xs text-white/18 font-medium">{label}</p>
        <p className="text-[10px] text-white/10">Screenshot will be added here</p>
      </div>
    </div>
  );
}

// ─── Step 1: Tutorial (Video) ─────────────────────────────────────────────────

function TutorialStep({ onNext, onPrev }: { onNext: () => void; onPrev?: () => void }) {
  const videoRef              = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);
  const [watched,  setWatched]  = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    fetch("/videos/google-cloud-setup.mp4", { method: "HEAD" })
      .then((r) => setHasVideo(r.ok))
      .catch(() => setHasVideo(false));
  }, []);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(v.currentTime);
    if (v.currentTime > v.duration * 0.9) setWatched(true);
  };

  const canContinue = isDev || hasVideo === false || watched;

  const progressPct = duration > 0 ? Math.round((progress / duration) * 100) : 0;
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Watch the setup video</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          Follow this walkthrough to connect your Google Cloud Project. It takes about 5 minutes.
        </p>
      </div>

      {/* Video card */}
      <div className="rounded-2xl border border-white/8 bg-[#0a0910] overflow-hidden shadow-xl">
        <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-[#0d0b18] to-[#0a0910]">
          {hasVideo === null && (
            <Spinner className="w-5 h-5 text-white/20" />
          )}

          {hasVideo === false && (
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/20 flex items-center justify-center">
                  <Video size={28} className="text-purple-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Clock size={10} className="text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white/60 mb-1">Tutorial video coming soon</p>
                <p className="text-xs text-white/25 leading-relaxed max-w-xs">
                  The written guide below covers everything you need to get connected.
                </p>
              </div>
              {isDev && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/6 text-xs text-purple-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Development mode — Continue is enabled
                </div>
              )}
            </div>
          )}

          {hasVideo === true && (
            <>
              <video
                ref={videoRef}
                src="/videos/google-cloud-setup.mp4"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-0"}`}
                onEnded={() => setWatched(true)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
              />
              {!playing && (
                <button
                  onClick={() => { setPlaying(true); videoRef.current?.play(); }}
                  className="relative z-10 group flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-900/60 group-hover:bg-purple-500 transition-all duration-200 group-hover:scale-105">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-0.5">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  {duration > 0 && (
                    <span className="text-xs text-white/40 font-medium">{fmtTime(duration)}</span>
                  )}
                </button>
              )}
              {watched && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-semibold">
                  <Check size={11} /> Watched
                </div>
              )}
            </>
          )}
        </div>

        {/* Progress bar */}
        {hasVideo === true && playing && (
          <div className="px-4 py-3 border-t border-white/6 flex items-center gap-3">
            <span className="text-[10px] text-white/25 font-mono w-10">{fmtTime(progress)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[10px] text-white/25 font-mono w-10 text-right">{fmtTime(duration)}</span>
          </div>
        )}
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Continue to Cloud Console" nextDisabled={!canContinue} />
    </div>
  );
}

// ─── Step 2: GCP ──────────────────────────────────────────────────────────────

function GCPStep({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Create a Google Cloud Project</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          You need a Google Cloud Project to generate API credentials. Create one if you don't have it already — it only takes a minute.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud Console · New Project" />
      <div className="space-y-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Cloud size={17} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Google Cloud Console</p>
            <p className="text-xs text-white/35 mt-0.5">Navigate to <code className="text-white/50 font-mono text-[11px]">console.cloud.google.com</code> and create a new project.</p>
          </div>
          <a
            href="https://console.cloud.google.com/projectcreate"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-xs font-semibold transition-all duration-200 shrink-0"
          >
            Open <ExternalLink size={11} />
          </a>
        </div>
        <div className="rounded-xl border border-white/6 bg-white/[0.015] px-4 py-3">
          <p className="text-[11px] text-white/30 flex items-start gap-2 leading-relaxed">
            <span className="text-amber-400 shrink-0 mt-0.5">ⓘ</span>
            Give your project a recognizable name like <span className="text-white/50 font-mono text-[11px]">moderateai-youtube</span>. You can use an existing project if it already has YouTube Data API v3 enabled.
          </p>
        </div>
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
        <p className="text-white/40 text-sm leading-relaxed">
          Search for the API in the API Library and enable it. This is required before your credentials will work.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud API Library · YouTube Data API v3 · Enable" />
      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <Youtube size={17} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">YouTube Data API v3</p>
          <p className="text-xs text-white/35 mt-0.5">In the API Library, search for <span className="text-white/50">YouTube Data API v3</span> and click Enable.</p>
        </div>
        <a
          href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all duration-200 shrink-0"
        >
          Open <ExternalLink size={11} />
        </a>
      </div>
      <div className="rounded-xl border border-white/6 bg-white/[0.015] px-4 py-3">
        <p className="text-[11px] text-white/30 flex items-start gap-2 leading-relaxed">
          <span className="text-amber-400 shrink-0 mt-0.5">ⓘ</span>
          Estimated time: <strong className="text-white/50">~1 minute</strong>. If you see a "Manage" button instead of "Enable", the API is already active.
        </p>
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
        <p className="text-white/40 text-sm leading-relaxed">
          Set up an OAuth consent screen, then create a Web Application client. Add the URIs below exactly — they must match.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud · Credentials · OAuth 2.0 Client IDs" />

      <div className="space-y-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Shield size={17} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">OAuth Consent Screen</p>
            <p className="text-xs text-white/35 mt-0.5">Configure as <span className="text-white/50">External</span> and add your app details.</p>
          </div>
          <a
            href="https://console.cloud.google.com/apis/credentials/consent"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-xs font-semibold transition-all duration-200 shrink-0"
          >
            Open <ExternalLink size={11} />
          </a>
        </div>

        {/* URI fields */}
        <div className="space-y-3">
          {[
            { label: "Authorized JavaScript Origin", value: JS_ORIGIN, hint: "Your app's root domain" },
            { label: "Authorized Redirect URI",      value: REDIRECT_URI, hint: "Where Google sends the auth code" },
          ].map(({ label, value, hint }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">{label}</label>
                <span className="text-[10px] text-white/18">{hint}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#0a0910] px-4 py-3">
                <code className="flex-1 text-purple-300 text-xs font-mono truncate">{value}</code>
                <CopyButton value={value} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Key size={17} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Create OAuth Client ID</p>
            <p className="text-xs text-white/35 mt-0.5">Application type: <span className="text-white/50">Web application</span>. Add the URIs above.</p>
          </div>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-xs font-semibold transition-all duration-200 shrink-0"
          >
            Open <ExternalLink size={11} />
          </a>
        </div>
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
        <h2 className="text-base font-semibold text-white mb-1">Add your credentials</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          Copy the Client ID and Client Secret from the OAuth client you just created in Google Cloud Console.
        </p>
      </div>
      <ScreenshotPlaceholder label="Google Cloud · OAuth Client · Download JSON or copy credentials" />
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
            className="w-full rounded-xl border border-white/10 bg-[#0a0910] px-4 py-3 text-sm text-white placeholder-white/12 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200 font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Client Secret</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl border border-white/10 bg-[#0a0910] px-4 py-3 pr-12 text-sm text-white placeholder-white/12 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200 font-mono"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors duration-150"
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex items-center gap-2 text-xs text-white/22">
        <Lock size={11} className="text-emerald-500/60 shrink-0" />
        Encrypted at rest. Never logged or exposed via the API.
      </div>
      <div className="flex gap-3 pt-1">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 font-medium text-sm transition-all duration-200"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${canSave && !saving
              ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/4 text-white/18 cursor-not-allowed border border-white/8"}`}
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
        <p className="text-white/40 text-sm leading-relaxed">
          Authorize ModerateAI to read and moderate comments on your YouTube channel.
        </p>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Youtube size={28} className="text-red-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <Check size={12} className="text-white" />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1.5">Authorize via Google OAuth</p>
          <p className="text-xs text-white/35 leading-relaxed max-w-xs mx-auto">
            A Google sign-in window will open. Select the account that owns your YouTube channel, then grant the requested permissions.
          </p>
        </div>
        <button
          onClick={() => { setConnecting(true); redirectToYouTubeAuth(); }}
          disabled={connecting}
          className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:scale-[1.02] disabled:opacity-60"
        >
          {connecting
            ? <><Spinner className="w-4 h-4" /> Redirecting to Google…</>
            : <><Youtube size={16} /> Connect YouTube</>}
        </button>
        <p className="text-[10px] text-white/18">You'll be redirected to Google. No password is stored.</p>
      </div>
      {onPrev && (
        <button
          onClick={onPrev}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 text-white/35 hover:text-white/60 hover:border-white/15 font-medium text-sm transition-all duration-200"
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
    <div className="rounded-2xl border border-purple-500/15 bg-[#080710] overflow-hidden shadow-2xl shadow-purple-900/10">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-white/6 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Google Cloud Setup</span>
        <span className="ml-auto text-[11px] text-white/20 font-medium tabular-nums">
          {stepIndex + 1} / {WIZARD_FLOW.length}
        </span>
      </div>

      {/* Step indicator */}
      <div className="px-6 py-5 border-b border-white/5">
        <StepIndicator current={stepIndex + 1} />
      </div>

      {/* Step content */}
      <div className="px-6 py-6">
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
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0910] shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onCancel} disabled={loading} className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors disabled:opacity-40">
          <X size={16} />
        </button>
        <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1.5">Delete credentials?</h3>
          <p className="text-sm text-white/40 leading-relaxed">
            This removes your OAuth credentials from ModerateAI. Active moderation will stop immediately. You can reconnect at any time.
          </p>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex gap-3 pt-1">
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

const LOG_ICON: Record<LogStatus, React.ReactNode> = {
  success: <CheckCircle2 size={11} />,
  warning: <AlertCircle size={11} />,
  error:   <XCircle size={11} />,
  info:    <Activity size={11} />,
};

function StatusBadge({ status }: { status: LogStatus }) {
  const map: Record<LogStatus, { label: string; c: string }> = {
    success: { label: "Success", c: "bg-emerald-500/10 text-emerald-400 border-emerald-500/18" },
    warning: { label: "Warning", c: "bg-amber-500/10 text-amber-400 border-amber-500/18" },
    error:   { label: "Error",   c: "bg-red-500/10 text-red-400 border-red-500/18" },
    info:    { label: "Info",    c: "bg-blue-500/10 text-blue-400 border-blue-500/18" },
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${map[status].c}`}>
      {LOG_ICON[status]}
      {map[status].label}
    </span>
  );
}

// ─── Managed Dashboard Card ───────────────────────────────────────────────────

function ManagedCard({ managed, onRefresh }: { managed: ManagedUsage; onRefresh: () => void }) {
  const planLimit = PLAN_LIMITS[managed.plan] ?? managed.actionsTotal;
  const used      = managed.actionsUsed;
  const meta      = PLAN_META[managed.plan] ?? PLAN_META.pro;
  const health: HealthState =
    managed.apiStatus === "operational" ? "healthy" :
    managed.apiStatus === "degraded"    ? "warning" : "offline";

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
    <div className="rounded-2xl border border-white/8 bg-[#080710] overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/6 flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-purple-500/12 border border-purple-500/20 flex items-center justify-center shrink-0">
          <Server size={16} className="text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">ModerateAI Shared API</p>
          <p className="text-xs text-white/30 mt-0.5">YouTube Data API v3 · Managed infrastructure</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <HealthIndicator health={health} />
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${meta.color} ${meta.bg} ${meta.border} uppercase tracking-wide`}>
            {managed.planLabel}
          </span>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.04]">
        <StatCell
          label="Current Plan"
          value={managed.planLabel}
          icon={<Sparkles size={12} className={meta.color} />}
          valueClass={meta.color}
        />
        <StatCell
          label="Actions Used"
          value={used.toLocaleString()}
          icon={<Zap size={12} className="text-amber-400" />}
        />
        <StatCell
          label="Remaining"
          value={managed.actionsRemaining.toLocaleString()}
          icon={<BarChart2 size={12} className="text-emerald-400" />}
          valueClass="text-emerald-400"
        />
        <StatCell
          label="Resets"
          value={fmt(managed.resetDate, { month: "short", day: "numeric" })}
          icon={<Clock size={12} className="text-blue-400" />}
          valueClass="text-white/60"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/[0.04] border-t border-white/[0.04]">
        <StatCell
          label="Today's Requests"
          value={managed.todayRequests.toLocaleString()}
          icon={<TrendingUp size={12} className="text-blue-400" />}
        />
        <StatCell
          label="Moderated"
          value={managed.commentsModerated.toLocaleString()}
          icon={<MessageSquare size={12} className="text-purple-400" />}
        />
        <StatCell
          label="AI Replies"
          value={managed.repliesGenerated.toLocaleString()}
          icon={<Zap size={12} className="text-amber-400" />}
        />
        <StatCell
          label="Videos"
          value={managed.videosMonitored.toLocaleString()}
          icon={<Video size={12} className="text-red-400" />}
        />
      </div>

      {/* API Health stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.04] border-t border-white/[0.04]">
        <StatCell
          label="Success Rate"
          value={`${managed.successRate}%`}
          icon={<CheckCircle2 size={12} className="text-emerald-400" />}
          valueClass={managed.successRate >= 99 ? "text-emerald-400" : managed.successRate >= 95 ? "text-amber-400" : "text-red-400"}
        />
        <StatCell
          label="Latency"
          value={`${managed.latencyMs}ms`}
          icon={<Cpu size={12} className="text-blue-400" />}
          valueClass={managed.latencyMs < 200 ? "text-emerald-400" : managed.latencyMs < 500 ? "text-amber-400" : "text-red-400"}
        />
        <StatCell
          label="Channels"
          value={managed.connectedChannels.toLocaleString()}
          icon={<Youtube size={12} className="text-red-400" />}
        />
        <StatCell
          label="Last Sync"
          value={lastSyncDisplay}
          icon={<Radio size={12} className="text-purple-400" />}
          valueClass="text-white/55"
        />
      </div>

      {/* Quota bar */}
      <div className="px-6 py-5 border-t border-white/5">
        <QuotaBar
          used={used}
          total={planLimit}
          label={`${Math.min(100, Math.round((used / planLimit) * 100))}% of monthly limit used`}
          resetLabel={`resets ${fmt(managed.resetDate, { month: "short", day: "numeric" })}`}
        />
      </div>

      {/* Upgrade CTA */}
      {used / planLimit >= 0.8 && managed.plan !== "agency" && (
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between gap-4 bg-gradient-to-r from-purple-900/20 to-transparent">
          <p className="text-xs text-white/45 leading-snug">
            You're using <span className="text-white/65 font-semibold">{Math.round((used / planLimit) * 100)}%</span> of your monthly limit. Upgrade to avoid interruptions.
          </p>
          <a
            href="/billing"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all duration-200 shrink-0 hover:scale-[1.02] shadow-lg shadow-purple-900/30"
          >
            Upgrade <ArrowUpRight size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Custom Project Card ──────────────────────────────────────────────────────

function CustomProjectCard({ custom, onRefresh }: { custom: CustomProjectInfo; onRefresh: () => void }) {
  const used = custom.dailyQuota - custom.remainingQuota;

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
    custom.oauthStatus === "expired"   ? "text-amber-400" : "text-red-400";
  const apiColor = custom.apiStatus === "enabled" ? "text-emerald-400" : "text-red-400";

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080710] overflow-hidden shadow-lg">
      <div className="px-6 py-5 border-b border-white/6 flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Cloud size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{custom.projectName || "My Google Cloud Project"}</p>
          <p className="text-xs text-white/30 mt-0.5">Google Cloud · YouTube Data API v3</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20 bg-emerald-500/8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400">Connected</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-white/[0.04]">
        <StatCell label="Account"        value={custom.connectedAccount || "—"}   icon={<Wifi size={12} className="text-blue-400" />} />
        <StatCell label="OAuth"          value={custom.oauthStatus === "connected" ? "Connected" : custom.oauthStatus === "expired" ? "Expired" : "Disconnected"} icon={<Lock size={12} className="text-purple-400" />} valueClass={oauthColor} />
        <StatCell label="API"            value={custom.apiStatus === "enabled" ? "Enabled" : "Disabled"} icon={<Youtube size={12} className="text-red-400" />} valueClass={apiColor} />
        <StatCell label="Last Sync"      value={lastSyncDisplay} icon={<Clock size={12} className="text-blue-400" />} valueClass="text-white/55" />
        <StatCell label="Daily Used"     value={`${used.toLocaleString()} / ${custom.dailyQuota.toLocaleString()}`} icon={<BarChart2 size={12} className="text-emerald-400" />} />
        <StatCell label="Remaining Today" value={custom.remainingQuota.toLocaleString()} icon={<Zap size={12} className="text-amber-400" />} />
      </div>

      <div className="px-6 py-5 border-t border-white/5">
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

// ─── Management Section ───────────────────────────────────────────────────────

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

      <div className="rounded-2xl border border-white/8 bg-[#080710] overflow-hidden">
        {/* Test connection */}
        <div className="px-6 py-5 border-b border-white/6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-white">Test connection</p>
              <p className="text-xs text-white/30 mt-0.5">Verify the API is responding correctly.</p>
            </div>
            <button
              onClick={handleTest}
              disabled={testState === "loading"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
            >
              {testState === "loading" ? <><Spinner className="w-3.5 h-3.5" /> Testing…</> : <><Wifi size={13} /> Test Connection</>}
            </button>
          </div>
          {testState === "ok" && (
            <div className="mt-3.5 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-4 py-3">
              <CheckCircle2 size={13} /> {testMessage}
            </div>
          )}
          {testState === "fail" && (
            <div className="mt-3.5 flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
              <WifiOff size={13} /> {testMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest">Management</p>
          {discError   && <ErrorBanner message={discError} />}
          {rotateError && <ErrorBanner message={rotateError} />}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => { redirectToYouTubeAuth(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-500/25 text-purple-300 hover:border-purple-500/45 hover:bg-purple-500/8 text-xs font-medium transition-all duration-200"
            >
              <RefreshCw size={13} /> Reconnect
            </button>
            <button
              onClick={handleRotate}
              disabled={rotating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/18 text-amber-400/70 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/6 text-xs font-medium transition-all duration-200 disabled:opacity-50"
            >
              {rotating ? <><Spinner className="w-3 h-3" /> Rotating…</> : <><RotateCcw size={13} /> Rotate credentials</>}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-white/35 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 text-xs font-medium transition-all duration-200 disabled:opacity-50"
            >
              {disconnecting ? <><Spinner className="w-3 h-3" /> Disconnecting…</> : <><WifiOff size={13} /> Disconnect</>}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/15 text-red-400/55 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/6 text-xs font-medium transition-all duration-200"
            >
              <Trash2 size={13} /> Delete credentials
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

const ACTIVITY_LABEL: Record<string, string> = {
  connected:         "Channel connected",
  channel_synced:    "Channel synced",
  comment_moderated: "Comment moderated",
  ai_reply:          "AI reply generated",
  quota_updated:     "Quota updated",
  background_scan:   "Background scan completed",
};

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

  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const visible = expanded ? logs : logs.slice(0, 5);

  if (loading) return <SkeletonLogs />;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#080710] overflow-hidden">
      <div className="px-6 py-5 border-b border-white/6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity size={14} className="text-white/25" />
          <p className="text-sm font-semibold text-white/70">Activity Feed</p>
        </div>
        {logs.length > 0 && (
          <span className="text-[11px] text-white/20 font-medium">{logs.length} events</span>
        )}
      </div>

      {logs.length === 0 && (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Events will appear here as ModerateAI moderates your channel."
        />
      )}

      {logs.length > 0 && (
        <>
          <div className="divide-y divide-white/4">
            {visible.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.015] transition-colors duration-150 group"
              >
                <StatusBadge status={log.status} />
                <p className="flex-1 text-sm text-white/50 group-hover:text-white/65 transition-colors duration-150 truncate">
                  {ACTIVITY_LABEL[log.action] ?? log.action}
                </p>
                <span className="text-[11px] text-white/18 font-mono whitespace-nowrap shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
          {logs.length > 5 && (
            <div className="px-6 py-4 border-t border-white/6">
              <button
                onClick={() => setExp(!expanded)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-150"
              >
                {expanded ? "Show less" : `Show ${logs.length - 5} more events`}
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
  const options: Array<{
    id: APIMethod;
    icon: React.ReactNode;
    label: string;
    sub: string;
    badge: string;
    badgeClass: string;
    activeRing: string;
    iconBg: string;
  }> = [
    {
      id: "managed",
      icon: <Server size={17} className="text-purple-400" />,
      label: "ModerateAI Shared API",
      sub: "Zero setup · We manage the infrastructure",
      badge: "Recommended",
      badgeClass: "text-purple-400 border-purple-500/25 bg-purple-500/8",
      activeRing: "border-purple-500/35 bg-purple-500/5 shadow-lg shadow-purple-900/10",
      iconBg: "bg-purple-500/12 border-purple-500/20",
    },
    {
      id: "custom",
      icon: <Cloud size={17} className="text-emerald-400" />,
      label: "My Google Cloud Project",
      sub: "Advanced · Use your own API quota",
      badge: "Advanced",
      badgeClass: "text-emerald-400 border-emerald-500/25 bg-emerald-500/8",
      activeRing: "border-emerald-500/25 bg-emerald-500/4 shadow-lg shadow-emerald-900/10",
      iconBg: "bg-emerald-500/12 border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const active = method === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200
              ${active ? opt.activeRing : "border-white/7 bg-white/[0.018] hover:border-white/12 hover:bg-white/[0.025]"}`}
          >
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${opt.iconBg}`}>
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-semibold text-white">{opt.label}</p>
                <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wide ${opt.badgeClass}`}>
                  {opt.badge}
                </span>
              </div>
              <p className="text-xs text-white/28 leading-relaxed">{opt.sub}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200
              ${active ? "border-purple-500 bg-purple-500" : "border-white/12 bg-transparent"}`}>
              {active && <div className="w-2 h-2 rounded-full bg-white" />}
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
      <div className="min-h-screen bg-[#080710] text-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <SkeletonCard />
          <SkeletonLogs />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080710] text-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-7">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">API Access</h1>
            <p className="text-white/35 text-sm">
              {connected
                ? "Manage how ModerateAI connects to the YouTube Data API."
                : "Connect your account to start moderating comments with AI."}
            </p>
          </div>
          {connected && (
            <button
              onClick={loadStatus}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-white/35 hover:text-white/65 hover:border-white/15 text-xs font-medium transition-all duration-200"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          )}
        </div>

        {/* Pre-connection: always show method selector */}
        {!connected && (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold text-white/22 uppercase tracking-widest mb-3">Choose Connection Method</p>
              <MethodSelector method={activeMethod} onChange={setMethod} />
            </div>

            {activeMethod === "managed" && (
              <div className="rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-950/30 to-[#080710] p-8 flex flex-col items-center gap-6 text-center shadow-xl shadow-purple-900/10">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/12 border border-purple-500/20 flex items-center justify-center">
                  <Server size={26} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white mb-2">Connect with ModerateAI Shared API</p>
                  <p className="text-sm text-white/35 leading-relaxed max-w-xs mx-auto">
                    No Google Cloud setup required. We manage the API quota and infrastructure — just authorize your channel.
                  </p>
                </div>
                <div className="space-y-3 w-full max-w-xs">
                  <button
                    onClick={() => { redirectToYouTubeAuth(); }}
                    className="w-full flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.02]"
                  >
                    <Youtube size={16} /> Connect YouTube
                  </button>
                  <div className="flex items-center justify-center gap-4 text-[10px] text-white/20">
                    <span className="flex items-center gap-1"><Lock size={9} /> Encrypted</span>
                    <span className="flex items-center gap-1"><Shield size={9} /> No password stored</span>
                    <span className="flex items-center gap-1"><Check size={9} /> Free to connect</span>
                  </div>
                </div>
              </div>
            )}

            {activeMethod === "custom" && (
              <SetupWizard onConnected={loadStatus} />
            )}
          </div>
        )}

        {/* Connected state */}
        {connected && status && (
          <>
            {/* Method label */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-bold text-white/20 uppercase tracking-widest">Connection</span>
              <span className="text-[11px] font-semibold text-purple-400 border border-purple-500/25 bg-purple-500/8 px-2.5 py-1 rounded-full uppercase tracking-wide">
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
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/4 px-6 py-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-300 mb-1">Security & Privacy</p>
                <p className="text-xs text-white/28 leading-relaxed">
                  Your credentials are encrypted at rest using AES-256 and never exposed via the API. You can remove access from your account at any time.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}