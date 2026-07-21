"use client";

import { useState, useRef, useEffect } from "react";
import {
  Shield, CheckCircle, ChevronRight, ChevronLeft, Copy, Eye, EyeOff,
  Play, ExternalLink, Video, Check, Lock, Wifi, WifiOff, RotateCcw,
  Trash2, RefreshCw, AlertTriangle, Activity, Clock, Zap, BarChart2, X,
  Cloud, Server, Youtube,
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

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_LOGS: ActivityLog[] = [
  { id: "1",  timestamp: "Today, 11:42 AM",     action: "YouTube OAuth token refreshed",         status: "success" },
  { id: "2",  timestamp: "Today, 11:15 AM",     action: "Comment moderation batch (312 items)",  status: "success" },
  { id: "3",  timestamp: "Today, 10:58 AM",     action: "Quota check — 8,200 units remaining",   status: "info"    },
  { id: "4",  timestamp: "Today, 09:30 AM",     action: "Live stream comment sync started",       status: "success" },
  { id: "5",  timestamp: "Today, 08:47 AM",     action: "API rate limit warning (90% used)",      status: "warning" },
  { id: "6",  timestamp: "Yesterday, 11:59 PM", action: "Daily quota reset",                      status: "info"    },
  { id: "7",  timestamp: "Yesterday, 07:12 PM", action: "Automation rule triggered (45 hidden)",  status: "success" },
  { id: "8",  timestamp: "Yesterday, 03:04 PM", action: "OAuth token refresh failed — retried",   status: "error"   },
  { id: "9",  timestamp: "Yesterday, 03:04 PM", action: "OAuth token refresh retry succeeded",    status: "success" },
  { id: "10", timestamp: "Yesterday, 09:18 AM", action: "Credentials rotated by user",            status: "info"    },
];

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
          const num = (i + 1) as WizardStep;
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

// ─── Preview Placeholder ──────────────────────────────────────────────────────

function PreviewCard({ label }: { label: string }) {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/5 h-36 flex items-center justify-center">
      <span className="text-white/20 text-sm font-medium">{label}</span>
    </div>
  );
}

// ─── Wizard Steps ─────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const [played, setPlayed]       = useState(false);
  const [completed, setCompleted] = useState(false);
  const handlePlay = () => { setPlayed(true); setTimeout(() => setCompleted(true), 2000); };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Watch 1-Minute Setup</h2>
        <p className="text-white/50 text-sm">Watch this quick tutorial before starting. It takes under 60 seconds.</p>
      </div>
      <div className="relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden aspect-video flex items-center justify-center group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-black/60" />
        {!played ? (
          <button onClick={handlePlay} className="relative z-10 w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center shadow-2xl shadow-purple-900/50 transition-all duration-200 group-hover:scale-105">
            <Play size={32} className="text-white ml-1" fill="white" />
          </button>
        ) : completed ? (
          <div className="relative z-10 flex flex-col items-center gap-3 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <span className="text-green-400 font-semibold text-sm">Video Completed</span>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            <span className="text-white/50 text-sm">Playing…</span>
          </div>
        )}
        <div className="absolute bottom-3 right-4 z-10 text-white/30 text-xs">0:58</div>
      </div>
      <button onClick={onNext} disabled={!completed} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
        ${completed ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]" : "bg-white/5 text-white/25 cursor-not-allowed border border-white/10"}`}>
        Continue to Google Console <ChevronRight size={16} />
      </button>
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
      <PreviewCard label="Google Cloud Console · New Project" />
      <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open Google Console <ExternalLink size={14} />
      </a>
      <div className="flex gap-3 text-sm">
        <button className="text-white/40 hover:text-purple-300 transition-colors duration-150 underline underline-offset-2">Watch Again</button>
        <button className="text-white/40 hover:text-purple-300 transition-colors duration-150 underline underline-offset-2">View Guide</button>
      </div>
      <div className="flex gap-3">
        <button onClick={onPrev} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"><ChevronLeft size={16} /> Previous</button>
        <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">Next <ChevronRight size={16} /></button>
      </div>
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
      <PreviewCard label="API Library · YouTube Data API v3" />
      <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open API Library <ExternalLink size={14} />
      </a>
      <div className="flex gap-3">
        <button onClick={onPrev} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"><ChevronLeft size={16} /> Previous</button>
        <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">Next <ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

const CALLBACK_URL = "https://moderateai.site/api/auth/google/callback";

function Step4({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(CALLBACK_URL); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Create OAuth Client</h2>
        <p className="text-white/50 text-sm">Create OAuth 2.0 Client credentials. Use the callback URL below as the Authorised Redirect URI.</p>
      </div>
      <PreviewCard label="Credentials · OAuth 2.0 Client IDs" />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Callback URL</label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <code className="flex-1 text-purple-300 text-sm font-mono truncate">{CALLBACK_URL}</code>
          <button onClick={handleCopy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
            ${copied ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/30"}`}>
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>
      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-purple-900/40 hover:scale-[1.01]">
        Open Credentials Page <ExternalLink size={14} />
      </a>
      <div className="flex gap-3">
        <button onClick={onPrev} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"><ChevronLeft size={16} /> Previous</button>
        <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">Next <ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

function Step5({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [clientId, setClientId]     = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved]           = useState(false);
  const canSave = clientId.trim() && clientSecret.trim();
  const handleSave = () => { if (!canSave) return; setSaved(true); setTimeout(() => onNext(), 800); };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Connect Your Google Cloud Project</h2>
        <p className="text-white/50 text-sm">Paste the OAuth credentials from the Google Console. Stored encrypted, never shared.</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Client ID</label>
          <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)}
            placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all duration-200 font-mono" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">Client Secret</label>
          <div className="relative">
            <input type={showSecret ? "text" : "password"} value={clientSecret} onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/60 focus:bg-purple-500/5 transition-all duration-200 font-mono" />
            <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-150">
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/30">
        <Lock size={12} className="text-green-400/60 shrink-0" /> Credentials are encrypted before storage.
      </div>
      <div className="flex gap-3">
        <button className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200">Validate</button>
        <button onClick={handleSave} disabled={!canSave}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
            ${canSave ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.01]" : "bg-white/5 text-white/25 cursor-not-allowed border border-white/10"}`}>
          {saved ? <><Check size={14} /> Saved</> : "Save Securely"}
        </button>
      </div>
      <button onClick={onPrev} className="w-full py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">
        <ChevronLeft size={16} /> Previous
      </button>
    </div>
  );
}

function Step6({ onPrev }: { onPrev: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected]   = useState(false);
  const handleConnect = () => { setConnecting(true); setTimeout(() => { setConnecting(false); setConnected(true); }, 1500); };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Connect YouTube</h2>
        <p className="text-white/50 text-sm">Authorize ModerateAI to access your YouTube channel using your Google Cloud Project credentials.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center gap-5">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${connected ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/10 border border-red-500/20"}`}>
          {connected ? <CheckCircle size={32} className="text-green-400" /> : <Youtube size={32} className="text-red-400" />}
        </div>
        <div className="text-center">
          <p className="text-white font-semibold mb-1">{connected ? "YouTube Connected" : "YouTube Not Connected"}</p>
          <p className="text-white/40 text-sm">{connected ? "Your channel is linked via your Google Cloud Project." : "Click below to authorize with your own Google Cloud Project."}</p>
        </div>
        {!connected && (
          <button onClick={handleConnect} disabled={connecting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/40 disabled:opacity-60 hover:scale-[1.02]">
            {connecting
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Connecting…</>
              : <><Youtube size={16} /> Connect YouTube</>}
          </button>
        )}
      </div>
      {!connected && (
        <button onClick={onPrev} className="w-full py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2">
          <ChevronLeft size={16} /> Previous
        </button>
      )}
      {connected && (
        <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
          <p className="text-green-300 text-sm">Setup complete. ModerateAI is now using your Google Cloud Project for all YouTube API requests.</p>
        </div>
      )}
    </div>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

function SetupWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>(1);
  const next = () => setStep((s) => Math.min(s + 1, 6) as WizardStep);
  const prev = () => setStep((s) => Math.max(s - 1, 1) as WizardStep);
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Setup Wizard</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors duration-150">Cancel</button>
      </div>
      <div className="px-6 pt-5 pb-2"><StepIndicator current={step} /></div>
      <div className="px-6 pb-6 pt-4">
        {step === 1 && <Step1 onNext={next} />}
        {step === 2 && <Step2 onNext={next} onPrev={prev} />}
        {step === 3 && <Step3 onNext={next} onPrev={prev} />}
        {step === 4 && <Step4 onNext={next} onPrev={prev} />}
        {step === 5 && <Step5 onNext={next} onPrev={prev} />}
        {step === 6 && <Step6 onPrev={prev} />}
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  // Trap focus, close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#13121a] shadow-2xl shadow-black/60 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onCancel} className="absolute top-4 right-4 text-white/25 hover:text-white/60 transition-colors duration-150">
          <X size={16} />
        </button>
        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
          <Trash2 size={22} className="text-red-400" />
        </div>
        {/* Copy */}
        <div>
          <h3 className="text-base font-semibold text-white mb-1.5">Delete Google Cloud Project?</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Removing your credentials will disconnect ModerateAI from your Google Cloud Project. You can reconnect at any time by setting up a new project.
          </p>
        </div>
        {/* Warning note */}
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
          <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300/80">This action cannot be undone.</p>
        </div>
        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-semibold text-sm transition-all duration-200">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-900/40 hover:scale-[1.02]">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LogStatus }) {
  const map: Record<LogStatus, { label: string; classes: string }> = {
    success: { label: "Success", classes: "bg-green-500/15 text-green-400 border-green-500/25"   },
    warning: { label: "Warning", classes: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"},
    error:   { label: "Error",   classes: "bg-red-500/15 text-red-400 border-red-500/25"         },
    info:    { label: "Info",    classes: "bg-blue-500/15 text-blue-400 border-blue-500/25"       },
  };
  const { label, classes } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${classes}`}>
      {label}
    </span>
  );
}

function DemoBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-purple-500/25 bg-purple-500/10 text-purple-400">
      Demo Data
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-white/80">{children}</h2>;
}

// ─── Current API Section ──────────────────────────────────────────────────────

interface CurrentAPISectionProps {
  activeMethod: APIMethod;
}

function CurrentAPISection({ activeMethod }: CurrentAPISectionProps) {
  const isManaged     = activeMethod === "managed";
  const [testing, setTesting]         = useState(false);
  const [testResult, setTestResult]   = useState<"idle" | "ok" | "fail">("idle");
  const [rotating, setRotating]       = useState(false);
  const [rotated, setRotated]         = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Reset test result when method changes
  useEffect(() => { setTestResult("idle"); setDisconnected(false); }, [activeMethod]);

  const handleTest = () => {
    if (disconnected) return;
    setTesting(true); setTestResult("idle");
    setTimeout(() => { setTesting(false); setTestResult("ok"); }, 1800);
  };

  const handleRotate = () => {
    if (disconnected) return;
    setRotating(true);
    setTimeout(() => { setRotating(false); setRotated(true); setTimeout(() => setRotated(false), 3000); }, 1500);
  };

  const handleDeleteConfirm = () => { setShowDeleteModal(false); setDisconnected(true); };

  // Dynamic values per method
  const meta = isManaged
    ? { icon: <Server size={16} className="text-purple-400" />, iconBg: "bg-purple-500/15 border-purple-500/25",
        title: "ModerateAI Managed API", subtitle: "ModerateAI · YouTube Data API v3",
        provider: "ModerateAI", quota: "Shared", connectionType: "Managed API",
        dotColor: "bg-purple-400", dotPulse: true }
    : { icon: <Cloud size={16} className="text-green-400" />, iconBg: "bg-green-500/15 border-green-500/25",
        title: "Your Google Cloud Project", subtitle: "Google Cloud · YouTube Data API v3",
        provider: "Google Cloud", quota: "10,000 / day", connectionType: "Google Cloud Project",
        dotColor: "bg-green-400", dotPulse: true };

  const statusLabel = disconnected ? "Disconnected" : "Connected";
  const statusClass = disconnected
    ? "bg-red-500/15 text-red-400 border-red-500/25"
    : "bg-green-500/15 text-green-400 border-green-500/25";
  const dotClass = disconnected ? "bg-red-400" : `${meta.dotColor} ${meta.dotPulse ? "animate-pulse" : ""}`;

  const stats = [
    { icon: <Server size={14} className="text-purple-400" />,  label: "Provider",        value: meta.provider          },
    { icon: <BarChart2 size={14} className="text-blue-400" />, label: "Quota",            value: meta.quota             },
    { icon: <Zap size={14} className="text-yellow-400" />,     label: "Status",           value: disconnected ? "Disconnected" : "Healthy" },
    { icon: <Clock size={14} className="text-blue-400" />,     label: "Last Sync",        value: disconnected ? "—" : "2 min ago"          },
    { icon: <RefreshCw size={14} className="text-green-400" />,label: "Last OAuth",       value: disconnected ? "—" : "Today, 11:42 AM"    },
    { icon: <Activity size={14} className="text-purple-400" />,label: "Connection Type",  value: meta.connectionType    },
  ];

  return (
    <>
      {showDeleteModal && (
        <DeleteModal onCancel={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} />
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 ${meta.iconBg}`}>
              {meta.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-white transition-all duration-300">{meta.title}</p>
              <p className="text-xs text-white/40 transition-all duration-300">{meta.subtitle}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${statusClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${dotClass}`} />
            {statusLabel}
          </span>
        </div>

        {/* Stats grid — 2 cols on mobile, 3 on sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-white/5">
          {stats.map(({ icon, label, value }) => (
            <div key={label} className="px-5 py-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium">{icon}{label}</div>
              <p className={`text-sm font-semibold transition-all duration-300 ${label === "Status" && disconnected ? "text-red-400" : "text-white"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Test Connection */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-white">Test Connection</p>
              <p className="text-xs text-white/40 mt-0.5">{disconnected ? "Reconnect to enable testing." : "Verify the API is responding correctly."}</p>
            </div>
            <button onClick={handleTest} disabled={testing || disconnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                ${disconnected
                  ? "bg-white/5 border border-white/10 text-white/25 cursor-not-allowed"
                  : "bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:scale-[1.02]"}`}>
              {testing
                ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-purple-300/30 border-t-purple-300 animate-spin" /> Testing…</>
                : <><Wifi size={14} /> Test Connection</>}
            </button>
          </div>
          {testResult === "ok" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
              <CheckCircle size={13} /> Connection successful — API is responding normally.
            </div>
          )}
          {testResult === "fail" && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <WifiOff size={13} /> Connection failed — check your credentials and try again.
            </div>
          )}
        </div>

        {/* Credential Actions */}
        <div className="px-5 py-4 border-t border-white/10 space-y-3">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Credential Actions</p>
          <div className="flex flex-wrap gap-3">

            {/* Reconnect — active only when disconnected */}
            <button
              onClick={() => setDisconnected(false)}
              disabled={!disconnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                ${disconnected
                  ? "border-purple-500/40 text-purple-300 hover:border-purple-500/60 hover:text-purple-200 hover:scale-[1.02]"
                  : "border-white/10 text-white/25 cursor-not-allowed"}`}>
              <RefreshCw size={14} /> Reconnect
            </button>

            {/* Rotate */}
            <button onClick={handleRotate} disabled={rotating || disconnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200
                ${disconnected
                  ? "border-white/10 text-white/25 cursor-not-allowed"
                  : "border-yellow-500/20 text-yellow-400/80 hover:text-yellow-300 hover:border-yellow-500/40 hover:scale-[1.02]"}`}>
              {rotating
                ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-300/30 border-t-yellow-300 animate-spin" /> Rotating…</>
                : rotated
                ? <><Check size={14} className="text-green-400" /> Rotated</>
                : <><RotateCcw size={14} /> Rotate Credentials</>}
            </button>

            {/* Disconnect / Reconnect toggle */}
            <button onClick={() => setDisconnected(!disconnected)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30 text-sm font-medium transition-all duration-200 hover:scale-[1.02]">
              <WifiOff size={14} /> {disconnected ? "Force Disconnect" : "Disconnect"}
            </button>

            {/* Delete — opens modal */}
            <button onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 text-sm font-medium transition-all duration-200 hover:scale-[1.02]">
              <Trash2 size={14} /> Delete Credentials
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Usage Section ────────────────────────────────────────────────────────────

function UsageSection() {
  const used      = 1800;
  const total     = 10000;
  const remaining = total - used;
  const pct       = Math.round((used / total) * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Usage</SectionHeading>
        <DemoBadge />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Today's Requests */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/15 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Today's Requests</span>
            <Zap size={13} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{used.toLocaleString()}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-white/30">
              <span>{pct}% of daily quota</span>
              <span>{total.toLocaleString()} limit</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Remaining Quota */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 hover:border-white/15 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/40">Remaining Quota</span>
            <BarChart2 size={13} className="text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{remaining.toLocaleString()}</p>
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
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? DEMO_LOGS : DEMO_LOGS.slice(0, 5);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <SectionHeading>Activity Logs</SectionHeading>
          <DemoBadge />
        </div>
        <span className="text-xs text-white/30 font-medium">{DEMO_LOGS.length} events</span>
      </div>

      <div className="divide-y divide-white/5">
        {visible.map((log) => (
          <div key={log.id} className="flex items-center gap-3 sm:gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors duration-150 group">
            <StatusBadge status={log.status} />
            <p className="flex-1 text-sm text-white/70 leading-snug group-hover:text-white/80 transition-colors duration-150">{log.action}</p>
            <span className="text-xs text-white/25 whitespace-nowrap shrink-0">{log.timestamp}</span>
          </div>
        ))}
      </div>

      {DEMO_LOGS.length > 5 && (
        <div className="px-5 py-3 border-t border-white/10">
          <button onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors duration-150">
            {expanded ? "Show less" : `Show ${DEMO_LOGS.length - 5} more events`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function APIAccessPage() {
  const [activeMethod, setActiveMethod] = useState<APIMethod>("managed");
  const [showWizard, setShowWizard]     = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);

  const handleSetupClick = () => {
    setShowWizard(true);
    setTimeout(() => wizardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Page header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">API Access</h1>
          <p className="text-white/50 text-sm sm:text-base">Choose how ModerateAI connects to the YouTube Data API.</p>
        </div>

        {/* Method selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Managed */}
          <div
            onClick={() => { setActiveMethod("managed"); setShowWizard(false); }}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-200 group
              ${activeMethod === "managed" ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5"}`}>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/30 mb-4">Recommended</span>
            <h3 className="text-base font-semibold text-white mb-1">ModerateAI Managed API</h3>
            <ul className="space-y-1.5 mb-6">
              {["No setup required", "One-click YouTube connection", "Perfect for most creators", "Included with your plan"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/50"><Check size={13} className="text-purple-400 shrink-0" />{item}</li>
              ))}
            </ul>
            <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeMethod === "managed" ? "bg-purple-600 text-white shadow-md shadow-purple-900/40" : "border border-white/15 text-white/50 hover:border-purple-500/40 hover:text-purple-300"}`}>
              {activeMethod === "managed" ? "Current Method" : "Use Managed API"}
            </button>
          </div>

          {/* Custom */}
          <div
            onClick={() => setActiveMethod("custom")}
            className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-200 group
              ${activeMethod === "custom" ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-900/20" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/5"}`}>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/50 border border-white/15 mb-4">Advanced</span>
            <h3 className="text-base font-semibold text-white mb-1">Use My Google Cloud Project</h3>
            <ul className="space-y-1.5 mb-6">
              {["Get your own daily API quota", "Better for high-volume channels", "More control", "Optional feature"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/50"><Check size={13} className="text-purple-400 shrink-0" />{item}</li>
              ))}
            </ul>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveMethod("custom"); handleSetupClick(); }}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${activeMethod === "custom" ? "bg-purple-600 text-white shadow-md shadow-purple-900/40" : "border border-white/15 text-white/50 hover:border-purple-500/40 hover:text-purple-300"}`}>
              Setup My Project
            </button>
          </div>
        </div>

        {/* Setup Wizard */}
        {showWizard && (
          <div ref={wizardRef}>
            <SetupWizard onClose={() => { setShowWizard(false); setActiveMethod("managed"); }} />
          </div>
        )}

        {/* Current API — receives activeMethod */}
        <CurrentAPISection activeMethod={activeMethod} />

        {/* Usage */}
        <UsageSection />

        {/* Activity Logs */}
        <ActivityLogsSection />

        {/* Security */}
        <div className="flex items-start gap-4 rounded-2xl border border-green-500/15 bg-green-500/5 px-5 py-4">
          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center shrink-0">
            <Shield size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-300 mb-0.5">Security</p>
            <p className="text-sm text-white/40 leading-relaxed">Your credentials are encrypted and never shared. You can remove them from your account at any time.</p>
          </div>
        </div>

      </div>
    </div>
  );
}