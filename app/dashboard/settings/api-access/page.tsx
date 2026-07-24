'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { auth, db } from '@/lib/firebase';
import {
  doc, onSnapshot, collection, query,
  orderBy, limit, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'shared' | 'google';
type TimeRange = '7D' | '30D' | '90D';

interface SharedPlan {
  plan: string;               // 'free_trial' | 'basic' | 'pro' | 'extended'
  aiActionsTotal: number;
  aiActionsUsed: number;
  trialEndsAt: Date | null;
  resetDate: Date | null;
  extensionUsed: boolean;
  recentActivity: ActivityItem[];
  health: string;             // 'operational' | 'degraded' | 'down'
  lastChecked: Date | null;
}

interface GoogleProject {
  connected: boolean;
  projectName: string;
  projectId: string;
  projectNumber: string;
  googleAccount: string;
  googleAvatar: string;
  connectedAt: Date | null;
  lastSync: Date | null;
  oauthStatus: string;
  oauthScopes: string[];
  redirectUri: string;
  apiStatus: string;
  billingStatus: string;
  clientId: string;
  quotaType: string;
  dailyQuota: number;
  quotaUsed: number;
  requestsToday: number;
  lastVerification: Date | null;
  quotaResetAt: Date | null;
  topMethods: MethodUsage[];
  usageHistory: ChartPoint[];
}

interface MethodUsage {
  name: string;
  units: number;
  pct: number;
}

interface ChartPoint {
  date: string;
  value: number;
}

interface ActivityItem {
  action: string;
  time: Date;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ w = '100%', h = 16, radius = 8 }: { w?: string | number; h?: number; radius?: number }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    background: 'linear-gradient(90deg, #1e1533 25%, #2d1b69 50%, #1e1533 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
);

// ─── StatusDot ────────────────────────────────────────────────────────────────

const StatusDot = memo(({ status = 'ok' }: { status?: string }) => {
  const color = status === 'ok' || status === 'operational' || status === 'enabled' || status === 'active' || status === 'verified' || status === 'valid' || status === 'connected'
    ? '#22c55e'
    : status === 'degraded'
    ? '#f59e0b'
    : '#ef4444';
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8,
      borderRadius: '50%', background: color, flexShrink: 0,
      boxShadow: `0 0 6px ${color}80`,
    }} />
  );
});
StatusDot.displayName = 'StatusDot';

// ─── Countdown Timer (from real Date) ─────────────────────────────────────────

function CountdownTimer({ target }: { target: Date | null }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    if (!target) return;
    const tick = () => setDiff(Math.max(0, target.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return <span style={{ color: '#6b7280' }}>—</span>;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span style={{ color: '#a78bfa', fontWeight: 600 }}>
      {String(h).padStart(2, '0')}h {String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
    </span>
  );
}

// ─── Time-ago helper ──────────────────────────────────────────────────────────

function timeAgo(d: Date | null): string {
  if (!d) return '—';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString();
}

// ─── formatDate helper ────────────────────────────────────────────────────────

function fmt(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub, cta, onCta }: {
  icon: string; title: string; sub: string; cta?: string; onCta?: () => void;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 24px', gap: 12, textAlign: 'center',
    }}>
      <div style={{ fontSize: 48 }}>{icon}</div>
      <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{title}</div>
      <div style={{ color: '#6b7280', fontSize: 13, maxWidth: 280 }}>{sub}</div>
      {cta && (
        <button onClick={onCta} style={{
          marginTop: 8, background: 'linear-gradient(90deg,#4c1d95,#6d28d9)',
          border: 'none', borderRadius: 10, color: '#fff',
          fontWeight: 600, fontSize: 13, padding: '10px 24px', cursor: 'pointer',
        }}>{cta}</button>
      )}
    </div>
  );
}

// ─── HTML/CSS Mock Screenshot (per step) ──────────────────────────────────────

function StepScreenshot({ step }: { step: number }) {
  const [fullscreen, setFullscreen] = useState(false);

  const screens: Record<number, React.ReactNode> = {
    1: (
      <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 11, color: '#a78bfa' }}>
        <div style={{ color: '#22c55e', marginBottom: 8 }}>▶ Watch the setup tutorial</div>
        <div style={{ background: '#0d0b17', borderRadius: 6, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #7c3aed' }} />
        </div>
        <div style={{ marginTop: 8, color: '#6b7280', fontSize: 10 }}>Duration: 3:45 • HD Quality</div>
      </div>
    ),
    2: (
      <div style={{ background: '#202124', borderRadius: 8, padding: 12, fontSize: 11 }}>
        <div style={{ color: '#8ab4f8', marginBottom: 6, fontWeight: 600 }}>console.cloud.google.com</div>
        <div style={{ background: '#303134', borderRadius: 6, padding: 10 }}>
          <div style={{ color: '#e8eaed', marginBottom: 4 }}>New Project</div>
          <div style={{ background: '#404144', borderRadius: 4, padding: '4px 8px', color: '#8ab4f8', marginBottom: 4 }}>ModerateAI User Project</div>
          <div style={{ color: '#9aa0a6', fontSize: 10 }}>Project ID: moderateai-user-xxxxx</div>
          <div style={{ marginTop: 8, background: '#1a73e8', borderRadius: 4, padding: '4px 8px', color: '#fff', display: 'inline-block' }}>Create</div>
        </div>
      </div>
    ),
    3: (
      <div style={{ background: '#202124', borderRadius: 8, padding: 12, fontSize: 11 }}>
        <div style={{ color: '#8ab4f8', marginBottom: 6, fontWeight: 600 }}>API Library</div>
        <div style={{ background: '#303134', borderRadius: 6, padding: 10 }}>
          <div style={{ color: '#e8eaed', marginBottom: 6 }}>YouTube Data API v3</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ background: '#1a73e8', borderRadius: 4, padding: '4px 12px', color: '#fff' }}>Enable</div>
            <div style={{ color: '#9aa0a6' }}>Google LLC</div>
          </div>
        </div>
      </div>
    ),
    4: (
      <div style={{ background: '#202124', borderRadius: 8, padding: 12, fontSize: 11 }}>
        <div style={{ color: '#8ab4f8', marginBottom: 6, fontWeight: 600 }}>OAuth 2.0 Client ID</div>
        <div style={{ background: '#303134', borderRadius: 6, padding: 10 }}>
          <div style={{ color: '#9aa0a6', marginBottom: 4 }}>Application type</div>
          <div style={{ background: '#404144', borderRadius: 4, padding: '4px 8px', color: '#e8eaed', marginBottom: 8 }}>Web application ▼</div>
          <div style={{ color: '#9aa0a6', marginBottom: 4 }}>Authorized redirect URI</div>
          <div style={{ background: '#404144', borderRadius: 4, padding: '4px 8px', color: '#8ab4f8', fontSize: 9 }}>https://moderateai.site/api/auth/youtube/callback</div>
        </div>
      </div>
    ),
    5: (
      <div style={{ background: '#0d0b17', borderRadius: 8, padding: 12, fontSize: 11 }}>
        <div style={{ color: '#a78bfa', marginBottom: 8, fontWeight: 600 }}>Paste your credentials</div>
        {['Client ID', 'Client Secret'].map(f => (
          <div key={f} style={{ marginBottom: 8 }}>
            <div style={{ color: '#6b7280', marginBottom: 3 }}>{f}</div>
            <div style={{ background: '#1e1533', borderRadius: 6, padding: '6px 10px', color: '#c4b5fd', fontFamily: 'monospace' }}>
              {'•'.repeat(24)}
            </div>
          </div>
        ))}
      </div>
    ),
    6: (
      <div style={{ background: '#0d0b17', borderRadius: 8, padding: 12, fontSize: 11, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
        <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>Authorize ModerateAI</div>
        <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 10 }}>Grant access to your YouTube Data</div>
        <div style={{ background: 'linear-gradient(90deg,#4c1d95,#7c3aed)', borderRadius: 8, padding: '8px 16px', color: '#fff' }}>
          Connect with Google →
        </div>
      </div>
    ),
  };

  const content = screens[step] || null;

  return (
    <>
      <div
        onClick={() => setFullscreen(true)}
        style={{
          cursor: 'zoom-in', border: '1px solid #2d1b69', borderRadius: 10,
          padding: 12, background: '#0a0814', transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 20px #7c3aed40'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
      >
        {content}
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 10, marginTop: 6 }}>Click to expand</div>
      </div>
      {fullscreen && (
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed', inset: 0, background: '#000000cc', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div style={{ background: '#0d0b17', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', border: '1px solid #3b2680' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 16 }}>{content}</div>
            <button onClick={() => setFullscreen(false)} style={{
              width: '100%', background: '#1e1533', border: 'none', color: '#a78bfa',
              borderRadius: 8, padding: '8px 0', cursor: 'pointer',
            }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { title: 'Watch Setup Video', desc: 'Watch our 3-minute tutorial to understand the setup process before you begin.' },
  { title: 'Create Google Cloud Project', desc: 'Go to console.cloud.google.com and create a new project named "ModerateAI".' },
  { title: 'Enable YouTube Data API', desc: 'In the API Library, search for "YouTube Data API v3" and click Enable.' },
  { title: 'Create OAuth 2.0 Client', desc: 'Under Credentials, create an OAuth 2.0 Client ID for a Web Application.' },
  { title: 'Add Client ID & Secret', desc: 'Copy your Client ID and Client Secret and paste them into ModerateAI.' },
  { title: 'Authorize ModerateAI', desc: 'Click Connect with Google to complete the OAuth flow and link your account.' },
];

function SetupWizard({ onConnect }: { onConnect: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying && videoProgress < 100) {
      videoRef.current = setInterval(() => {
        setVideoProgress(p => {
          if (p >= 100) {
            clearInterval(videoRef.current!);
            setIsPlaying(false);
            setVideoWatched(true);
            return 100;
          }
          return p + 0.5;
        });
      }, 112); // ~225 seconds total
    } else if (!isPlaying && videoRef.current) {
      clearInterval(videoRef.current);
    }
    return () => { if (videoRef.current) clearInterval(videoRef.current); };
  }, [isPlaying, videoProgress]);

  const completeStep = (i: number) => {
    setCompletedSteps(prev => new Set([...prev, i]));
    if (i < WIZARD_STEPS.length - 1) setCurrentStep(i + 1);
  };

  const handleSaveCredentials = async () => {
    if (!clientId || !clientSecret) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await setDoc(doc(db, 'users', uid, 'settings', 'googleCloud'), {
        clientId,
        clientSecret,
        credentialsSavedAt: serverTimestamp(),
        connected: false,
      }, { merge: true });
      completeStep(4);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/youtube/auth';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1040 0%, #2d1b69 100%)',
        borderRadius: 16, padding: '32px 24px', textAlign: 'center',
        border: '1px solid #3b2680',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>☁️</div>
        <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 0 8px' }}>
          Connect Your Google Cloud Project
        </h2>
        <p style={{ color: '#c4b5fd', fontSize: 14, margin: '0 0 20px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          Use your own Google Cloud Project for higher quota and unlimited scalability.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Higher quota', 'No shared limits', 'Better reliability', 'Your own API'].map(b => (
            <span key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#86efac', fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="7" fill="#16a34a" opacity="0.3" />
                <path d="M4 7l2.5 2.5L10 4.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Step progress bar */}
      <div style={{ display: 'flex', gap: 0, background: '#0d0b17', borderRadius: 12, border: '1px solid #1e1533', overflow: 'hidden' }}>
        {WIZARD_STEPS.map((s, i) => {
          const done = completedSteps.has(i);
          const active = currentStep === i;
          return (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              style={{
                flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                background: active ? 'linear-gradient(135deg,#4c1d95,#6d28d9)' : done ? '#0d1f12' : 'transparent',
                borderRight: i < 5 ? '1px solid #1e1533' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'background 0.2s',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#16a34a' : active ? '#7c3aed' : '#1e1533',
                color: '#fff', fontSize: 11, fontWeight: 700,
              }}>
                {done ? '✓' : i + 1}
              </span>
              <span style={{ color: active ? '#fff' : done ? '#22c55e' : '#6b7280', fontSize: 9, textAlign: 'center', lineHeight: 1.2 }}>
                {s.title.split(' ').slice(0, 2).join(' ')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active step */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>{currentStep + 1}</span>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 17, margin: 0 }}>
            {WIZARD_STEPS[currentStep].title}
          </h3>
          {completedSteps.has(currentStep) && (
            <span style={{ background: '#052e16', color: '#22c55e', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
              ✓ Completed
            </span>
          )}
        </div>
        <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 0 16px 38px' }}>
          {WIZARD_STEPS[currentStep].desc}
        </p>

        {/* Step 0: Video */}
        {currentStep === 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              background: '#080612', borderRadius: 12, overflow: 'hidden',
              border: '1px solid #2d1b69', position: 'relative',
            }}>
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0d0b17,#1e1040)' }}>
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 24px #7c3aed60',
                  }}>
                    {isPlaying
                      ? <div style={{ display: 'flex', gap: 4 }}><div style={{ width: 4, height: 18, background: '#fff', borderRadius: 2 }} /><div style={{ width: 4, height: 18, background: '#fff', borderRadius: 2 }} /></div>
                      : <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '18px solid #fff', marginLeft: 4 }} />
                    }
                  </div>
                  <span style={{ color: '#c4b5fd', fontSize: 12 }}>{isPlaying ? 'Pause' : videoProgress > 0 ? 'Resume' : 'Play Tutorial'}</span>
                </button>
                <div style={{ position: 'absolute', top: 10, right: 10, background: '#080612cc', borderRadius: 6, padding: '2px 8px', color: '#fff', fontSize: 11 }}>
                  3:45
                </div>
              </div>
              <div style={{ padding: '8px 12px', background: '#080612' }}>
                <div style={{ height: 4, background: '#1e1533', borderRadius: 99, cursor: 'pointer' }} onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width * 100;
                  setVideoProgress(pct);
                  if (pct >= 100) { setVideoWatched(true); setIsPlaying(false); }
                }}>
                  <div style={{ height: '100%', width: `${videoProgress}%`, background: 'linear-gradient(90deg,#6d28d9,#a78bfa)', borderRadius: 99, transition: 'width 0.1s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ color: '#6b7280', fontSize: 10 }}>{Math.floor(videoProgress * 2.25)}s / 3:45</span>
                  <button onClick={() => { setVideoProgress(100); setVideoWatched(true); setIsPlaying(false); }}
                    style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 10, cursor: 'pointer' }}>
                    Skip →
                  </button>
                </div>
              </div>
            </div>
            {videoWatched && (
              <div style={{ marginTop: 10, background: '#052e16', border: '1px solid #166534', borderRadius: 8, padding: '8px 12px', color: '#22c55e', fontSize: 12, textAlign: 'center' }}>
                ✓ Video complete — you can proceed to Step 2
              </div>
            )}
          </div>
        )}

        {/* Step 4: Credentials form */}
        {currentStep === 4 && (
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Client ID', val: clientId, setter: setClientId, placeholder: 'xxxx.apps.googleusercontent.com' },
              { label: 'Client Secret', val: clientSecret, setter: setClientSecret, placeholder: 'GOCSPX-xxxxxxxxxxxx' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>{f.label}</div>
                <input
                  type={f.label === 'Client Secret' ? 'password' : 'text'}
                  value={f.val}
                  onChange={e => f.setter(e.target.value)}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', background: '#1e1533', border: '1px solid #3b2680',
                    borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 13,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Screenshot */}
        <StepScreenshot step={currentStep + 1} />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep(currentStep - 1)} style={{
              background: '#1e1533', border: '1px solid #2d1b69', color: '#a78bfa',
              borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer',
            }}>← Previous</button>
          )}
          {currentStep === 0 && (
            <button
              onClick={() => { if (videoWatched || videoProgress > 0) { setVideoProgress(100); setVideoWatched(true); completeStep(0); } else { setIsPlaying(true); } }}
              style={{
                flex: 1, background: videoWatched ? 'linear-gradient(90deg,#166534,#15803d)' : 'linear-gradient(90deg,#4c1d95,#6d28d9)',
                border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 13, padding: '10px 0', cursor: 'pointer',
              }}>
              {videoWatched ? '✓ Continue to Step 2' : 'Watch Video'}
            </button>
          )}
          {currentStep > 0 && currentStep < 4 && (
            <button onClick={() => completeStep(currentStep)} style={{
              flex: 1, background: 'linear-gradient(90deg,#4c1d95,#6d28d9)',
              border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 13, padding: '10px 0', cursor: 'pointer',
            }}>Continue →</button>
          )}
          {currentStep === 4 && (
            <button onClick={handleSaveCredentials} disabled={!clientId || !clientSecret || saving} style={{
              flex: 1, background: clientId && clientSecret ? 'linear-gradient(90deg,#4c1d95,#6d28d9)' : '#1e1533',
              border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 13, padding: '10px 0',
              cursor: clientId && clientSecret ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : 'Save & Continue →'}
            </button>
          )}
          {currentStep === 5 && (
            <button onClick={handleConnect} style={{
              flex: 1, background: 'linear-gradient(90deg,#1a73e8,#4285f4)',
              border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 0', cursor: 'pointer',
            }}>
              🔐 Connect with Google →
            </button>
          )}
        </div>

        {/* Docs */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { label: '📖 Documentation', href: 'https://developers.google.com/youtube/v3/getting-started' },
            { label: '🎬 Watch Tutorial Again', href: '#' },
            { label: '💬 Contact Support', href: 'mailto:support@moderateai.site' },
          ].map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{
              color: '#7c3aed', fontSize: 12, textDecoration: 'none',
            }}>{l.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared API Tab ───────────────────────────────────────────────────────────

function SharedAPITab({ uid }: { uid: string }) {
  const [data, setData] = useState<SharedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>('7D');
  const [usageHistory, setUsageHistory] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', uid, 'settings', 'sharedApi'), snap => {
      if (!snap.exists()) {
        setData(null);
        setLoading(false);
        return;
      }
      const d = snap.data();
      setData({
        plan: d.plan ?? 'free_trial',
        aiActionsTotal: d.aiActionsTotal ?? 250,
        aiActionsUsed: d.aiActionsUsed ?? 0,
        trialEndsAt: d.trialEndsAt?.toDate() ?? null,
        resetDate: d.resetDate?.toDate() ?? null,
        extensionUsed: d.extensionUsed ?? false,
        recentActivity: (d.recentActivity ?? []).map((a: any) => ({ action: a.action, time: a.time?.toDate() })),
        health: d.health ?? 'operational',
        lastChecked: d.lastChecked?.toDate() ?? null,
      });
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
    const unsub = onSnapshot(
      query(collection(db, 'users', uid, 'usageHistory'), orderBy('date', 'desc'), limit(days)),
      snap => {
        const pts: ChartPoint[] = snap.docs.reverse().map(d => ({
          date: d.data().dateLabel ?? d.id,
          value: d.data().aiActionsUsed ?? 0,
        }));
        setUsageHistory(pts);
      }
    );
    return () => unsub();
  }, [uid, range]);

  const remaining = data ? data.aiActionsTotal - data.aiActionsUsed : 0;
  const usedPct = data ? (data.aiActionsUsed / data.aiActionsTotal) * 100 : 0;
  const trialExpired = data?.trialEndsAt ? data.trialEndsAt < new Date() : false;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[140, 90, 180, 200].map((h, i) => <div key={i} style={{ height: h, borderRadius: 14, overflow: 'hidden' }}><Skeleton h={h} radius={14} /></div>)}
    </div>
  );

  if (!data) return (
    <EmptyState icon="🔌" title="Shared API Not Configured"
      sub="Your shared API plan hasn't been set up yet. Contact support to get started."
      cta="Contact Support" onCta={() => window.open('mailto:support@moderateai.site')} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1040 0%, #2d1b69 100%)',
        borderRadius: 16, padding: '24px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid #3b2680', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" fill="#a78bfa" /></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>ModerateAI Shared API</div>
              <div style={{ color: '#c4b5fd', fontSize: 13 }}>We handle everything for you. No setup required.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            {['Secure', 'Reliable', 'Always On', 'Optimized'].map(f => (
              <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#86efac', fontSize: 12 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#16a34a" opacity="0.3" /><path d="M3.5 6l2 2 3-3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {f}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={data.health} />
          <span style={{ color: data.health === 'operational' ? '#22c55e' : '#f59e0b', fontSize: 12, textTransform: 'capitalize' }}>{data.health}</span>
        </div>
      </div>

      {/* Trial / Plan banner */}
      {data.plan === 'free_trial' && !trialExpired && (
        <div style={{ background: '#13101f', border: '1px solid #2d1b69', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #4c1d95, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎁</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>You're on Free Trial! 🎉</div>
            <div style={{ color: '#7c6fad', fontSize: 12 }}>Explore all features with {data.aiActionsTotal} free AI actions.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
              <span style={{ color: '#a78bfa' }}>{remaining}</span> / {data.aiActionsTotal}
            </div>
            <div style={{ color: '#7c6fad', fontSize: 11 }}>AI Actions Left</div>
            <div style={{ marginTop: 4, height: 4, width: 120, background: '#2d1b69', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${Math.min(100, 100 - usedPct)}%`, background: '#7c3aed', borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Trial ends in</div>
            {data.trialEndsAt ? (() => {
              const daysLeft = Math.max(0, Math.ceil((data.trialEndsAt.getTime() - Date.now()) / 86400000));
              return <>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>{daysLeft} Days</div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>📅 {fmt(data.trialEndsAt)}</div>
              </>;
            })() : <div style={{ color: '#6b7280', fontSize: 14 }}>—</div>}
          </div>
        </div>
      )}

      {/* Trial expired — extension offer */}
      {data.plan === 'free_trial' && trialExpired && !data.extensionUsed && (
        <div style={{ background: '#13101f', border: '1px solid #f59e0b40', borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>⏰ Your Trial Has Ended</div>
          <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 14 }}>Extend once for ₹69 to get 30 more days + 250 AI actions.</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16 }}>30 Days</div><div style={{ color: '#6b7280', fontSize: 11 }}>Extra validity</div></div>
            <div><div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16 }}>250 AI Actions</div><div style={{ color: '#6b7280', fontSize: 11 }}>Full access</div></div>
            <div style={{ background: 'linear-gradient(135deg,#1a0e3a,#7c3aed)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', marginLeft: 'auto' }}>
              <div style={{ color: '#fbbf24', fontSize: 10 }}>₹</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>69</div>
              <div style={{ color: '#c4b5fd', fontSize: 10 }}>One-time Offer</div>
            </div>
          </div>
          <button style={{ width: '100%', marginTop: 14, background: 'linear-gradient(90deg,#6d28d9,#7c3aed)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 0', cursor: 'pointer' }}>
            Extend Trial Now →
          </button>
        </div>
      )}

      {/* After extension — upgrade required */}
      {(data.extensionUsed && trialExpired) && (
        <div style={{ background: '#13101f', border: '1px solid #7c3aed40', borderRadius: 14, padding: 18, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>Upgrade Required</div>
          <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 14 }}>Your trial extension has been used. Choose a paid plan to continue.</div>
          <button style={{ background: 'linear-gradient(90deg,#4c1d95,#7c3aed)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 32px', cursor: 'pointer' }}>
            View Plans →
          </button>
        </div>
      )}

      {/* Usage stats */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>
            Shared API Usage <span style={{ color: '#6b7280', fontWeight: 400 }}>(This Month)</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {[
            { label: 'AI Actions Used', value: `${data.aiActionsUsed} / ${data.aiActionsTotal}`, sub: `${Math.round(usedPct)}% Used`, subColor: '#6b7280', bar: usedPct },
            { label: 'AI Actions Remaining', value: String(remaining), sub: `${Math.round(100 - usedPct)}% Remaining`, subColor: '#a78bfa', bar: 100 - usedPct },
            { label: 'Resets In', value: data.resetDate ? `${Math.max(0, Math.ceil((data.resetDate.getTime() - Date.now()) / 86400000))} Days` : '—', sub: fmt(data.resetDate), subColor: '#6b7280', bar: null },
            { label: 'Current Plan', value: data.plan.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()), sub: '🚀 Upgrade', subColor: '#7c3aed', bar: null, valueColor: '#22c55e' },
          ].map(item => (
            <div key={item.label} style={{ background: '#13101f', borderRadius: 12, padding: 14, border: '1px solid #1e1533' }}>
              <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 6 }}>{item.label}</div>
              <div style={{ color: (item as any).valueColor || '#fff', fontWeight: 700, fontSize: 18 }}>{item.value}</div>
              {item.bar !== null && (
                <div style={{ height: 4, background: '#2d1b69', borderRadius: 99, margin: '6px 0' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, item.bar)}%`, background: item.bar === 0 ? '#374151' : '#7c3aed', borderRadius: 99 }} />
                </div>
              )}
              <div style={{ color: item.subColor, fontSize: 11 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>AI Actions Usage Over Time</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['7D', '30D', '90D'] as TimeRange[]).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                background: range === r ? '#7c3aed' : 'transparent',
                border: '1px solid ' + (range === r ? '#7c3aed' : '#2d1b69'),
                color: range === r ? '#fff' : '#6b7280',
                borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
              }}>{r}</button>
            ))}
          </div>
        </div>
        {usageHistory.length === 0 ? (
          <EmptyState icon="📊" title="No usage data yet" sub="AI action usage will appear here once you start using the API." />
        ) : (
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageHistory}>
                <CartesianGrid stroke="#1e1533" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e1533', border: 'none', borderRadius: 8, color: '#fff' }} />
                <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>Shared API Status</div>
        <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 14 }}>
          Real-time status · Last checked: {timeAgo(data.lastChecked)}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['API Server', 'Database', 'YouTube Data API', 'AI Engine', 'Rate Limiting'].map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 90 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusDot status={data.health} />
                <span style={{ color: '#d1d5db', fontSize: 13 }}>{s}</span>
              </div>
              <span style={{ color: data.health === 'operational' ? '#22c55e' : '#f59e0b', fontSize: 12, paddingLeft: 14, textTransform: 'capitalize' }}>{data.health}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 14 }}>Recent Activity</div>
        {data.recentActivity.length === 0 ? (
          <EmptyState icon="⚡" title="No recent activity" sub="API actions will appear here in real time." />
        ) : (
          data.recentActivity.slice(0, 6).map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid #1e1533' : 'none' }}>
              <span style={{ color: '#d1d5db', fontSize: 13 }}>{a.action}</span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>{timeAgo(a.time)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Google Cloud Connected Dashboard ────────────────────────────────────────

function GoogleCloudDashboard({ uid, project }: { uid: string; project: GoogleProject }) {
  const [range, setRange] = useState<TimeRange>('7D');
  const [usageHistory, setUsageHistory] = useState<ChartPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showClientId, setShowClientId] = useState(false);

  useEffect(() => {
    const days = range === '7D' ? 7 : range === '30D' ? 30 : 90;
    const unsub = onSnapshot(
      query(collection(db, 'users', uid, 'googleUsageHistory'), orderBy('date', 'desc'), limit(days)),
      snap => {
        const pts: ChartPoint[] = snap.docs.reverse().map(d => ({
          date: d.data().dateLabel ?? d.id,
          value: d.data().units ?? 0,
        }));
        setUsageHistory(pts);
      }
    );
    return () => unsub();
  }, [uid, range]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/auth/youtube/refresh-stats', { method: 'POST' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Google Cloud project?')) return;
    await updateDoc(doc(db, 'users', uid, 'settings', 'googleCloud'), {
      connected: false,
      disconnectedAt: serverTimestamp(),
    });
  };

  const quotaRemaining = project.dailyQuota - project.quotaUsed;
  const quotaUsedPct = project.dailyQuota > 0 ? (project.quotaUsed / project.dailyQuota) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Project info */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {project.googleAvatar
              ? <img src={project.googleAvatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>G</div>
            }
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>My Google Cloud Project</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{project.googleAccount}</div>
            </div>
            <span style={{ background: '#052e16', color: '#22c55e', borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>Connected</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleRefresh} disabled={refreshing} style={{ background: '#1e1533', border: '1px solid #2d1b69', color: '#a78bfa', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              {refreshing ? '⟳ Refreshing…' : '🔄 Refresh'}
            </button>
            <button onClick={handleDisconnect} style={{ background: '#1a0e0e', border: '1px solid #7f1d1d', color: '#f87171', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              Disconnect
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Project Name', value: project.projectName || '—' },
              { label: 'Project ID', value: project.projectId || '—' },
              { label: 'Project Number', value: project.projectNumber || '—' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ color: '#6b7280', fontSize: 11 }}>{f.label}</div>
                <div style={{ color: '#d1d5db', fontSize: 13, fontWeight: 500 }}>{f.value}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>Connected</div>
                <div style={{ color: '#d1d5db', fontSize: 12 }}>{fmt(project.connectedAt)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: 11 }}>Last Sync</div>
                <div style={{ color: '#d1d5db', fontSize: 12 }}>{timeAgo(project.lastSync)}</div>
              </div>
            </div>
          </div>

          {/* Middle: statuses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'OAuth Status', value: project.oauthStatus },
              { label: 'API Status', value: project.apiStatus },
              { label: 'Billing Status', value: project.billingStatus },
              { label: 'Credentials', value: 'Valid' },
              { label: 'Quota Reset', value: project.quotaResetAt ? fmt(project.quotaResetAt) : '—' },
              { label: 'Last Verification', value: timeAgo(project.lastVerification) },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusDot status={s.value.toLowerCase()} />
                <span style={{ color: '#6b7280', fontSize: 12, flex: 1 }}>{s.label}</span>
                <span style={{ color: '#22c55e', fontSize: 12, textTransform: 'capitalize' }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Donut */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Daily Quota Usage</div>
            <div style={{ position: 'relative', width: 90, height: 90 }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="38" fill="none" stroke="#1e1533" strokeWidth="12" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#60a5fa" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 38 * quotaUsedPct / 100} ${2 * Math.PI * 38}`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{project.quotaUsed.toLocaleString()}</div>
                <div style={{ color: '#6b7280', fontSize: 9 }}>/ {project.dailyQuota.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ color: '#60a5fa', fontSize: 12 }}>{Math.round(quotaUsedPct)}% Used</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { icon: '🌐', label: 'Google Cloud Console', href: 'https://console.cloud.google.com' },
            { icon: '📚', label: 'API Library', href: 'https://console.cloud.google.com/apis/library' },
            { icon: '🔑', label: 'Credentials', href: 'https://console.cloud.google.com/apis/credentials' },
          ].map(b => (
            <a key={b.label} href={b.href} target="_blank" rel="noreferrer" style={{
              flex: 1, background: '#13101f', border: '1px solid #2d1b69',
              color: '#d1d5db', borderRadius: 8, padding: '8px 12px',
              fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              textDecoration: 'none',
            }}>
              {b.icon} {b.label}
            </a>
          ))}
        </div>
      </div>

      {/* Credentials */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 14 }}>Credentials & OAuth</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          <div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Client ID</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ color: '#d1d5db', fontSize: 13, fontFamily: 'monospace' }}>
                {showClientId ? project.clientId : '•'.repeat(20) + (project.clientId?.slice(-6) || '')}
              </span>
              <button onClick={() => setShowClientId(v => !v)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 14 }}>
                {showClientId ? '🙈' : '👁️'}
              </button>
              {project.clientId && (
                <button onClick={() => navigator.clipboard.writeText(project.clientId)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>📋</button>
              )}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Quota Type</div>
            <div style={{ color: '#d1d5db', fontSize: 13, marginTop: 2 }}>{project.quotaType || '—'}</div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>OAuth Scopes</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {project.oauthScopes?.length ? project.oauthScopes.map(s => (
                <span key={s} style={{ background: '#1e1533', color: '#a78bfa', borderRadius: 6, padding: '2px 8px', fontSize: 10 }}>{s}</span>
              )) : <span style={{ color: '#6b7280', fontSize: 12 }}>—</span>}
            </div>
          </div>
          <div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>Redirect URI</div>
            <div style={{ color: '#d1d5db', fontSize: 12, marginTop: 2, wordBreak: 'break-all' }}>{project.redirectUri || '—'}</div>
          </div>
        </div>
      </div>

      {/* Quota stats */}
      <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>YouTube Data API Usage <span style={{ color: '#6b7280', fontWeight: 400, fontSize: 13 }}>(Daily Quota)</span></div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['7D', '30D', '90D'] as TimeRange[]).map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                background: range === r ? '#7c3aed' : 'transparent',
                border: '1px solid ' + (range === r ? '#7c3aed' : '#2d1b69'),
                color: range === r ? '#fff' : '#6b7280',
                borderRadius: 8, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Daily Quota', value: `${project.dailyQuota.toLocaleString()} units`, sub: 'Hard limit per day', subColor: '#6b7280' },
            { label: 'Used Today', value: `${project.quotaUsed.toLocaleString()} units`, sub: `${Math.round(quotaUsedPct)}% of daily quota`, subColor: '#f59e0b' },
            { label: 'Remaining', value: `${quotaRemaining.toLocaleString()} units`, sub: `${Math.round(100 - quotaUsedPct)}% remaining`, subColor: '#22c55e' },
            { label: 'Requests Today', value: String(project.requestsToday), sub: 'Across endpoints', subColor: '#6b7280' },
          ].map(item => (
            <div key={item.label} style={{ background: '#13101f', borderRadius: 12, padding: 14, border: '1px solid #1e1533' }}>
              <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{item.value}</div>
              <div style={{ color: item.subColor, fontSize: 11, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>API Usage Over Time (Units)</div>
            {usageHistory.length === 0 ? (
              <EmptyState icon="📈" title="No history yet" sub="Usage trends will appear here." />
            ) : (
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageHistory}>
                    <CartesianGrid stroke="#1e1533" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1e1533', border: 'none', borderRadius: 8, color: '#fff' }} />
                    <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div>
            <div style={{ color: '#d1d5db', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Top API Methods (Today)</div>
            {project.topMethods?.length === 0 ? (
              <EmptyState icon="🔌" title="No methods tracked yet" sub="API method usage will show here." />
            ) : (
              <>
                {project.topMethods?.map(m => (
                  <div key={m.name} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#d1d5db', fontSize: 12 }}>{m.name}</span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{m.units} units ({Math.round(m.pct)}%)</span>
                    </div>
                    <div style={{ height: 4, background: '#1e1533', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${m.pct}%`, background: '#7c3aed', borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e1533', paddingTop: 8 }}>
                  <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 600 }}>Total</span>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{project.quotaUsed.toLocaleString()} units</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quota reset + need more */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 12 }}>Quota Reset</div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          {project.quotaResetAt ? (
            <>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 16 }}>{fmt(project.quotaResetAt)}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>12:00 AM (IST)</div>
              <div style={{ marginTop: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 11 }}>Time remaining</div>
                <CountdownTimer target={project.quotaResetAt} />
              </div>
            </>
          ) : <div style={{ color: '#6b7280', fontSize: 13 }}>Quota reset time unavailable</div>}
        </div>
        <div style={{ background: '#0d0b17', border: '1px solid #1e1533', borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 8 }}>Need More Quota?</div>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 14 }}>Request a quota increase directly from Google.</div>
          <a href="https://console.cloud.google.com/iam-admin/quotas" target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', background: 'none', border: '1px solid #2d1b69', color: '#a78bfa',
            borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer', textDecoration: 'none',
            marginBottom: 8,
          }}>
            Request Quota Increase ↗
          </a>
          <a href="https://developers.google.com/youtube/v3/getting-started#quota" target="_blank" rel="noreferrer"
            style={{ display: 'block', textAlign: 'center', color: '#7c3aed', fontSize: 12, textDecoration: 'none' }}>
            Learn how quota works ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Google Cloud Tab (state router) ─────────────────────────────────────────

function GoogleCloudTab({ uid }: { uid: string }) {
  const [project, setProject] = useState<GoogleProject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', uid, 'settings', 'googleCloud'), snap => {
      if (!snap.exists() || !snap.data().connected) {
        setProject(null);
        setLoading(false);
        return;
      }
      const d = snap.data();
      setProject({
        connected: true,
        projectName: d.projectName ?? '',
        projectId: d.projectId ?? '',
        projectNumber: d.projectNumber ?? '',
        googleAccount: d.googleAccount ?? '',
        googleAvatar: d.googleAvatar ?? '',
        connectedAt: d.connectedAt?.toDate() ?? null,
        lastSync: d.lastSync?.toDate() ?? null,
        oauthStatus: d.oauthStatus ?? '—',
        oauthScopes: d.oauthScopes ?? [],
        redirectUri: d.redirectUri ?? '',
        apiStatus: d.apiStatus ?? '—',
        billingStatus: d.billingStatus ?? '—',
        clientId: d.clientId ?? '',
        quotaType: d.quotaType ?? '',
        dailyQuota: d.dailyQuota ?? 10000,
        quotaUsed: d.quotaUsed ?? 0,
        requestsToday: d.requestsToday ?? 0,
        lastVerification: d.lastVerification?.toDate() ?? null,
        quotaResetAt: d.quotaResetAt?.toDate() ?? null,
        topMethods: d.topMethods ?? [],
        usageHistory: [],
      });
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[200, 120, 160].map((h, i) => <div key={i} style={{ height: h, borderRadius: 14, overflow: 'hidden' }}><Skeleton h={h} radius={14} /></div>)}
    </div>
  );

  if (!project) return <SetupWizard onConnect={() => {}} />;

  return <GoogleCloudDashboard uid={uid} project={project} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function APIAccessPage() {
  const [tab, setTab] = useState<Tab>('shared');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<{ status: string; lastChecked: Date | null }>({ status: 'operational', lastChecked: null });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'status'), snap => {
      if (!snap.exists()) return;
      const d = snap.data();
      setSystemStatus({ status: d.status ?? 'operational', lastChecked: d.lastChecked?.toDate() ?? null });
    });
    return () => unsub();
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: '100vh', background: '#080612', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#a78bfa', fontSize: 14 }}>Loading…</div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#080612', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState icon="🔐" title="Sign in required" sub="Please sign in to access API settings." cta="Sign In" onCta={() => window.location.href = '/login'} />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: #4b5563; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#080612', color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: '24px 20px 80px',
        maxWidth: 900, margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>API Access</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
              Manage how ModerateAI connects to the YouTube Data API
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: systemStatus.status === 'operational' ? '#0d1f12' : '#1a0e0e',
            border: `1px solid ${systemStatus.status === 'operational' ? '#166534' : '#7f1d1d'}`,
            borderRadius: 10, padding: '6px 12px',
          }}>
            <StatusDot status={systemStatus.status} />
            <div>
              <div style={{ color: systemStatus.status === 'operational' ? '#22c55e' : '#f87171', fontSize: 12, fontWeight: 600 }}>
                {systemStatus.status === 'operational' ? 'All Systems Normal' : 'Degraded'}
              </div>
              <div style={{ color: '#6b7280', fontSize: 10 }}>Last checked: {timeAgo(systemStatus.lastChecked)}</div>
            </div>
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
              <path d="M2 8 Q5 4 8 8 Q11 12 14 8 Q17 4 20 8" stroke={systemStatus.status === 'operational' ? '#22c55e' : '#f87171'} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: '#0d0b17', border: '1px solid #1e1533',
          borderRadius: 14, padding: 6, marginBottom: 20,
        }}>
          <button onClick={() => setTab('shared')} style={{
            background: tab === 'shared' ? 'linear-gradient(90deg,#4c1d95,#6d28d9)' : 'transparent',
            border: 'none', borderRadius: 10,
            color: tab === 'shared' ? '#fff' : '#6b7280',
            padding: '12px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="3" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 6v3M8 9l-4 2M8 9l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            ModerateAI Shared API
            <span style={{ background: '#7c3aed', color: '#fff', fontSize: 10, borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>
              Recommended
            </span>
          </button>
          <button onClick={() => setTab('google')} style={{
            background: tab === 'google' ? 'linear-gradient(90deg,#4c1d95,#6d28d9)' : 'transparent',
            border: 'none', borderRadius: 10,
            color: tab === 'google' ? '#fff' : '#6b7280',
            padding: '12px 0', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
          }}>
            ☁️ My Google Cloud Project
          </button>
        </div>

        {tab === 'shared' ? <SharedAPITab uid={user.uid} /> : <GoogleCloudTab uid={user.uid} />}
      </div>
    </>
  );
}