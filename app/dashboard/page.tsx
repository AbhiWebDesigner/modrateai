'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, MessageSquare, Eye, Settings, LogOut, CreditCard,
  BarChart2, Bell, Zap, Search, Activity, Target,
  CheckCircle, LayoutDashboard, TrendingUp, TrendingDown,
  MoreHorizontal, Rss, Bot, Users, Video,
  Eye as EyeIcon, Sun, ChevronRight, ToggleRight, AlertTriangle,
  ExternalLink, RefreshCw, Hash, InboxIcon
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

/* ── SPARKLINE ── */
function Sparkline({ color, up = true, width = 80, height = 36 }: { color: string; up?: boolean; width?: number; height?: number }) {
  const points = up
    ? [28, 22, 32, 24, 36, 28, 42, 34, 48, 38, 56, 44, 62]
    : [62, 58, 52, 60, 48, 54, 44, 50, 40, 46, 38, 42, 36];
  const max = Math.max(...points), min = Math.min(...points);
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / (max - min)) * (height * 0.85);
    return `${x},${y}`;
  }).join(' ');
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${id})`} />
    </svg>
  );
}

/* ── MINI LINE CHART ── */
function MiniLineChart({ data, timeLabels }: {
  data: { values: number[]; color: string; label: string }[];
  timeLabels: string[];
}) {
  const W = 480, H = 160, padL = 36, padR = 10, padT = 10, padB = 24;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const allVals = data.flatMap(d => d.values);
  const maxV = Math.max(...allVals, 1);
  const minV = 0;
  const steps = data[0].values.length;

  const toX = (i: number) => padL + (i / (steps - 1)) * chartW;
  const toY = (v: number) => padT + chartH - ((v - minV) / (maxV - minV)) * chartH;

  const makePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');

  const makeArea = (vals: number[], color: string, id: string) => {
    const line = makePath(vals);
    const lastX = toX(vals.length - 1);
    const firstX = toX(0), bottom = padT + chartH;
    return (
      <>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${lastX},${bottom} L${firstX},${bottom} Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </>
    );
  };

  const yTicks = [0, Math.round(maxV * 0.25), Math.round(maxV * 0.5), Math.round(maxV * 0.75), maxV];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {yTicks.map(t => (
        <g key={t}>
          <text x={padL - 6} y={toY(t) + 4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Inter,sans-serif">
            {t >= 1000 ? `${(t / 1000).toFixed(1)}K` : t}
          </text>
          <line x1={padL} y1={toY(t)} x2={W - padR} y2={toY(t)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </g>
      ))}
      {data.map((d, i) => makeArea(d.values, d.color, `area-${i}`))}
      {data.map((d, i) =>
        d.values.map((v, j) => (
          <circle key={`${i}-${j}`} cx={toX(j)} cy={toY(v)} r="3" fill={d.color} opacity="0.8" />
        ))
      )}
      {timeLabels.map((l, i) => (
        <text key={l} x={toX(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.22)" fontSize="9" fontFamily="Inter,sans-serif">{l}</text>
      ))}
    </svg>
  );
}

/* ── EMPTY STATE ── */
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
      </div>
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center' }}>{message}</span>
    </div>
  );
}

/* ── DONUT CHART ── */
function DonutChart({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 60, circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={16} />
        <circle cx={80} cy={80} r={r} fill="none" stroke={`url(#dnt-grad)`} strokeWidth={16}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)`, transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
        <defs>
          <linearGradient id="dnt-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#FAFAFA', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{pct.toFixed(1)}%</span>
        <span style={{ color: color, fontSize: 10, fontWeight: 700, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      </div>
    </div>
  );
}

/* ── YT ICON ── */
function YTIcon({ color = '#f87171', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

/* ── FORMAT HELPERS ── */
function fmtCount(n: string | number | null | undefined): string {
  if (n === null || n === undefined || n === '') return '—';
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(num)) return '—';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}
function fmt(n: number | null | undefined): string | null {
  if (n === null || n === undefined) return null;
  return n >= 1000 ? n.toLocaleString() : String(n);
}
function fmtMs(ms: number | null | undefined): string | null {
  if (ms === null || ms === undefined) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}
function timeAgo(ts: any): string {
  if (!ts) return '';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ── LIVE ACTIVITY ITEM ── */
function LiveItem({ icon: Icon, iconColor, title, sub, time, bg }: {
  icon: any; iconColor: string; title: string; sub: string; time: string; bg: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={14} color={iconColor} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap' }}>{time}</span>
    </div>
  );
}

/* ── AUTOMATION ROW ── */
function AutomationRow({ icon: Icon, iconColor, label, active }: { icon: any; iconColor: string; label: string; active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: `${iconColor}14`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} color={iconColor} strokeWidth={1.8} />
      </div>
      <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 12.5, fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {active && <span style={{ color: '#34d399', fontSize: 10.5, fontWeight: 700 }}>Active</span>}
        <div style={{ width: 32, height: 18, borderRadius: 9, background: active ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)', border: `1px solid ${active ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.1)'}`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 2, left: active ? 15 : 2, width: 12, height: 12, borderRadius: '50%', background: active ? '#34d399' : 'rgba(255,255,255,0.3)', transition: 'left 0.2s', boxShadow: active ? '0 0 6px rgba(52,211,153,0.6)' : 'none' }} />
        </div>
      </div>
    </div>
  );
}

/* ── MONTHLY USAGE CARD ── */
function MonthlyUsageCard({ plan, commentsUsed, commentsLimit, trialDaysLeft, onConnectYouTube }:
  { plan: string; commentsUsed: number; commentsLimit: number; trialDaysLeft: number | null; youtubeConnected: boolean; onConnectYouTube: () => void }) {
  const usagePct = commentsLimit > 0 ? Math.min(100, (commentsUsed / commentsLimit) * 100) : 0;
  const remaining = commentsLimit - commentsUsed;
  const isFree = plan === 'free';
  const quotaDisplay = isFree ? '1,500' : commentsLimit.toLocaleString();
  const planLabel = plan === 'pro' ? 'Pro Plan' : plan === 'agency' ? 'Agency' : 'Free Trial';
  const planColor = plan === 'agency' ? '#a78bfa' : plan === 'pro' ? '#34d399' : '#F59E0B';

  return (
    <div className="ref-card">
      <div className="ref-card-top">
        <div>
          <div className="ref-card-title">Plan Usage</div>
          <div className="ref-card-sub">Comments scanned this month</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${planColor}12`, border: `1px solid ${planColor}28`, borderRadius: 8, padding: '4px 10px' }}>
          <Shield size={10} color={planColor} />
          <span style={{ color: planColor, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>{planLabel.toUpperCase()}</span>
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
          <span style={{ color: '#FAFAFA', fontSize: 36, fontWeight: 900, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{commentsUsed.toLocaleString()}</span>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 15 }}>/ {quotaDisplay}</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{ height: '100%', borderRadius: 8, background: `linear-gradient(90deg,${planColor},#7C3AED)`, width: `${usagePct}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>
          <span>{usagePct.toFixed(1)}% used</span>
          {isFree && trialDaysLeft !== null && (
            <span style={{ color: trialDaysLeft <= 3 ? '#f87171' : '#F59E0B', fontWeight: 700 }}>Resets in {trialDaysLeft} days</span>
          )}
          {!isFree && <span>Resets 1 Aug 2026</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Used', val: commentsUsed.toLocaleString() },
            { label: 'Remaining', val: remaining.toLocaleString() },
          ].map(r => (
            <div key={r.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10.5, marginBottom: 4 }}>{r.label}</div>
              <div style={{ color: '#FAFAFA', fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{r.val}</div>
            </div>
          ))}
        </div>
        {isFree
          ? <Link href="/billing" className="ref-btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Zap size={13} /> Upgrade to Pro</Link>
          : <Link href="/billing" className="ref-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Manage Plan</Link>
        }
      </div>
    </div>
  );
}

/* ── SIDEBAR ── */
const SIDEBAR_NAV = [
  { label: 'Overview',        icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Live Feed',       icon: Rss,             href: '/live-feed'  },
  { label: 'Comments',        icon: MessageSquare,   href: '/comments'   },
  { label: 'Moderation',      icon: Shield,          href: '/moderation' },
  { label: 'Automation',      icon: Zap,             href: '/automation' },
  { label: 'Analytics',       icon: BarChart2,       href: '/analytics'  },
  { label: 'Alerts',          icon: Bell,            href: '/alerts'     },
  { label: 'Billing',         icon: CreditCard,      href: '/billing'    },
  { label: 'Settings',        icon: Settings,        href: '/settings'   },
];

const BOTTOM_NAV = [
  { label: 'Overview',   icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Live Feed',  icon: Rss,             href: '/live-feed'  },
  { label: 'Automation', icon: Zap,             href: '/automation' },
  { label: 'Alerts',     icon: Bell,            href: '/alerts'     },
];

/* ══════════════════════════════════════
   MAIN DASHBOARD V2
══════════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<DocumentData | null>(null);
  const [automationData, setAutomationData] = useState<DocumentData | null>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chartRange, setChartRange] = useState<'week' | 'month'>('week');
  const unsubRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);

      unsubRefs.current.forEach(u => u());
      unsubRefs.current = [];

      const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        setLoading(false);
      });
      unsubRefs.current.push(unsubUser);

      const unsubAnalytics = onSnapshot(doc(db, 'analytics', firebaseUser.uid), (snap) => {
        if (snap.exists()) setAnalyticsData(snap.data());
      });
      unsubRefs.current.push(unsubAnalytics);

      const unsubAutomation = onSnapshot(doc(db, 'automations', firebaseUser.uid), (snap) => {
        if (snap.exists()) setAutomationData(snap.data());
      });
      unsubRefs.current.push(unsubAutomation);

      const eventsRef = collection(db, 'users', firebaseUser.uid, 'events');
      const eventsQ = query(eventsRef, orderBy('timestamp', 'desc'), limit(10));
      const unsubEvents = onSnapshot(eventsQ, (snap) => {
        setLiveEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      unsubRefs.current.push(unsubEvents);
    });

    return () => {
      unsubAuth();
      unsubRefs.current.forEach(u => u());
    };
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };
  const handleYouTubeConnect = () => { window.location.href = `/api/auth/youtube?uid=${user?.uid}`; };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 38, height: 38, border: '2.5px solid rgba(124,58,237,0.25)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13 }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── FIRESTORE: users/{uid} ── */
  const plan             = (userData?.plan as string) || 'free';
  const commentsScanned  = (userData?.comments_scanned  as number) ?? null;
  const hiddenComments   = (userData?.comments_hidden   as number) ?? (userData?.hidden_count as number) ?? null;
  const aiReplies        = (userData?.ai_replies        as number) ?? null;
  const avgResponseMs    = (userData?.avg_response_ms   as number) ?? null;
  const commentsUsed     = (userData?.comments_used     as number) || 0;
  const commentsLimit    = plan === 'free' ? 1500 : plan === 'pro' ? 5000 : (userData?.comments_limit as number) || 200000;
  const youtubeConnected = (userData?.youtube_connected as boolean) || false;
  const channelName      = (userData?.youtube_channel_name as string) || null;
  const channelHandle    = (userData?.youtube_channel_handle as string) || null;
  const channelThumbnail = (userData?.youtube_channel_thumbnail as string) || null;
  const subscriberCount  = (userData?.youtube_subscriber_count as string) || null;
  const videoCount       = (userData?.youtube_video_count as string) || null;
  const viewCount        = (userData?.youtube_view_count as string) || null;

  /* ── FIRESTORE: analytics/{uid} ── */
  const moderationAcc    = (analyticsData?.moderationAccuracy as number) ?? (userData?.moderation_accuracy as number) ?? 99.9;
  const aiConfidence     = (analyticsData?.aiConfidence as number) ?? 98.6;
  const totalScanned     = (analyticsData?.totalScanned as number) ?? 0;
  const totalHidden      = (analyticsData?.totalHidden as number) ?? 0;
  const totalReplies     = (analyticsData?.totalReplies as number) ?? 0;
  const spamDetected     = (analyticsData?.spamDetected as number) ?? 0;
  const avgResponseTime  = (analyticsData?.avgResponseTime as number) ?? avgResponseMs ?? 0;

  const weeklyScanned  = (analyticsData?.weekly?.scanned  as number[]) ?? [];
  const weeklyReplies  = (analyticsData?.weekly?.replies  as number[]) ?? [];
  const weeklyHidden   = (analyticsData?.weekly?.hidden   as number[]) ?? [];
  const hasChartData   = weeklyScanned.some(v => v > 0) || weeklyReplies.some(v => v > 0) || weeklyHidden.some(v => v > 0);

  /* ── FIRESTORE: automations/{uid} ── */
  const autoEnabled      = (automationData?.enabled as boolean) ?? false;
  const autoHideToxic    = (automationData?.hideToxic as boolean) ?? false;
  const autoHideSpam     = (automationData?.hideSpam as boolean) ?? false;
  const autoAiReplies    = (automationData?.aiReplies as boolean) ?? false;
  const autoActiveRules  = (automationData?.activeRules as number) ?? 0;

  /* ── TRIAL ── */
  const trialEndsAt   = userData?.trial_ends_at?.toDate?.() as Date | undefined;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : null;

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const initials  = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const planLabel = plan === 'free' ? 'Free Trial' : plan === 'pro' ? 'Pro' : plan === 'agency' ? 'Agency' : 'Free Trial';
  const userPhoto = user?.photoURL || (userData?.photo as string) || null;
  const planColor = plan === 'agency' ? '#a78bfa' : plan === 'pro' ? '#34d399' : '#F59E0B';

  const statCards = [
    { label: 'Comments Scanned', fmtValue: fmt(commentsScanned ?? totalScanned),  raw: commentsScanned ?? totalScanned,  up: true,  color: '#a78bfa', icon: MessageSquare },
    { label: 'AI Replies Sent',  fmtValue: fmt(aiReplies ?? totalReplies),         raw: aiReplies ?? totalReplies,         up: true,  color: '#F59E0B', icon: Bot           },
    { label: 'Hidden Toxic',     fmtValue: fmt(hiddenComments ?? totalHidden),     raw: hiddenComments ?? totalHidden,     up: true,  color: '#f87171', icon: EyeIcon       },
    { label: 'Spam Detected',    fmtValue: fmt(spamDetected),                      raw: spamDetected,                      up: true,  color: '#60a5fa', icon: AlertTriangle  },
    { label: 'Avg. Response',    fmtValue: fmtMs(avgResponseTime),                 raw: avgResponseTime,                   up: false, color: '#34d399', icon: Activity      },
  ];

  const chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = [
    { label: 'Comments Scanned', color: '#a78bfa', values: weeklyScanned.length === 7 ? weeklyScanned : [0,0,0,0,0,0,0] },
    { label: 'AI Replies',       color: '#F59E0B', values: weeklyReplies.length === 7 ? weeklyReplies : [0,0,0,0,0,0,0] },
    { label: 'Hidden Comments',  color: '#f87171', values: weeklyHidden.length  === 7 ? weeklyHidden  : [0,0,0,0,0,0,0] },
  ];

  function eventToLiveItem(ev: any) {
    const type = ev.type || '';
    const map: Record<string, { icon: any; iconColor: string; bg: string; title: string; sub: string }> = {
      toxic_hidden:    { icon: Shield,        iconColor: '#f87171', bg: 'rgba(248,113,113,0.1)', title: 'Toxic comment hidden',  sub: ev.videoTitle ? `On "${ev.videoTitle}"` : 'Comment removed'   },
      ai_reply:        { icon: Bot,           iconColor: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'AI reply sent',         sub: ev.username   ? `To @${ev.username}`   : 'Auto reply sent'    },
      comment_scanned: { icon: MessageSquare, iconColor: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  title: 'New comment scanned',   sub: ev.videoTitle ? `On "${ev.videoTitle}"` : 'Comment processed'  },
      spam_detected:   { icon: AlertTriangle, iconColor: '#f87171', bg: 'rgba(248,113,113,0.1)', title: 'Spam detected',         sub: 'Comment removed'                                              },
      rule_triggered:  { icon: Zap,           iconColor: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  title: 'AI rule triggered',     sub: ev.keyword    ? `Keyword: "${ev.keyword}"` : 'Rule matched'    },
      scan_complete:   { icon: CheckCircle,   iconColor: '#34d399', bg: 'rgba(52,211,153,0.1)',  title: 'Scan completed',        sub: ev.count      ? `${ev.count} comments scanned` : 'Scan done'   },
      user_connected:  { icon: Users,         iconColor: '#34d399', bg: 'rgba(52,211,153,0.1)',  title: 'User connected',        sub: ev.username   ? `@${ev.username}` : ''                         },
    };
    const cfg = map[type] || { icon: Activity, iconColor: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: ev.title || 'Event', sub: ev.description || '' };
    return { ...cfg, time: timeAgo(ev.timestamp) };
  }

  const totalActionsCalc   = totalScanned > 0 ? totalScanned : null;
  const correctActionsCalc = totalActionsCalc ? Math.round((moderationAcc / 100) * totalActionsCalc) : null;
  const falsePositivesCalc = totalActionsCalc ? totalActionsCalc - (correctActionsCalc ?? 0) : null;

  const currentPath = '/dashboard';

  // ── FIX 1: YouTube channel URL ──
  const youtubeChannelUrl = channelHandle
    ? `https://www.youtube.com/@${channelHandle.replace('@', '')}`
    : `https://www.youtube.com`;

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
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}

        .r-bg{min-height:100vh;background:#0a0a0f;position:relative;}
        .r-bg::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background:
            radial-gradient(ellipse 60% 50% at -8% -5%,rgba(124,58,237,0.10) 0%,transparent 55%),
            radial-gradient(ellipse 50% 40% at 108% 108%,rgba(245,158,11,0.07) 0%,transparent 55%);}
        .r-bg::after{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px);
          background-size:44px 44px;}

        .r-sidebar{width:220px;min-width:220px;background:#0c0c14;border-right:1px solid rgba(124,58,237,0.12);
          display:flex;flex-direction:column;position:fixed;height:100vh;left:0;top:0;z-index:40;
          box-shadow:4px 0 40px rgba(0,0,0,0.6);overflow:hidden;}
        .r-sidebar::after{content:'';position:absolute;right:0;top:0;bottom:0;width:1px;
          background:linear-gradient(180deg,transparent,rgba(124,58,237,0.18) 30%,rgba(124,58,237,0.28) 50%,rgba(124,58,237,0.18) 70%,transparent);
          pointer-events:none;}
        .r-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(255,255,255,0.04);position:relative;z-index:1;}
        .r-logo-mark{width:36px;height:36px;border-radius:11px;flex-shrink:0;
          background:linear-gradient(135deg,#7C3AED 0%,#5B21B6 50%,#4C1D95 100%);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 16px rgba(124,58,237,0.4),0 0 0 1px rgba(124,58,237,0.2),inset 0 1px 0 rgba(255,255,255,0.15);}
        .r-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:1px;overflow-y:auto;position:relative;z-index:1;}
        .r-nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:11px;
          font-size:13px;font-weight:500;text-decoration:none;color:rgba(255,255,255,0.38);
          transition:all 0.2s cubic-bezier(.4,0,.2,1);border:1px solid transparent;position:relative;overflow:hidden;}
        .r-nav-item:hover{background:rgba(124,58,237,0.06);color:rgba(255,255,255,0.75);}
        .r-nav-item.active{background:linear-gradient(135deg,rgba(124,58,237,0.22) 0%,rgba(124,58,237,0.10) 100%);
          color:#a78bfa;border-color:rgba(124,58,237,0.22);font-weight:700;
          box-shadow:0 0 0 1px rgba(124,58,237,0.10),inset 0 0 24px rgba(124,58,237,0.06);}
        .r-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:20px;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,#a78bfa,#7C3AED);box-shadow:0 0 8px rgba(124,58,237,0.7);}
        .r-upgrade{margin:0 8px 8px;background:linear-gradient(135deg,rgba(124,58,237,0.08) 0%,rgba(124,58,237,0.04) 100%);
          border:1px solid rgba(124,58,237,0.16);border-radius:14px;padding:14px;position:relative;z-index:1;}
        .r-sidebar-bottom{padding:8px 8px 20px;border-top:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:3px;position:relative;z-index:1;}

        .r-main{margin-left:220px;min-height:100vh;display:flex;flex-direction:column;position:relative;z-index:1;}

        .r-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.90);backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.05);padding:0 24px;height:58px;
          display:flex;align-items:center;gap:12px;
          box-shadow:0 1px 0 rgba(255,255,255,0.02),0 4px 32px rgba(0,0,0,0.3);}
        .r-search{flex:1;max-width:400px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:9px;padding:0 12px 0 34px;height:34px;color:#FAFAFA;font-size:12.5px;outline:none;transition:all 0.2s;}
        .r-search:focus{border-color:rgba(124,58,237,0.35);background:rgba(255,255,255,0.06);box-shadow:0 0 0 3px rgba(124,58,237,0.08);}
        .r-search::placeholder{color:rgba(255,255,255,0.18);}
        .r-status{display:flex;align-items:center;gap:5px;padding:5px 11px;border-radius:20px;
          background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.14);
          font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);white-space:nowrap;}
        .r-status-dot{width:5px;height:5px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite;flex-shrink:0;}
        .r-icon-btn{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;position:relative;flex-shrink:0;}
        .r-icon-btn:hover{background:rgba(255,255,255,0.07);}
        .r-credits-btn{display:flex;align-items:center;gap:6px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.18);
          borderRadius:9px;padding:0 12px;height:34px;color:#F59E0B;font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
        .r-credits-btn:hover{background:rgba(245,158,11,0.14);}
        .r-avatar{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:10px;padding:4px 10px 4px 4px;cursor:pointer;transition:all 0.2s;}
        .r-avatar:hover{border-color:rgba(255,255,255,0.12);}

        .r-content{padding:24px 24px 24px;flex:1;animation:fadeIn 0.35s ease;}
        .r-layout{display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start;}

        .r-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px;}
        .r-stat{background:rgba(14,13,22,0.98);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:18px 20px;
          transition:all 0.22s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;backdrop-filter:blur(16px);position:relative;overflow:hidden;}
        .r-stat::before{content:'';position:absolute;inset:0;border-radius:16px;
          background:linear-gradient(135deg,rgba(255,255,255,0.015) 0%,transparent 60%);pointer-events:none;}
        .r-stat:hover{border-color:rgba(255,255,255,0.11);transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,0.28);}
        .r-stat-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
        .r-stat-icon{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .r-stat-label{color:rgba(255,255,255,0.45);font-size:11.5px;font-weight:500;margin-top:2px;}
        .r-stat-bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:6px;}
        .r-stat-value{font-size:28px;font-weight:900;color:#FAFAFA;letter-spacing:-0.05em;font-variant-numeric:tabular-nums;line-height:1;}
        .r-stat-zero{font-size:28px;font-weight:900;color:rgba(255,255,255,0.35);letter-spacing:-0.05em;font-variant-numeric:tabular-nums;line-height:1;}
        .r-stat-empty{font-size:28px;font-weight:900;color:rgba(255,255,255,0.12);letter-spacing:-0.05em;line-height:1;}
        .r-stat-pct-up{display:flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#34d399;
          background:rgba(52,211,153,0.09);border:1px solid rgba(52,211,153,0.16);border-radius:6px;padding:2px 6px;white-space:nowrap;}
        .r-stat-pct-down{display:flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#f87171;
          background:rgba(248,113,113,0.09);border:1px solid rgba(248,113,113,0.16);border-radius:6px;padding:2px 6px;white-space:nowrap;}
        .r-stat-vs{font-size:10px;color:rgba(255,255,255,0.22);margin-top:4px;}

        .ref-card{background:rgba(14,13,22,0.98);border:1px solid rgba(255,255,255,0.07);border-radius:16px;backdrop-filter:blur(16px);
          transition:border-color 0.2s;display:flex;flex-direction:column;overflow:hidden;}
        .ref-card:hover{border-color:rgba(255,255,255,0.10);}
        .ref-card-top{display:flex;align-items:flex-start;justify-content:space-between;padding:16px 18px 12px;border-bottom:1px solid rgba(255,255,255,0.05);}
        .ref-card-title{color:#FAFAFA;font-size:13.5px;font-weight:700;letter-spacing:-0.02em;}
        .ref-card-sub{color:rgba(255,255,255,0.26);font-size:11px;margin-top:2px;}
        .ref-badge{display:inline-flex;align-items:center;gap:4px;border-radius:7px;padding:3px 9px;font-size:9.5px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;}
        .ref-badge-amber{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.22);color:#F59E0B;}
        .ref-badge-green{background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.22);color:#34d399;}
        .ref-badge-purple{background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.28);color:#a78bfa;}
        .ref-badge-live{background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.22);color:#22c55e;}

        .ref-btn-primary{background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-weight:700;font-size:12.5px;
          padding:9px 16px;border-radius:9px;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:6px;
          transition:all 0.2s;text-decoration:none;white-space:nowrap;box-shadow:0 2px 12px rgba(124,58,237,0.28);}
        .ref-btn-primary:hover{box-shadow:0 4px 22px rgba(124,58,237,0.44);transform:translateY(-1px);}
        .ref-btn-ghost{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);font-weight:600;font-size:12.5px;
          padding:9px 16px;border-radius:9px;border:1px solid rgba(255,255,255,0.09);cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:all 0.18s;text-decoration:none;white-space:nowrap;}
        .ref-btn-ghost:hover{background:rgba(255,255,255,0.08);color:#FAFAFA;}
        .r-btn-upgrade{width:100%;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;font-weight:700;font-size:12px;
          padding:9px;border-radius:9px;border:none;cursor:pointer;transition:all 0.2s;text-align:center;text-decoration:none;display:block;}
        .r-btn-upgrade:hover{opacity:0.88;transform:translateY(-1px);}
        .r-btn-logout{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:9px;font-size:12.5px;font-weight:500;
          color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;width:100%;transition:all 0.18s;}
        .r-btn-logout:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.6);}

        .r-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;
          background:rgba(10,10,15,0.97);border-top:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(24px);
          padding:8px 4px env(safe-area-inset-bottom,8px);}
        .r-bnav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;
          flex:1;padding:6px 4px;text-decoration:none;color:rgba(255,255,255,0.35);
          border:none;background:none;cursor:pointer;transition:color 0.18s;-webkit-tap-highlight-color:transparent;}
        .r-bnav-item.active{color:#a78bfa;}
        .r-bnav-icon{width:40px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:10px;transition:background 0.18s;}
        .r-bnav-item.active .r-bnav-icon{background:rgba(124,58,237,0.14);}

        .r-live-panel{background:rgba(14,13,22,0.98);border:1px solid rgba(255,255,255,0.07);border-radius:16px;
          display:flex;flex-direction:column;overflow:hidden;height:fit-content;}
        .r-live-scroll{overflow-y:auto;max-height:360px;padding:0 14px;}

        .r-hero{background:linear-gradient(135deg,rgba(14,13,22,0.98) 0%,rgba(20,14,40,0.98) 100%);
          border:1px solid rgba(124,58,237,0.14);border-radius:16px;padding:28px 32px;
          margin-bottom:14px;position:relative;overflow:hidden;}
        .r-hero::before{content:'';position:absolute;top:-40px;right:60px;width:320px;height:320px;
          background:radial-gradient(ellipse,rgba(124,58,237,0.14) 0%,transparent 65%);pointer-events:none;}
        .r-hero-shield{position:absolute;right:32px;top:50%;transform:translateY(-50%);width:140px;height:140px;opacity:0.85;}

        .r-channel-card{display:flex;align-items:center;gap:18px;}
        .r-channel-stats{display:flex;gap:28px;flex-shrink:0;}
        .r-channel-btn{flex-shrink:0;}

        .r-bottom-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}

        /* ── FIX 2: Live panel visible on all sizes, stacks below on mobile ── */
        @media(max-width:1279px){
          .r-layout{grid-template-columns:1fr;}
          .r-stats{grid-template-columns:repeat(3,1fr);}
        }
        @media(max-width:1023px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;padding-bottom:72px;}
          .r-bottom-nav{display:flex!important;}
          .r-content{padding:12px 12px 16px;}
          .r-topbar{padding:0 12px;}
          .r-topbar-search,.r-topbar-status{display:none!important;}
          .r-hero{padding:18px 16px;}
          .r-hero-shield{display:none;}
          .r-stats{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
          .r-stat{padding:14px 14px;}
          .r-stat-value,.r-stat-zero{font-size:22px;}
          .r-stat-label{font-size:10.5px;}
          .r-channel-card{flex-wrap:wrap;gap:10px;}
          .r-channel-stats{gap:16px;}
          .r-channel-btn{width:100%;justify-content:center;}
          .r-bottom-grid{grid-template-columns:1fr;gap:10px;}
          .r-hero-badges{flex-wrap:wrap;gap:6px!important;}
          .r-hero h1{font-size:24px!important;}
          .r-live-panel{margin-top:10px;position:static!important;}
        }
        @media(min-width:768px) and (max-width:1023px){
          .r-stats{grid-template-columns:repeat(3,1fr);}
          .r-content{padding:18px;}
          .r-topbar{padding:0 18px;}
          .r-channel-card{flex-direction:row;align-items:center;}
          .r-bottom-grid{grid-template-columns:1fr 1fr;}
        }
        @media(min-width:1024px){.r-bottom-nav{display:none!important;}}
      `}</style>

      <div className="r-bg" style={{ display: 'flex' }}>

        {/* ── SIDEBAR ── */}
        <aside className="r-sidebar">
          <div className="r-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="r-logo-mark"><Shield size={17} color="white" strokeWidth={2.2} /></div>
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 15, letterSpacing: '-0.025em' }}>ModerateAI</div>
                <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9.5, fontWeight: 500, marginTop: 1 }}>YouTube AI Moderator</div>
              </div>
            </div>
          </div>

          {youtubeConnected && channelName && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '8px 10px' }}>
                {channelThumbnail
                  ? <img src={channelThumbnail} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{(channelName || 'C')[0].toUpperCase()}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelName}</div>
                  <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>{channelHandle ? `@${channelHandle.replace('@', '')}` : 'Connected'}</div>
                </div>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              </div>
            </div>
          )}

          <nav className="r-nav">
            {SIDEBAR_NAV.map(item => {
              const isActive = currentPath === item.href;
              return (
                <Link key={item.href} href={item.href} className={`r-nav-item${isActive ? ' active' : ''}`}>
                  <item.icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {plan === 'free' && (
            <div className="r-upgrade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Zap size={11} color="#a78bfa" />
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 11.5 }}>Upgrade to Pro</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {['Unlimited comments', 'Advanced AI models', 'Priority support', 'Team members'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: 10.5 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />{f}
                  </div>
                ))}
              </div>
              <Link href="/billing" className="r-btn-upgrade">Upgrade Now</Link>
            </div>
          )}

          <div className="r-sidebar-bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4 }}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="av" />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{initials}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>{user?.email?.slice(0, 22)}{(user?.email?.length || 0) > 22 ? '…' : ''}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="r-btn-logout">
              <LogOut size={13} strokeWidth={1.8} /> Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="r-main">

          {/* TOPBAR */}
          <header className="r-topbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }} className="r-topbar-search">
              <Search size={12} color="rgba(255,255,255,0.18)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="r-search" placeholder="Search comments, users, keywords…" />
              <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 5px', fontSize: 9.5, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>⌘K</span>
            </div>
            <div className="r-status r-topbar-status"><div className="r-status-dot" />AI System Online</div>
            <div style={{ flex: 1 }} />
            <button className="r-credits-btn">
              <CreditCard size={12} />
              {commentsUsed.toLocaleString()} Credits
              <ChevronRight size={11} />
            </button>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button className="r-icon-btn" onClick={() => setNotifOpen(v => !v)}>
                <Bell size={13} color={notifOpen ? '#a78bfa' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} />
                <span style={{ position: 'absolute', top: 7, right: 7, width: 14, height: 14, background: '#7C3AED', borderRadius: '50%', border: '1.5px solid #0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 800 }}>3</span>
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 60, width: 300, background: 'rgba(14,13,20,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', animation: 'fadeIn 0.18s ease', overflow: 'hidden' }}>
                    <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12.5 }}>Notifications</span>
                      <span className="ref-badge ref-badge-purple">3 new</span>
                    </div>
                    {[
                      { icon: Shield, color: '#34d399', title: 'Moderation active', sub: 'AI moderator is protecting your channel', time: 'Now' },
                      { icon: Bell,   color: '#60a5fa', title: 'System operational', sub: 'All services running normally', time: '2m' },
                      { icon: Zap,    color: '#a78bfa', title: 'Upgrade available', sub: 'Unlock unlimited scans with Pro', time: '1h' },
                    ].map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 15px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: `${n.color}14`, border: `1px solid ${n.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <n.icon size={13} color={n.color} strokeWidth={1.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                          <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11 }}>{n.sub}</div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0 }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button className="r-icon-btn"><Sun size={13} color="rgba(255,255,255,0.4)" strokeWidth={1.8} /></button>
            <div className="r-avatar" onClick={() => router.push('/settings')}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{initials}</div>
              }
            </div>
          </header>

          {/* CONTENT */}
          <div className="r-content">

            {/* HERO */}
            <div className="r-hero">
              <div className="r-hero-badges" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'All systems operational', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.18)', dot: true },
                  { label: 'Protection active',        color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.18)', icon: Shield },
                  { label: 'Last scan: 10s ago',       color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', icon: RefreshCw },
                ].map(p => (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: p.color }}>
                    {p.dot ? <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, animation: 'pulse 2s infinite' }} /> : p.icon && <p.icon size={10} strokeWidth={2} />}
                    {p.label}
                  </div>
                ))}
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 8 }}>
                Welcome back, <span style={{ background: 'linear-gradient(90deg,#a78bfa,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span> 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13.5 }}>
                Your AI moderator is actively protecting your YouTube channel 24/7.
              </p>
              <div className="r-hero-shield">
                <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="shg1" cx="50%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.05"/>
                    </radialGradient>
                  </defs>
                  <ellipse cx="70" cy="70" rx="65" ry="65" fill="url(#shg1)" />
                  <path d="M70 18 L105 32 L105 68 C105 88 88 104 70 112 C52 104 35 88 35 68 L35 32 Z" fill="rgba(124,58,237,0.18)" stroke="rgba(167,139,250,0.35)" strokeWidth="1.5"/>
                  <path d="M70 26 L100 38 L100 67 C100 84 85 98 70 105 C55 98 40 84 40 67 L40 38 Z" fill="rgba(124,58,237,0.12)" stroke="rgba(167,139,250,0.2)" strokeWidth="1"/>
                  <circle cx="70" cy="68" r="18" fill="rgba(124,58,237,0.2)" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5"/>
                  <path d="M61 68 L66 74 L79 61" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {[0,60,120,180,240,300].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 70 + 52 * Math.cos(rad), y = 70 + 52 * Math.sin(rad);
                    return <circle key={i} cx={x} cy={y} r="3" fill="rgba(167,139,250,0.3)" />;
                  })}
                </svg>
              </div>
            </div>

            {/* CHANNEL CARD */}
            {youtubeConnected && (
              <div style={{ background: 'rgba(14,13,22,0.98)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 22px', marginBottom: 14 }}>
                <div className="r-channel-card">
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {channelThumbnail
                      ? <img src={channelThumbnail} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.3)' }} />
                      : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'white' }}>{(channelName || 'C')[0]}</div>
                    }
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: '50%', background: '#22c55e', border: '2px solid #0a0a0f', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelName || 'My Channel'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e' }} />
                        <span style={{ color: '#22c55e', fontSize: 9.5, fontWeight: 700 }}>CONNECTED</span>
                      </div>
                    </div>
                    {channelHandle && <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{channelHandle.replace('@', '')} · Connected on {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                  </div>
                  <div className="r-channel-stats">
                    {[
                      { label: 'Subscribers', value: fmtCount(subscriberCount) },
                      { label: 'Videos',      value: fmtCount(videoCount)      },
                      { label: 'Views',       value: fmtCount(viewCount)       },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ color: '#FAFAFA', fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                        <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10.5, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* ── FIX 1: Open Channel → YouTube URL ── */}
                  <a
                    href={youtubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ref-btn-ghost r-channel-btn"
                    style={{ fontSize: 11.5, padding: '7px 12px' }}
                  >
                    <ExternalLink size={11} /> Open Channel
                  </a>
                </div>
              </div>
            )}

            {!youtubeConnected && (
              <div style={{ background: 'rgba(14,13,22,0.98)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, padding: '24px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <YTIcon color="#f87171" size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Connect your YouTube channel</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Grant OAuth access and ModerateAI starts protecting your community instantly.</p>
                </div>
                <button onClick={handleYouTubeConnect} className="ref-btn-primary" style={{ flexShrink: 0, width: '100%' }}>
                  <YTIcon color="#fff" size={13} /> Connect YouTube
                </button>
              </div>
            )}

            {/* TWO-COLUMN LAYOUT */}
            <div className="r-layout">
              <div>

                {/* STAT CARDS */}
                <div className="r-stats">
                  {statCards.map((s) => {
                    const isNull  = s.fmtValue === null;
                    const hasReal = !isNull && s.raw !== null && s.raw !== undefined && (s.raw as number) > 0;
                    return (
                      <div key={s.label} className="r-stat">
                        <div className="r-stat-header">
                          <div className="r-stat-icon" style={{ background: `${s.color}14`, border: `1px solid ${s.color}22` }}>
                            <s.icon size={13} color={s.color} strokeWidth={2} />
                          </div>
                          {hasReal && (
                            s.up
                              ? <span className="r-stat-pct-up"><TrendingUp size={9} />↑</span>
                              : <span className="r-stat-pct-down"><TrendingDown size={9} />↓</span>
                          )}
                        </div>
                        <div className="r-stat-label">{s.label}</div>
                        <div className="r-stat-bottom" style={{ marginTop: 8 }}>
                          {isNull
                            ? <div className="r-stat-empty">—</div>
                            : hasReal
                              ? <><div className="r-stat-value">{s.fmtValue}</div><Sparkline color={s.color} up={s.up} width={64} height={34} /></>
                              : <div className="r-stat-zero">{s.fmtValue || '0'}</div>
                          }
                        </div>
                        {hasReal && <div className="r-stat-vs">↑ vs yesterday</div>}
                      </div>
                    );
                  })}
                </div>

                {/* CHART CARD */}
                <div className="ref-card" style={{ marginBottom: 14 }}>
                  <div className="ref-card-top">
                    <div>
                      <div className="ref-card-title">Comments &amp; AI Replies Overview</div>
                      <div className="ref-card-sub">Activity over time</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['week', 'month'] as const).map(r => (
                        <button key={r} onClick={() => setChartRange(r)}
                          style={{ background: chartRange === r ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${chartRange === r ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 7, padding: '4px 12px', color: chartRange === r ? '#a78bfa' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          {r === 'week' ? 'This Week' : 'Month'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasChartData ? (
                    <>
                      <div style={{ display: 'flex', gap: 16, padding: '12px 18px 0' }}>
                        {chartData.map(d => (
                          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10.5, fontWeight: 600 }}>{d.label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '12px 18px 16px' }}>
                        <MiniLineChart data={chartData} timeLabels={chartLabels} />
                      </div>
                    </>
                  ) : (
                    <EmptyState icon={BarChart2} message="No activity yet. Data will appear once comments are scanned." />
                  )}
                </div>

                {/* BOTTOM ROW */}
                <div className="r-bottom-grid">

                  <div className="ref-card">
                    <div className="ref-card-top">
                      <div>
                        <div className="ref-card-title">Moderation Accuracy</div>
                        <div className="ref-card-sub">AI confidence · rolling 24h</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', gap: 14 }}>
                      <DonutChart pct={moderationAcc} label="Excellent" color="#34d399" />
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {totalActionsCalc !== null && totalActionsCalc > 0 ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
                              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, flex: 1 }}>Correct Actions</span>
                              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}>{correctActionsCalc?.toLocaleString()} ({moderationAcc.toFixed(1)}%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, flex: 1 }}>False Positives</span>
                              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}>{falsePositivesCalc?.toLocaleString()} ({(100 - moderationAcc).toFixed(1)}%)</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, padding: '8px 0' }}>Stats will appear after first scan</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ref-card">
                    <div className="ref-card-top">
                      <div>
                        <div className="ref-card-title">Top Toxic Keywords</div>
                        <div className="ref-card-sub">Detected this week</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 7, padding: '4px 10px', color: '#a78bfa', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>This Week</button>
                      </div>
                    </div>
                    <EmptyState icon={Hash} message="No toxic keywords detected yet. Keywords will appear as comments are scanned." />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="ref-card">
                      <div className="ref-card-top" style={{ alignItems: 'center' }}>
                        <div><div className="ref-card-title">Recent Automations</div></div>
                        <Link href="/automation" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, textDecoration: 'none', transition: 'color 0.18s' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                          View all <ChevronRight size={11} />
                        </Link>
                      </div>
                      <div style={{ padding: '4px 16px 12px' }}>
                        <AutomationRow icon={Shield}        iconColor="#f87171" label="Toxic Comment Protection" active={autoHideToxic} />
                        <AutomationRow icon={Bot}           iconColor="#a78bfa" label="AI Auto Reply"            active={autoAiReplies} />
                        <AutomationRow icon={MessageSquare} iconColor="#34d399" label="Spam Filter"             active={autoHideSpam} />
                      </div>
                    </div>

                    <div className="ref-card">
                      <div className="ref-card-top" style={{ alignItems: 'center' }}>
                        <div><div className="ref-card-title">AI System Health</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 7, padding: '3px 8px' }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                          <span style={{ color: '#22c55e', fontSize: 9.5, fontWeight: 800 }}>HEALTHY</span>
                        </div>
                      </div>
                      <div style={{ padding: '10px 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { label: 'Uptime',        value: '100%',                              color: '#34d399' },
                          { label: 'Response Time', value: fmtMs(avgResponseTime) || '0ms',     color: '#a78bfa' },
                          { label: 'AI Confidence', value: `${aiConfidence.toFixed(1)}%`,       color: '#60a5fa' },
                          { label: 'Error Rate',    value: `${(analyticsData?.falsePositiveRate as number ?? 0).toFixed(2)}%`, color: '#F59E0B' },
                        ].map(s => (
                          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ color: s.color, fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <MonthlyUsageCard
                      plan={plan}
                      commentsUsed={commentsUsed}
                      commentsLimit={commentsLimit}
                      trialDaysLeft={trialDaysLeft}
                      youtubeConnected={youtubeConnected}
                      onConnectYouTube={handleYouTubeConnect}
                    />
                  </div>
                </div>
              </div>

              {/* ── FIX 2: LIVE ACTIVITY PANEL — always visible, stacks on mobile ── */}
              <div className="r-live-panel" style={{ position: 'sticky', top: 74 }}>
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#FAFAFA', fontSize: 13.5, fontWeight: 700 }}>Live Activity</span>
                    <div className="ref-badge ref-badge-live">
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                      Live
                    </div>
                  </div>
                </div>
                <div className="r-live-scroll">
                  {liveEvents.length > 0
                    ? liveEvents.map((ev) => {
                        const item = eventToLiveItem(ev);
                        return <LiveItem key={ev.id} {...item} />;
                      })
                    : <EmptyState icon={Activity} message="No activity yet. Events will appear in real time." />
                  }
                </div>
                <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <Link href="/live-feed" className="ref-btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    View Live Feed <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV ── */}
        <nav className="r-bottom-nav">
          {BOTTOM_NAV.map(item => {
            const isActive = currentPath === item.href;
            return (
              <Link key={item.href} href={item.href} className={`r-bnav-item${isActive ? ' active' : ''}`} title={item.label}>
                <span className="r-bnav-icon"><item.icon size={20} strokeWidth={isActive ? 2.2 : 1.7} /></span>
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </Link>
            );
          })}
          <button className={`r-bnav-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)}>
            <span className="r-bnav-icon"><MoreHorizontal size={20} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>More</span>
          </button>
        </nav>

        {/* MORE DRAWER */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'fixed', bottom: 70, left: 12, right: 12, zIndex: 60, background: 'rgba(14,14,20,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '8px 8px 12px', boxShadow: '0 -8px 48px rgba(0,0,0,0.7)', backdropFilter: 'blur(28px)', animation: 'slideUp 0.2s ease' }}>
              <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '6px auto 14px' }} />
              {[
                { icon: CreditCard, label: 'Billing',    href: '/billing',    color: '#F59E0B' },
                { icon: BarChart2,  label: 'Analytics',  href: '/analytics',  color: '#34d399' },
                { icon: Bot,        label: 'Automation', href: '/automation', color: '#a78bfa' },
                { icon: Hash,       label: 'Comments',   href: '/comments',   color: '#60a5fa' },
                { icon: Settings,   label: 'Settings',   href: '/settings',   color: '#94a3b8' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 14px', borderRadius: 11, textDecoration: 'none', color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 13.5, transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${item.color}14`, border: `1px solid ${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={15} color={item.color} strokeWidth={1.8} />
                  </div>
                  {item.label}
                </Link>
              ))}
              <div style={{ margin: '8px 14px 0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
                <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 600, fontSize: 13.5, width: '100%' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(248,113,113,0.09)', border: '1px solid rgba(248,113,113,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={15} color="#f87171" strokeWidth={1.8} />
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