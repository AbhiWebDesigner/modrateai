"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Shield, ChevronRight, ChevronLeft, Copy, Eye, EyeOff,
  ExternalLink, Check, Lock, Wifi, WifiOff, RotateCcw,
  Trash2, RefreshCw, Activity, Clock, Zap, BarChart2, X,
  Cloud, Server, Loader2, Youtube, AlertTriangle,
  CheckCircle2, Circle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type APIMethod  = "managed" | "custom";
type LogStatus  = "success" | "warning" | "error" | "info";
type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

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
  youtubeConnected: boolean;
  managed?: ManagedUsage;
  custom?: CustomProjectInfo;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAPIStatus(): Promise<APIStatus> {
  const res = await fetch("/api/settings/api-access", { cache: "no-store" });
  if (!res.ok) throw new Error("failed");
  return res.json();
}

async function switchAPIMethod(method: APIMethod): Promise<void> {
  await fetch("/api/settings/api-access/method", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method }),
  });
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
  if (!res.ok) throw new Error("failed");
  return res.json();
}

// ─── Project config — computed client-side only ───────────────────────────────
// Never computed at module scope to avoid SSR/hydration crashes.
function useProjectUrls() {
  const [urls, setUrls] = useState({ origin: "", callback: "" });
  useEffect(() => {
    const origin = window.location.origin;
    setUrls({ origin, callback: `${origin}/api/auth/youtube/callback` });
  }, []);
  return urls;
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

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEP_LABELS = ["Tutorial", "Cloud Project", "Enable API", "OAuth Client", "Credentials", "Connect"];

function StepIndicator({ current }: { current: WizardStep }) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="flex items-center min-w-max mx-auto">
        {STEP_LABELS.map((label, i) => {
          const num    = (i + 1) as WizardStep;
          const done   = num < current;
          const active = num === current;
          return (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${done   ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30" : ""}
                  ${active ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-4 ring-purple-500/20" : ""}
                  ${!done && !active ? "bg-white/5 border border-white/10 text-white/20" : ""}
                `}>
                  {done ? <Check size={13} strokeWidth={2.5} /> : num}
                </div>
                <span className={`text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-300
                  ${active ? "text-purple-400" : done ? "text-emerald-500" : "text-white/20"}`}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-px w-10 mx-1.5 mb-5 rounded-full transition-all duration-500 ${done ? "bg-emerald-500/40" : "bg-white/8"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Screenshot Placeholder ───────────────────────────────────────────────────

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="w-full aspect-[16/7] rounded-xl border border-white/8 bg-white/[0.02] flex flex-col items-center justify-center gap-2 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
        <Cloud size={15} className="text-white/20" />
      </div>
      <p className="text-[10px] text-white/20 font-medium">{label}</p>
    </div>
  );
}

// ─── Step 1 — Tutorial ────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Watch the setup tutorial</h2>
        <p className="text-white/40 text-sm leading-relaxed">A short walkthrough of the Google Cloud setup process.</p>
      </div>

      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Youtube size={18} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">Tutorial video coming soon</p>
          <p className="text-xs text-white/30 max-w-xs leading-relaxed">We're recording a walkthrough. For now, follow the steps below — each one links directly to the right Google Console page.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wide">
          Development mode
        </span>
      </div>

      <button onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.01]">
        Continue <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── Step 2 — Cloud Project ───────────────────────────────────────────────────

function Step2({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Create a Google Cloud Project</h2>
        <p className="text-white/40 text-sm leading-relaxed">Your project hosts the YouTube API credentials ModerateAI will use.</p>
      </div>

      <ScreenshotPlaceholder label="Google Cloud Console" />

      <div className="space-y-2">
        {[
          { n: 1, text: "Go to console.cloud.google.com and sign in." },
          { n: 2, text: 'Click "New Project", give it a name, and click "Create".' },
          { n: 3, text: "Wait for the project to be created, then select it from the top bar." },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/6">
            <span className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/25 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
            <p className="text-sm text-white/55 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 text-white/70 hover:text-white font-medium text-sm transition-all duration-200">
        Open Google Cloud Console <ExternalLink size={13} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Project created" />
    </div>
  );
}

// ─── Step 3 — Enable API ──────────────────────────────────────────────────────

function Step3({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Enable YouTube Data API v3</h2>
        <p className="text-white/40 text-sm leading-relaxed">The API must be enabled in your project before credentials will work.</p>
      </div>

      <ScreenshotPlaceholder label="API Library · YouTube Data API v3" />

      <div className="space-y-2">
        {[
          { n: 1, text: 'In the left sidebar, go to "APIs & Services" → "Library".' },
          { n: 2, text: 'Search for "YouTube Data API v3" and open the result.' },
          { n: 3, text: 'Click "Enable" and wait a few seconds for it to activate.' },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/6">
            <span className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/25 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
            <p className="text-sm text-white/55 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 text-white/70 hover:text-white font-medium text-sm transition-all duration-200">
        Open API Library <ExternalLink size={13} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="API enabled" />
    </div>
  );
}

// ─── Step 4 — OAuth Client ────────────────────────────────────────────────────

function Step4({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const { origin: JS_ORIGIN, callback: CALLBACK_URL } = useProjectUrls();
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedOrigin,   setCopiedOrigin]   = useState(false);

  const copy = (text: string, which: "callback" | "origin") => {
    navigator.clipboard.writeText(text);
    if (which === "callback") { setCopiedCallback(true); setTimeout(() => setCopiedCallback(false), 2000); }
    else                      { setCopiedOrigin(true);   setTimeout(() => setCopiedOrigin(false),   2000); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Create an OAuth 2.0 client</h2>
        <p className="text-white/40 text-sm leading-relaxed">Add these exact URLs — no trailing slashes.</p>
      </div>

      <ScreenshotPlaceholder label="APIs & Services · Credentials" />

      <div className="space-y-2">
        {[
          { n: 1, text: 'Go to "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID".' },
          { n: 2, text: 'Set Application Type to "Web application".' },
          { n: 3, text: "Add both URLs below, then click Create." },
        ].map(({ n, text }) => (
          <div key={n} className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white/[0.025] border border-white/6">
            <span className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/25 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
            <p className="text-sm text-white/55 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <UrlField label="Authorized JavaScript Origin" value={JS_ORIGIN} copied={copiedOrigin} onCopy={() => copy(JS_ORIGIN, "origin")} />
        <UrlField label="Authorized Redirect URI" value={CALLBACK_URL} copied={copiedCallback} onCopy={() => copy(CALLBACK_URL, "callback")} />
      </div>

      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 text-white/70 hover:text-white font-medium text-sm transition-all duration-200">
        Open Credentials Page <ExternalLink size={13} />
      </a>

      <NavButtons onPrev={onPrev} onNext={onNext} nextLabel="Credentials created" />
    </div>
  );
}

function UrlField({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#0d0c14] px-3.5 py-2.5">
        <code className="flex-1 text-purple-300 text-xs font-mono truncate">{value}</code>
        <button onClick={onCopy}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 shrink-0
            ${copied ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "bg-purple-600/15 text-purple-300 hover:bg-purple-600/25 border border-purple-500/20"}`}>
          {copied ? <><Check size={9} /> Copied</> : <><Copy size={9} /> Copy</>}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5 — Credentials ──────────────────────────────────────────────────────

function Step5({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [clientId,     setClientId]     = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret,   setShowSecret]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const canSave = clientId.trim().length > 0 && clientSecret.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true); setError(null);
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
        <p className="text-white/40 text-sm leading-relaxed">After creating the OAuth client, copy the Client ID and Secret from Google Console.</p>
      </div>

      <ScreenshotPlaceholder label="OAuth Client · Client ID & Secret" />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Client ID</label>
          <input
            type="text" value={clientId} onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
            className="w-full rounded-xl border border-white/8 bg-[#0d0c14] px-4 py-2.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-200 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Client Secret</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"} value={clientSecret} onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl border border-white/8 bg-[#0d0c14] px-4 py-2.5 pr-11 text-sm text-white placeholder-white/15 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-200 font-mono"
            />
            <button onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors duration-150">
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="flex items-center gap-2 text-xs text-white/20">
        <Lock size={11} className="text-emerald-500/50 shrink-0" />
        Encrypted before storage — never logged or exposed via API.
      </div>

      <div className="flex gap-2.5">
        <button onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/8 text-white/40 hover:text-white hover:border-white/15 font-medium text-sm transition-all duration-200">
          <ChevronLeft size={15} /> Back
        </button>
        <button onClick={handleSave} disabled={!canSave || saving}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${canSave && !saving ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 hover:scale-[1.01]" : "bg-white/4 text-white/20 cursor-not-allowed border border-white/6"}`}>
          {saving ? <><Spinner className="w-3.5 h-3.5" /> Saving…</> : <><Lock size={13} /> Save & Continue</>}
        </button>
      </div>
    </div>
  );
}

// ─── Step 6 — Connect YouTube ─────────────────────────────────────────────────

function Step6({ onPrev }: { onPrev: () => void }) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = "/api/auth/youtube";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Connect your YouTube channel</h2>
        <p className="text-white/40 text-sm leading-relaxed">Authorize ModerateAI to read and moderate your channel's comments.</p>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/[0.025] p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Youtube size={26} className="text-red-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-1">Google OAuth will open</p>
          <p className="text-white/35 text-xs leading-relaxed max-w-xs mx-auto">
            You'll be redirected to Google to grant read and manage access. After approval, your dashboard becomes active.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 pt-1">
          {["Read your channel's comments", "Moderate and delete spam", "Access channel metadata"].map((item) => (
            <div key={item} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03]">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
              <span className="text-xs text-white/50">{item}</span>
            </div>
          ))}
        </div>

        <button onClick={handleConnect} disabled={connecting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/30 hover:scale-[1.01] disabled:opacity-60">
          {connecting ? <><Spinner className="w-3.5 h-3.5" /> Redirecting to Google…</> : <><Youtube size={15} /> Connect YouTube</>}
        </button>
      </div>

      <button onClick={onPrev}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/8 text-white/35 hover:text-white/60 hover:border-white/15 font-medium text-sm transition-all duration-200">
        <ChevronLeft size={14} /> Back
      </button>
    </div>
  );
}

// ─── Nav Buttons ──────────────────────────────────────────────────────────────

function NavButtons({ onPrev, onNext, nextLabel = "Continue", nextDisabled = false, loading = false }: {
  onPrev?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; loading?: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      {onPrev && (
        <button onClick={onPrev}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/8 text-white/40 hover:text-white hover:border-white/15 font-medium text-sm transition-all duration-200">
          <ChevronLeft size={15} /> Back
        </button>
      )}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled || loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
            ${!nextDisabled && !loading ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 hover:scale-[1.01]" : "bg-white/4 text-white/20 cursor-not-allowed border border-white/6"}`}>
          {loading ? <><Spinner className="w-3.5 h-3.5" /> Processing…</> : <>{nextLabel} <ChevronRight size={15} /></>}
        </button>
      )}
    </div>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const next = () => setStep((s) => Math.min(s + 1, 6) as WizardStep);
  const prev = () => setStep((s) => Math.max(s - 1, 1) as WizardStep);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/25 flex items-center justify-center">
          <Youtube size={15} className="text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Connect YouTube</p>
          <p className="text-xs text-white/30">Complete setup to start moderating</p>
        </div>
      </div>

      {/* Stepper + content card */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/6">
          <StepIndicator current={step} />
        </div>
        <div className="px-6 py-5">
          {step === 1 && <Step1 onNext={next} />}
          {step === 2 && <Step2 onNext={next} onPrev={prev} />}
          {step === 3 && <Step3 onNext={next} onPrev={prev} />}
          {step === 4 && <Step4 onNext={next} onPrev={prev} />}
          {step === 5 && <Step5 onNext={next} onPrev={prev} />}
          {step === 6 && <Step6 onPrev={prev} />}
        </div>
      </div>
    </div>
  );
}

// ─── Method Switcher ──────────────────────────────────────────────────────────

function MethodSwitcher({ active, onChange }: { active: APIMethod; onChange: (m: APIMethod) => void }) {
  return (
    <div className="flex gap-2">
      {(["managed", "custom"] as APIMethod[]).map((m) => (
        <button key={m} onClick={() => onChange(m)}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition-all duration-200
            ${active === m
              ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
              : "border-white/8 bg-white/[0.02] text-white/35 hover:text-white/60 hover:border-white/12"}`}>
          {m === "managed" ? <Server size={13} /> : <Cloud size={13} />}
          {m === "managed" ? "ModerateAI Managed" : "My Google Cloud"}
        </button>
      ))}
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0c14] shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} disabled={loading} className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors disabled:opacity-40">
          <X size={15} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 size={17} className="text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Delete credentials?</h3>
          <p className="text-sm text-white/40 leading-relaxed">Removes your Google Cloud credentials. Active moderation stops immediately. You can reconnect any time.</p>
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/8 text-white/40 hover:text-white hover:border-white/15 font-semibold text-sm transition-all duration-200 disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2">
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
    success: { label: "Success", c: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    warning: { label: "Warning", c: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"   },
    error:   { label: "Error",   c: "bg-red-500/10 text-red-400 border-red-500/20"             },
    info:    { label: "Info",    c: "bg-blue-500/10 text-blue-400 border-blue-500/20"           },
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide shrink-0 ${map[status].c}`}>
      {map[status].label}
    </span>
  );
}

// ─── Connection Dashboard ────────────────────────────────────────────────────

function ConnectionDashboard({ status, onRefresh }: { status: APIStatus; onRefresh: () => void }) {
  const [activeMethod, setActiveMethod] = useState<APIMethod>(status.method);
  const [testState,    setTestState]    = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testMessage,  setTestMessage]  = useState("");
  const [rotating,     setRotating]     = useState(false);
  const [disconnecting, setDisc]        = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);
  const [actionError,  setActionError]  = useState<string | null>(null);
  const [logs,         setLogs]         = useState<ActivityLog[]>([]);
  const [logsLoading,  setLogsLoading]  = useState(true);
  const [logsExpanded, setLogsExp]      = useState(false);

  const isManaged = activeMethod === "managed";
  const managed   = status.managed;
  const custom    = status.custom;

  useEffect(() => {
    fetchActivityLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false));
  }, []);

  const handleMethodChange = async (m: APIMethod) => {
    setActiveMethod(m);
    try { await switchAPIMethod(m); onRefresh(); } catch { /* silent */ }
  };

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
    setRotating(true); setActionError(null);
    try { await rotateCredentials(); onRefresh(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "Rotation failed."); }
    finally { setRotating(false); }
  };

  const handleDisconnect = async () => {
    setDisc(true); setActionError(null);
    try { await disconnectChannel(); onRefresh(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "Disconnect failed."); }
    finally { setDisc(false); }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true); setDeleteError(null);
    try { await deleteCredentials(); setShowDelete(false); onRefresh(); }
    catch (e) { setDeleteError(e instanceof Error ? e.message : "Delete failed."); }
    finally { setDeleting(false); }
  };

  const visibleLogs = logsExpanded ? logs : logs.slice(0, 5);

  // Stats derived from backend only
  const managedStats = managed ? [
    { label: "Plan",       value: managed.planLabel,                          icon: <Server size={11} className="text-purple-400" />   },
    { label: "Used",       value: managed.actionsUsed.toLocaleString(),        icon: <Zap size={11} className="text-yellow-400" />     },
    { label: "Remaining",  value: managed.actionsRemaining.toLocaleString(),   icon: <BarChart2 size={11} className="text-emerald-400" />},
    { label: "Resets",     value: fmt(managed.resetDate, { month: "short", day: "numeric" }), icon: <Clock size={11} className="text-blue-400" /> },
  ] : null;

  const customStats = custom ? [
    { label: "Project",   value: custom.projectName || "—", icon: <Server size={11} className="text-purple-400" /> },
    { label: "OAuth",     value: custom.oauthStatus === "connected" ? "Connected" : custom.oauthStatus === "expired" ? "Expired" : "Disconnected", icon: <Wifi size={11} className="text-blue-400" /> },
    { label: "Remaining", value: custom.remainingQuota?.toLocaleString() ?? "—", icon: <BarChart2 size={11} className="text-emerald-400" /> },
    { label: "Last Sync", value: fmt(custom.lastSync), icon: <Clock size={11} className="text-blue-400" /> },
  ] : null;

  const stats = isManaged ? managedStats : customStats;

  // Usage
  const managedPct = managed && managed.actionsTotal > 0
    ? Math.min(100, Math.round((managed.actionsUsed / managed.actionsTotal) * 100)) : 0;
  const managedBar = managedPct >= 90 ? "from-red-600 to-red-400" : managedPct >= 70 ? "from-yellow-600 to-yellow-400" : "from-purple-600 to-purple-400";

  const customUsed = custom ? custom.dailyQuota - custom.remainingQuota : 0;
  const customPct  = custom && custom.dailyQuota > 0 ? Math.min(100, Math.round((customUsed / custom.dailyQuota) * 100)) : 0;

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

      <div className="space-y-4">

        {/* Method switcher */}
        <MethodSwitcher active={activeMethod} onChange={handleMethodChange} />

        {/* Connection card */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0
                ${isManaged ? "bg-purple-500/10 border-purple-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                {isManaged ? <Server size={15} className="text-purple-400" /> : <Cloud size={15} className="text-emerald-400" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {isManaged ? "ModerateAI Managed API" : (custom?.projectName ?? "Your Google Cloud Project")}
                </p>
                <p className="text-xs text-white/30 mt-0.5">YouTube Data API v3</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20 bg-emerald-500/8 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
            </span>
          </div>

          {/* Stats grid */}
          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-white/5">
              {stats.map(({ label, value, icon }) => (
                <div key={label} className="px-4 py-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/25 font-medium uppercase tracking-wide">{icon}{label}</div>
                  <p className="text-sm font-semibold text-white truncate">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-white/25">No data available.</p>
            </div>
          )}

          {/* Test connection */}
          <div className="px-5 py-4 border-t border-white/6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-white">Test connection</p>
                <p className="text-xs text-white/30 mt-0.5">Verify the API is responding correctly.</p>
              </div>
              <button onClick={handleTest} disabled={testState === "loading"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/12 hover:bg-purple-600/20 border border-purple-500/20 text-purple-300 text-xs font-semibold transition-all duration-200 disabled:opacity-50">
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
          <div className="px-5 py-4 border-t border-white/6 space-y-3">
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Actions</p>
            {actionError && <ErrorBanner message={actionError} />}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { window.location.href = "/api/auth/youtube"; }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/25 text-purple-300/80 hover:text-purple-300 hover:border-purple-500/40 text-xs font-medium transition-all duration-200 hover:scale-[1.02]">
                <RefreshCw size={11} /> Reconnect
              </button>
              <button onClick={handleRotate} disabled={rotating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-500/20 text-yellow-400/70 hover:text-yellow-300 hover:border-yellow-500/35 text-xs font-medium transition-all duration-200 hover:scale-[1.02]">
                {rotating ? <><Spinner className="w-3 h-3 text-yellow-300" /> Rotating…</> : <><RotateCcw size={11} /> Rotate</>}
              </button>
              <button onClick={handleDisconnect} disabled={disconnecting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/8 text-white/40 hover:text-red-400 hover:border-red-500/25 text-xs font-medium transition-all duration-200 hover:scale-[1.02]">
                {disconnecting ? <><Spinner className="w-3 h-3" /> Disconnecting…</> : <><WifiOff size={11} /> Disconnect</>}
              </button>
              <button onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 text-xs font-medium transition-all duration-200 hover:scale-[1.02]">
                <Trash2 size={11} /> Delete credentials
              </button>
            </div>
          </div>
        </div>

        {/* Usage */}
        {isManaged && managed && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/70">Monthly Usage</p>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border border-purple-500/25 bg-purple-500/8 text-purple-400 uppercase tracking-wide">
                {managed.planLabel}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UsageTile
                label="Actions used" value={managed.actionsUsed.toLocaleString()}
                sub={`${managedPct}% of ${managed.actionsTotal.toLocaleString()}`}
                pct={managedPct} barClass={managedBar}
                icon={<Zap size={11} className="text-purple-400" />}
              />
              <UsageTile
                label="Remaining" value={managed.actionsRemaining.toLocaleString()}
                sub={`Resets ${fmt(managed.resetDate, { month: "short", day: "numeric" })}`}
                pct={100 - managedPct} barClass="from-emerald-600 to-emerald-400"
                icon={<BarChart2 size={11} className="text-emerald-400" />}
              />
            </div>
          </div>
        )}

        {!isManaged && custom && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
            <p className="text-sm font-semibold text-white/70">Daily Quota</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UsageTile
                label="Used today" value={customUsed.toLocaleString()}
                sub={`${customPct}% of ${custom.dailyQuota.toLocaleString()}`}
                pct={customPct} barClass="from-purple-600 to-purple-400"
                icon={<Zap size={11} className="text-purple-400" />}
              />
              <UsageTile
                label="Remaining" value={custom.remainingQuota.toLocaleString()}
                sub="Resets midnight PT"
                pct={100 - customPct} barClass="from-emerald-600 to-emerald-400"
                icon={<BarChart2 size={11} className="text-emerald-400" />}
              />
            </div>
          </div>
        )}

        {/* Activity */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white/70">Activity</p>
            {!logsLoading && logs.length > 0 && (
              <span className="text-[10px] text-white/20 font-medium">{logs.length} events</span>
            )}
          </div>

          {logsLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-white/20 text-sm">
              <Spinner className="w-4 h-4" /> Loading…
            </div>
          )}

          {!logsLoading && logs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center px-6">
              <div className="w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
                <Activity size={15} className="text-white/15" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/30">No activity yet</p>
                <p className="text-xs text-white/20 mt-0.5">Events will appear here as ModerateAI runs.</p>
              </div>
            </div>
          )}

          {!logsLoading && logs.length > 0 && (
            <>
              <div className="divide-y divide-white/5">
                {visibleLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.015] transition-colors duration-150 group">
                    <StatusBadge status={log.status} />
                    <p className="flex-1 text-sm text-white/50 leading-snug group-hover:text-white/65 transition-colors duration-150">{log.action}</p>
                    <span className="text-[10px] text-white/20 whitespace-nowrap shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
              {logs.length > 5 && (
                <div className="px-5 py-3 border-t border-white/6">
                  <button onClick={() => setLogsExp(!logsExpanded)}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                    {logsExpanded ? "Show less" : `Show ${logs.length - 5} more`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Security footer */}
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/4 px-5 py-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <Shield size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300 mb-0.5">Security</p>
            <p className="text-xs text-white/30 leading-relaxed">
              Credentials are encrypted at rest and never exposed via the API. Remove them from your account at any time.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

// ─── Usage Tile ───────────────────────────────────────────────────────────────

function UsageTile({ label, value, sub, pct, barClass, icon }: {
  label: string; value: string; sub: string; pct: number; barClass: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.025] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-white/20">
          <span>{sub}</span>
        </div>
        <div className="h-1 rounded-full bg-white/6 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function APIAccessPage() {
  const [status,  setStatus]  = useState<APIStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try   { setStatus(await fetchAPIStatus()); }
    catch { setStatus(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const connected = !!status?.youtubeConnected;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Spinner className="w-5 h-5 text-white/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">API Access</h1>
          <p className="text-white/35 text-sm mt-1">
            {connected
              ? "Manage how ModerateAI connects to the YouTube Data API."
              : "Connect your YouTube channel to start moderating comments with AI."}
          </p>
        </div>

        {/* Onboarding or Dashboard */}
        {!connected && <SetupWizard />}
        {connected && status && <ConnectionDashboard status={status} onRefresh={loadStatus} />}

      </div>
    </div>
  );
}