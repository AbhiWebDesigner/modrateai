"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Shield, ChevronRight, ChevronLeft, Copy, Eye, EyeOff,
  ExternalLink, Check, Lock, Wifi, WifiOff, RotateCcw,
  Trash2, RefreshCw, AlertTriangle, Activity, Clock, Zap, BarChart2, X,
  Cloud, Server, Loader2, AlertCircle, Play, SkipForward,
  CheckCircle2, Circle, Youtube,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type APIMethod  = "managed" | "custom";
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
type LogStatus  = "success" | "warning" | "error" | "info";

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
}

interface CustomProjectInfo {
  projectName: string;
  oauthStatus: "connected" | "disconnected" | "expired";
  connectionStatus: "active" | "inactive" | "error";
  dailyQuota: number;
  remainingQuota: number;
  lastVerified: string | null;
  lastSync: string | null;
}

interface APIStatus {
  method: APIMethod;
  managed?: ManagedUsage;
  custom?: CustomProjectInfo;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAPIStatus(): Promise<APIStatus> {
  const res = await fetch("/api/settings/api-access", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load API status (${res.status})`);
  return res.json();
}

async function switchAPIMethod(method: APIMethod): Promise<void> {
  const res = await fetch("/api/settings/api-access/method", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method }),
  });
  if (!res.ok) throw new Error("Failed to switch API method");
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

async function testConnection(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch("/api/settings/api-access/test", { method: "POST" });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, message: body.message ?? (res.ok ? "Connection successful." : "Connection failed.") };
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

async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const res = await fetch("/api/settings/api-access/logs", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load activity logs");
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

// ─── Primitives ───────────────────────────────────────────────────────────────

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin`} />;
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
      <AlertCircle size={14} className="shrink-0" />
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

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = ["Tutorial", "Cloud Project", "Enable API", "OAuth Client", "Credentials", "Connect"];

function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
      <div className="flex items-center min-w-max">
        {STEPS.map((label, i) => {
          const num    = (i + 1) as WizardStep;
          const done   = num < current;
          const active = num === current;
          return (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                  ${done   ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/40" : ""}
                  ${active ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/40 ring-4 ring-purple-500/15" : ""}
                  ${!done && !active ? "bg-transparent border-white/15 text-white/25" : ""}`}>
                  {done ? <Check size={12} /> : num}
                </div>
                <span className={`text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors duration-300
                  ${active ? "text-purple-300" : done ? "text-emerald-500" : "text-white/20"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 mx-2 mb-5 transition-all duration-500 ${done ? "bg-emerald-600/60" : "bg-white/8"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nav Buttons ──────────────────────────────────────────────────────────────

function NavButtons({ onPrev, onNext, nextLabel = "Continue", nextDisabled = false, loading = false }: {
  onPrev?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div className="flex gap-2.5 pt-1">
      {onPrev && (
        <button onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200">
          <ChevronLeft size={15} /> Back
        </button>
      )}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${!nextDisabled && !loading
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"}`}>
          {loading ? <><Spinner className="w-3.5 h-3.5" /> Processing…</> : <>{nextLabel} <ChevronRight size={15} /></>}
        </button>
      )}
    </div>
  );
}

// ─── Step 1 — Tutorial ────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const [watched, setWatched] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = () => setWatched(true);
  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  const topics = [
    "Create a Google Cloud Project",
    "Enable the YouTube Data API",
    "Set up OAuth Consent Screen",
    "Create OAuth Client credentials",
    "Copy your Client ID & Secret",
    "Connect ModerateAI to YouTube",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Watch the setup tutorial</h2>
        <p className="text-white/40 text-sm">Optional — skip if you've done this before.</p>
      </div>

      {/* Video card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="relative aspect-video bg-[#0d0c14] flex items-center justify-center group">
          <video
            ref={videoRef}
            src="/videos/google-cloud-setup.mp4"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-0"}`}
            onEnded={handleVideoEnd}
          />
          {!playing && (
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-900/60 hover:bg-purple-500 cursor-pointer transition-all duration-200 hover:scale-105 group-hover:shadow-purple-900/80"
                onClick={handlePlay}>
                <Play size={20} className="text-white ml-0.5" fill="white" />
              </div>
              <p className="text-xs text-white/30 font-medium">Play tutorial</p>
            </div>
          )}
          {watched && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-semibold backdrop-blur-sm">
              <Check size={10} /> Watched
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-white/35">
            <Clock size={12} />
            <span>2–3 min</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {topics.map((t) => (
              <span key={t} className="flex items-center gap-1 text-[10px] text-white/30">
                <Check size={9} className="text-emerald-500/60" /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button onClick={() => setWatched(true)}
          className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors duration-150">
          <SkipForward size={12} /> Skip — I know this already
        </button>
        <button onClick={onNext} disabled={!watched}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${watched
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"}`}>
          Continue <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — Google Cloud Project ───────────────────────────────────────────

function Step2({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const cards = [
    {
      title: "Create Project",
      desc: "Create a new Google Cloud project to host your YouTube API credentials.",
      url: "https://console.cloud.google.com/projectcreate",
    },
    {
      title: "Enable YouTube API",
      desc: "Enable the YouTube Data API v3 from the API Library.",
      url: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    },
    {
      title: "OAuth Consent Screen",
      desc: "Configure the consent screen shown to users when they authorize your app.",
      url: "https://console.cloud.google.com/apis/credentials/consent",
    },
    {
      title: "Create OAuth Client",
      desc: "Create OAuth 2.0 credentials under APIs & Services → Credentials.",
      url: "https://console.cloud.google.com/apis/credentials",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Open Google Cloud Console</h2>
        <p className="text-white/40 text-sm">Complete each step in order. Come back here after each one.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(({ title, desc, url }, i) => (
          <a key={title} href={url} target="_blank" rel="noopener noreferrer"
            className="group relative rounded-xl border border-white/8 bg-white/[0.025] hover:border-purple-500/30 hover:bg-purple-500/5 p-4 transition-all duration-200 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-600/25 border border-purple-500/25 flex items-center justify-center text-[10px] font-bold text-purple-300 shrink-0">
                {i + 1}
              </div>
              <ExternalLink size={12} className="text-white/15 group-hover:text-purple-400 transition-colors duration-200 shrink-0 mt-0.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-0.5">{title}</p>
              <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
            </div>
          </a>
        ))}
      </div>

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="I've set up my project" />
    </div>
  );
}

// ─── Step 3 — Enable API ─────────────────────────────────────────────────────

function Step3({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const steps = [
    { n: "1", text: 'In the left sidebar, go to "APIs & Services" → "Library".' },
    { n: "2", text: 'Search for "YouTube Data API v3" and click the result.' },
    { n: "3", text: 'Click "Enable" and wait for the API to activate.' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Enable YouTube Data API v3</h2>
        <p className="text-white/40 text-sm">The API must be enabled before credentials will work.</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.025] divide-y divide-white/5 overflow-hidden">
        {steps.map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3 px-4 py-3.5">
            <span className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/25 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
            <p className="text-sm text-white/55 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open API Library <ExternalLink size={13} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="API is enabled" />
    </div>
  );
}

// ─── Step 4 — OAuth Client ────────────────────────────────────────────────────

const CALLBACK_URL = "https://moderateai.site/api/auth/google/callback";

function Step4({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CALLBACK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    'Go to "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID".',
    'Set Application Type to "Web application".',
    "Add the callback URL below as an Authorised Redirect URI.",
    "Click Create, then copy the Client ID and Client Secret.",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Create OAuth 2.0 client</h2>
        <p className="text-white/40 text-sm">Add the callback URL exactly as shown — no trailing slash.</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.025] divide-y divide-white/5 overflow-hidden">
        {steps.map((text, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5">
            <span className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/25 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-sm text-white/55 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Callback URL</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d0c14] px-4 py-3">
          <code className="flex-1 text-purple-300 text-xs font-mono truncate">{CALLBACK_URL}</code>
          <button onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 shrink-0
              ${copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25" : "bg-purple-600/20 text-purple-300 hover:bg-purple-600/35 border border-purple-500/25"}`}>
            {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
          </button>
        </div>
      </div>

      <a href="https://console.cloud.google.com/apis/credentials"
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open Credentials Page <ExternalLink size={13} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Credentials created" />
    </div>
  );
}

// ─── Step 5 — Add Credentials ─────────────────────────────────────────────────

function Step5({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [clientId, setClientId]         = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

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
        <h2 className="text-lg font-semibold text-white mb-1">Add your credentials</h2>
        <p className="text-white/40 text-sm">Paste the credentials from Google Console. Encrypted at rest, never exposed.</p>
      </div>

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
            <button onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors duration-150">
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex items-center gap-2 text-xs text-white/25">
        <Lock size={11} className="text-emerald-500/50 shrink-0" />
        Encrypted before storage. Never logged or exposed via API.
      </div>

      <div className="flex gap-2.5 pt-1">
        <button onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-medium text-sm transition-all duration-200">
          <ChevronLeft size={15} /> Back
        </button>
        <button onClick={handleSave} disabled={!canSave || saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${canSave && !saving
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"}`}>
          {saving ? <><Spinner className="w-3.5 h-3.5" /> Saving…</> : <><Lock size={13} /> Save Credentials</>}
        </button>
      </div>
    </div>
  );
}

// ─── Step 6 — Connect YouTube ─────────────────────────────────────────────────

function Step6({ onPrev, onComplete }: { onPrev: () => void; onComplete: () => void }) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = "/api/auth/youtube";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Connect YouTube</h2>
        <p className="text-white/40 text-sm">Authorize ModerateAI to access your YouTube channel using your credentials.</p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-8 flex flex-col items-center gap-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Youtube size={28} className="text-red-400" />
        </div>
        <div>
          <p className="text-white font-semibold mb-1">Authorize YouTube access</p>
          <p className="text-white/35 text-sm leading-relaxed max-w-xs mx-auto">
            You'll be redirected to Google to grant read and manage access to your channel's comments.
          </p>
        </div>
        <button onClick={handleConnect} disabled={connecting}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/40 hover:scale-[1.02] disabled:opacity-60">
          {connecting ? <><Spinner className="w-3.5 h-3.5" /> Redirecting…</> : <><Youtube size={15} /> Connect YouTube</>}
        </button>
      </div>

      <button onClick={onPrev}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/8 text-white/40 hover:text-white/70 hover:border-white/15 font-medium text-sm transition-all duration-200">
        <ChevronLeft size={15} /> Back
      </button>
    </div>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizard({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState<WizardStep>(1);
  const next = () => setStep((s) => Math.min(s + 1, 6) as WizardStep);
  const prev = () => setStep((s) => Math.max(s - 1, 1) as WizardStep);

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-[#0d0c14] overflow-hidden shadow-2xl shadow-purple-900/20">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Setup Wizard</span>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-all duration-150">
          <X size={14} />
        </button>
      </div>
      <div className="px-5 py-4 border-b border-white/5">
        <StepIndicator current={step} />
      </div>
      <div className="px-5 py-5">
        {step === 1 && <Step1 onNext={next} />}
        {step === 2 && <Step2 onNext={next} onPrev={prev} />}
        {step === 3 && <Step3 onNext={next} onPrev={prev} />}
        {step === 4 && <Step4 onNext={next} onPrev={prev} />}
        {step === 5 && <Step5 onNext={next} onPrev={prev} />}
        {step === 6 && <Step6 onPrev={prev} onComplete={onComplete} />}
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
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0c14] shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} disabled={loading}
          className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors disabled:opacity-40">
          <X size={15} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 size={18} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Delete credentials?</h3>
          <p className="text-sm text-white/40 leading-relaxed">This removes your Google Cloud credentials. Active moderation will stop immediately. You can reconnect at any time.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
          <AlertTriangle size={12} className="text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300/70">Active moderation will stop immediately.</p>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2">
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
    warning: { label: "Warning", c: "bg-yellow-500/12 text-yellow-400 border-yellow-500/20"  },
    error:   { label: "Error",   c: "bg-red-500/12 text-red-400 border-red-500/20"            },
    info:    { label: "Info",    c: "bg-blue-500/12 text-blue-400 border-blue-500/20"          },
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide shrink-0 ${map[status].c}`}>
      {map[status].label}
    </span>
  );
}

// ─── Connection Status Section ────────────────────────────────────────────────

function ConnectionSection({
  activeMethod, status, onRefresh,
}: {
  activeMethod: APIMethod; status: APIStatus | null; onRefresh: () => void;
}) {
  const [testState, setTestState]     = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [rotating, setRotating]       = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const [disconnecting, setDisc]      = useState(false);
  const [discError, setDiscError]     = useState<string | null>(null);
  const [showDelete, setShowDelete]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isManaged = activeMethod === "managed";
  const custom    = status?.custom;
  const managed   = status?.managed;

  const isConnected = isManaged ? !!managed : custom?.connectionStatus === "active";
  const connLabel   = isManaged ? "Connected"
    : custom?.connectionStatus === "active" ? "Connected"
    : custom?.connectionStatus === "error"  ? "Error"
    : "Disconnected";

  const connRing  = isConnected ? "border-emerald-500/25 bg-emerald-500/8"  : connLabel === "Error" ? "border-red-500/25 bg-red-500/8" : "border-white/10 bg-white/[0.03]";
  const dotColor  = isConnected ? "bg-emerald-400 animate-pulse" : connLabel === "Error" ? "bg-red-400" : "bg-white/20";
  const textColor = isConnected ? "text-emerald-400" : connLabel === "Error" ? "text-red-400" : "text-white/35";

  const handleTest = async () => {
    setTestState("loading");
    try {
      const r = await testConnection();
      setTestState(r.ok ? "ok" : "fail");
      setTestMessage(r.message);
    } catch {
      setTestState("fail");
      setTestMessage("Could not reach the server.");
    }
  };

  const handleRotate = async () => {
    setRotating(true); setRotateError(null);
    try { await rotateCredentials(); onRefresh(); }
    catch (e) { setRotateError(e instanceof Error ? e.message : "Rotation failed."); }
    finally { setRotating(false); }
  };

  const handleDisconnect = async () => {
    setDisc(true); setDiscError(null);
    try { await disconnectChannel(); onRefresh(); }
    catch (e) { setDiscError(e instanceof Error ? e.message : "Disconnect failed."); }
    finally { setDisc(false); }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true); setDeleteError(null);
    try { await deleteCredentials(); setShowDelete(false); onRefresh(); }
    catch (e) { setDeleteError(e instanceof Error ? e.message : "Delete failed."); }
    finally { setDeleting(false); }
  };

  // Managed stats — only render if data exists
  const managedStats = managed ? [
    { label: "Plan",       value: managed.planLabel,                        icon: <Server size={12} className="text-purple-400" />  },
    { label: "Used",       value: managed.actionsUsed.toLocaleString(),      icon: <Zap size={12} className="text-yellow-400" />    },
    { label: "Remaining",  value: managed.actionsRemaining.toLocaleString(), icon: <BarChart2 size={12} className="text-green-400" /> },
    { label: "Resets",     value: fmt(managed.resetDate, { month: "short", day: "numeric" }), icon: <Clock size={12} className="text-blue-400" /> },
  ] : null;

  // Custom stats — only render if data exists
  const customStats = custom ? [
    { label: "Project",   value: custom.projectName || "—",                                  icon: <Server size={12} className="text-purple-400" />   },
    { label: "OAuth",     value: custom.oauthStatus === "connected" ? "Connected" : custom.oauthStatus === "expired" ? "Expired" : "Disconnected", icon: <Wifi size={12} className="text-blue-400" /> },
    { label: "Remaining", value: custom.remainingQuota?.toLocaleString() ?? "—",             icon: <BarChart2 size={12} className="text-green-400" /> },
    { label: "Last Sync", value: fmt(custom.lastSync),                                       icon: <Clock size={12} className="text-blue-400" />      },
  ] : null;

  const stats = isManaged ? managedStats : customStats;

  return (
    <>
      {showDelete && (
        <DeleteModal
          onCancel={() => { setShowDelete(false); setDeleteError(null); }}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          error={deleteError}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${isManaged ? "bg-purple-500/12 border-purple-500/20" : "bg-emerald-500/12 border-emerald-500/20"}`}>
              {isManaged ? <Server size={14} className="text-purple-400" /> : <Cloud size={14} className="text-emerald-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {isManaged ? "ModerateAI Managed API" : (custom?.projectName ?? "Your Google Cloud Project")}
              </p>
              <p className="text-xs text-white/30">
                {isManaged ? "Managed · YouTube Data API v3" : "Google Cloud · YouTube Data API v3"}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${connRing}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            <span className={textColor}>{connLabel}</span>
          </span>
        </div>

        {/* Stats */}
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/5">
            {stats.map(({ label, value, icon }) => (
              <div key={label} className="px-4 py-3.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium uppercase tracking-wide">{icon}{label}</div>
                <p className="text-sm font-semibold text-white truncate">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-4 text-center">
            <p className="text-sm text-white/25">
              {isManaged ? "No managed API data available." : "Connect your Google Cloud project to see stats."}
            </p>
          </div>
        )}

        {/* Test Connection */}
        <div className="px-5 py-4 border-t border-white/8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-white">Test connection</p>
              <p className="text-xs text-white/30 mt-0.5">Verify the API is responding.</p>
            </div>
            <button onClick={handleTest} disabled={testState === "loading"}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/25 text-purple-300 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50">
              {testState === "loading" ? <><Spinner className="w-3 h-3" /> Testing…</> : <><Wifi size={12} /> Test</>}
            </button>
          </div>
          {testState === "ok" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-4 py-2.5">
              <CheckCircle2 size={12} /> {testMessage}
            </div>
          )}
          {testState === "fail" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-2.5">
              <WifiOff size={12} /> {testMessage}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-white/8 space-y-3">
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Actions</p>
          {discError   && <ErrorBanner message={discError} />}
          {rotateError && <ErrorBanner message={rotateError} />}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { window.location.href = "/api/auth/youtube"; }}
              disabled={isConnected}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200
                ${!isConnected ? "border-purple-500/35 text-purple-300 hover:border-purple-500/55 hover:scale-[1.02]" : "border-white/8 text-white/20 cursor-not-allowed"}`}>
              <RefreshCw size={12} /> Reconnect
            </button>
            <button onClick={handleRotate} disabled={rotating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-yellow-500/20 text-yellow-400/70 hover:text-yellow-300 hover:border-yellow-500/35 text-xs font-medium transition-all duration-200 hover:scale-[1.02]">
              {rotating ? <><Spinner className="w-3 h-3 text-yellow-300" /> Rotating…</> : <><RotateCcw size={12} /> Rotate credentials</>}
            </button>
            <button onClick={handleDisconnect} disabled={disconnecting || !isConnected}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200
                ${isConnected ? "border-white/8 text-white/45 hover:text-red-400 hover:border-red-500/25 hover:scale-[1.02]" : "border-white/8 text-white/20 cursor-not-allowed"}`}>
              {disconnecting ? <><Spinner className="w-3 h-3" /> Disconnecting…</> : <><WifiOff size={12} /> Disconnect</>}
            </button>
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/15 text-red-400/60 hover:text-red-400 hover:border-red-500/35 text-xs font-medium transition-all duration-200 hover:scale-[1.02]">
              <Trash2 size={12} /> Delete credentials
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Managed Usage ────────────────────────────────────────────────────────────

function ManagedUsageSection({ usage }: { usage: ManagedUsage | undefined }) {
  if (!usage) return null;

  const pct      = usage.actionsTotal > 0 ? Math.min(100, Math.round((usage.actionsUsed / usage.actionsTotal) * 100)) : 0;
  const barColor = pct >= 90 ? "from-red-600 to-red-400" : pct >= 70 ? "from-yellow-600 to-yellow-400" : "from-purple-600 to-purple-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/70">Monthly Usage</p>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-purple-500/25 bg-purple-500/10 text-purple-400 uppercase tracking-wide">
          {usage.planLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">Actions used</span>
            <Zap size={12} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{usage.actionsUsed.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-white/25">
              <span>{pct}% of limit</span>
              <span>{usage.actionsTotal.toLocaleString()} total</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">Remaining</span>
            <BarChart2 size={12} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{usage.actionsRemaining.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-white/25">
              <span>{100 - pct}% left</span>
              <span>Resets {fmt(usage.resetDate, { month: "short", day: "numeric" })}</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Usage ─────────────────────────────────────────────────────────────

function CustomUsageSection({ custom }: { custom: CustomProjectInfo | undefined }) {
  if (!custom) return null;

  const used = custom.dailyQuota - custom.remainingQuota;
  const pct  = custom.dailyQuota > 0 ? Math.min(100, Math.round((used / custom.dailyQuota) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <p className="text-sm font-semibold text-white/70">Daily Quota</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">Used today</span>
            <Zap size={12} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{used.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-white/25">
              <span>{pct}% of quota</span>
              <span>{custom.dailyQuota.toLocaleString()} limit</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">Remaining</span>
            <BarChart2 size={12} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{custom.remainingQuota.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-white/25">
              <span>{100 - pct}% left</span>
              <span>Resets midnight PT</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

function ActivityLogsSection() {
  const [logs, setLogs]     = useState<ActivityLog[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [expanded, setExp]  = useState(false);

  const load = useCallback(async () => {
    setLoad(true); setError(null);
    try { setLogs(await fetchActivityLogs()); }
    catch { setError("Failed to load activity logs."); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = expanded ? logs : logs.slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/70">Activity</p>
        {!loading && !error && logs.length > 0 && (
          <span className="text-[10px] text-white/25 font-medium">{logs.length} events</span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-white/20 text-sm">
          <Spinner className="w-4 h-4" /> Loading…
        </div>
      )}

      {!loading && error && (
        <div className="px-5 py-4">
          <ErrorBanner message={error} onRetry={load} />
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Your API events will appear here after connecting your Google Cloud Project."
        />
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="divide-y divide-white/5">
            {visible.map((log) => (
              <div key={log.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors duration-150 group">
                <StatusBadge status={log.status} />
                <p className="flex-1 text-sm text-white/55 leading-snug group-hover:text-white/70 transition-colors duration-150">{log.action}</p>
                <span className="text-[10px] text-white/20 whitespace-nowrap shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
          {logs.length > 5 && (
            <div className="px-5 py-3 border-t border-white/8">
              <button onClick={() => setExp(!expanded)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-150">
                {expanded ? "Show less" : `Show ${logs.length - 5} more`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Custom Onboarding Card (shown when not set up) ───────────────────────────

function CustomOnboardingCard({ onSetup }: { onSetup: () => void }) {
  const features = [
    "Your own dedicated API quota",
    "No shared limits with other users",
    "Full control over your credentials",
    "Better for high-volume channels",
  ];

  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.015] p-8 text-center space-y-5">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
        <Cloud size={22} className="text-white/30" />
      </div>
      <div>
        <p className="text-base font-semibold text-white mb-1">Connect your Google Cloud project</p>
        <p className="text-sm text-white/35 leading-relaxed max-w-sm mx-auto">
          Use your own YouTube Data API quota. Takes about 5 minutes to set up.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        {features.map((f) => (
          <span key={f} className="flex items-center gap-2 text-xs text-white/35">
            <Check size={11} className="text-purple-400/60 shrink-0" /> {f}
          </span>
        ))}
      </div>
      <button onClick={onSetup}
        className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Start setup <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function APIAccessPage() {
  const [activeMethod, setActiveMethod] = useState<APIMethod>("managed");
  const [showWizard, setShowWizard]     = useState(false);
  const [status, setStatus]             = useState<APIStatus | null>(null);
  const [statusLoading, setStatusLoad]  = useState(true);
  const [statusError, setStatusError]   = useState<string | null>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  const loadStatus = useCallback(async () => {
    setStatusLoad(true); setStatusError(null);
    try {
      const data = await fetchAPIStatus();
      setStatus(data);
      setActiveMethod(data.method);
    } catch {
      setStatusError("Failed to load API status. Please refresh.");
    } finally {
      setStatusLoad(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleMethodSwitch = async (method: APIMethod) => {
    setActiveMethod(method);
    if (method === "managed") setShowWizard(false);
    try { await switchAPIMethod(method); loadStatus(); } catch { /* silent */ }
  };

  const handleSetupClick = () => {
    setShowWizard(true);
    setTimeout(() => wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setActiveMethod("managed");
    handleMethodSwitch("managed");
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    loadStatus();
  };

  const customIsSetup = !!status?.custom;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">API Access</h1>
          <p className="text-white/35 text-sm">Choose how ModerateAI connects to the YouTube Data API.</p>
        </div>

        {statusError && <ErrorBanner message={statusError} onRetry={loadStatus} />}

        {/* Method selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Managed */}
          <div
            onClick={() => handleMethodSwitch("managed")}
            className={`relative rounded-2xl border p-5 cursor-pointer transition-all duration-200
              ${activeMethod === "managed"
                ? "border-purple-500/40 bg-purple-500/8 shadow-xl shadow-purple-900/15"
                : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.035]"}`}>
            {activeMethod === "managed" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                <Check size={11} className="text-white" />
              </div>
            )}
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-600/25 text-purple-300 border border-purple-500/25 mb-3 uppercase tracking-wide">
              Recommended
            </span>
            <h3 className="text-sm font-semibold text-white mb-2">ModerateAI Managed</h3>
            <ul className="space-y-1.5">
              {["No setup required", "One-click YouTube connection", "Included with your plan"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-white/40">
                  <Check size={11} className="text-purple-400 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          {/* Custom */}
          <div
            onClick={() => { handleMethodSwitch("custom"); if (!customIsSetup) handleSetupClick(); }}
            className={`relative rounded-2xl border p-5 cursor-pointer transition-all duration-200
              ${activeMethod === "custom"
                ? "border-purple-500/40 bg-purple-500/8 shadow-xl shadow-purple-900/15"
                : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.035]"}`}>
            {activeMethod === "custom" && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                <Check size={11} className="text-white" />
              </div>
            )}
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/8 text-white/40 border border-white/12 mb-3 uppercase tracking-wide">
              Advanced
            </span>
            <h3 className="text-sm font-semibold text-white mb-2">My Google Cloud Project</h3>
            <ul className="space-y-1.5">
              {["Your own daily API quota", "Better for high-volume channels", "Full control over credentials"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-white/40">
                  <Check size={11} className="text-purple-400 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Custom — show onboarding card if not set up yet */}
        {activeMethod === "custom" && !customIsSetup && !showWizard && (
          <CustomOnboardingCard onSetup={handleSetupClick} />
        )}

        {/* Setup Wizard */}
        {showWizard && (
          <div ref={wizardRef}>
            <SetupWizard onClose={handleWizardClose} onComplete={handleWizardComplete} />
          </div>
        )}

        {/* Connection status */}
        {statusLoading ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 flex items-center justify-center gap-2 text-white/20 text-sm">
            <Spinner /> Loading connection…
          </div>
        ) : (
          /* Only show when managed, or when custom is set up */
          (activeMethod === "managed" || customIsSetup) && (
            <ConnectionSection
              activeMethod={activeMethod}
              status={status}
              onRefresh={loadStatus}
            />
          )
        )}

        {/* Usage */}
        {!statusLoading && activeMethod === "managed" && <ManagedUsageSection usage={status?.managed} />}
        {!statusLoading && activeMethod === "custom" && customIsSetup && <CustomUsageSection custom={status?.custom} />}

        {/* Activity */}
        {(activeMethod === "managed" || customIsSetup) && <ActivityLogsSection />}

        {/* Security */}
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

      </div>
    </div>
  );
}