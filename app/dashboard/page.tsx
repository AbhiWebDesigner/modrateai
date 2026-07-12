'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, MessageSquare, Eye, Settings, LogOut, MoreHorizontal, CreditCard,
  Home, BarChart3, Bell, Zap, Search,
  Layers, Radio, Activity, Wifi, Cpu, Target, TrendingUp, CheckCircle, Infinity
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

function Sparkline({ color, up = true }: { color: string; up?: boolean }) {
  const points = up
    ? [28, 22, 32, 24, 36, 28, 42, 34, 48, 38, 56, 44, 62]
    : [62, 58, 52, 60, 48, 54, 44, 50, 40, 46, 38, 42, 36];
  const max = Math.max(...points), min = Math.min(...points);
  const h = 36, w = 80;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`} />
    </svg>
  );
}

function CircularProgress({ pct }: { pct: number }) {
  const r = 40, circ = 2 * Math.PI * r;
  const filled = (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 85 ? '#f87171' : pct >= 60 ? '#F59E0B' : '#34d399';
  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width={96} height={96} viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={48} cy={48} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}88)`, transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#FAFAFA', fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{Math.round(pct)}<span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>%</span></span>
      </div>
    </div>
  );
}

function MonthlyUsageCard({
  plan, youtubeConnected, commentsUsed, commentsLimit,
  trialDaysLeft, onConnectYouTube
}: {
  plan: string;
  youtubeConnected: boolean;
  commentsUsed: number;
  commentsLimit: number;
  trialDaysLeft: number | null;
  onConnectYouTube: () => void;
}) {
  const usagePct = commentsLimit > 0 ? Math.min(100, (commentsUsed / commentsLimit) * 100) : 0;
  const remaining = commentsLimit - commentsUsed;

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 8, padding: '4px 10px',
    fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
    textTransform: 'uppercase',
  };

  if (!youtubeConnected) {
    return (
      <div className="db-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="db-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="db-card-title">Monthly Usage</div>
            <div className="db-card-sub">Comment scan quota</div>
          </div>
          <div style={{ ...badgeStyle, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', color: '#F59E0B' }}>
            <Zap size={9} /> Free Trial
          </div>
        </div>
        <div className="db-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} color="#F59E0B" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.6, maxWidth: 220 }}>
            Connect your YouTube channel to start your free trial.
          </p>
          <button onClick={onConnectYouTube} className="db-btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Connect YouTube
          </button>
        </div>
      </div>
    );
  }

  if (plan === 'agency') {
    return (
      <div className="db-card">
        <div className="db-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="db-card-title">Monthly Usage</div>
            <div className="db-card-sub">Comment scan quota</div>
          </div>
          <div style={{ ...badgeStyle, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.28)', color: '#a78bfa' }}>
            <Zap size={9} /> Agency
          </div>
        </div>
        <div className="db-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: '2px solid rgba(167,139,250,0.25)', background: 'rgba(167,139,250,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36, color: '#a78bfa', fontWeight: 900, lineHeight: 1 }}>∞</span>
          </div>
          <div>
            <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>Unlimited Usage</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 3 }}>No quota restrictions on Agency</div>
          </div>
          <Link href="/billing" className="db-btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
            Manage Subscription
          </Link>
        </div>
      </div>
    );
  }

  const isFree = plan === 'free';
  const quotaDisplay = isFree ? '1,500' : commentsLimit.toLocaleString();

  return (
    <div className="db-card">
      <div className="db-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="db-card-title">Monthly Usage</div>
          <div className="db-card-sub">Comment scan quota</div>
        </div>
        {isFree ? (
          <div style={{ ...badgeStyle, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', color: '#F59E0B' }}>
            <Zap size={9} /> Free Trial
          </div>
        ) : (
          <div style={{ ...badgeStyle, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)', color: '#34d399' }}>
            <CheckCircle size={9} /> Pro
          </div>
        )}
      </div>
      <div className="db-card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <CircularProgress pct={usagePct} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
              <span style={{ color: '#FAFAFA', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{commentsUsed.toLocaleString()}</span>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, fontWeight: 500 }}>/ {quotaDisplay}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>
                <span>Used</span><span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{commentsUsed.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>
                <span>Remaining</span><span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{remaining.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>
                <span>Quota</span><span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{quotaDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', borderRadius: 8, background: 'linear-gradient(90deg, #F59E0B, #7C3AED)', width: `${usagePct}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
          <span>{usagePct.toFixed(0)}% used</span>
          {isFree && trialDaysLeft !== null && (
            <span style={{ color: trialDaysLeft <= 3 ? '#f87171' : '#F59E0B', fontWeight: 700 }}>
              {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
            </span>
          )}
        </div>

        {isFree && (
          <Link href="/billing" className="db-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Zap size={13} /> Upgrade to Pro
          </Link>
        )}
        {!isFree && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/billing" className="db-btn-ghost" style={{ flex: 1, textAlign: 'center' }}>
              Manage Plan
            </Link>
            <Link href="/billing?upgrade=agency" className="db-btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
              <Zap size={12} /> Upgrade to Agency
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthRow({ icon: Icon, label, sub, value, color = '#34d399', dot = 'green' }:
  { icon: any; label: string; sub: string; value?: string; color?: string; dot?: 'green' | 'amber' | 'red' }) {
  const dotColor = { green: '#22c55e', amber: '#F59E0B', red: '#f87171' }[dot];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: 600 }}>{label}</div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600 }}>{value}</span>
        </div>
      )}
    </div>
  );
}

function AccuracyCard({ accuracy }: { accuracy: number | null }) {
  if (accuracy === null) {
    return (
      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target size={22} color="rgba(255,255,255,0.15)" />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, textAlign: 'center' }}>
          No accuracy data yet. Connect YouTube and let the AI moderate to see confidence scores.
        </p>
      </div>
    );
  }
  const pct = accuracy;
  const r = 54, circ = 2 * Math.PI * r, filled = (pct / 100) * circ;
  const color = pct >= 90 ? '#34d399' : pct >= 70 ? '#F59E0B' : '#f87171';
  const label = pct >= 90 ? 'Excellent' : pct >= 70 ? 'Good' : 'Needs review';
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
          <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#FAFAFA', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{pct}<span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>%</span></span>
          <span style={{ color, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{label}</span>
        </div>
      </div>
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[{ label: 'True Positive', value: `${pct}%`, color: '#34d399' }, { label: 'False Positive', value: `${(100 - pct).toFixed(1)}%`, color: '#f87171' }].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ color: s.color, fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10.5, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Rolling 24h · updated in real time</div>
    </div>
  );
}

function YTIcon({ color = '#f87171', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const unsubDocRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      if (unsubDocRef.current) unsubDocRef.current();
      unsubDocRef.current = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        setLoading(false);
      });
    });
    return () => {
      unsubAuth();
      if (unsubDocRef.current) unsubDocRef.current();
    };
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };
  const handleYouTubeConnect = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth?uid=${user?.uid}`;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#090909', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const plan             = (userData?.plan as string) || 'free';
  const commentsScanned  = (userData?.comments_scanned  as number) ?? (userData?.comments_used as number) ?? null;
  const hiddenComments   = (userData?.hidden_comments   as number) ?? null;
  const aiReplies        = (userData?.ai_replies        as number) ?? null;
  const avgResponseMs    = (userData?.avg_response_ms   as number) ?? null;
  const moderationAcc    = (userData?.moderation_accuracy as number) ?? null;
  const commentsUsed     = (userData?.comments_used     as number) || 0;
  const commentsLimit    = plan === 'free' ? 1500 : plan === 'pro' ? 200000 : (userData?.comments_limit as number) || 200000;
  const youtubeConnected = (userData?.youtube_connected as boolean) || false;
  const channelName      = (userData?.youtube_channel_name as string) || (userData?.channel_name as string) || null;
  const channelHandle    = (userData?.youtube_channel_handle as string) || (userData?.channel_handle as string) || null;
  const aiModel          = (userData?.ai_model          as string) || null;
  const webhookPct       = (userData?.webhook_delivery_percent as number) ?? null;
  const webhookAge       = (userData?.webhook_last_delivery_age as string) ?? null;

  const trialEndsAt = userData?.trial_ends_at?.toDate?.() as Date | undefined;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;

  const firstName  = user?.displayName?.split(' ')[0] || 'there';
  const initials   = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const planLabel  = plan === 'free' ? 'Free Trial' : plan === 'pro' ? 'Pro' : plan === 'agency' ? 'Agency' : 'Free Trial';

  const fmt   = (n: number | null) => n === null ? null : n >= 1000 ? n.toLocaleString() : String(n);
  const fmtMs = (ms: number | null) => ms === null ? null : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  const navItems = [
    { icon: Home,      label: 'Overview',    href: '/dashboard',  active: true  },
    { icon: Radio,     label: 'Live Feed',   href: '/live-feed',  active: false },
    { icon: BarChart3, label: 'Analytics',   href: '/analytics',  active: false },
    { icon: Zap,       label: 'Automations', href: '/automation', active: false },
    { icon: Bell,      label: 'Alerts',      href: '/alerts',     active: false },
    { icon: Layers,    label: 'Channels',    href: '/channels',   active: false },
    { icon: Settings,  label: 'Settings',    href: '/settings',   active: false },
  ];

  const statCards = [
    { label: 'Comments Scanned', fmtValue: fmt(commentsScanned),  raw: commentsScanned,  up: true,  color: '#F59E0B', icon: MessageSquare },
    { label: 'Hidden Comments',  fmtValue: fmt(hiddenComments),   raw: hiddenComments,   up: true,  color: '#f87171', icon: Eye          },
    { label: 'AI Replies',       fmtValue: fmt(aiReplies),        raw: aiReplies,        up: true,  color: '#a78bfa', icon: MessageSquare },
    { label: 'Avg Response',     fmtValue: fmtMs(avgResponseMs),  raw: avgResponseMs,    up: false, color: '#34d399', icon: Activity     },
  ];

  type HRow = { key: string; icon: any; label: string; sub: string; value?: string; color: string; dot: 'green' | 'amber' | 'red' };
  const healthRows: HRow[] = [];

  healthRows.push({
    key: 'api', icon: Wifi, label: 'API Status',
    sub: avgResponseMs !== null ? 'Operational' : 'Operational',
    value: avgResponseMs !== null ? fmtMs(avgResponseMs)! : undefined,
    color: '#34d399',
    dot: avgResponseMs === null ? 'green' : avgResponseMs < 500 ? 'green' : avgResponseMs < 1500 ? 'amber' : 'red',
  });

  if (webhookPct !== null) {
    healthRows.push({
      key: 'webhook', icon: Zap, label: 'Webhook Delivery',
      sub: webhookAge ? `${webhookPct}% · ${webhookAge}` : `${webhookPct}%`,
      value: webhookPct === 100 ? 'Live' : `${webhookPct}%`,
      color: '#60a5fa',
      dot: webhookPct >= 95 ? 'green' : webhookPct >= 80 ? 'amber' : 'red',
    });
  }

  if (youtubeConnected && channelName) {
    healthRows.push({
      key: 'channel', icon: YTIcon, label: 'Channel',
      sub: channelHandle ? `@${channelHandle.replace('@', '')}` : channelName,
      color: '#f87171', dot: 'green',
    });
  }

  if (aiModel) {
    healthRows.push({
      key: 'model', icon: Cpu, label: 'AI Model',
      sub: aiModel, color: '#a78bfa', dot: 'green',
    });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        html, body { background: #090909; }

        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes pulse       { 0%,100%{ opacity:1; } 50%{ opacity:0.38; } }
        @keyframes fadeIn      { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes slideUp     { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes indicatorPulse { 0%,100%{ opacity:1; box-shadow:0 0 8px rgba(245,158,11,0.5); } 50%{ opacity:0.7; box-shadow:0 0 16px rgba(245,158,11,0.25); } }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

        .db-bg {
          min-height: 100vh;
          background: #090909;
          position: relative;
          overflow: hidden;
        }
        .db-bg::before {
          content:'';
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background:
            radial-gradient(ellipse 60% 50% at -5% 0%, rgba(245,158,11,0.09) 0%, transparent 65%),
            radial-gradient(ellipse 55% 45% at 105% 100%, rgba(124,58,237,0.07) 0%, transparent 65%);
        }
        .db-bg::after {
          content:'';
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .db-noise {
          position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 160px 160px;
        }
        .db-vignette {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background: radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%);
        }

        /* ── SIDEBAR ── */
        .db-sidebar {
          width: 220px; min-width: 220px;
          background: rgba(10,10,13,0.82);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-right: 1px solid rgba(255,255,255,0.055);
          display: flex; flex-direction: column;
          position: fixed; height: 100vh; left: 0; top: 0;
          z-index: 40;
          box-shadow:
            inset -1px 0 0 rgba(255,255,255,0.03),
            4px 0 40px rgba(0,0,0,0.4),
            4px 0 16px rgba(245,158,11,0.04);
        }
        .db-sidebar::before {
          content:'';
          position:absolute; left:0; top:18%; bottom:18%; width:2px; border-radius:0 2px 2px 0;
          background: linear-gradient(180deg, transparent, rgba(245,158,11,0.55), rgba(245,158,11,0.9), rgba(245,158,11,0.55), transparent);
          box-shadow: 0 0 14px rgba(245,158,11,0.35), 0 0 32px rgba(245,158,11,0.12);
        }

        .db-logo { padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.045); }
        .db-logo-inner { display:flex; align-items:center; gap:11px; }
        .db-logo-mark {
          width:36px; height:36px; border-radius:11px; flex-shrink:0;
          background: linear-gradient(135deg, #F59E0B 0%, #7C3AED 100%);
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 2px 12px rgba(245,158,11,0.3), 0 1px 4px rgba(0,0,0,0.4);
        }
        .db-logo-text { color:#FAFAFA; font-weight:800; font-size:15px; letter-spacing:-0.025em; }
        .db-logo-sub  { color:rgba(255,255,255,0.28); font-size:10px; font-weight:500; margin-top:1px; letter-spacing:0.01em; }

        .db-nav { flex:1; padding:14px 10px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }

        .db-nav-item {
          display:flex; align-items:center; gap:10px;
          padding:9px 13px; border-radius:12px;
          font-size:13px; font-weight:500;
          text-decoration:none; color:rgba(255,255,255,0.38);
          transition:all 0.22s cubic-bezier(.4,0,.2,1);
          border:1px solid transparent;
          position:relative; overflow:hidden; cursor:pointer;
        }
        .db-nav-item:hover {
          background: rgba(255,255,255,0.042);
          color: rgba(255,255,255,0.78);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        }
        .db-nav-item.active {
          background: rgba(255,170,35,0.08);
          color: #F5A623;
          border-color: rgba(255,170,35,0.22);
          box-shadow: 0 0 40px rgba(255,170,35,0.12), inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          font-weight: 600;
        }
        .db-nav-item.active::before {
          content:'';
          position:absolute; left:0; top:50%; transform:translateY(-50%);
          width:3px; height:22px; border-radius:0 3px 3px 0;
          background: linear-gradient(180deg, #F59E0B 0%, #ec4899 55%, #7C3AED 100%);
          box-shadow: 0 0 10px rgba(245,158,11,0.6);
          animation: indicatorPulse 2.5s ease-in-out infinite;
        }

        .db-nav-live {
          display:inline-flex; align-items:center; gap:4px;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.22);
          border-radius:8px; padding:2px 7px;
          font-size:9px; font-weight:700; color:#F59E0B;
          margin-left:auto; letter-spacing:0.05em; text-transform:uppercase;
          box-shadow: 0 0 8px rgba(245,158,11,0.08);
        }
        .db-nav-live-dot { width:4px; height:4px; border-radius:50%; background:#F59E0B; animation:pulse 1.8s infinite; flex-shrink:0; }

        .db-upgrade {
          margin:0 10px 10px;
          background: rgba(245,158,11,0.055);
          border:1px solid rgba(245,158,11,0.14);
          border-radius:14px; padding:15px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }

        .db-sidebar-bottom { padding:8px 10px 22px; border-top:1px solid rgba(255,255,255,0.045); display:flex; flex-direction:column; gap:4px; }

        /* ── MAIN ── */
        .db-main { margin-left:220px; min-height:100vh; display:flex; flex-direction:column; position:relative; z-index:1; }

        /* ── TOPBAR ── */
        .db-topbar {
          position:sticky; top:0; z-index:30;
          background:rgba(9,9,9,0.8); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.048);
          padding:0 28px; height:58px;
          display:flex; align-items:center; gap:14px;
          box-shadow: 0 1px 0 rgba(255,255,255,0.025), 0 4px 32px rgba(0,0,0,0.28);
        }
        .db-search {
          flex:1; max-width:440px;
          background:rgba(255,255,255,0.038); border:1px solid rgba(255,255,255,0.065);
          border-radius:10px; padding:0 14px 0 36px; height:34px;
          color:#FAFAFA; font-size:13px; outline:none;
          transition:all 0.2s;
        }
        .db-search:focus { border-color:rgba(245,158,11,0.32); background:rgba(255,255,255,0.055); box-shadow:0 0 0 3px rgba(245,158,11,0.06); }
        .db-search::placeholder { color:rgba(255,255,255,0.22); }

        .db-status-pill { display:flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; background:rgba(34,197,94,0.07); border:1px solid rgba(34,197,94,0.14); font-size:11.5px; font-weight:600; color:rgba(255,255,255,0.55); white-space:nowrap; }
        .db-status-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; animation:pulse 2s infinite; flex-shrink:0; }
        .db-icon-btn { width:34px; height:34px; border-radius:9px; background:rgba(255,255,255,0.038); border:1px solid rgba(255,255,255,0.065); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s; position:relative; flex-shrink:0; }
        .db-icon-btn:hover { background:rgba(255,255,255,0.07); border-color:rgba(255,255,255,0.1); }
        .db-yt-btn { display:flex; align-items:center; gap:8px; background:linear-gradient(135deg,#F59E0B,#FBBF24); color:#08080A; font-weight:700; font-size:12.5px; padding:0 15px; height:34px; border-radius:9px; border:none; cursor:pointer; transition:all 0.22s; white-space:nowrap; box-shadow:0 2px 12px rgba(245,158,11,0.3); }
        .db-yt-btn:hover { box-shadow:0 4px 20px rgba(245,158,11,0.45); transform:translateY(-1px); }
        .db-avatar { display:flex; align-items:center; gap:9px; background:rgba(255,255,255,0.038); border:1px solid rgba(255,255,255,0.065); border-radius:10px; padding:4px 10px 4px 4px; cursor:pointer; transition:all 0.2s; }
        .db-avatar:hover { border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.055); }

        /* ── CONTENT ── */
        .db-content { padding:28px; flex:1; animation:fadeIn 0.35s ease; }
        .db-page-title { font-size:27px; font-weight:900; color:#FAFAFA; letter-spacing:-0.035em; margin-bottom:4px; }
        .db-welcome { color:rgba(255,255,255,0.38); font-size:13px; font-weight:500; margin-bottom:6px; letter-spacing:0.01em; }

        /* ── STAT CARDS ── */
        .db-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:16px; }
        .db-stat {
          background: rgba(15,15,19,0.9);
          border:1px solid rgba(255,255,255,0.055);
          border-radius:16px; padding:20px;
          transition:all 0.22s cubic-bezier(.4,0,.2,1);
          display:flex; flex-direction:column; gap:10px;
          backdrop-filter:blur(12px);
        }
        .db-stat:hover { border-color:rgba(255,255,255,0.1); transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.28); }
        .db-stat-label { color:rgba(255,255,255,0.38); font-size:12px; font-weight:500; letter-spacing:0.01em; }
        .db-stat-value { font-size:30px; font-weight:900; color:#FAFAFA; letter-spacing:-0.045em; font-variant-numeric:tabular-nums; line-height:1; }
        .db-stat-zero  { font-size:30px; font-weight:900; color:rgba(255,255,255,0.45); letter-spacing:-0.045em; font-variant-numeric:tabular-nums; line-height:1; }
        .db-stat-empty { font-size:30px; font-weight:900; color:rgba(255,255,255,0.15); letter-spacing:-0.045em; line-height:1; }

        /* ── BOTTOM GRID ── */
        .db-bottom { display:grid; grid-template-columns:1fr 1fr 1.1fr; gap:12px; }

        .db-card {
          background: rgba(15,15,19,0.9);
          border:1px solid rgba(255,255,255,0.055);
          border-radius:16px;
          backdrop-filter:blur(12px);
          transition:border-color 0.2s;
        }
        .db-card:hover { border-color:rgba(255,255,255,0.08); }
        .db-card-header { padding:18px 20px 14px; border-bottom:1px solid rgba(255,255,255,0.045); }
        .db-card-title { color:#FAFAFA; font-size:13.5px; font-weight:700; letter-spacing:-0.018em; }
        .db-card-sub { color:rgba(255,255,255,0.3); font-size:11px; margin-top:2px; font-weight:400; }
        .db-card-body { padding:18px 20px; }

        .db-health-badge { display:flex; align-items:center; gap:5px; font-size:10.5px; font-weight:700; color:#34d399; background:rgba(34,197,94,0.09); border:1px solid rgba(34,197,94,0.18); border-radius:7px; padding:3px 8px; white-space:nowrap; }

        .db-btn-primary { background:linear-gradient(135deg,#F59E0B,#FBBF24); color:#08080A; font-weight:700; font-size:12.5px; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.22s; text-decoration:none; white-space:nowrap; box-shadow:0 2px 10px rgba(245,158,11,0.25); }
        .db-btn-primary:hover { box-shadow:0 4px 20px rgba(245,158,11,0.4); transform:translateY(-1px); }
        .db-btn-ghost { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7); font-weight:600; font-size:12.5px; padding:10px 16px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:all 0.18s; text-decoration:none; white-space:nowrap; }
        .db-btn-ghost:hover { background:rgba(255,255,255,0.08); color:#FAFAFA; }
        .db-btn-upgrade { width:100%; background:linear-gradient(135deg,#F59E0B,#FBBF24); color:#08080A; font-weight:700; font-size:12px; padding:9px; border-radius:10px; border:none; cursor:pointer; transition:all 0.2s; text-align:center; text-decoration:none; display:block; box-shadow:0 2px 10px rgba(245,158,11,0.22); }
        .db-btn-upgrade:hover { opacity:0.92; transform:translateY(-1px); }
        .db-btn-logout { display:flex; align-items:center; gap:9px; padding:9px 13px; border-radius:10px; font-size:12.5px; font-weight:500; color:rgba(255,255,255,0.32); background:none; border:none; cursor:pointer; width:100%; transition:all 0.18s; }
        .db-btn-logout:hover { background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); }

        /* ── BOTTOM NAV (mobile) ── */
        .db-bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; z-index:50; background:rgba(9,9,9,0.95); border-top:1px solid rgba(255,255,255,0.055); backdrop-filter:blur(24px); padding:10px 0 env(safe-area-inset-bottom,10px); }
        .db-bnav-item { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; padding:4px; text-decoration:none; color:rgba(255,255,255,0.32); border:none; background:none; cursor:pointer; transition:color 0.18s; }
        .db-bnav-item.active { color:#F59E0B; }
        .db-bnav-item:hover { color:rgba(255,255,255,0.7); }
        .db-bnav-item.active .db-bnav-icon { background:rgba(245,158,11,0.1); border-radius:10px; }
        .db-bnav-icon { width:40px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:10px; transition:background 0.18s; }

        /* ── RESPONSIVE ── */
        @media (max-width:767px) {
          .db-sidebar { display:none !important; }
          .db-main { margin-left:0 !important; padding-bottom:72px; }
          .db-bottom-nav { display:flex !important; }
          .db-stats { grid-template-columns:1fr 1fr; gap:10px; }
          .db-bottom { grid-template-columns:1fr; }
          .db-content { padding:14px; }
          .db-topbar { padding:0 14px; }
          .db-topbar-search, .db-topbar-status { display:none !important; }
          .db-page-title { font-size:22px; }
          .db-welcome { font-size:12px; }
        }
        @media (min-width:768px) and (max-width:1023px) {
          .db-bottom-nav { display:none !important; }
          .db-stats { grid-template-columns:repeat(2,1fr); }
          .db-bottom { grid-template-columns:1fr 1fr; }
          .db-content { padding:20px; }
          .db-topbar { padding:0 20px; }
        }
        @media (min-width:1024px) {
          .db-bottom-nav { display:none !important; }
        }
      `}</style>

      <div className="db-bg" style={{ display:'flex' }}>
        <div className="db-noise" />
        <div className="db-vignette" />

        {/* ── SIDEBAR ── */}
        <aside className="db-sidebar">
          <div className="db-logo">
            <div className="db-logo-inner">
              <div className="db-logo-mark"><Shield size={17} color="white" strokeWidth={2.2} /></div>
              <div>
                <div className="db-logo-text">ModerateAI</div>
                <div className="db-logo-sub">AI Moderation Platform</div>
              </div>
            </div>
          </div>

          <nav className="db-nav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={`db-nav-item${item.active ? ' active' : ''}`}>
                <item.icon size={15} strokeWidth={item.active ? 2.2 : 1.8} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.active && (
                  <span className="db-nav-live">
                    <span className="db-nav-live-dot" /> live
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {plan === 'free' && (
            <div className="db-upgrade">
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:7 }}>
                <Zap size={12} color="#F59E0B" />
                <span style={{ color:'#F59E0B', fontWeight:700, fontSize:12, letterSpacing:'-0.01em' }}>Upgrade to Pro</span>
              </div>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:11, lineHeight:1.6, marginBottom:11 }}>
                Unlock unlimited moderation and Telegram alerts.
              </p>
              <Link href="/billing" className="db-btn-upgrade">Upgrade to Pro</Link>
            </div>
          )}

          <div className="db-sidebar-bottom">
            <button onClick={handleLogout} className="db-btn-logout">
              <LogOut size={14} strokeWidth={1.8} /> Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="db-main">

          {/* TOPBAR */}
          <header className="db-topbar">
            <div style={{ position:'relative', flex:1, maxWidth:440 }} className="db-topbar-search">
              <Search size={13} color="rgba(255,255,255,0.22)" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input className="db-search" placeholder="Search comments, videos, users…" />
              <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:5, padding:'2px 6px', fontSize:10, color:'rgba(255,255,255,0.22)', fontWeight:600 }}>⌘K</span>
            </div>

            <div className="db-status-pill db-topbar-status">
              <div className="db-status-dot" />
              All systems operational
            </div>

            <div style={{ flex:1 }} />

            {!youtubeConnected && (
              <button onClick={handleYouTubeConnect} className="db-yt-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Connect YouTube
              </button>
            )}

            <button className="db-icon-btn">
              <Bell size={14} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
              <span style={{ position:'absolute', top:7, right:7, width:5, height:5, background:'#F59E0B', borderRadius:'50%', border:'1.5px solid #090909' }} />
            </button>

            <div className="db-avatar" onClick={() => router.push('/settings')}>
              {user?.photoURL
                ? <img src={user.photoURL} style={{ width:27, height:27, borderRadius:'50%', objectFit:'cover' }} alt="avatar" />
                : <div style={{ width:27, height:27, borderRadius:'50%', background:'linear-gradient(135deg,#F59E0B,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:10.5, flexShrink:0 }}>{initials}</div>
              }
              <div>
                <div style={{ color:'#FAFAFA', fontWeight:600, fontSize:12, lineHeight:1.25 }}>{channelName || firstName}</div>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:10, lineHeight:1.25 }}>{channelName ? `Welcome back, ${firstName}` : `${planLabel} plan`}</div>
              </div>
              <span style={{
                background: plan === 'free' ? 'rgba(245,158,11,0.13)' : plan === 'agency' ? 'rgba(167,139,250,0.13)' : 'rgba(52,211,153,0.13)',
                color:       plan === 'free' ? '#F59E0B' : plan === 'agency' ? '#a78bfa' : '#34d399',
                fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:5, letterSpacing:'0.05em', marginLeft:2, textTransform:'uppercase'
              }}>
                {plan === 'free' ? 'FREE' : plan.toUpperCase()}
              </span>
            </div>
          </header>

          {/* CONTENT */}
          <div className="db-content">

            {/* ── WELCOME + TITLE ── */}
            <div style={{ marginBottom:22 }}>
              <p className="db-welcome">Welcome back, {firstName}! 👋</p>
              <h1 className="db-page-title">Overview</h1>
            </div>

            {/* STAT CARDS */}
            <div className="db-stats">
              {statCards.map((s) => {
                const isNull  = s.fmtValue === null;
                const isZero  = !isNull && (s.raw === 0 || s.raw === null);
                const hasReal = !isNull && s.raw !== null && (s.raw as number) > 0;
                return (
                  <div key={s.label} className="db-stat">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span className="db-stat-label">{s.label}</span>
                      {!isNull && (
                        <div style={{ width:27, height:27, borderRadius:8, background:`${s.color}14`, border:`1px solid ${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <s.icon size={13} color={s.color} strokeWidth={2} />
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                      {isNull  ? <div className="db-stat-empty">—</div>
                      : hasReal ? (
                        <>
                          <div className="db-stat-value">{s.fmtValue}</div>
                          <Sparkline color={s.color} up={s.up} />
                        </>
                      ) : (
                        <div className="db-stat-zero">{s.fmtValue}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM GRID */}
            <div className="db-bottom" style={{ marginTop:12 }}>

              <MonthlyUsageCard
                plan={plan}
                youtubeConnected={youtubeConnected}
                commentsUsed={commentsUsed}
                commentsLimit={commentsLimit}
                trialDaysLeft={trialDaysLeft}
                onConnectYouTube={handleYouTubeConnect}
              />

              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title">Moderation Accuracy</div>
                  <div className="db-card-sub">AI confidence · rolling 24h</div>
                </div>
                <AccuracyCard accuracy={moderationAcc} />
              </div>

              <div className="db-card">
                <div className="db-card-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div className="db-card-title">System Health</div>
                    <div className="db-card-sub">Live infra status</div>
                  </div>
                  <div className="db-health-badge">
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', animation:'pulse 2s infinite', flexShrink:0 }} />
                    Healthy
                  </div>
                </div>
                <div className="db-card-body" style={{ paddingTop:6 }}>
                  {healthRows.length === 0 ? (
                    <div style={{ padding:'24px 0', textAlign:'center', color:'rgba(255,255,255,0.22)', fontSize:13 }}>
                      No system data yet. Connect YouTube to start.
                    </div>
                  ) : (
                    healthRows.map(row => (
                      <HealthRow key={row.key} icon={row.icon} label={row.label} sub={row.sub} value={row.value} color={row.color} dot={row.dot} />
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV (mobile only) ── */}
        <nav className="db-bottom-nav">
          {navItems.slice(0, 5).map(item => (
            <Link key={item.href} href={item.href} className={`db-bnav-item${item.active ? ' active' : ''}`} title={item.label}>
              <span className="db-bnav-icon">
                <item.icon size={20} strokeWidth={item.active ? 2.2 : 1.7} />
              </span>
            </Link>
          ))}
          <button className={`db-bnav-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)} title="More">
            <span className="db-bnav-icon"><MoreHorizontal size={20} strokeWidth={1.7} /></span>
          </button>
        </nav>

        {/* ── MORE DRAWER ── */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position:'fixed', inset:0, zIndex:55, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)' }} />
            <div style={{
              position:'fixed', bottom:68, left:12, right:12, zIndex:60,
              background:'rgba(16,16,20,0.97)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:20, padding:'8px 8px 12px',
              boxShadow:'0 -8px 48px rgba(0,0,0,0.7)', backdropFilter:'blur(24px)',
              animation:'slideUp 0.2s ease'
            }}>
              <div style={{ width:34, height:3, background:'rgba(255,255,255,0.1)', borderRadius:4, margin:'6px auto 14px' }} />

              <div style={{ padding:'0 12px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  {user?.photoURL
                    ? <img src={user.photoURL} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover' }} alt="avatar" />
                    : <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#F59E0B,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:13, flexShrink:0 }}>{initials}</div>
                  }
                  <div>
                    <div style={{ color:'#FAFAFA', fontWeight:700, fontSize:13.5 }}>{channelName || firstName}</div>
                    <div style={{ color:'rgba(255,255,255,0.32)', fontSize:11 }}>Welcome back{firstName ? `, ${firstName}` : ''}</div>
                  </div>
                </div>
              </div>

              {[
                { icon:CreditCard, label:'Billing',  href:'/billing',  color:'#F59E0B' },
                { icon:Layers,     label:'Channels', href:'/channels', color:'#60a5fa' },
                { icon:Settings,   label:'Settings', href:'/settings', color:'#a78bfa' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', borderRadius:12, textDecoration:'none', color:'rgba(255,255,255,0.75)', fontWeight:600, fontSize:14, transition:'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width:34, height:34, borderRadius:10, background:`${item.color}15`, border:`1px solid ${item.color}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <item.icon size={16} color={item.color} strokeWidth={1.8} />
                  </div>
                  {item.label}
                </Link>
              ))}

              <div style={{ margin:'8px 16px 0', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:8 }}>
                <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', background:'none', border:'none', cursor:'pointer', color:'#f87171', fontWeight:600, fontSize:14, width:'100%' }}>
                  <div style={{ width:34, height:34, borderRadius:10, background:'rgba(248,113,113,0.09)', border:'1px solid rgba(248,113,113,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <LogOut size={16} color="#f87171" strokeWidth={1.8} />
                  </div>
                  Logout
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}