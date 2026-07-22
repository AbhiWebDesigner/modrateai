"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Shield, CheckCircle, ChevronRight, ChevronLeft, Copy, Eye, EyeOff,
  ExternalLink, Check, Lock, Wifi, WifiOff, RotateCcw,
  Trash2, RefreshCw, AlertTriangle, Activity, Clock, Zap, BarChart2, X,
  Cloud, Server, Loader2, AlertCircle, Info,
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
  resetDate: string; // ISO date string
}

interface CustomProjectInfo {
  projectName: string;
  oauthStatus: "connected" | "disconnected" | "expired";
  connectionStatus: "active" | "inactive" | "error";
  dailyQuota: number;
  remainingQuota: number;
  lastVerified: string | null; // ISO date string
  lastSync: string | null;     // ISO date string
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

async function reconnectChannel(): Promise<void> {
  const res = await fetch("/api/settings/api-access/reconnect", { method: "POST" });
  if (!res.ok) throw new Error("Reconnect failed");
}

async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const res = await fetch("/api/settings/api-access/logs", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load activity logs");
  return res.json();
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatResetDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-white/80">{children}</h2>;
}

function InlineSpinner({ className = "w-4 h-4" }: { className?: string }) {
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

const STEPS = [
  "Watch Video", "Google Console", "Enable API",
  "OAuth Client", "Add Credentials", "Connect YouTube",
];

function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max mx-auto px-2">
        {STEPS.map((label, i) => {
          const num    = (i + 1) as WizardStep;
          const done   = num < current;
          const active = num === current;
          return (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300
                  ${done   ? "bg-purple-600 border-purple-600 text-white" : ""}
                  ${active ? "bg-purple-600/20 border-purple-500 text-purple-300" : ""}
                  ${!done && !active ? "bg-white/5 border-white/20 text-white/40" : ""}`}>
                  {done ? <Check size={14} /> : num}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap transition-colors duration-300
                  ${active ? "text-purple-300" : done ? "text-purple-400" : "text-white/30"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-10 mx-1 mb-4 transition-all duration-500 ${done ? "bg-purple-600" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const [watched, setWatched] = useState(false);

  // Listen for YouTube iframe API postMessage to detect video completion
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        // YouTube iframe API sends info.playerState === 0 when ended
        if (data?.event === "infoDelivery" && data?.info?.playerState === 0) {
          setWatched(true);
        }
      } catch {
        // ignore non-JSON messages
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Watch the Setup Tutorial</h2>
        <p className="text-white/50 text-sm">Watch this tutorial before continuing. The video walks you through each step.</p>
      </div>

      {/* Real YouTube embed — replace VIDEO_ID with your actual tutorial video ID */}
      <div className="relative rounded-2xl border border-white/10 overflow-hidden aspect-video">
        <iframe
          className="absolute inset-0 w-full h-full"
          src="https://www.youtube.com/embed/VIDEO_ID?enablejsapi=1&rel=0"
          title="ModerateAI Setup Tutorial"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <Info size={13} className="text-blue-400 shrink-0" />
        <p className="text-xs text-blue-300/80">
          {watched
            ? "Video complete — you can continue."
            : "Watch the full video to unlock the next step."}
        </p>
      </div>

      {!watched && (
        <button
          onClick={() => setWatched(true)}
          className="text-xs text-white/25 hover:text-white/40 transition-colors underline underline-offset-2"
        >
          Skip video (I've already set this up before)
        </button>
      )}

      <button
        onClick={onNext}
        disabled={!watched}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
          ${watched
            ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
            : "bg-white/5 text-white/25 cursor-not-allowed border border-white/10"}`}>
        Continue to Google Console <ChevronRight size={16} />
      </button>
    </div>
  );
}

function NavButtons({
  onPrev, onNext, nextLabel = "Next",
}: {
  onPrev: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onPrev}
        className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">
        <ChevronLeft size={16} /> Previous
      </button>
      {onNext && (
        <button
          onClick={onNext}
          className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">
          {nextLabel} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function Step2({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Open Google Cloud Console</h2>
        <p className="text-white/50 text-sm">Create a new Google Cloud Project to host your YouTube API credentials.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        {[
          { step: "1", text: 'Go to the Google Cloud Console and click "New Project".' },
          { step: "2", text: "Enter a project name (e.g. ModerateAI) and click Create." },
          { step: "3", text: "Wait for the project to be provisioned, then select it." },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
            <p className="text-sm text-white/60 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <a
        href="https://console.cloud.google.com/projectcreate"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open Google Console <ExternalLink size={14} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

function Step3({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Enable YouTube Data API v3</h2>
        <p className="text-white/50 text-sm">Inside your project, search for and enable the YouTube Data API v3 from the API Library.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        {[
          { step: "1", text: 'In the left sidebar, go to "APIs & Services" → "Library".' },
          { step: "2", text: 'Search for "YouTube Data API v3" and click the result.' },
          { step: "3", text: 'Click "Enable" and wait for the API to activate.' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
            <p className="text-sm text-white/60 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <a
        href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open API Library <ExternalLink size={14} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

const CALLBACK_URL = "https://moderateai.site/api/auth/google/callback";

function Step4({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(CALLBACK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Create OAuth 2.0 Client</h2>
        <p className="text-white/50 text-sm">Create OAuth 2.0 credentials and add the callback URL below as the Authorised Redirect URI.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        {[
          { step: "1", text: 'Go to "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID".' },
          { step: "2", text: 'Set Application Type to "Web application".' },
          { step: "3", text: "Add the callback URL below as an Authorised Redirect URI." },
          { step: "4", text: "Click Create and copy the Client ID and Client Secret." },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
            <p className="text-sm text-white/60 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Callback URL</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <code className="flex-1 text-purple-300 text-sm font-mono truncate">{CALLBACK_URL}</code>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
              ${copied
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/30"}`}>
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>

      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open Credentials Page <ExternalLink size={14} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} />
    </div>
  );
}

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
      setError(err instanceof Error ? err.message : "Failed to save credentials. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Add Your Credentials</h2>
        <p className="text-white/50 text-sm">Paste the OAuth credentials from the Google Console. Stored encrypted, never shared.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all duration-200 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Client Secret</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all duration-200 font-mono"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-150">
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex items-center gap-2 text-xs text-white/30">
        <Lock size={12} className="text-green-400/60 shrink-0" />
        Credentials are encrypted before storage and never exposed.
      </div>

      <div className="flex gap-3">
        <button
          onClick={onPrev}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">
          <ChevronLeft size={16} /> Previous
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
            ${canSave && !saving
              ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]"
              : "bg-white/5 text-white/25 cursor-not-allowed border border-white/10"}`}>
          {saving ? <><InlineSpinner /> Saving…</> : "Save Securely"}
        </button>
      </div>
    </div>
  );
}

function Step6({ onPrev, onComplete }: { onPrev: () => void; onComplete: () => void }) {
  const handleConnect = () => {
    // Redirect to the actual OAuth flow
    window.location.href = "/api/auth/youtube";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Connect YouTube</h2>
        <p className="text-white/50 text-sm">Authorize ModerateAI to access your YouTube channel using your Google Cloud credentials.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.6.6 9.4.6 9.4.6s7.8 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="#f87171"/>
            <path d="M9.8 15.6V8.4l6.2 3.6-6.2 3.6z" fill="white"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">Authorize YouTube Access</p>
          <p className="text-white/40 text-sm">You'll be redirected to Google to grant access to your channel.</p>
        </div>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/40 hover:scale-[1.02]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.6.6 9.4.6 9.4.6s7.8 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="white"/>
            <path d="M9.8 15.6V8.4l6.2 3.6-6.2 3.6z" fill="white"/>
          </svg>
          Connect YouTube
        </button>
      </div>

      <button
        onClick={onPrev}
        className="w-full py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">
        <ChevronLeft size={16} /> Previous
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
    <div className="rounded-2xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Setup Wizard</span>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors duration-150 flex items-center gap-1">
          <X size={12} /> Cancel
        </button>
      </div>
      <div className="px-6 pt-5 pb-2">
        <StepIndicator current={step} />
      </div>
      <div className="px-6 pb-6 pt-4">
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

function DeleteModal({
  onCancel,
  onConfirm,
  loading,
  error,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel, loading]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !loading && onCancel()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#13121a] shadow-2xl shadow-black/60 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors duration-150 disabled:opacity-40">
          <X size={16} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1.5">Delete Credentials?</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Removing your credentials will disconnect ModerateAI from your Google Cloud Project. You can reconnect at any time.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
          <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300/80">Active moderation will stop immediately.</p>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/40 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><InlineSpinner /> Deleting…</> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LogStatus }) {
  const map: Record<LogStatus, { label: string; classes: string }> = {
    success: { label: "Success", classes: "bg-green-500/15 text-green-400 border-green-500/25"    },
    warning: { label: "Warning", classes: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
    error:   { label: "Error",   classes: "bg-red-500/15 text-red-400 border-red-500/25"          },
    info:    { label: "Info",    classes: "bg-blue-500/15 text-blue-400 border-blue-500/25"        },
  };
  const { label, classes } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${classes}`}>
      {label}
    </span>
  );
}

// ─── Current API Section ──────────────────────────────────────────────────────

function CurrentAPISection({
  activeMethod,
  status,
  onRefresh,
}: {
  activeMethod: APIMethod;
  status: APIStatus | null;
  onRefresh: () => void;
}) {
  const [testState, setTestState]       = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testMessage, setTestMessage]   = useState("");
  const [rotating, setRotating]         = useState(false);
  const [rotateError, setRotateError]   = useState<string | null>(null);
  const [rotateSupported, setRotateSupported] = useState<boolean | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState<string | null>(null);

  const isManaged = activeMethod === "managed";

  // Check if rotate is supported on mount (only for custom)
  useEffect(() => {
    if (isManaged) { setRotateSupported(false); return; }
    fetch("/api/settings/api-access/rotate/supported")
      .then((r) => r.json())
      .then((d) => setRotateSupported(!!d.supported))
      .catch(() => setRotateSupported(false));
  }, [isManaged]);

  const handleTest = async () => {
    setTestState("loading");
    setTestMessage("");
    try {
      const result = await testConnection();
      setTestState(result.ok ? "ok" : "fail");
      setTestMessage(result.message);
    } catch {
      setTestState("fail");
      setTestMessage("Could not reach the server. Check your connection.");
    }
  };

  const handleRotate = async () => {
    if (rotating || !rotateSupported) return;
    setRotating(true);
    setRotateError(null);
    try {
      await rotateCredentials();
      onRefresh();
    } catch (err) {
      setRotateError(err instanceof Error ? err.message : "Rotation failed.");
    } finally {
      setRotating(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setDisconnectError(null);
    try {
      await disconnectChannel();
      onRefresh();
    } catch (err) {
      setDisconnectError(err instanceof Error ? err.message : "Disconnect failed.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleReconnect = async () => {
    // Redirect to OAuth flow
    window.location.href = "/api/auth/youtube";
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCredentials();
      setShowDeleteModal(false);
      onRefresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  // Derive display values from backend status
  const custom = status?.custom;

  const isConnected = isManaged
    ? true // managed is always connected if authenticated
    : custom?.connectionStatus === "active";

  const connectionLabel = isManaged
    ? "Connected"
    : custom
      ? custom.connectionStatus === "active" ? "Connected"
        : custom.connectionStatus === "error" ? "Error"
        : "Disconnected"
      : "—";

  const connectionClass = isConnected
    ? "bg-green-500/15 text-green-400 border-green-500/25"
    : connectionLabel === "Error"
      ? "bg-red-500/15 text-red-400 border-red-500/25"
      : "bg-white/8 text-white/40 border-white/15";

  const dotClass = isConnected
    ? "bg-green-400 animate-pulse"
    : connectionLabel === "Error"
      ? "bg-red-400"
      : "bg-white/20";

  const stats = isManaged
    ? [
        { icon: <Server size={14} className="text-purple-400" />,   label: "Provider",      value: "ModerateAI" },
        { icon: <Zap size={14} className="text-yellow-400" />,      label: "Status",        value: "Active" },
        { icon: <Activity size={14} className="text-purple-400" />, label: "Type",          value: "Managed API" },
      ]
    : custom
      ? [
          { icon: <Server size={14} className="text-purple-400" />,    label: "Project",     value: custom.projectName || "—" },
          { icon: <Zap size={14} className="text-yellow-400" />,       label: "OAuth",       value: custom.oauthStatus === "connected" ? "Connected" : custom.oauthStatus === "expired" ? "Expired" : "Disconnected" },
          { icon: <BarChart2 size={14} className="text-blue-400" />,   label: "Daily Quota", value: custom.dailyQuota?.toLocaleString() ?? "—" },
          { icon: <BarChart2 size={14} className="text-green-400" />,  label: "Remaining",   value: custom.remainingQuota?.toLocaleString() ?? "—" },
          { icon: <Clock size={14} className="text-blue-400" />,       label: "Last Sync",   value: formatDateTime(custom.lastSync) },
          { icon: <RefreshCw size={14} className="text-green-400" />,  label: "Verified",    value: formatDateTime(custom.lastVerified) },
        ]
      : [];

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onCancel={() => { setShowDeleteModal(false); setDeleteError(null); }}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          error={deleteError}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300
              ${isManaged ? "bg-purple-500/15 border-purple-500/25" : "bg-green-500/15 border-green-500/25"}`}>
              {isManaged
                ? <Server size={16} className="text-purple-400" />
                : <Cloud size={16} className="text-green-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {isManaged ? "ModerateAI Managed API" : (custom?.projectName ?? "Your Google Cloud Project")}
              </p>
              <p className="text-xs text-white/40">
                {isManaged ? "ModerateAI · YouTube Data API v3" : "Google Cloud · YouTube Data API v3"}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${connectionClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${dotClass}`} />
            {connectionLabel}
          </span>
        </div>

        {/* Stats grid */}
        {stats.length > 0 && (
          <div className={`grid divide-x divide-y divide-white/5 ${stats.length <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
            {stats.map(({ icon, label, value }) => (
              <div key={label} className="px-5 py-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">{icon}{label}</div>
                <p className="text-sm font-semibold text-white truncate">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Test Connection */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-white">Test Connection</p>
              <p className="text-xs text-white/40 mt-0.5">Verify the API is responding correctly.</p>
            </div>
            <button
              onClick={handleTest}
              disabled={testState === "loading"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
              {testState === "loading"
                ? <><InlineSpinner className="w-3.5 h-3.5" /> Testing…</>
                : <><Wifi size={14} /> Test Connection</>}
            </button>
          </div>
          {testState === "ok" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
              <CheckCircle size={13} /> {testMessage}
            </div>
          )}
          {testState === "fail" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <WifiOff size={13} /> {testMessage}
            </div>
          )}
        </div>

        {/* Credential Actions */}
        <div className="px-5 py-4 border-t border-white/10 space-y-3">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Actions</p>
          {disconnectError && <ErrorBanner message={disconnectError} />}
          {rotateError && <ErrorBanner message={rotateError} />}
          <div className="flex flex-wrap gap-3">

            {/* Reconnect */}
            <button
              onClick={handleReconnect}
              disabled={isConnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                ${!isConnected
                  ? "border-purple-500/40 text-purple-300 hover:border-purple-500/60 hover:text-purple-200 hover:scale-[1.02]"
                  : "border-white/10 text-white/25 cursor-not-allowed"}`}>
              <RefreshCw size={14} /> Reconnect
            </button>

            {/* Rotate — only if backend supports it */}
            <button
              onClick={handleRotate}
              disabled={rotating || rotateSupported === false || rotateSupported === null}
              title={rotateSupported === false ? "Credential rotation is not supported for this connection type" : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                ${rotateSupported
                  ? "border-yellow-500/20 text-yellow-400/80 hover:text-yellow-300 hover:border-yellow-500/40 hover:scale-[1.02]"
                  : "border-white/10 text-white/25 cursor-not-allowed"}`}>
              {rotating
                ? <><InlineSpinner className="w-3.5 h-3.5 text-yellow-300" /> Rotating…</>
                : <><RotateCcw size={14} /> Rotate Credentials</>}
            </button>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting || !isConnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                ${isConnected
                  ? "border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30 hover:scale-[1.02]"
                  : "border-white/10 text-white/25 cursor-not-allowed"}`}>
              {disconnecting
                ? <><InlineSpinner className="w-3.5 h-3.5" /> Disconnecting…</>
                : <><WifiOff size={14} /> Disconnect</>}
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 text-sm font-medium transition-all duration-200 hover:scale-[1.02]">
              <Trash2 size={14} /> Delete Credentials
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Managed Usage Section ────────────────────────────────────────────────────

function ManagedUsageSection({ usage }: { usage: ManagedUsage | undefined }) {
  if (!usage) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <EmptyState
          icon={BarChart2}
          title="No usage data"
          description="Usage information will appear here once your plan is active."
        />
      </div>
    );
  }

  const pct = usage.actionsTotal > 0
    ? Math.min(100, Math.round((usage.actionsUsed / usage.actionsTotal) * 100))
    : 0;

  const barColor = pct >= 90 ? "from-red-600 to-red-400" : pct >= 70 ? "from-yellow-600 to-yellow-400" : "from-purple-600 to-purple-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Usage</SectionHeading>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-purple-500/25 bg-purple-500/10 text-purple-400">
          {usage.planLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Used */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/15 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">AI Actions Used</span>
            <Zap size={13} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{usage.actionsUsed.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-white/30">
              <span>{pct}% of monthly limit</span>
              <span>{usage.actionsTotal.toLocaleString()} total</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Remaining */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/15 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Remaining</span>
            <BarChart2 size={13} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{usage.actionsRemaining.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-white/30">
              <span>{100 - pct}% remaining</span>
              <span>Resets {formatResetDate(usage.resetDate)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Project Usage Section ─────────────────────────────────────────────

function CustomUsageSection({ custom }: { custom: CustomProjectInfo | undefined }) {
  if (!custom) return null;

  const pct = custom.dailyQuota > 0
    ? Math.min(100, Math.round(((custom.dailyQuota - custom.remainingQuota) / custom.dailyQuota) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
      <SectionHeading>Daily Quota</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/15 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Used Today</span>
            <Zap size={13} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{(custom.dailyQuota - custom.remainingQuota).toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-white/30">
              <span>{pct}% of daily quota</span>
              <span>{custom.dailyQuota.toLocaleString()} limit</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/15 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Remaining</span>
            <BarChart2 size={13} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{custom.remainingQuota.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-white/30">
              <span>{100 - pct}% remaining</span>
              <span>Resets midnight PT</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700" style={{ width: `${100 - pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

function ActivityLogsSection() {
  const [logs, setLogs]       = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivityLogs();
      setLogs(data);
    } catch {
      setError("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = expanded ? logs : logs.slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <SectionHeading>Activity Logs</SectionHeading>
        {!loading && !error && logs.length > 0 && (
          <span className="text-xs text-white/30 font-medium">{logs.length} events</span>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 px-5 py-8 text-white/30 text-sm justify-center">
          <InlineSpinner /> Loading activity…
        </div>
      )}

      {!loading && error && (
        <div className="px-5 py-5">
          <ErrorBanner message={error} onRetry={load} />
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Your API activity will appear here once moderation starts."
        />
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="divide-y divide-white/5">
            {visible.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 sm:gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors duration-150 group">
                <StatusBadge status={log.status} />
                <p className="flex-1 text-sm text-white/70 leading-snug group-hover:text-white/80 transition-colors duration-150">
                  {log.action}
                </p>
                <span className="text-xs text-white/25 whitespace-nowrap shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
          {logs.length > 5 && (
            <div className="px-5 py-3 border-t border-white/10">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-150">
                {expanded ? "Show less" : `Show ${logs.length - 5} more events`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function APIAccessPage() {
  const [activeMethod, setActiveMethod] = useState<APIMethod>("managed");
  const [showWizard, setShowWizard]     = useState(false);
  const [status, setStatus]             = useState<APIStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError]   = useState<string | null>(null);
  const wizardRef = useRef<HTMLDivElement>(null);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await fetchAPIStatus();
      setStatus(data);
      setActiveMethod(data.method);
    } catch {
      setStatusError("Failed to load API status. Please refresh.");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleMethodSwitch = async (method: APIMethod) => {
    setActiveMethod(method);
    if (method === "managed") setShowWizard(false);
    try {
      await switchAPIMethod(method);
      loadStatus();
    } catch {
      // non-critical: UI already updated, warn quietly
    }
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Page header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">API Access</h1>
          <p className="text-white/50 text-sm sm:text-base">Choose how ModerateAI connects to the YouTube Data API.</p>
        </div>

        {/* Top-level error */}
        {statusError && <ErrorBanner message={statusError} onRetry={loadStatus} />}

        {/* Method selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Managed */}
          <div
            onClick={() => handleMethodSwitch("managed")}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-200
              ${activeMethod === "managed"
                ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5"}`}>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/30 mb-4">
              Recommended
            </span>
            <h3 className="text-base font-semibold text-white mb-1">ModerateAI Managed API</h3>
            <ul className="space-y-1.5 mb-6">
              {["No setup required", "One-click YouTube connection", "Perfect for most creators", "Included with your plan"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/50">
                  <Check size={13} className="text-purple-400 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <div className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all duration-200
              ${activeMethod === "managed"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "border border-white/15 text-white/50"}`}>
              {activeMethod === "managed" ? "Current Method" : "Use Managed API"}
            </div>
          </div>

          {/* Custom */}
          <div
            onClick={() => handleMethodSwitch("custom")}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-200
              ${activeMethod === "custom"
                ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20"
                : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5"}`}>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/50 border border-white/15 mb-4">
              Advanced
            </span>
            <h3 className="text-base font-semibold text-white mb-1">Use My Google Cloud Project</h3>
            <ul className="space-y-1.5 mb-6">
              {["Your own daily API quota", "Better for high-volume channels", "Full control", "Optional feature"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/50">
                  <Check size={13} className="text-purple-400 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <button
              onClick={(e) => { e.stopPropagation(); handleMethodSwitch("custom"); handleSetupClick(); }}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${activeMethod === "custom"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                  : "border border-white/15 text-white/50 hover:border-purple-500/40 hover:text-purple-300"}`}>
              {activeMethod === "custom" ? "Setup Complete" : "Setup My Project"}
            </button>
          </div>
        </div>

        {/* Setup Wizard */}
        {showWizard && (
          <div ref={wizardRef}>
            <SetupWizard onClose={handleWizardClose} onComplete={handleWizardComplete} />
          </div>
        )}

        {/* Current API status */}
        {statusLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 flex items-center justify-center gap-2 text-white/30 text-sm">
            <InlineSpinner /> Loading connection status…
          </div>
        ) : (
          <CurrentAPISection
            activeMethod={activeMethod}
            status={status}
            onRefresh={loadStatus}
          />
        )}

        {/* Usage */}
        {!statusLoading && activeMethod === "managed" && (
          <ManagedUsageSection usage={status?.managed} />
        )}
        {!statusLoading && activeMethod === "custom" && (
          <CustomUsageSection custom={status?.custom} />
        )}

        {/* Activity Logs */}
        <ActivityLogsSection />

        {/* Security note */}
        <div className="flex items-start gap-4 rounded-2xl border border-green-500/15 bg-green-500/5 px-5 py-4">
          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0">
            <Shield size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-300 mb-0.5">Security</p>
            <p className="text-sm text-white/40 leading-relaxed">
              Credentials are encrypted at rest and never exposed via the API. You can remove them from your account at any time.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}