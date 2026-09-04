'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, MessageSquare, Settings, LogOut, CreditCard,
  BarChart2, Bell, Zap, Search, Activity,
  CheckCircle, LayoutDashboard, TrendingUp, TrendingDown,
  MoreHorizontal, Rss, Bot, Users,
  Eye as EyeIcon, Sun, ChevronRight, AlertTriangle,
  ExternalLink, RefreshCw, Hash, Plus,
  Clock, Cpu
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  doc, onSnapshot, DocumentData, collection, query,
  orderBy, limit, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// ─── Plan defaults ───────────────────────────────────────────────────────────
const PLAN_CREDITS: Record<string, number> = { free: 250, pro: 1900, agency: 15000 };
const PLAN_COMMENTS_LIMIT: Record<string, number> = { free: 2000, pro: 25000, agency: 150000 };

// ─── Automation rule type — matches Automation page schema ──────────────────
interface AutomationRule {
  id: string;
  name: string;
  active: boolean;
  keywords?: string[];
  video?: { id: string; title: string } | null;
  replyMode?: string;
  updatedAt?: any;
  createdAt?: any;
}

function Sparkline({ color, up = true, width = 72, height = 32 }: { color: string; up?: boolean; width?: number; height?: number }) {
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
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${id})`} />
    </svg>
  );
}

function MiniBarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 3,
          background: i === values.length - 1 ? color : `${color}44`,
          height: `${Math.max(8, (v / max) * 100)}%`,
          transition: 'height 0.3s',
        }} />
      ))}
    </div>
  );
}

function MiniLineChart({ data, timeLabels }: {
  data: { values: number[]; color: string; label: string }[];
  timeLabels: string[];
}) {
  const W = 480, H = 160, padL = 36, padR = 10, padT = 10, padB = 24;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const allVals = data.flatMap(d => d.values);
  const maxV = Math.max(...allVals, 1);
  const steps = data[0].values.length;
  const toX = (i: number) => padL + (i / (steps - 1)) * chartW;
  const toY = (v: number) => padT + chartH - ((v - 0) / (maxV - 0)) * chartH;
  const makePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const makeArea = (vals: number[], color: string, id: string) => {
    const line = makePath(vals);
    const lastX = toX(vals.length - 1), firstX = toX(0), bottom = padT + chartH;
    return (
      <>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${lastX},${bottom} L${firstX},${bottom} Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </>
    );
  };
  const yTicks = [0, Math.round(maxV * 0.5), maxV];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      {yTicks.map(t => (
        <g key={t}>
          <text x={padL - 6} y={toY(t) + 4} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="9" fontFamily="Inter,sans-serif">
            {t >= 1000 ? `${(t / 1000).toFixed(1)}K` : t}
          </text>
          <line x1={padL} y1={toY(t)} x2={W - padR} y2={toY(t)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        </g>
      ))}
      {data.map((d, i) => makeArea(d.values, d.color, `area-${i}`))}
      {data.map((d, i) =>
        d.values.map((v, j) => (
          <circle key={`${i}-${j}`} cx={toX(j)} cy={toY(v)} r="2.5" fill={d.color} opacity="0.75" />
        ))
      )}
      {timeLabels.map((l, i) => (
        <text key={l} x={toX(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Inter,sans-serif">{l}</text>
      ))}
    </svg>
  );
}

function DonutChart({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 56, circ = 2 * Math.PI * r, filled = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 148, height: 148 }}>
      <svg width={148} height={148} viewBox="0 0 148 148" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={74} cy={74} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={14} />
        <circle cx={74} cy={74} r={r} fill="none" stroke={`url(#dnt-grad)`} strokeWidth={14}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}55)`, transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
        <defs>
          <linearGradient id="dnt-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#FAFAFA', fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{pct.toFixed(1)}%</span>
        <span style={{ color: color, fontSize: 9, fontWeight: 700, marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
      </div>
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

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color="rgba(255,255,255,0.18)" strokeWidth={1.5} />
      </div>
      <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11.5, textAlign: 'center', lineHeight: 1.5 }}>{message}</span>
    </div>
  );
}

function LiveItem({ icon: Icon, iconColor, title, sub, time, bg }: {
  icon: any; iconColor: string; title: string; sub: string; time: string; bg: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: bg, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Icon size={13} color={iconColor} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap' }}>{time}</span>
    </div>
  );
}

// ─── Real-time Automation Row ────────────────────────────────────────────────
function RealAutomationRow({ rule, uid }: { rule: AutomationRule; uid: string }) {
  const [toggling, setToggling] = useState(false);

  const isLive = rule.active === true;
  const statusColor = isLive ? '#34d399' : '#f87171';
  const statusLabel = isLive ? 'Live' : 'Disabled';
  const keywordsCount = Array.isArray(rule.keywords) ? rule.keywords.length : 0;
  const videoLabel = rule.video?.title || rule.video?.id || 'All Videos';
  const updatedLabel = rule.updatedAt ? timeAgo(rule.updatedAt) : rule.createdAt ? timeAgo(rule.createdAt) : '—';

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const ref = doc(db, 'automations', uid, 'rules', rule.id);
      // FIX: also write updatedAt so the updatedAt desc query re-sorts correctly
      await updateDoc(ref, { active: !isLive });
    } catch (e) {
      console.error('Toggle failed:', e);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: statusColor,
          boxShadow: isLive ? `0 0 5px ${statusColor}88` : 'none',
          flexShrink: 0,
          animation: isLive ? 'pulse 2s infinite' : 'none',
        }} />
        <span style={{
          flex: 1, color: 'rgba(255,255,255,0.82)', fontSize: 12,
          fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{rule.name || 'Untitled Rule'}</span>
        <span style={{
          color: statusColor, fontSize: 9.5, fontWeight: 800,
          background: `${statusColor}12`, border: `1px solid ${statusColor}28`,
          borderRadius: 5, padding: '1.5px 6px', flexShrink: 0,
        }}>{statusLabel}</span>
        <button
          onClick={handleToggle}
          disabled={toggling}
          aria-label={isLive ? 'Disable rule' : 'Enable rule'}
          style={{
            width: 30, height: 17, borderRadius: 9,
            background: isLive ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isLive ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.09)'}`,
            position: 'relative', cursor: toggling ? 'wait' : 'pointer',
            flexShrink: 0, padding: 0, outline: 'none',
            opacity: toggling ? 0.6 : 1, transition: 'opacity 0.2s',
          }}>
          <div style={{
            position: 'absolute', top: 2,
            left: isLive ? 14 : 2,
            width: 11, height: 11, borderRadius: '50%',
            background: isLive ? '#34d399' : 'rgba(255,255,255,0.28)',
            transition: 'left 0.2s',
            boxShadow: isLive ? '0 0 5px rgba(52,211,153,0.55)' : 'none',
          }} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, paddingLeft: 15, flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Hash size={9} strokeWidth={2} color="rgba(255,255,255,0.22)" />
          {keywordsCount} {keywordsCount === 1 ? 'Keyword' : 'Keywords'}
        </span>
        <span style={{
          color: 'rgba(255,255,255,0.28)', fontSize: 10,
          display: 'flex', alignItems: 'center', gap: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130,
        }}>
          <YTIcon color="rgba(255,255,255,0.22)" size={9} />
          {videoLabel}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
          <Clock size={9} strokeWidth={2} color="rgba(255,255,255,0.16)" />
          {updatedLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Recent Automations widget ───────────────────────────────────────────────
// Collection: automations/{uid}/rules
function RecentAutomations({ uid }: { uid: string }) {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    // No orderBy — avoids index errors when createdAt/updatedAt field is missing
    const ref = collection(db, 'automations', uid, 'rules');
    const q = query(ref, limit(5));

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationRule));
      // Sort client-side by updatedAt or createdAt, newest first
      docs.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.()?.getTime?.() ?? a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const bTime = b.updatedAt?.toDate?.()?.getTime?.() ?? b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return bTime - aTime;
      });
      setRules(docs);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  return (
    <div className="r-card">
      <div className="r-card-top" style={{ alignItems: 'center' }}>
        <div><div className="r-card-title">Recent Automations</div></div>
        <Link href="/automation" style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(255,255,255,0.3)', fontSize: 10.5, fontWeight: 600, textDecoration: 'none' }}>
          View all <ChevronRight size={10} />
        </Link>
      </div>

      <div style={{ padding: '4px 14px 10px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <div style={{ width: 18, height: 18, border: '2px solid rgba(124,58,237,0.15)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : rules.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 10px', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="#a78bfa" strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No automation rules yet</div>
              <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10.5, lineHeight: 1.5 }}>
                Create your first automation to start automatically replying to comments.
              </div>
            </div>
            <Link href="/automation" style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff',
              fontWeight: 700, fontSize: 11, padding: '7px 14px', borderRadius: 8,
              textDecoration: 'none', marginTop: 2,
            }}>
              <Plus size={11} /> Create Automation
            </Link>
          </div>
        ) : (
          rules.map(rule => (
            <RealAutomationRow key={rule.id} rule={rule} uid={uid} />
          ))
        )}
      </div>
    </div>
  );
}

const SIDEBAR_NAV = [
  { label: 'Overview',   icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Live Feed',  icon: Rss,             href: '/live-feed'  },
  { label: 'Moderation', icon: Shield,          href: '/moderation' },
  { label: 'Automation', icon: Zap,             href: '/automation' },
  { label: 'Analytics',  icon: BarChart2,       href: '/analytics'  },
  { label: 'Alerts',     icon: Bell,            href: '/alerts'     },
  { label: 'Billing',    icon: CreditCard,      href: '/billing'    },
  { label: 'Settings',   icon: Settings,        href: '/settings'   },
];

type LoadState = 'auth' | 'firestore' | 'missing' | 'ready';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser]               = useState<User | null>(null);
  const [userData, setUserData]       = useState<DocumentData | null>(null);
  const [analyticsData, setAnalyticsData]   = useState<DocumentData | null>(null);
  const [liveEvents, setLiveEvents]   = useState<any[]>([]);
  const [loadState, setLoadState]     = useState<LoadState>('auth');
  const [moreOpen, setMoreOpen]       = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [isDesktopSiteOn, setIsDesktopSiteOn] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(true);

  useEffect(() => {
    const check = () => {
      setIsDesktopSiteOn(navigator.maxTouchPoints > 0 && window.innerWidth >= 600);
      setShowBottomNav(window.innerWidth < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [notifCount, setNotifCount]   = useState(0);
  const [notifications, setNotifications] = useState<{ id: string; title: string; body: string; read: boolean; type: string; timestamp?: { toDate?: () => Date } }[]>([]);
  const [chartRange, setChartRange]   = useState<'week' | 'month'>('week');
  const unsubRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      // If user came from GCP OAuth flow, redirect back to api-access page
      if (typeof window !== 'undefined') {
        const gcpReturn = localStorage.getItem('gcp_oauth_return');
        if (gcpReturn === '1') {
          localStorage.removeItem('gcp_oauth_return');
          router.push('/dashboard/settings/api-access?gcp=connected');
          return;
        }
      }
      setUser(firebaseUser);
      setLoadState('firestore');
      if (process.env.NODE_ENV === 'development') console.log('Dashboard UID:', firebaseUser.uid);

      unsubRefs.current.forEach(u => u());
      unsubRefs.current = [];

      firebaseUser.getIdToken().then(token => { fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/youtube/refresh-stats?uid=${firebaseUser.uid}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {}); }).catch(() => {});
      const statsInterval = setInterval(() => {
      firebaseUser.getIdToken().then(token => { fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/youtube/refresh-stats?uid=${firebaseUser.uid}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {}); }).catch(() => {});      }, 30_000);
      unsubRefs.current.push(() => clearInterval(statsInterval));

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const unsubUser = onSnapshot(userDocRef, (snap) => {
        if (!snap.exists()) { setLoadState('missing'); return; }
        const data = snap.data();
        if (process.env.NODE_ENV === 'development') console.log('Dashboard Firestore:', data);
        setUserData(data);
        setLoadState('ready');
      });
      unsubRefs.current.push(unsubUser);

      const unsubAnalytics = onSnapshot(
        doc(db, 'analytics', firebaseUser.uid),
        (snap) => { if (snap.exists()) setAnalyticsData(snap.data()); }
      );
      unsubRefs.current.push(unsubAnalytics);

      const eventsRef = collection(db, 'users', firebaseUser.uid, 'events');
      const eventsQ   = query(eventsRef, orderBy('timestamp', 'desc'), limit(10));
      const unsubEvents = onSnapshot(eventsQ, (snap) => {
        setLiveEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      unsubRefs.current.push(unsubEvents); 
     const notifsRef = collection(db, 'users', firebaseUser.uid, 'notifications');
     const notifsQ = query(notifsRef, orderBy('createdAt', 'desc'), limit(10));
      const unsubNotifCount = onSnapshot(notifsQ, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; title: string; body: string; read: boolean; type: string; timestamp?: { toDate?: () => Date } }));
        const unread = docs.filter(d => d.read === false).length;
        setNotifCount(unread);
        setNotifications(docs);
      });
      unsubRefs.current.push(unsubNotifCount);
    });

    return () => { unsubAuth(); unsubRefs.current.forEach(u => u()); };
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };
  const handleYouTubeConnect = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/youtube?token=${token}`;
    } catch { console.error('Failed to get auth token'); }
  };

  if (loadState === 'auth' || loadState === 'firestore') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
            {loadState === 'auth' ? 'Authenticating…' : 'Loading dashboard…'}
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (loadState === 'missing') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 340, padding: '0 20px' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <AlertTriangle size={22} color="#f87171" strokeWidth={1.8} />
          </div>
          <h2 style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Account setup incomplete</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12.5, lineHeight: 1.6, marginBottom: 18 }}>
            Your Firestore user document could not be found. Please contact support or try signing out and back in.
          </p>
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 20px', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const plan = (userData!.plan as string) || 'free';
  const commentsScanned  = userData!.comments_scanned  as number | undefined;
  const hiddenComments   = userData!.comments_hidden   as number | undefined;
  const aiReplies        = userData!.ai_replies        as number | undefined;
  const avgResponseMs    = userData!.avg_response_ms   as number | undefined;
  const commentsUsed     = (userData!.comments_used    as number) ?? 0;
  const commentsLimit    = (userData!.comments_limit   as number) ?? PLAN_COMMENTS_LIMIT[plan] ?? 2000;
  const aiCredits        = (userData!.ai_credits       as number) ?? PLAN_CREDITS[plan] ?? 0;
  const youtubeConnected   = (userData!.youtube_connected        as boolean) === true;
  const channelName        = (userData!.youtube_channel_name     as string)  || null;
  const channelHandle      = (userData!.youtube_channel_handle   as string)  || null;
  const channelThumbnail   = (userData!.youtube_channel_thumbnail as string) || null;
  const subscriberCount    = (userData!.youtube_subscriber_count as string)  || null;
  const videoCount         = (userData!.youtube_video_count      as string)  || null;
  const viewCount          = (userData!.youtube_view_count       as string)  || null;
  const trialActive  = (userData!.trial_active as boolean) ?? false;
  const trialDays    = (userData!.trial_days   as number)  ?? null;
  const trialEndsAt  = userData!.trial_ends_at?.toDate?.() as Date | undefined;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
    : trialDays;

  const moderationAcc   = (analyticsData?.moderationAccuracy as number) ?? (userData!.moderation_accuracy as number) ?? 99.9;
  const totalScanned    = (analyticsData?.totalScanned       as number) ?? 0;
  const totalHidden     = (analyticsData?.totalHidden        as number) ?? 0;
  const totalReplies    = (analyticsData?.totalReplies       as number) ?? 0;
  const pendingReview   = (analyticsData?.pendingReview      as number) ?? (userData!.pending_review as number) ?? 0;
  const avgResponseTime = (analyticsData?.avgResponseTime    as number) ?? avgResponseMs ?? 0;
  const weeklyScanned  = (analyticsData?.weekly?.scanned  as number[]) ?? [];
  const weeklyReplies  = (analyticsData?.weekly?.replies  as number[]) ?? [];
  const weeklyHidden   = (analyticsData?.weekly?.hidden   as number[]) ?? [];
  const hasChartData   = weeklyScanned.some(v => v > 0) || weeklyReplies.some(v => v > 0);

  const usagePct = commentsLimit > 0 ? Math.min(100, (commentsUsed / commentsLimit) * 100) : 0;
  const firstName  = user?.displayName?.split(' ')[0] || 'there';
  const initials   = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const planLabel  = plan === 'pro' ? 'Pro Plan' : plan === 'agency' ? 'Agency' : 'Free Trial';
  const planColor  = plan === 'agency' ? '#a78bfa' : plan === 'pro' ? '#34d399' : '#F59E0B';
  const userPhoto  = user?.photoURL || (userData!.photo as string) || null;
  const showUpgradeCard = plan === 'free';
  const youtubeChannelUrl = channelHandle
    ? `https://www.youtube.com/@${channelHandle.replace('@', '')}`
    : `https://www.youtube.com`;

  const trendScanned  = (analyticsData?.trends?.scanned   as number) ?? null;
  const trendReplies  = (analyticsData?.trends?.replies   as number) ?? null;
  const trendHidden   = (analyticsData?.trends?.hidden    as number) ?? null;
  const trendResponse = (analyticsData?.trends?.response  as number) ?? null;
  const pendingTrend  = (analyticsData?.trends?.pending   as number) ?? null;

  const statCards = [
    { label: 'Comments Scanned', value: fmt(commentsScanned ?? (totalScanned > 0 ? totalScanned : undefined)), raw: commentsScanned ?? (totalScanned > 0 ? totalScanned : undefined), up: true,  color: '#a78bfa', pct: trendScanned,  icon: MessageSquare },
    { label: 'AI Replies Sent',  value: fmt(aiReplies ?? (totalReplies > 0 ? totalReplies : undefined)),       raw: aiReplies ?? (totalReplies > 0 ? totalReplies : undefined),       up: true,  color: '#F59E0B', pct: trendReplies,  icon: Bot           },
    { label: 'Hidden Toxic',     value: fmt(hiddenComments ?? (totalHidden > 0 ? totalHidden : undefined)),    raw: hiddenComments ?? (totalHidden > 0 ? totalHidden : undefined),    up: false, color: '#f87171', pct: trendHidden,   icon: EyeIcon       },
    { label: 'Avg. Response Time', value: fmtMs(avgResponseTime > 0 ? avgResponseTime : undefined),           raw: avgResponseTime > 0 ? avgResponseTime : undefined,                up: false, color: '#34d399', pct: trendResponse, icon: Activity      },
  ];

  const chartLabels = ['11 Jul', '12 Jul', '13 Jul', '14 Jul', '15 Jul', '17 Jul'];
  const chartData = [
    { label: 'Comments Scanned', color: '#a78bfa', values: weeklyScanned.length >= 6 ? weeklyScanned.slice(-6) : [0,0,0,0,0,0] },
    { label: 'AI Replies',       color: '#F59E0B', values: weeklyReplies.length >= 6 ? weeklyReplies.slice(-6) : [0,0,0,0,0,0] },
    { label: 'Hidden Toxic',     color: '#f87171', values: weeklyHidden.length  >= 6 ? weeklyHidden.slice(-6)  : [0,0,0,0,0,0] },
  ];

  const toxicKeywords = (analyticsData?.topKeywords as any[]) ?? [];

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
  const requestVolumeBars = (analyticsData?.requestVolume12h as number[]) ?? [];

  const heroBadges = youtubeConnected
    ? [
        { label: 'All systems operational', color: '#22c55e', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.16)', dot: true },
        { label: 'Protection active',        color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.16)', icon: Shield },
      ]
    : [
        { label: 'Offline — connect YouTube', color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.09)', dot: false },
      ];

  function LiveActivityContent() {
    return (
      <>
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#FAFAFA', fontSize: 13, fontWeight: 700 }}>Live Activity</span>
          {youtubeConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 7, padding: '3px 8px' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
              <span style={{ color: '#22c55e', fontSize: 9.5, fontWeight: 800 }}>LIVE</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '3px 8px' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9.5, fontWeight: 800 }}>OFFLINE</span>
            </div>
          )}
        </div>
        <div style={{ overflowY: 'auto', maxHeight: 340, padding: '0 14px' }}>
          {youtubeConnected && liveEvents.length > 0
            ? liveEvents.map((ev) => { const item = eventToLiveItem(ev); return <LiveItem key={ev.id} {...item} />; })
            : <EmptyState icon={Activity} message={youtubeConnected ? 'No activity yet. Events will appear in real time.' : 'Connect your YouTube channel to see live activity.'} />
          }
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/live-feed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            View Live Feed <ChevronRight size={12} />
          </Link>
        </div>
      </>
    );
  }

  const currentPath = '/dashboard';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',-apple-system,sans-serif;}
        html,body{background:#0a0a0f;width:100%;overflow-x:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:3px}

        .r-bg{min-height:100vh;background:#0a0a0f;position:relative;width:100%;overflow-x:hidden;}
        .r-bg::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background:radial-gradient(ellipse 55% 45% at -5% -5%,rgba(124,58,237,0.09) 0%,transparent 55%),
            radial-gradient(ellipse 45% 35% at 108% 108%,rgba(245,158,11,0.06) 0%,transparent 55%);}
        .r-bg::after{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px);
          background-size:44px 44px;}

        .r-sidebar{width:216px;min-width:216px;background:#0c0a0e;border-right:1px solid rgba(245,158,11,0.12);
          display:flex;flex-direction:column;position:fixed;height:100vh;left:0;top:0;z-index:40;overflow:hidden;}
        .r-sidebar::after{content:'';position:absolute;right:0;top:0;bottom:0;width:1px;
          background:linear-gradient(180deg,transparent,rgba(245,158,11,0.15) 30%,rgba(245,158,11,0.22) 50%,rgba(245,158,11,0.15) 70%,transparent);pointer-events:none;}
        .r-logo{padding:18px 14px 14px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .r-logo-mark{width:34px;height:34px;border-radius:10px;
          background:linear-gradient(135deg,#F59E0B 0%,#D97706 40%,#7C3AED 100%);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 14px rgba(124,58,237,0.38),inset 0 1px 0 rgba(255,255,255,0.14);}
        .r-nav{flex:1;padding:10px 7px;display:flex;flex-direction:column;gap:1px;overflow-y:auto;}
        .r-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:10px;
          font-size:12.5px;font-weight:500;text-decoration:none;color:rgba(255,255,255,0.36);
          transition:all 0.18s;border:1px solid transparent;position:relative;overflow:hidden;}
        .r-nav-item:hover{background:rgba(124,58,237,0.06);color:rgba(255,255,255,0.7);}
        .r-nav-item.active{background:linear-gradient(135deg,rgba(245,158,11,0.20) 0%,rgba(245,158,11,0.10) 50%,rgba(245,158,11,0.06) 100%);
         color:#FBBF24;border-color:rgba(245,158,11,0.25);font-weight:700;
         box-shadow:0 0 0 1px rgba(245,158,11,0.12),0 2px 20px rgba(245,158,11,0.10),inset 0 1px 0 rgba(245,158,11,0.18),inset 0 0 28px rgba(245,158,11,0.06);}
         .r-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
         width:3px;height:18px;border-radius:0 3px 3px 0;
         background:linear-gradient(180deg,#FBBF24,#F59E0B,#D97706);box-shadow:0 0 10px rgba(245,158,11,0.8),0 0 24px rgba(245,158,11,0.3);}
        .r-upgrade{margin:0 7px 7px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.14);border-radius:13px;padding:13px;}
        .r-sidebar-bottom{padding:7px 7px 18px;border-top:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:2px;}
        .r-btn-logout{display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:9px;font-size:12px;font-weight:500;
          color:rgba(255,255,255,0.28);background:none;border:none;cursor:pointer;width:100%;transition:all 0.18s;}
        .r-btn-logout:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);}
        .r-btn-upgrade{width:100%;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;font-weight:700;font-size:11.5px;
          padding:8px;border-radius:8px;border:none;cursor:pointer;transition:all 0.2s;text-align:center;text-decoration:none;display:block;}

        .r-main{margin-left:216px;min-height:100vh;display:flex;flex-direction:column;position:relative;z-index:1;width:calc(100% - 216px);}

        .r-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.92);backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.05);padding:0 22px;height:56px;
          display:flex;align-items:center;gap:10px;box-shadow:0 4px 24px rgba(0,0,0,0.25);}
        .r-search{flex:1;max-width:380px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:8px;padding:0 10px 0 32px;height:33px;color:#FAFAFA;font-size:12px;outline:none;transition:all 0.2s;}
        .r-search:focus{border-color:rgba(124,58,237,0.3);background:rgba(255,255,255,0.05);}
        .r-search::placeholder{color:rgba(255,255,255,0.16);}
        .r-icon-btn{width:33px;height:33px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.18s;position:relative;flex-shrink:0;}
        .r-icon-btn:hover{background:rgba(255,255,255,0.07);}
        .r-credits-btn{display:flex;align-items:center;gap:5px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.16);
          border-radius:8px;padding:0 11px;height:33px;color:#F59E0B;font-weight:700;font-size:11.5px;cursor:pointer;transition:all 0.18s;white-space:nowrap;}
        .r-credits-btn:hover{background:rgba(245,158,11,0.13);}
        .r-avatar-btn{display:flex;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:9px;padding:3px 9px 3px 3px;cursor:pointer;transition:all 0.18s;gap:6px;}
        .r-avatar-btn:hover{border-color:rgba(255,255,255,0.11);}

        .r-mobile-topbar{display:none;position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.96);
          backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.05);
          padding:0 12px;height:52px;align-items:center;gap:5px;box-shadow:0 2px 16px rgba(0,0,0,0.3);}

        .r-mobile-status-bar{display:none;background:rgba(14,13,22,0.95);border-bottom:1px solid rgba(255,255,255,0.04);
          padding:6px 12px;gap:6px;align-items:center;overflow-x:auto;scrollbar-width:none;}
        .r-mobile-status-bar::-webkit-scrollbar{display:none;}

        .r-content{padding:20px 22px 24px;flex:1;animation:fadeIn 0.3s ease;width:100%;box-sizing:border-box;}

        .r-layout{display:grid;grid-template-columns:1fr 280px;gap:14px;align-items:start;width:100%;}

        .r-hero{background:linear-gradient(135deg,rgba(14,13,22,0.99) 0%,rgba(18,12,36,0.99) 100%);
          border:1px solid rgba(124,58,237,0.13);border-radius:16px;padding:24px 28px;
          margin-bottom:13px;position:relative;overflow:hidden;}
        .r-hero::before{content:'';position:absolute;top:-50px;right:40px;width:280px;height:280px;
          background:radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 65%);pointer-events:none;}
        .r-hero-shield{position:absolute;right:24px;top:50%;transform:translateY(-50%);width:130px;height:130px;opacity:0.9;}

        .r-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:13px;}
        .r-stat{background:rgba(13,12,20,0.99);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px 18px;
          transition:all 0.2s;display:flex;flex-direction:column;position:relative;overflow:hidden;}
        .r-stat::before{content:'';position:absolute;inset:0;border-radius:14px;
          background:linear-gradient(135deg,rgba(255,255,255,0.012) 0%,transparent 60%);pointer-events:none;}
        .r-stat:hover{border-color:rgba(255,255,255,0.1);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.26);}
        .r-stat-label{color:rgba(255,255,255,0.42);font-size:11px;font-weight:500;}
        .r-stat-value{font-size:26px;font-weight:900;color:#FAFAFA;letter-spacing:-0.05em;font-variant-numeric:tabular-nums;line-height:1;margin:6px 0 2px;}
        .r-stat-zero{font-size:26px;font-weight:900;color:rgba(255,255,255,0.32);letter-spacing:-0.05em;font-variant-numeric:tabular-nums;line-height:1;margin:6px 0 2px;}
        .r-stat-pct-up{display:inline-flex;align-items:center;gap:2px;font-size:9.5px;font-weight:700;color:#34d399;
          background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.15);border-radius:5px;padding:1.5px 5px;}
        .r-stat-pct-down{display:inline-flex;align-items:center;gap:2px;font-size:9.5px;font-weight:700;color:#f87171;
          background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.15);border-radius:5px;padding:1.5px 5px;}
        .r-stat-vs{font-size:9.5px;color:rgba(255,255,255,0.2);margin-top:3px;}

        .r-card{background:rgba(13,12,20,0.99);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;}
        .r-card:hover{border-color:rgba(255,255,255,0.09);}
        .r-card-top{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 16px 11px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .r-card-title{color:#FAFAFA;font-size:13px;font-weight:700;}
        .r-card-sub{color:rgba(255,255,255,0.24);font-size:10.5px;margin-top:2px;}

        .r-btn-primary{background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-weight:700;font-size:12px;
          padding:8px 14px;border-radius:8px;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:5px;
          transition:all 0.18s;text-decoration:none;white-space:nowrap;box-shadow:0 2px 10px rgba(124,58,237,0.25);}
        .r-btn-primary:hover{box-shadow:0 4px 20px rgba(124,58,237,0.4);transform:translateY(-1px);}
        .r-btn-ghost{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);font-weight:600;font-size:12px;
          padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;gap:5px;transition:all 0.18s;text-decoration:none;white-space:nowrap;}
        .r-btn-ghost:hover{background:rgba(255,255,255,0.07);color:#FAFAFA;}

        .r-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;
          background:rgba(10,10,15,0.97);border-top:1px solid rgba(255,255,255,0.06);
          backdrop-filter:blur(24px);padding:8px 4px env(safe-area-inset-bottom,8px);}
        .r-bnav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;
          flex:1;padding:7px 2px 9px;text-decoration:none;color:rgba(255,255,255,0.32);
          border:none;background:none;cursor:pointer;transition:color 0.18s;-webkit-tap-highlight-color:transparent;gap:3px;}
        .r-bnav-item.active{color:#F59E0B;}
        .r-bnav-icon{width:44px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;transition:all 0.2s;}
        .r-bnav-item.active .r-bnav-icon{background:rgba(245,158,11,0.15);box-shadow:0 0 14px rgba(245,158,11,0.4);}
        .r-bnav-fab{width:44px;height:34px;border-radius:10px;background:none;
          display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:all 0.2s;}
        .r-bnav-fab-active{background:rgba(245,158,11,0.15);box-shadow:0 0 14px rgba(245,158,11,0.4);}

        .r-live-panel{background:rgba(13,12,20,0.99);border:1px solid rgba(255,255,255,0.07);border-radius:14px;
          display:flex;flex-direction:column;overflow:hidden;}
        .r-mobile-live{display:none;}

        .r-keyword-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);}

        .r-bottom-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}

        .r-pending-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:13px;}

        @media(min-width:768px) and (max-width:1023px){
          .r-bnav-icon{width:44px!important;height:34px!important;}
          .r-bnav-item span:last-child{font-size:14px!important;}
          .r-bottom-nav{padding:10px 4px env(safe-area-inset-bottom,10px)!important;}
        }

        @media(min-width:1024px){
          .r-bottom-nav{display:none!important;}
          .r-mobile-topbar{display:none!important;}
          .r-mobile-status-bar{display:none!important;}
          .r-layout{grid-template-columns:1fr 280px;width:100%;}
          .r-stats{grid-template-columns:repeat(4,1fr);}
          .r-bottom-grid{grid-template-columns:1fr 1fr 1fr;}
        }

        @media(min-width:768px) and (max-width:1023px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;padding-bottom:76px;}
          .r-bottom-nav{display:flex!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-mobile-status-bar{display:flex!important;}
          .r-content{padding:14px 16px 16px;width:100%!important;box-sizing:border-box!important;}
          .r-layout{display:flex!important;flex-direction:column!important;width:100%!important;gap:10px;}
          .r-layout > div{width:100%!important;min-width:0!important;box-sizing:border-box!important;}
          .r-stats{grid-template-columns:repeat(2,1fr);gap:10px;}
          .r-bottom-grid{display:flex!important;flex-direction:column!important;gap:10px!important;width:100%!important;}
          .r-bottom-grid > *{width:100%!important;min-width:0!important;box-sizing:border-box!important;}
          .r-bottom-grid-last{width:100%!important;min-width:0!important;box-sizing:border-box!important;}
          .r-pending-row{grid-template-columns:1fr 1fr;}
          .r-live-panel{display:none!important;}
          .r-mobile-live{display:flex!important;flex-direction:column;}
        }

        @media(max-width:767px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;max-width:100vw!important;overflow-x:hidden!important;padding-bottom:80px;}
          .r-bottom-nav{display:flex!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-mobile-status-bar{display:flex!important;}
          .r-bnav-icon svg{width:22px!important;height:22px!important;}
          .r-bnav-item span:last-child{font-size:14px!important;}
          .r-content{padding:10px 10px 16px;width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important;}
          .r-hero{padding:14px 14px 14px;margin-bottom:10px;}
          .r-hero-shield{display:none!important;}
          .r-hero h1{font-size:20px!important;}
          .r-layout{display:flex!important;flex-direction:column!important;width:100%!important;max-width:100%!important;gap:10px;box-sizing:border-box!important;}
          .r-layout > div{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}
          .r-stats{grid-template-columns:1fr 1fr!important;gap:8px;margin-bottom:10px;width:100%!important;}
          .r-stat{padding:12px 12px;}
          .r-stat-value,.r-stat-zero{font-size:22px!important;}
          .r-stat-label{font-size:10px;}
          .r-pending-row{grid-template-columns:1fr!important;gap:8px;margin-bottom:10px;width:100%!important;}
          .r-donut-wrap{flex-direction:column!important;align-items:center!important;gap:10px!important;}
          .r-donut-wrap > div:last-child{width:100%;}
          .r-bottom-grid{display:flex!important;flex-direction:column!important;gap:9px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;}
          .r-bottom-grid > *{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}
          .r-bottom-grid-last{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}
          .r-live-panel{display:none!important;}
          .r-mobile-live{display:flex!important;flex-direction:column;width:100%!important;}
          .r-channel-card-inner{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;}
          .r-channel-stats{flex-direction:row!important;gap:16px!important;width:100%;}
          .r-channel-open-btn{width:100%!important;justify-content:center!important;}
          .r-mob-protect-badge{display:none!important;}
          .r-credits-btn{padding:0 7px!important;font-size:10px!important;gap:3px!important;}
        }

        @media(max-width:379px){
          .r-stats{grid-template-columns:1fr 1fr!important;gap:6px;}
          .r-stat{padding:10px 10px;}
          .r-stat-value,.r-stat-zero{font-size:18px!important;}
          .r-content{padding:8px 8px 14px;}
          .r-mob-ai-badge{display:none!important;}
        }
      `}</style>

      <div className="r-bg" style={{ display: 'flex' }}>

        {/* SIDEBAR */}
    <aside className="r-sidebar">
    <div style={{ position: "absolute", top: "-60px", left: "-80px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,90,0,0.55) 0%, rgba(160,65,0,0.28) 35%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(18px)" }} />
    <div style={{ position: "absolute", top: "160px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(180,75,0,0.30) 0%, rgba(130,55,0,0.12) 40%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(22px)" }} />
   <div className="r-logo">

            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div className="r-logo-mark"><Shield size={16} color="white" strokeWidth={2.2} /></div>
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 14.5, letterSpacing: '-0.02em' }}>ModerateAI</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 500, marginTop: 1 }}>YouTube AI Moderator</div>
              </div>
            </div>
          </div>

          {youtubeConnected && channelName && (
            <div style={{ padding: '9px 11px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11, padding: '7px 9px' }}>
                {channelThumbnail
                  ? <img src={channelThumbnail} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{(channelName || 'C')[0].toUpperCase()}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelName}</div>
                  <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 9.5 }}>{channelHandle ? `@${channelHandle.replace('@', '')}` : 'Connected'}</div>
                </div>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.6)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              </div>
            </div>
          )}

          <nav className="r-nav">
            {SIDEBAR_NAV.map(item => {
              const isActive = currentPath === item.href;
              return (
                <Link key={item.href} href={item.href} className={`r-nav-item${isActive ? ' active' : ''}`}>
                  <item.icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {showUpgradeCard && (
            <div className="r-upgrade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Zap size={10} color="#a78bfa" />
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 11 }}>Upgrade to Pro</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 9 }}>
                {[' 25,000 comments scanned / month', 'Unlimited automation rules', 'Priority support', '1,900 AI actions / month'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.32)', fontSize: 10 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />{f}
                  </div>
                ))}
              </div>
              <Link href="/billing" className="r-btn-upgrade">Upgrade Now</Link>
            </div>
          )}

          <div className="r-sidebar-bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', marginBottom: 3 }}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="av" />
                : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{initials}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 700, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 9.5 }}>{user?.email?.slice(0, 22)}{(user?.email?.length || 0) > 22 ? '…' : ''}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="r-btn-logout">
              <LogOut size={12} strokeWidth={1.8} /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="r-main">

          {/* DESKTOP TOPBAR */}
          <header className="r-topbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search size={11} color="rgba(255,255,255,0.16)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="r-search" placeholder="Search comments, users, keywords…" />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '1.5px 4px', fontSize: 9, color: 'rgba(255,255,255,0.16)', fontWeight: 600 }}>⌘K</span>
            </div>

            {youtubeConnected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.13)', fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                AI Online
              </div>
            )}
            {youtubeConnected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.14)', fontSize: 10.5, fontWeight: 600, color: '#a78bfa', whiteSpace: 'nowrap' }}>
                <Shield size={9} strokeWidth={2} /> Protection Active
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button className="r-credits-btn">
              <CreditCard size={11} />
              {aiCredits.toLocaleString()} Credits
              <ChevronRight size={10} />
            </button>

            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button className="r-icon-btn" onClick={() => setNotifOpen(v => !v)}>
                <Bell size={12} color={notifOpen ? '#a78bfa' : 'rgba(255,255,255,0.4)'} strokeWidth={1.8} />
                {notifCount > 0 && (
  <span style={{ position: 'absolute', top: 6, right: 6, width: 13, height: 13, background: '#7C3AED', borderRadius: '50%', border: '1.5px solid #0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7.5, color: 'white', fontWeight: 800 }}>{notifCount > 9 ? '9+' : notifCount}</span>
)}
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60, width: 300, background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, boxShadow: '0 8px 36px rgba(0,0,0,0.55)', backdropFilter: 'blur(24px)', animation: 'fadeIn 0.16s ease', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12 }}>Notifications</span>
                      {notifCount > 0 && <span style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.22)', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 800, color: '#a78bfa'}}>{notifCount} NEW</span>}
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '20px 14px', color: 'rgba(255,255,255,0.35)', fontSize: 11.5, textAlign: 'center' }}>
                          No notifications yet
                        </div>
                      ) : notifications.map(n => (
                        <div key={n.id} style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: !n.read ? 'rgba(124,58,237,0.04)' : 'transparent',
                          display: 'flex', gap: 10, alignItems: 'flex-start',
                        }}>
                          <div style={{
                            width: 7, height: 7, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                            background: !n.read ? '#7C3AED' : 'transparent',
                            border: n.read ? '1px solid rgba(255,255,255,0.15)' : 'none',
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#FAFAFA', fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, lineHeight: 1.4 }}>{n.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <Link href="/notifications" onClick={() => setNotifOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#a78bfa', fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}>
                        View All Notifications <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button className="r-icon-btn"><Sun size={12} color="rgba(255,255,255,0.38)" strokeWidth={1.8} /></button>
            <button className="r-avatar-btn" onClick={() => router.push('/settings')}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 25, height: 25, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 9, flexShrink: 0 }}>{initials}</div>
              }
            </button>
          </header>

          {/* MOBILE TOPBAR */}
          <header className="r-mobile-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={12} color="white" strokeWidth={2.2} />
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em' }}>ModerateAI</span>
            </div>
            <div style={{ flex: 1 }} />
            {youtubeConnected && (
              <div className="r-mob-ai-badge" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 14, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.14)', fontSize: 9.5, fontWeight: 700, color: '#22c55e', flexShrink: 0, whiteSpace: 'nowrap' }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                AI Online
              </div>
            )}
            {youtubeConnected && (
              <div className="r-mob-protect-badge" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 14, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.14)', fontSize: 9.5, fontWeight: 700, color: '#a78bfa', flexShrink: 0, whiteSpace: 'nowrap' }}>
                <Shield size={8} strokeWidth={2.2} /> Protection
              </div>
            )}
            <button className="r-credits-btn" style={{ height: 28, flexShrink: 0 }}>
              <CreditCard size={9} />{aiCredits.toLocaleString()} <ChevronRight size={8} />
            </button>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button className="r-icon-btn" style={{ width: 28, height: 28 }} onClick={() => router.push('/notifications')}>
                <Bell size={11} color="rgba(255,255,255,0.4)" strokeWidth={1.8} />
                <span style={{ position: 'absolute', top: 4, right: 4, width: 11, height: 11, background: '#7C3AED', borderRadius: '50%', border: '1.5px solid #0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 6.5, color: 'white', fontWeight: 800 }}>3</span>
              </button>
            </div>
            <button className="r-avatar-btn" style={{ padding: '2px 6px 2px 2px', flexShrink: 0 }} onClick={() => router.push('/settings')}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 8 }}>{initials}</div>
              }
            </button>
          </header>

          {/* MOBILE STATUS BAR */}
          {youtubeConnected && (
            <div className="r-mobile-status-bar">
              {[
                { label: 'AI System Online', color: '#22c55e', bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.16)', dot: true },
                { label: 'Protection Active', color: '#a78bfa', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.16)', icon: Shield },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 14, padding: '3px 7px', fontSize: 9.5, fontWeight: 600, color: p.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {p.dot ? <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.color, animation: 'pulse 2s infinite' }} /> : p.icon && <p.icon size={8} strokeWidth={2.2} />}
                  {p.label}
                </div>
              ))}
            </div>
          )}

          {/* CONTENT */}
          <div className="r-content">

            {/* HERO */}
            <div className="r-hero">
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {heroBadges.map(p => (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 4, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 18, padding: '3px 9px', fontSize: 10, fontWeight: 600, color: p.color }}>
                    {'dot' in p && p.dot
                      ? <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.color, animation: 'pulse 2s infinite' }} />
                      : 'icon' in p && p.icon && <p.icon size={9} strokeWidth={2} />
                    }
                    {p.label}
                  </div>
                ))}
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 6 }}>
                Welcome back, <span style={{ background: 'linear-gradient(90deg,#a78bfa,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span> 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12.5 }}>
                Your AI moderator is actively protecting your YouTube channel 24/7.
              </p>
              <div className="r-hero-shield">
                <svg viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="shg1" cx="50%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35"/>
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.04"/>
                    </radialGradient>
                  </defs>
                  <ellipse cx="65" cy="65" rx="60" ry="60" fill="url(#shg1)" />
                  <path d="M65 16 L98 29 L98 63 C98 82 82 97 65 104 C48 97 32 82 32 63 L32 29 Z" fill="rgba(124,58,237,0.16)" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5"/>
                  <path d="M65 23 L93 35 L93 62 C93 78 79 91 65 98 C51 91 37 78 37 62 L37 35 Z" fill="rgba(124,58,237,0.1)" stroke="rgba(167,139,250,0.18)" strokeWidth="1"/>
                  <circle cx="65" cy="63" r="16" fill="rgba(220,38,38,0.18)" stroke="rgba(248,113,113,0.35)" strokeWidth="1.5"/>
                  <path d="M58 57.5 L58 68.5 L74 63 Z" fill="#f87171" opacity="0.9"/>
                  {[0,60,120,180,240,300].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 65 + 48 * Math.cos(rad), y = 65 + 48 * Math.sin(rad);
                    return <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(167,139,250,0.28)" />;
                  })}
                  <rect x="20" y="22" width="14" height="14" rx="4" fill="rgba(167,139,250,0.14)" stroke="rgba(167,139,250,0.28)" strokeWidth="1"/>
                  <rect x="96" y="22" width="14" height="14" rx="4" fill="rgba(245,158,11,0.14)" stroke="rgba(245,158,11,0.28)" strokeWidth="1"/>
                  <rect x="110" y="58" width="14" height="14" rx="4" fill="rgba(52,211,153,0.14)" stroke="rgba(52,211,153,0.28)" strokeWidth="1"/>
                </svg>
              </div>
            </div>

            {/* CHANNEL CARD */}
            {youtubeConnected ? (
              <div style={{ background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', marginBottom: 13, width: '100%', boxSizing: 'border-box' }}>
                <div className="r-channel-card-inner" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {channelThumbnail
                      ? <img src={channelThumbnail} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.25)' }} />
                      : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'white' }}>{(channelName || 'C')[0]}</div>
                    }
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #0a0a0f' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ color: '#FAFAFA', fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{channelName || 'My Channel'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(34,197,94,0.09)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>
                        <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#22c55e' }} />
                        <span style={{ color: '#22c55e', fontSize: 9, fontWeight: 800 }}>CONNECTED</span>
                      </div>
                    </div>
                    {channelHandle && (
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        @{channelHandle.replace('@', '')} · Connected on {userData?.created_at
                          ? (typeof userData.created_at === 'string'
                              ? new Date(userData.created_at)
                              : userData.created_at?.toDate?.()
                            )?.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                          : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                        }
                      </div>
                    )}
                  </div>
                  <div className="r-channel-stats" style={{ display: 'flex', gap: 18, flexShrink: 0 }}>
                    {[
                      { label: 'Subscribers', value: fmtCount(subscriberCount) },
                      { label: 'Videos',      value: fmtCount(videoCount)      },
                      { label: 'Views',       value: fmtCount(viewCount)       },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                        <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 10, marginTop: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer" className="r-btn-ghost r-channel-open-btn" style={{ fontSize: 11, padding: '6px 11px' }}>
                    <ExternalLink size={10} /> Open Channel
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 14, padding: '16px 14px', marginBottom: 13, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(248,113,113,0.09)', border: '1px solid rgba(248,113,113,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <YTIcon color="#f87171" size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ color: '#FAFAFA', fontSize: 13.5, fontWeight: 800, marginBottom: 3 }}>Connect your YouTube channel</h2>
                  <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11 }}>Grant OAuth access and ModerateAI starts protecting your community instantly.</p>
                </div>
                <button onClick={handleYouTubeConnect} className="r-btn-primary" style={{ flexShrink: 0, width: '100%', justifyContent: 'center' }}>
                  <YTIcon color="#fff" size={12} /> Connect YouTube
                </button>
              </div>
            )}

            {/* TWO-COLUMN LAYOUT */}
            <div className="r-layout">
              <div style={{ minWidth: 0, width: '100%' }}>

                {/* STAT CARDS */}
                <div className="r-stats">
                  {statCards.map((s) => {
                    const isNull  = s.value === null;
                    const hasReal = !isNull && s.raw !== null && s.raw !== undefined && (s.raw as number) > 0;
                    return (
                      <div key={s.label} className="r-stat">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 7, background: `${s.color}12`, border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <s.icon size={12} color={s.color} strokeWidth={2} />
                          </div>
                          {hasReal && s.pct !== null && (
                            s.up
                              ? <span className="r-stat-pct-up"><TrendingUp size={8} />↑ {s.pct}%</span>
                              : <span className="r-stat-pct-down"><TrendingDown size={8} />↓ {s.pct}%</span>
                          )}
                        </div>
                        <div className="r-stat-label">{s.label}</div>
                        {isNull
                          ? <div className="r-stat-zero">—</div>
                          : <div className={hasReal ? 'r-stat-value' : 'r-stat-zero'}>{s.value || '0'}</div>
                        }
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, gap: 6 }}>
                          {hasReal && <div className="r-stat-vs">vs yesterday</div>}
                          {hasReal && <Sparkline color={s.color} up={s.up} width={60} height={30} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PENDING + MODERATION ROW */}
                <div className="r-pending-row">
                  <div className="r-card">
                    <div className="r-card-top">
                      <div>
                        <div className="r-card-title">Pending Review</div>
                        <div className="r-card-sub">Needs manual action</div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={11} color="#F59E0B" strokeWidth={2} />
                      </div>
                    </div>
                    <div style={{ padding: '14px 16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: '#FAFAFA', fontSize: 36, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pendingReview}</span>
                        {pendingReview > 0 && pendingTrend !== null && <span className="r-stat-pct-up" style={{ marginBottom: 4 }}><TrendingUp size={8} />↑ {pendingTrend}%</span>}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10.5, marginBottom: 10 }}>vs yesterday</div>
                      <Sparkline color="#F59E0B" up={true} width={120} height={38} />
                    </div>
                  </div>

                  <div className="r-card">
                    <div className="r-card-top">
                      <div>
                        <div className="r-card-title">Moderation Accuracy</div>
                        <div className="r-card-sub">Rolling 24h</div>
                      </div>
                    </div>
                    <div className="r-donut-wrap" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 14px' }}>
                      <DonutChart pct={moderationAcc} label="Excellent" color="#34d399" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {totalActionsCalc !== null && totalActionsCalc > 0 ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
                              <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5, flex: 1 }}>Correct Actions</span>
                              <span style={{ color: '#FAFAFA', fontSize: 10.5, fontWeight: 700 }}>{correctActionsCalc?.toLocaleString()} ({moderationAcc.toFixed(1)}%)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                              <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10.5, flex: 1 }}>False Positives</span>
                              <span style={{ color: '#FAFAFA', fontSize: 10.5, fontWeight: 700 }}>{falsePositivesCalc?.toLocaleString()} ({(100 - moderationAcc).toFixed(1)}%)</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, lineHeight: 1.5 }}>Stats appear after first scan</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHART CARD */}
                <div className="r-card" style={{ marginBottom: 12 }}>
                  <div className="r-card-top">
                    <div>
                      <div className="r-card-title">Comments &amp; AI Replies Overview</div>
                      <div className="r-card-sub">Activity over time</div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {(['week', 'month'] as const).map(r => (
                        <button key={r} onClick={() => setChartRange(r)}
                          style={{ background: chartRange === r ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.04)', border: `1px solid ${chartRange === r ? 'rgba(124,58,237,0.32)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 6, padding: '3px 10px', color: chartRange === r ? '#a78bfa' : 'rgba(255,255,255,0.38)', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>
                          {r === 'week' ? 'This Week' : 'Month'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasChartData ? (
                    <>
                      <div style={{ display: 'flex', gap: 14, padding: '10px 16px 0', flexWrap: 'wrap' }}>
                        {chartData.map(d => (
                          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: d.color }} />
                            <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 10, fontWeight: 600 }}>{d.label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '10px 16px 14px' }}>
                        <MiniLineChart data={chartData} timeLabels={chartLabels} />
                      </div>
                    </>
                  ) : (
                    <EmptyState icon={BarChart2} message="No activity yet. Data will appear once comments are scanned." />
                  )}
                </div>

                {/* BOTTOM GRID */}
                <div className="r-bottom-grid">

                  {/* TOP TOXIC KEYWORDS */}
                  <div className="r-card">
                    <div className="r-card-top">
                      <div>
                        <div className="r-card-title">Top Toxic Keywords</div>
                        <div className="r-card-sub">Detected this week</div>
                      </div>
                      <button style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.24)', borderRadius: 6, padding: '3px 8px', color: '#a78bfa', fontSize: 9.5, fontWeight: 700, cursor: 'pointer' }}>This Week ▾</button>
                    </div>
                    <div style={{ padding: '8px 14px 12px' }}>
                      {toxicKeywords.length > 0 ? (
                        toxicKeywords.slice(0, 5).map((kw: any, i: number) => {
                          const max = toxicKeywords[0]?.count || 1;
                          return (
                            <div key={i} className="r-keyword-row">
                              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, width: 16, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                              <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kw.keyword}</span>
                              <div style={{ width: 70, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                                <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#a78bfa,#7C3AED)', width: `${(kw.count / max) * 100}%` }} />
                              </div>
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10.5, fontWeight: 700, flexShrink: 0, minWidth: 28, textAlign: 'right' }}>–{kw.count}</span>
                            </div>
                          );
                        })
                      ) : (
                        <EmptyState icon={Hash} message="No toxic keywords detected yet." />
                      )}
                      <Link href="/analytics" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#a78bfa', fontSize: 11, fontWeight: 600, textDecoration: 'none', marginTop: 10 }}>
                        View All Keywords <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>

                  {/* LIVE ACTIVITY — mobile inline */}
                  <div className="r-card r-mobile-live">
                    <LiveActivityContent />
                  </div>

                  {/* REAL-TIME RECENT AUTOMATIONS */}
                  {user && <RecentAutomations uid={user.uid} />}

                  {/* AI SYSTEM HEALTH + PLAN */}
                  <div className="r-bottom-grid-last" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="r-card">
                      <div className="r-card-top" style={{ alignItems: 'center' }}>
                        <div><div className="r-card-title">AI System Health</div></div>
                        <Link href="/analytics" style={{ color: '#a78bfa', fontSize: 10.5, fontWeight: 600, textDecoration: 'none' }}>View details</Link>
                      </div>
                      <div style={{ padding: '10px 14px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          { label: 'Uptime', value: analyticsData?.uptime != null ? `${analyticsData.uptime}%` : '—', sub: '30 days', color: '#34d399' },
                          { label: 'Response Time', value: fmtMs(avgResponseTime) || '—', sub: 'Average', color: '#a78bfa' },
                          { label: 'Requests Today', value: (analyticsData?.commentsToday as number ?? 0).toLocaleString() || '0', sub: analyticsData?.requestsTodayTrend ? `↑ ${analyticsData.requestsTodayTrend}%` : '—', color: '#FAFAFA' },
                          { label: 'Error Rate', value: `${(analyticsData?.falsePositiveRate as number ?? 0).toFixed(2)}%`, sub: analyticsData?.errorRateTrend ? `↓ ${analyticsData.errorRateTrend}%` : '—', color: '#F59E0B' },
                        ].map(s => (
                          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 9, padding: '9px 10px' }}>
                            <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 9.5, marginBottom: 3 }}>{s.label}</div>
                            <div style={{ color: s.color, fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                            <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9, marginTop: 2 }}>{s.sub}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '8px 14px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: 10 }}>Request volume (12h)</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.16)', borderRadius: 6, padding: '2px 7px' }}>
                            <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                            <span style={{ color: '#22c55e', fontSize: 8.5, fontWeight: 800 }}>HEALTHY</span>
                          </div>
                        </div>
                        {requestVolumeBars.length > 0
                          ? <MiniBarChart values={requestVolumeBars} color="#a78bfa" />
                          : <EmptyState icon={Activity} message="No request data yet." />
                        }
                      </div>
                    </div>

                    {/* PLAN USAGE */}
                    <div className="r-card">
                      <div className="r-card-top" style={{ alignItems: 'center' }}>
                        <div><div className="r-card-title">Plan Usage</div><div className="r-card-sub">Comments scanned this month</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${planColor}10`, border: `1px solid ${planColor}22`, borderRadius: 7, padding: '3px 8px' }}>
                          <Shield size={9} color={planColor} />
                          <span style={{ color: planColor, fontSize: 9, fontWeight: 800 }}>{planLabel.toUpperCase()}</span>
                        </div>
                      </div>
                      <div style={{ padding: '14px 14px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 10 }}>
                          <span style={{ color: '#FAFAFA', fontSize: 30, fontWeight: 900, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{commentsUsed.toLocaleString()}</span>
                          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 13 }}>/ {commentsLimit.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', marginBottom: 7 }}>
                          <div style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg,${planColor},#7C3AED)`, width: `${usagePct}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,0.26)', marginBottom: 12 }}>
                          <span>{usagePct.toFixed(1)}% used</span>
                          {plan === 'free' && trialActive && trialDaysLeft !== null && trialDaysLeft > 0
                            ? <span style={{ color: trialDaysLeft <= 3 ? '#f87171' : '#F59E0B', fontWeight: 700 }}>Trial: {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left</span>
                            : plan === 'free' && !trialActive
                            ? <span style={{ color: '#f87171', fontWeight: 700 }}>Trial Expired</span>
                            : <span>Resets {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          }
                        </div>
                        {plan === 'free'
                          ? <Link href="/billing" className="r-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}><Zap size={12} /> Upgrade to Pro</Link>
                          : <Link href="/billing" className="r-btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11.5 }}>Manage Plan</Link>
                        }
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* DESKTOP LIVE ACTIVITY PANEL */}
              <div className="r-live-panel" style={{ position: 'sticky', top: 72 }}>
                <LiveActivityContent />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
        {showBottomNav && <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(9,9,11,0.97)', borderTop: '1px solid rgba(255,255,255,0.055)', display: 'flex', backdropFilter: 'blur(28px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {[
            { href: '/dashboard',  label: 'Overview',   icon: <svg width={isDesktopSiteOn?28:20} height={isDesktopSiteOn?28:22} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
            { href: '/live-feed',  label: 'Live Feed',  icon: <svg width={isDesktopSiteOn?28:20} height={isDesktopSiteOn?28:22} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
            { href: '/automation', label: 'Automation', icon: <svg width={isDesktopSiteOn?28:20} height={isDesktopSiteOn?28:22} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            { href: '/alerts',     label: 'Alerts',     icon: <svg width={isDesktopSiteOn?28:20} height={isDesktopSiteOn?28:22} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
          ].map(link => {
            const active = currentPath === link.href;
            const iDSO = isDesktopSiteOn;
            return (
              <Link key={link.href} href={link.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: iDSO ? '14px 2px 18px' : '7px 2px 9px', textDecoration: 'none', color: active ? '#F59E0B' : 'rgba(255,255,255,0.35)', transition: 'color 0.18s', position: 'relative' }}>
                {active && <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 2, background: 'linear-gradient(90deg,#F59E0B,#EA580C)', borderRadius: '0 0 4px 4px' }} />}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: iDSO?64:44, height: iDSO?48:34, borderRadius: 10, background: active ? 'rgba(245,158,11,0.15)' : 'transparent', boxShadow: active ? '0 0 14px rgba(245,158,11,0.4)' : 'none', transition: 'all 0.2s' }}>{link.icon}</span>
                <span style={{ fontSize: iDSO?16:11, fontWeight: active ? 600 : 500, lineHeight: 1 }}>{link.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(v => !v)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: isDesktopSiteOn ? '14px 2px 18px' : '7px 2px 9px', background: 'none', border: 'none', cursor: 'pointer', color: moreOpen ? '#F59E0B' : 'rgba(255,255,255,0.35)', position: 'relative' }}>
            {moreOpen && <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 28, height: 2, background: 'linear-gradient(90deg,#F59E0B,#EA580C)', borderRadius: '0 0 4px 4px' }} />}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: isDesktopSiteOn?64:44, height: isDesktopSiteOn?48:34, borderRadius: 10, background: moreOpen ? 'rgba(245,158,11,0.15)' : 'transparent', boxShadow: moreOpen ? '0 0 14px rgba(245,158,11,0.4)' : 'none', transition: 'all 0.2s' }}>
              <svg width={isDesktopSiteOn?28:20} height={isDesktopSiteOn?28:22} fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
            </span>
            <span style={{ fontSize: isDesktopSiteOn?16:11, fontWeight: moreOpen ? 600 : 500, lineHeight: 1 }}>More</span>
          </button>
        </nav>}

        {/* MORE DRAWER */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'transparent' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, background: 'rgba(8,5,20,0.3)', borderTop: '1px solid rgba(124,58,237,0.25)', borderRadius: '10px 20px 0 0', padding: `0 0 env(safe-area-inset-bottom,${isDesktopSiteOn ? '20px' : '16px'})`, boxShadow: '0 -12px 60px rgba(124,58,237,0.2), 0 -8px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', animation: 'slideUp 0.22s ease' }}>
              <div style={{ width: isDesktopSiteOn ? 56 : 36, height: isDesktopSiteOn ? 6 : 4, background: 'rgba(255,255,255,0.12)', borderRadius: 4, margin: isDesktopSiteOn ? '18px auto 12px' : '8px auto 14px' }} />
              <div style={{ padding: isDesktopSiteOn ? '0 24px 16px' : '0 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: isDesktopSiteOn ? 12 : 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isDesktopSiteOn ? 18 : 10 }}>
                  {userPhoto
                    ? <img src={userPhoto} style={{ width: isDesktopSiteOn ? 60 : 38, height: isDesktopSiteOn ? 60 : 38, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                    : <div style={{ width: isDesktopSiteOn ? 60 : 38, height: isDesktopSiteOn ? 60 : 38, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: isDesktopSiteOn ? 22 : 13 }}>{initials}</div>
                  }
                  <div>
                    <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: isDesktopSiteOn ? 26 : 14 }}>{firstName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: isDesktopSiteOn ? 20 : 11 }}>{user?.email}</div>
                  </div>
                </div>
              </div>
              {[
                { emoji: '💳', label: 'Billing',    href: '/billing' },
                { emoji: '📊', label: 'Analytics',  href: '/analytics' },
                { emoji: '🛡️', label: 'Moderation', href: '/moderation' },
                { emoji: '⚙️', label: 'Settings',   href: '/settings' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: isDesktopSiteOn ? 20 : 14, padding: isDesktopSiteOn ? '20px 28px' : '14px 20px', textDecoration: 'none', color: '#ffffff', fontWeight: 500, fontSize: isDesktopSiteOn ? 24 : 15, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: isDesktopSiteOn ? 28 : 20 }}>{item.emoji}</span>
                  {item.label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
                <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: isDesktopSiteOn ? 20 : 14, padding: isDesktopSiteOn ? '20px 28px' : '14px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 500, fontSize: isDesktopSiteOn ? 24 : 15, width: '100%' }}>
                  <span style={{ fontSize: isDesktopSiteOn ? 28 : 20 }}>🚪</span>
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