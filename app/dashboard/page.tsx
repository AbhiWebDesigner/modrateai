'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, MessageSquare, Eye, Settings, LogOut, CreditCard,
  BarChart2, Bell, Zap, Search, Activity, Wifi, Cpu, Target,
  CheckCircle, LayoutDashboard, TrendingUp, TrendingDown, MoreHorizontal, Layers
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

function Sparkline({ color, up = true, width = 80, height = 36 }: { color: string; up?: boolean; width?: number; height?: number }) {
  const points = up
    ? [28, 22, 32, 24, 36, 28, 42, 34, 48, 38, 56, 44, 62]
    : [62, 58, 52, 60, 48, 54, 44, 50, 40, 46, 38, 42, 36];
  const max = Math.max(...points), min = Math.min(...points);
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(' ');
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${id})`} />
    </svg>
  );
}

function CircularProgress({ pct }: { pct: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const filled = (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 85 ? '#f87171' : pct >= 60 ? '#F59E0B' : '#34d399';
  return (
    <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
      <svg width={108} height={108} viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={54} cy={54} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
        <circle cx={54} cy={54} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}99)`, transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#FAFAFA', fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(pct)}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>%</span>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>USED</span>
      </div>
    </div>
  );
}

function AccuracyRing({ accuracy }: { accuracy: number | null }) {
  if (accuracy === null) {
    return (
      <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target size={24} color="rgba(255,255,255,0.12)" />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12.5, textAlign: 'center', lineHeight: 1.6, maxWidth: 200 }}>
          No accuracy data yet. Connect YouTube and let the AI moderate to see confidence scores.
        </p>
      </div>
    );
  }
  const r = 60, circ = 2 * Math.PI * r, pct = accuracy;
  const color = pct >= 90 ? '#34d399' : pct >= 70 ? '#F59E0B' : '#f87171';
  const label = pct >= 90 ? 'Excellent' : pct >= 70 ? 'Good' : 'Needs review';
  const filled = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px' }}>
      <div style={{ position: 'relative', width: 148, height: 148 }}>
        <svg width={148} height={148} viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={74} cy={74} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={11} />
          <circle cx={74} cy={74} r={r} fill="none" stroke={color} strokeWidth={11}
            strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}77)`, transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#FAFAFA', fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {pct}<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)' }}>%</span>
          </span>
          <span style={{ color, fontSize: 11, fontWeight: 700, marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
        </div>
      </div>
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[{ label: 'True Positive', value: `${pct}%`, color: '#34d399' }, { label: 'False Positive', value: `${(100 - pct).toFixed(1)}%`, color: '#f87171' }].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ color: s.color, fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10.5, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>Rolling 24h · updated in real time</div>
    </div>
  );
}

function MonthlyUsageCard({ plan, youtubeConnected, commentsUsed, commentsLimit, trialDaysLeft, onConnectYouTube }:
  { plan: string; youtubeConnected: boolean; commentsUsed: number; commentsLimit: number; trialDaysLeft: number | null; onConnectYouTube: () => void }) {
  const usagePct = commentsLimit > 0 ? Math.min(100, (commentsUsed / commentsLimit) * 100) : 0;
  const remaining = commentsLimit - commentsUsed;
  const isFree = plan === 'free';
  const quotaDisplay = isFree ? '1,500' : commentsLimit.toLocaleString();

  if (!youtubeConnected) {
    return (
      <div className="ref-card">
        <div className="ref-card-top">
          <div><div className="ref-card-title">Monthly Usage</div><div className="ref-card-sub">Comment scan quota</div></div>
          <span className="ref-badge ref-badge-amber"><Zap size={9} /> Free Trial</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="#F59E0B" />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.6, maxWidth: 220 }}>Connect your YouTube channel to start your free trial.</p>
          <button onClick={onConnectYouTube} className="ref-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            Connect YouTube
          </button>
        </div>
      </div>
    );
  }

  if (plan === 'agency') {
    return (
      <div className="ref-card">
        <div className="ref-card-top">
          <div><div className="ref-card-title">Monthly Usage</div><div className="ref-card-sub">Comment scan quota</div></div>
          <span className="ref-badge ref-badge-purple"><Zap size={9} /> Agency</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 20px', textAlign: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', border: '2px solid rgba(167,139,250,0.25)', background: 'rgba(167,139,250,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 38, color: '#a78bfa', fontWeight: 900 }}>∞</span>
          </div>
          <div>
            <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 18 }}>Unlimited Usage</div>
            <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12, marginTop: 3 }}>No quota restrictions</div>
          </div>
          <Link href="/billing" className="ref-btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)', boxShadow: 'none' }}>
            Manage Subscription
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ref-card">
      <div className="ref-card-top">
        <div><div className="ref-card-title">Monthly Usage</div><div className="ref-card-sub">Comment scan quota</div></div>
        {isFree
          ? <span className="ref-badge ref-badge-amber"><Zap size={9} /> Free Trial</span>
          : <span className="ref-badge ref-badge-green"><CheckCircle size={9} /> Pro</span>}
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <CircularProgress pct={usagePct} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 10 }}>
              <span style={{ color: '#FAFAFA', fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{commentsUsed.toLocaleString()}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>/ {quotaDisplay}</span>
            </div>
            {[{ label: 'Used', val: commentsUsed.toLocaleString() }, { label: 'Remaining', val: remaining.toLocaleString() }, { label: 'Quota', val: quotaDisplay }].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.32)', marginBottom: 4 }}>
                <span>{r.label}</span><span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#F59E0B,#7C3AED)', width: `${usagePct}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.28)', marginBottom: 16 }}>
          <span>{usagePct.toFixed(0)}% used</span>
          {isFree && trialDaysLeft !== null && (
            <span style={{ color: trialDaysLeft <= 3 ? '#f87171' : '#F59E0B', fontWeight: 700 }}>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</span>
          )}
        </div>
        {isFree
          ? <Link href="/billing" className="ref-btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Zap size={13} /> Upgrade to Pro</Link>
          : <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/billing" className="ref-btn-ghost" style={{ flex: 1, textAlign: 'center' }}>Manage Plan</Link>
              <Link href="/billing?upgrade=agency" className="ref-btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}><Zap size={12} /> Agency</Link>
            </div>
        }
      </div>
    </div>
  );
}

function HealthRow({ icon: Icon, label, sub, value, color = '#34d399', dot = 'green' }:
  { icon: any; label: string; sub: string; value?: string; color?: string; dot?: 'green' | 'amber' | 'red' }) {
  const dotColor = { green: '#22c55e', amber: '#F59E0B', red: '#f87171' }[dot];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, boxShadow: `0 0 6px ${dotColor}88` }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>{value}</span>
        </div>
      )}
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

/* Bottom nav — 5 icons only (no labels, no logout) */
const BOTTOM_NAV = [
  { label: 'Overview',    icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Analytics',  icon: BarChart2,        href: '/analytics'  },
  { label: 'Automation', icon: Zap,              href: '/automation' },
  { label: 'Alerts',     icon: Bell,             href: '/alerts'     },
  { label: 'Settings',   icon: Settings,         href: '/settings'   },
];

/* Sidebar nav — full list */
const SIDEBAR_NAV = [
  { label: 'Overview',    icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Analytics',  icon: BarChart2,        href: '/analytics'  },
  { label: 'Automation', icon: Zap,              href: '/automation' },
  { label: 'Alerts',     icon: Bell,             href: '/alerts'     },
  { label: 'Settings',   icon: Settings,         href: '/settings'   },
  { label: 'Billing',    icon: CreditCard,       href: '/billing'    },
];

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
    return () => { unsubAuth(); if (unsubDocRef.current) unsubDocRef.current(); };
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };
  const handleYouTubeConnect = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth?uid=${user?.uid}`;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 38, height: 38, border: '2.5px solid rgba(245,158,11,0.25)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const plan             = (userData?.plan as string) || 'free';
  const commentsScanned  = (userData?.comments_scanned as number) ?? (userData?.comments_used as number) ?? null;
  const hiddenComments   = (userData?.hidden_comments  as number) ?? null;
  const aiReplies        = (userData?.ai_replies       as number) ?? null;
  const avgResponseMs    = (userData?.avg_response_ms  as number) ?? null;
  const moderationAcc    = (userData?.moderation_accuracy as number) ?? null;
  const commentsUsed     = (userData?.comments_used    as number) || 0;
  const commentsLimit    = plan === 'free' ? 1500 : plan === 'pro' ? 200000 : (userData?.comments_limit as number) || 200000;
  const youtubeConnected = (userData?.youtube_connected as boolean) || false;
  const channelName      = (userData?.youtube_channel_name as string) || (userData?.channel_name as string) || null;
  const channelHandle    = (userData?.youtube_channel_handle as string) || (userData?.channel_handle as string) || null;
  const aiModel          = (userData?.ai_model as string) || null;
  const webhookPct       = (userData?.webhook_delivery_percent as number) ?? null;
  const webhookAge       = (userData?.webhook_last_delivery_age as string) ?? null;

  const trialEndsAt   = userData?.trial_ends_at?.toDate?.() as Date | undefined;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : null;

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const initials  = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const planLabel = plan === 'free' ? 'Free Trial' : plan === 'pro' ? 'Pro' : plan === 'agency' ? 'Agency' : 'Free Trial';

  const fmt   = (n: number | null) => n === null ? null : n >= 1000 ? n.toLocaleString() : String(n);
  const fmtMs = (ms: number | null) => ms === null ? null : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  const statCards = [
    { label: 'Comments Scanned', fmtValue: fmt(commentsScanned),  raw: commentsScanned,  up: true,  color: '#F59E0B', icon: MessageSquare, pct: '+8.2%' },
    { label: 'Hidden Comments',  fmtValue: fmt(hiddenComments),   raw: hiddenComments,   up: true,  color: '#f87171', icon: Eye,           pct: '+2.1%' },
    { label: 'AI Replies',       fmtValue: fmt(aiReplies),        raw: aiReplies,        up: true,  color: '#a78bfa', icon: MessageSquare, pct: '+14%'  },
    { label: 'Avg Response',     fmtValue: fmtMs(avgResponseMs),  raw: avgResponseMs,    up: false, color: '#34d399', icon: Activity,      pct: '-0.3s' },
  ];

  type HRow = { key: string; icon: any; label: string; sub: string; value?: string; color: string; dot: 'green' | 'amber' | 'red' };
  const healthRows: HRow[] = [];
  healthRows.push({
    key: 'api', icon: Wifi, label: 'API Status', sub: 'Operational',
    value: avgResponseMs !== null ? fmtMs(avgResponseMs)! : undefined,
    color: '#34d399',
    dot: avgResponseMs === null ? 'green' : avgResponseMs < 500 ? 'green' : avgResponseMs < 1500 ? 'amber' : 'red',
  });
  if (webhookPct !== null) healthRows.push({
    key: 'webhook', icon: Zap, label: 'Webhook Delivery',
    sub: webhookAge ? `${webhookPct}% · ${webhookAge}` : `${webhookPct}%`,
    value: webhookPct === 100 ? 'Live' : `${webhookPct}%`,
    color: '#60a5fa', dot: webhookPct >= 95 ? 'green' : webhookPct >= 80 ? 'amber' : 'red',
  });
  if (youtubeConnected && channelName) healthRows.push({
    key: 'channel', icon: YTIcon, label: 'Channel',
    sub: channelHandle ? `@${channelHandle.replace('@', '')}` : channelName,
    color: '#f87171', dot: 'green',
  });
  if (aiModel) healthRows.push({ key: 'model', icon: Cpu, label: 'AI Model', sub: aiModel, color: '#a78bfa', dot: 'green' });

  const currentPath = '/dashboard';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',-apple-system,sans-serif;}
        html,body{background:#0a0a0f;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes indPulse{0%,100%{box-shadow:0 0 8px rgba(245,158,11,0.5)}50%{box-shadow:0 0 18px rgba(245,158,11,0.2)}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}

        .r-bg{min-height:100vh;background:#0a0a0f;position:relative;}
        .r-bg::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background:radial-gradient(ellipse 55% 45% at -5% 0%,rgba(245,158,11,0.07) 0%,transparent 60%),
                     radial-gradient(ellipse 50% 40% at 105% 100%,rgba(124,58,237,0.06) 0%,transparent 60%);}
        .r-bg::after{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,0.014) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.014) 1px,transparent 1px);
          background-size:44px 44px;}

        /* ── SIDEBAR ── */
        .r-sidebar{width:228px;min-width:228px;background:rgba(10,10,15,0.92);backdrop-filter:blur(32px);
          border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;
          position:fixed;height:100vh;left:0;top:0;z-index:40;
          box-shadow:inset -1px 0 0 rgba(255,255,255,0.02),4px 0 48px rgba(0,0,0,0.45);}
        .r-sidebar::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:2px;border-radius:0 2px 2px 0;
          background:linear-gradient(180deg,transparent,rgba(245,158,11,0.6),rgba(245,158,11,0.95),rgba(245,158,11,0.6),transparent);
          box-shadow:0 0 16px rgba(245,158,11,0.4),0 0 36px rgba(245,158,11,0.1);}
        .r-logo{padding:22px 18px 18px;border-bottom:1px solid rgba(255,255,255,0.05);}
        .r-logo-mark{width:38px;height:38px;border-radius:12px;flex-shrink:0;
          background:linear-gradient(135deg,#F59E0B 0%,#7C3AED 100%);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 14px rgba(245,158,11,0.32),0 1px 4px rgba(0,0,0,0.4);}
        .r-nav{flex:1;padding:14px 10px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;}
        .r-nav-item{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:12px;
          font-size:13.5px;font-weight:500;text-decoration:none;color:rgba(255,255,255,0.36);
          transition:all 0.2s cubic-bezier(.4,0,.2,1);border:1px solid transparent;position:relative;overflow:hidden;}
        .r-nav-item:hover{background:rgba(255,255,255,0.045);color:rgba(255,255,255,0.8);transform:translateX(2px);}
        .r-nav-item.active{background:rgba(245,158,11,0.09);color:#F5A623;border-color:rgba(245,158,11,0.2);font-weight:650;}
        .r-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:20px;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,#F59E0B,#ec4899,#7C3AED);
          animation:indPulse 2.5s ease-in-out infinite;}
        .r-live-badge{display:inline-flex;align-items:center;gap:4px;background:rgba(245,158,11,0.1);
          border:1px solid rgba(245,158,11,0.2);border-radius:7px;padding:2px 7px;
          font-size:9px;font-weight:700;color:#F59E0B;margin-left:auto;letter-spacing:0.05em;text-transform:uppercase;}
        .r-live-dot{width:4px;height:4px;border-radius:50%;background:#F59E0B;animation:pulse 1.8s infinite;flex-shrink:0;}
        .r-upgrade{margin:0 10px 10px;background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.13);border-radius:14px;padding:15px;}
        .r-sidebar-bottom{padding:8px 10px 22px;border-top:1px solid rgba(255,255,255,0.045);display:flex;flex-direction:column;gap:4px;}

        /* ── MAIN ── */
        .r-main{margin-left:228px;min-height:100vh;display:flex;flex-direction:column;position:relative;z-index:1;}

        /* ── TOPBAR ── */
        .r-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.88);backdrop-filter:blur(28px);
          border-bottom:1px solid rgba(255,255,255,0.05);padding:0 28px;height:60px;
          display:flex;align-items:center;gap:14px;
          box-shadow:0 1px 0 rgba(255,255,255,0.02),0 4px 32px rgba(0,0,0,0.3);}
        .r-search{flex:1;max-width:460px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:10px;padding:0 14px 0 36px;height:36px;color:#FAFAFA;font-size:13px;outline:none;transition:all 0.2s;}
        .r-search:focus{border-color:rgba(245,158,11,0.3);background:rgba(255,255,255,0.06);box-shadow:0 0 0 3px rgba(245,158,11,0.06);}
        .r-search::placeholder{color:rgba(255,255,255,0.2);}
        .r-status{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;
          background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.14);
          font-size:11.5px;font-weight:600;color:rgba(255,255,255,0.5);white-space:nowrap;}
        .r-status-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite;flex-shrink:0;}
        .r-icon-btn{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;position:relative;flex-shrink:0;}
        .r-icon-btn:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.1);}
        .r-yt-btn{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#F59E0B,#FBBF24);color:#08080A;
          font-weight:700;font-size:13px;padding:0 16px;height:36px;border-radius:10px;border:none;cursor:pointer;
          transition:all 0.2s;white-space:nowrap;box-shadow:0 2px 14px rgba(245,158,11,0.32);}
        .r-yt-btn:hover{box-shadow:0 4px 22px rgba(245,158,11,0.48);transform:translateY(-1px);}
        .r-avatar{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:11px;padding:4px 11px 4px 4px;cursor:pointer;transition:all 0.2s;}
        .r-avatar:hover{border-color:rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);}

        /* ── CONTENT ── */
        .r-content{padding:28px;flex:1;animation:fadeIn 0.35s ease;}

        /* ── STAT CARDS ── */
        .r-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}
        .r-stat{background:rgba(16,16,22,0.95);border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:20px 22px;
          transition:all 0.22s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;backdrop-filter:blur(16px);position:relative;overflow:hidden;}
        .r-stat::before{content:'';position:absolute;inset:0;border-radius:18px;
          background:linear-gradient(135deg,rgba(255,255,255,0.018) 0%,transparent 60%);pointer-events:none;}
        .r-stat:hover{border-color:rgba(255,255,255,0.12);transform:translateY(-2px);box-shadow:0 10px 32px rgba(0,0,0,0.32);}
        .r-stat-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
        .r-stat-icon-wrap{display:flex;align-items:center;gap:8px;}
        .r-stat-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .r-stat-label{color:rgba(255,255,255,0.5);font-size:12.5px;font-weight:500;}
        .r-stat-pct-up{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:#34d399;
          background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.18);border-radius:7px;padding:2px 7px;white-space:nowrap;}
        .r-stat-pct-down{display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:#f87171;
          background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.18);border-radius:7px;padding:2px 7px;white-space:nowrap;}
        .r-stat-bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;}
        .r-stat-value{font-size:34px;font-weight:900;color:#FAFAFA;letter-spacing:-0.05em;font-variant-numeric:tabular-nums;line-height:1;}
        .r-stat-zero{font-size:34px;font-weight:900;color:rgba(255,255,255,0.4);letter-spacing:-0.05em;font-variant-numeric:tabular-nums;line-height:1;}
        .r-stat-empty{font-size:34px;font-weight:900;color:rgba(255,255,255,0.14);letter-spacing:-0.05em;line-height:1;}

        /* ── CARDS ── */
        .ref-card{background:rgba(16,16,22,0.95);border:1px solid rgba(255,255,255,0.07);border-radius:18px;backdrop-filter:blur(16px);
          transition:border-color 0.2s;display:flex;flex-direction:column;overflow:hidden;}
        .ref-card:hover{border-color:rgba(255,255,255,0.11);}
        .ref-card-top{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,0.05);}
        .ref-card-title{color:#FAFAFA;font-size:14px;font-weight:700;letter-spacing:-0.02em;}
        .ref-card-sub{color:rgba(255,255,255,0.28);font-size:11.5px;margin-top:2px;}
        .ref-badge{display:inline-flex;align-items:center;gap:5px;border-radius:8px;padding:4px 10px;font-size:10px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;}
        .ref-badge-amber{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.22);color:#F59E0B;}
        .ref-badge-green{background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.22);color:#34d399;}
        .ref-badge-purple{background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.28);color:#a78bfa;}
        .r-health-badge{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;color:#34d399;
          background:rgba(34,197,94,0.09);border:1px solid rgba(34,197,94,0.18);border-radius:7px;padding:3px 9px;white-space:nowrap;}
        .r-bottom{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:12px;}

        /* ── BUTTONS ── */
        .ref-btn-primary{background:linear-gradient(135deg,#F59E0B,#FBBF24);color:#08080A;font-weight:700;font-size:13px;
          padding:10px 18px;border-radius:10px;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
          transition:all 0.2s;text-decoration:none;white-space:nowrap;box-shadow:0 2px 12px rgba(245,158,11,0.28);}
        .ref-btn-primary:hover{box-shadow:0 4px 22px rgba(245,158,11,0.44);transform:translateY(-1px);}
        .ref-btn-ghost{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.65);font-weight:600;font-size:13px;
          padding:10px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:all 0.18s;text-decoration:none;white-space:nowrap;}
        .ref-btn-ghost:hover{background:rgba(255,255,255,0.08);color:#FAFAFA;}
        .r-btn-upgrade{width:100%;background:linear-gradient(135deg,#F59E0B,#FBBF24);color:#08080A;font-weight:700;font-size:12.5px;
          padding:10px;border-radius:10px;border:none;cursor:pointer;transition:all 0.2s;text-align:center;
          text-decoration:none;display:block;box-shadow:0 2px 10px rgba(245,158,11,0.22);}
        .r-btn-upgrade:hover{opacity:0.9;transform:translateY(-1px);}
        .r-btn-logout{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:10px;font-size:13px;font-weight:500;
          color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;width:100%;transition:all 0.18s;}
        .r-btn-logout:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.6);}

        /* ── BOTTOM NAV — phone only (≤767px) ── */
        .r-bottom-nav{
          display:none;
          position:fixed;bottom:0;left:0;right:0;z-index:50;
          background:rgba(10,10,15,0.97);
          border-top:1px solid rgba(255,255,255,0.07);
          backdrop-filter:blur(24px);
          padding:8px 4px env(safe-area-inset-bottom,8px);
        }
        /* icon-only tap targets */
        .r-bnav-item{
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          flex:1;padding:6px 4px;text-decoration:none;
          color:rgba(255,255,255,0.38);
          border:none;background:none;cursor:pointer;
          transition:color 0.18s;
          -webkit-tap-highlight-color:transparent;
        }
        .r-bnav-item.active{color:#F59E0B;}
        .r-bnav-item:hover{color:rgba(255,255,255,0.75);}
        .r-bnav-icon{
          width:40px;height:32px;
          display:flex;align-items:center;justify-content:center;
          border-radius:10px;transition:background 0.18s;
        }
        .r-bnav-item.active .r-bnav-icon{background:rgba(245,158,11,0.12);}

        /* ── RESPONSIVE ── */

        /* Phone ≤767px — bottom nav, no sidebar */
        @media(max-width:767px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;padding-bottom:72px;}
          .r-bottom-nav{display:flex!important;}
          .r-stats{grid-template-columns:1fr 1fr;gap:10px;}
          .r-bottom{grid-template-columns:1fr;}
          .r-content{padding:14px;}
          .r-topbar{padding:0 14px;}
          .r-topbar-search,.r-topbar-status{display:none!important;}
          .r-stat-value,.r-stat-zero{font-size:28px;}
        }

        /* Tablet 768px–1023px — sidebar visible, no bottom nav */
        @media(min-width:768px) and (max-width:1023px){
          .r-bottom-nav{display:none!important;}
          .r-stats{grid-template-columns:1fr 1fr;}
          .r-bottom{grid-template-columns:1fr 1fr;}
          .r-content{padding:20px;}
          .r-topbar{padding:0 20px;}
        }

        /* Desktop ≥1024px — full layout */
        @media(min-width:1024px){
          .r-bottom-nav{display:none!important;}
        }
      `}</style>

      <div className="r-bg" style={{ display: 'flex' }}>

        {/* ── SIDEBAR ── */}
        <aside className="r-sidebar">
          <div className="r-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="r-logo-mark"><Shield size={18} color="white" strokeWidth={2.2} /></div>
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.025em' }}>ModerateAI</div>
                <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 10, fontWeight: 500, marginTop: 1 }}>AI Moderation Platform</div>
              </div>
            </div>
          </div>

          <nav className="r-nav">
            {SIDEBAR_NAV.map(item => {
              const isActive = currentPath === item.href;
              return (
                <Link key={item.href} href={item.href} className={`r-nav-item${isActive ? ' active' : ''}`}>
                  <item.icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <span className="r-live-badge"><span className="r-live-dot" />live</span>}
                </Link>
              );
            })}
          </nav>

          {plan === 'free' && (
            <div className="r-upgrade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                <Zap size={12} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 12 }}>Upgrade to Pro</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, lineHeight: 1.65, marginBottom: 11 }}>Unlock unlimited moderation and Telegram alerts.</p>
              <Link href="/billing" className="r-btn-upgrade">Upgrade to Pro</Link>
            </div>
          )}

          <div className="r-sidebar-bottom">
            <button onClick={handleLogout} className="r-btn-logout">
              <LogOut size={14} strokeWidth={1.8} /> Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="r-main">
          <header className="r-topbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 460 }} className="r-topbar-search">
              <Search size={13} color="rgba(255,255,255,0.2)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="r-search" placeholder="Search comments, videos, users…" />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>⌘K</span>
            </div>
            <div className="r-status r-topbar-status"><div className="r-status-dot" />All systems operational</div>
            <div style={{ flex: 1 }} />
            {!youtubeConnected && (
              <button onClick={handleYouTubeConnect} className="r-yt-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                Connect YouTube
              </button>
            )}
            <button className="r-icon-btn">
              <Bell size={14} color="rgba(255,255,255,0.48)" strokeWidth={1.8} />
              <span style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, background: '#F59E0B', borderRadius: '50%', border: '1.5px solid #0a0a0f' }} />
            </button>
            <div className="r-avatar" onClick={() => router.push('/settings')}>
              {user?.photoURL
                ? <img src={user.photoURL} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{initials}</div>
              }
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 12.5, lineHeight: 1.25 }}>{channelName || firstName}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10.5, lineHeight: 1.25 }}>{planLabel} plan</div>
              </div>
              <span style={{
                background: plan === 'free' ? 'rgba(245,158,11,0.12)' : plan === 'agency' ? 'rgba(167,139,250,0.12)' : 'rgba(52,211,153,0.12)',
                color: plan === 'free' ? '#F59E0B' : plan === 'agency' ? '#a78bfa' : '#34d399',
                fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, letterSpacing: '0.06em', marginLeft: 2, textTransform: 'uppercase'
              }}>{plan === 'free' ? 'FREE' : plan.toUpperCase()}</span>
            </div>
          </header>

          <div className="r-content">
            {/* Header */}
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.6)', animation: 'pulse 2s infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {youtubeConnected ? 'Live · Protected' : 'Ready to connect'}
                </span>
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 4 }}>Overview</h1>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }}>Here's what's happening across your channels right now.</p>
            </div>

            {/* STAT CARDS */}
            <div className="r-stats">
              {statCards.map((s) => {
                const isNull  = s.fmtValue === null;
                const hasReal = !isNull && s.raw !== null && (s.raw as number) > 0;
                return (
                  <div key={s.label} className="r-stat">
                    <div className="r-stat-header">
                      <div className="r-stat-icon-wrap">
                        <div className="r-stat-icon" style={{ background: `${s.color}14`, border: `1px solid ${s.color}22` }}>
                          <s.icon size={14} color={s.color} strokeWidth={2} />
                        </div>
                        <span className="r-stat-label">{s.label}</span>
                      </div>
                      {hasReal && (
                        s.up
                          ? <span className="r-stat-pct-up"><TrendingUp size={10} />{s.pct}</span>
                          : <span className="r-stat-pct-down"><TrendingDown size={10} />{s.pct}</span>
                      )}
                    </div>
                    <div className="r-stat-bottom">
                      {isNull
                        ? <div className="r-stat-empty">—</div>
                        : hasReal
                          ? <><div className="r-stat-value">{s.fmtValue}</div><Sparkline color={s.color} up={s.up} width={72} height={38} /></>
                          : <div className="r-stat-zero">{s.fmtValue}</div>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM GRID */}
            <div className="r-bottom">
              <MonthlyUsageCard plan={plan} youtubeConnected={youtubeConnected} commentsUsed={commentsUsed}
                commentsLimit={commentsLimit} trialDaysLeft={trialDaysLeft} onConnectYouTube={handleYouTubeConnect} />

              <div className="ref-card">
                <div className="ref-card-top">
                  <div><div className="ref-card-title">Moderation Accuracy</div><div className="ref-card-sub">AI confidence · rolling 24h</div></div>
                </div>
                <AccuracyRing accuracy={moderationAcc} />
              </div>

              <div className="ref-card">
                <div className="ref-card-top" style={{ alignItems: 'center' }}>
                  <div><div className="ref-card-title">System Health</div><div className="ref-card-sub">Live infra status</div></div>
                  <div className="r-health-badge">
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                    Healthy
                  </div>
                </div>
                <div style={{ padding: '6px 20px 18px' }}>
                  {healthRows.length === 0
                    ? <div style={{ padding: '28px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No system data yet. Connect YouTube to start.</div>
                    : healthRows.map(row => <HealthRow key={row.key} icon={row.icon} label={row.label} sub={row.sub} value={row.value} color={row.color} dot={row.dot} />)
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV — phone only, icons only ── */}
        <nav className="r-bottom-nav">
          {BOTTOM_NAV.map(item => {
            const isActive = currentPath === item.href;
            return (
              <Link key={item.href} href={item.href} className={`r-bnav-item${isActive ? ' active' : ''}`} title={item.label}>
                <span className="r-bnav-icon">
                  <item.icon size={21} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>
              </Link>
            );
          })}
          {/* More button */}
          <button className={`r-bnav-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)} title="More">
            <span className="r-bnav-icon">
              <MoreHorizontal size={21} strokeWidth={1.7} />
            </span>
          </button>
        </nav>

        {/* ── MORE DRAWER ── */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
            <div style={{
              position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 60,
              background: 'rgba(14,14,20,0.98)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '8px 8px 12px',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.7)', backdropFilter: 'blur(28px)',
              animation: 'slideUp 0.2s ease'
            }}>
              <div style={{ width: 34, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '6px auto 14px' }} />

              {/* User info */}
              <div style={{ padding: '0 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {user?.photoURL
                    ? <img src={user.photoURL} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                    : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{initials}</div>
                  }
                  <div>
                    <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 13.5 }}>{channelName || firstName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11 }}>{planLabel} plan</div>
                  </div>
                </div>
              </div>

              {/* Extra links */}
              {[
                { icon: CreditCard, label: 'Billing',  href: '/billing',  color: '#F59E0B' },
                { icon: Layers,     label: 'Channels', href: '/channels', color: '#60a5fa' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, textDecoration: 'none', color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 14, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={16} color={item.color} strokeWidth={1.8} />
                  </div>
                  {item.label}
                </Link>
              ))}

              {/* Logout */}
              <div style={{ margin: '8px 16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 600, fontSize: 14, width: '100%' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(248,113,113,0.09)', border: '1px solid rgba(248,113,113,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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