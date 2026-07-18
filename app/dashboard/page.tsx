'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, MessageSquare, Eye, Settings, LogOut, CreditCard,
  BarChart2, Bell, Zap, Search, Activity, Wifi, Cpu,
  CheckCircle, LayoutDashboard, TrendingUp, TrendingDown,
  MoreHorizontal, Rss, Bot, Users, Video,
  Eye as EyeIcon, Sun, ChevronRight, AlertTriangle,
  ExternalLink, RefreshCw, Hash
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

/* ── SPARKLINE (only shown when value > 0) ── */
function Sparkline({ color, up = true, width = 64, height = 34 }: { color: string; up?: boolean; width?: number; height?: number }) {
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

/* ── DONUT CHART ── */
function DonutChart({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 60, circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      <svg width={160} height={160} viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="dnt-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={16} />
        <circle cx={80} cy={80} r={r} fill="none" stroke="url(#dnt-grad)" strokeWidth={16}
          strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)`, transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#FAFAFA', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{pct.toFixed(1)}%</span>
        <span style={{ color, fontSize: 10, fontWeight: 700, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
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
function fmt(n: number | null) { return n === null ? null : n >= 1000 ? n.toLocaleString() : String(n); }
function fmtMs(ms: number | null) { return ms === null ? null : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`; }

/* ── MONTHLY USAGE CARD ── */
function MonthlyUsageCard({ plan, commentsUsed, commentsLimit, trialDaysLeft }: {
  plan: string; commentsUsed: number; commentsLimit: number; trialDaysLeft: number | null;
}) {
  const usagePct = commentsLimit > 0 ? Math.min(100, (commentsUsed / commentsLimit) * 100) : 0;
  const remaining = commentsLimit - commentsUsed;
  const isFree = plan === 'free';
  const quotaDisplay = isFree ? '1,500' : commentsLimit.toLocaleString();
  const planColor = plan === 'agency' ? '#a78bfa' : plan === 'pro' ? '#34d399' : '#F59E0B';
  const planLabel = plan === 'pro' ? 'Pro Plan' : plan === 'agency' ? 'Agency' : 'Free Trial';

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

/* ── SIDEBAR NAV ── */
const SIDEBAR_NAV = [
  { label: 'Overview',    icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Live Feed',   icon: Rss,             href: '/live-feed'  },
  { label: 'Comments',    icon: MessageSquare,   href: '/comments'   },
  { label: 'Moderation',  icon: Shield,          href: '/moderation' },
  { label: 'Automation',  icon: Zap,             href: '/automation' },
  { label: 'Analytics',   icon: BarChart2,       href: '/analytics'  },
  { label: 'Alerts',      icon: Bell,            href: '/alerts'     },
  { label: 'Billing',     icon: CreditCard,      href: '/billing'    },
  { label: 'Settings',    icon: Settings,        href: '/settings'   },
];

const BOTTOM_NAV = [
  { label: 'Overview',   icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Live Feed',  icon: Rss,             href: '/live-feed'  },
  { label: 'Automation', icon: Zap,             href: '/automation' },
  { label: 'Alerts',     icon: Bell,            href: '/alerts'     },
];

/* ══════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
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

  /* ── FIRESTORE DATA (real only) ── */
  const plan             = (userData?.plan as string) || 'free';
  const commentsScanned  = (userData?.comments_scanned  as number) ?? null;
  const hiddenComments   = (userData?.comments_hidden   as number) ?? (userData?.hidden_count as number) ?? null;
  const aiReplies        = (userData?.ai_replies        as number) ?? null;
  const avgResponseMs    = (userData?.avg_response_ms   as number) ?? null;
  const moderationAcc    = (userData?.moderation_accuracy as number) ?? null;
  const commentsUsed     = (userData?.comments_used     as number) || 0;
  const commentsLimit    = plan === 'free' ? 1500 : plan === 'pro' ? 5000 : (userData?.comments_limit as number) || 200000;
  const youtubeConnected = (userData?.youtube_connected as boolean) || false;
  const channelName      = (userData?.youtube_channel_name as string) || null;
  const channelHandle    = (userData?.youtube_channel_handle as string) || null;
  const channelThumbnail = (userData?.youtube_channel_thumbnail as string) || null;
  const channelId        = (userData?.youtube_channel_id as string) || null;
  const subscriberCount  = (userData?.youtube_subscriber_count as string) || null;
  const videoCount       = (userData?.youtube_video_count as string) || null;
  const viewCount        = (userData?.youtube_view_count as string) || null;
  const automationEnabled = (userData?.automation_enabled as boolean) || false;
  const protectionScore  = (userData?.protection_score as number) ?? null;
  const spamDetected     = (userData?.spam_detected as number) ?? null;
  const liveChatMessages = (userData?.live_chat_messages as number) ?? null;

  const trialEndsAt   = userData?.trial_ends_at?.toDate?.() as Date | undefined;
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000)) : null;
  const lastScanAt    = userData?.last_scan_at?.toDate?.() as Date | undefined;
  const lastScanAgo   = lastScanAt ? (() => {
    const secs = Math.floor((Date.now() - lastScanAt.getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    return `${Math.floor(secs / 3600)}h ago`;
  })() : null;

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const initials  = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const planLabel = plan === 'free' ? 'Free Trial' : plan === 'pro' ? 'Pro' : plan === 'agency' ? 'Agency' : 'Free Trial';
  const userPhoto = user?.photoURL || (userData?.photo as string) || null;

  const statCards = [
    { label: 'Comments Scanned', fmtValue: fmt(commentsScanned), raw: commentsScanned, up: true,  color: '#a78bfa', icon: MessageSquare, pct: null },
    { label: 'AI Replies Sent',  fmtValue: fmt(aiReplies),       raw: aiReplies,       up: true,  color: '#F59E0B', icon: Bot,           pct: null },
    { label: 'Hidden Toxic',     fmtValue: fmt(hiddenComments),  raw: hiddenComments,  up: true,  color: '#f87171', icon: EyeIcon,       pct: null },
    { label: 'Spam Detected',    fmtValue: fmt(spamDetected),    raw: spamDetected,    up: true,  color: '#60a5fa', icon: AlertTriangle, pct: null },
    { label: 'Avg. Response',    fmtValue: fmtMs(avgResponseMs), raw: avgResponseMs,   up: false, color: '#34d399', icon: Activity,      pct: null },
  ];

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
        .r-avatar{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:10px;padding:4px 10px 4px 4px;cursor:pointer;transition:all 0.2s;}
        .r-avatar:hover{border-color:rgba(255,255,255,0.12);}

        .r-content{padding:24px;flex:1;animation:fadeIn 0.35s ease;}
        .r-layout{display:grid;grid-template-columns:1fr 272px;gap:16px;align-items:start;}

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

        .r-hero{background:linear-gradient(135deg,rgba(14,13,22,0.98) 0%,rgba(20,14,40,0.98) 100%);
          border:1px solid rgba(124,58,237,0.14);border-radius:16px;padding:28px 32px;
          margin-bottom:14px;position:relative;overflow:hidden;}
        .r-hero::before{content:'';position:absolute;top:-40px;right:60px;width:320px;height:320px;
          background:radial-gradient(ellipse,rgba(124,58,237,0.14) 0%,transparent 65%);pointer-events:none;}
        .r-hero-shield{position:absolute;right:32px;top:50%;transform:translateY(-50%);width:140px;height:140px;opacity:0.85;}

        .r-empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:32px 20px;gap:10px;text-align:center;}

        @media(max-width:1279px){
          .r-layout{grid-template-columns:1fr;}
          .r-live-panel{display:none!important;}
          .r-stats{grid-template-columns:repeat(3,1fr);}
        }
        @media(max-width:1023px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;padding-bottom:72px;}
          .r-bottom-nav{display:flex!important;}
          .r-stats{grid-template-columns:1fr 1fr;gap:8px;}
          .r-content{padding:12px;}
          .r-topbar{padding:0 12px;}
          .r-topbar-search,.r-topbar-status{display:none!important;}
          .r-stat-value,.r-stat-zero{font-size:24px;}
          .r-hero{padding:20px;}
          .r-hero-shield{display:none;}
        }
        @media(min-width:768px) and (max-width:1023px){
          .r-stats{grid-template-columns:repeat(3,1fr);}
          .r-content{padding:18px;}
          .r-topbar{padding:0 18px;}
        }
        @media(min-width:1024px){.r-bottom-nav{display:none!important;}}
      `}</style>

      <div className="r-bg" style={{ display: 'flex' }}>

        {/* SIDEBAR */}
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

          {/* Channel mini */}
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

        {/* MAIN */}
        <div className="r-main">
          <header className="r-topbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }} className="r-topbar-search">
              <Search size={12} color="rgba(255,255,255,0.18)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="r-search" placeholder="Search comments, users, keywords…" />
              <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 5px', fontSize: 9.5, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>⌘K</span>
            </div>
            <div className="r-status r-topbar-status"><div className="r-status-dot" />AI System Online</div>
            <div style={{ flex: 1 }} />

            {/* Notif */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button className="r-icon-btn" onClick={() => setNotifOpen(v => !v)}>
                <Bell size={13} color={notifOpen ? '#a78bfa' : 'rgba(255,255,255,0.45)'} strokeWidth={1.8} />
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 60, width: 290, background: 'rgba(14,13,20,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', animation: 'fadeIn 0.18s ease', overflow: 'hidden' }}>
                    <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12.5 }}>Notifications</span>
                    </div>
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <Bell size={22} color="rgba(255,255,255,0.12)" />
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 8 }}>No notifications yet</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="r-avatar" onClick={() => router.push('/settings')}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{initials}</div>
              }
              <div style={{ marginRight: 4 }}>
                <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 12, lineHeight: 1.25 }}>{firstName}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, lineHeight: 1.25 }}>{planLabel}</div>
              </div>
            </div>
          </header>

          <div className="r-content">
            {/* HERO */}
            <div className="r-hero">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#22c55e' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                  All systems operational
                </div>
                {youtubeConnected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>
                    <Shield size={10} strokeWidth={2} /> Protection active
                  </div>
                )}
                {lastScanAgo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                    <RefreshCw size={10} strokeWidth={2} /> Last scan: {lastScanAgo}
                  </div>
                )}
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 8 }}>
                Welcome back, <span style={{ background: 'linear-gradient(90deg,#a78bfa,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{firstName}</span> 👋
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13.5 }}>
                {youtubeConnected
                  ? 'Your AI moderator is actively protecting your YouTube channel 24/7.'
                  : 'Connect your YouTube channel to start AI moderation.'}
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
                  <circle cx="70" cy="68" r="18" fill="rgba(124,58,237,0.2)" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5"/>
                  <path d="M61 68 L66 74 L79 61" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* CHANNEL CARD */}
            {youtubeConnected && (
              <div style={{ background: 'rgba(14,13,22,0.98)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 22px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {(channelThumbnail || userPhoto)
                    ? <img src={channelThumbnail || userPhoto!} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.3)' }} />
                    : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'white' }}>{(channelName || 'C')[0]}</div>
                  }
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: '50%', background: '#22c55e', border: '2px solid #0a0a0f', boxShadow: '0 0 6px rgba(34,197,94,0.6)', animation: 'pulse 2s infinite' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 800 }}>{channelName || 'My Channel'}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '2px 7px' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ color: '#22c55e', fontSize: 9.5, fontWeight: 700 }}>CONNECTED</span>
                    </div>
                  </div>
                  {channelHandle && (
                    <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11.5 }}>
                      @{channelHandle.replace('@', '')} · Connected on {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 28, flexShrink: 0 }}>
                  {[
                    { label: 'Subscribers', value: fmtCount(subscriberCount) },
                    { label: 'Videos',      value: fmtCount(videoCount) },
                    { label: 'Views',       value: fmtCount(viewCount) },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#FAFAFA', fontSize: 18, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                      <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10.5, marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {channelId && (
                  <a href={`https://youtube.com/channel/${channelId}`} target="_blank" rel="noopener noreferrer" className="ref-btn-ghost" style={{ fontSize: 11.5, padding: '7px 12px', flexShrink: 0 }}>
                    <ExternalLink size={11} /> Open Channel
                  </a>
                )}
              </div>
            )}

            {/* NOT CONNECTED BANNER */}
            {!youtubeConnected && (
              <div style={{ background: 'rgba(14,13,22,0.98)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16, padding: '24px 28px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <YTIcon color="#f87171" size={26} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ color: '#FAFAFA', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Connect your YouTube channel</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12.5 }}>Grant OAuth access and ModerateAI starts protecting your community instantly.</p>
                </div>
                <button onClick={handleYouTubeConnect} className="ref-btn-primary" style={{ flexShrink: 0 }}>
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
                    const hasReal = !isNull && s.raw !== null && (s.raw as number) > 0;
                    return (
                      <div key={s.label} className="r-stat">
                        <div className="r-stat-header">
                          <div className="r-stat-icon" style={{ background: `${s.color}14`, border: `1px solid ${s.color}22` }}>
                            <s.icon size={13} color={s.color} strokeWidth={2} />
                          </div>
                        </div>
                        <div className="r-stat-label">{s.label}</div>
                        <div className="r-stat-bottom" style={{ marginTop: 8 }}>
                          {isNull
                            ? <div className="r-stat-empty">—</div>
                            : hasReal
                              ? <><div className="r-stat-value">{s.fmtValue}</div><Sparkline color={s.color} up={s.up} width={64} height={34} /></>
                              : <div className="r-stat-zero">0</div>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BOTTOM ROW */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                  {/* Moderation Accuracy */}
                  <div className="ref-card">
                    <div className="ref-card-top">
                      <div>
                        <div className="ref-card-title">Moderation Accuracy</div>
                        <div className="ref-card-sub">AI confidence · rolling 24h</div>
                      </div>
                    </div>
                    {moderationAcc !== null
                      ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', gap: 14 }}>
                          <DonutChart pct={moderationAcc} label={moderationAcc >= 95 ? 'Excellent' : moderationAcc >= 80 ? 'Good' : 'Fair'} color="#34d399" />
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                              { label: 'True Positive',  value: `${moderationAcc.toFixed(1)}%`,       color: '#34d399' },
                              { label: 'False Positive', value: `${(100 - moderationAcc).toFixed(1)}%`, color: '#f87171' },
                            ].map(s => (
                              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, flex: 1 }}>{s.label}</span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700 }}>{s.value}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10.5 }}>Rolling 24h · updated in real time</div>
                        </div>
                      ) : (
                        <div className="r-empty-state">
                          <Activity size={28} color="rgba(255,255,255,0.1)" />
                          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, lineHeight: 1.6, maxWidth: 200 }}>
                            No accuracy data yet. Start moderating to see AI confidence scores.
                          </p>
                        </div>
                      )
                    }
                  </div>

                  {/* System Health — real data only */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                          { label: 'Uptime',         value: protectionScore !== null ? `${protectionScore}%` : '100%',      color: '#34d399' },
                          { label: 'Response Time',  value: fmtMs(avgResponseMs) || '0ms',                                  color: '#a78bfa' },
                          { label: 'Automation',     value: automationEnabled ? 'Active' : 'Inactive',                      color: automationEnabled ? '#34d399' : 'rgba(255,255,255,0.3)' },
                          { label: 'Spam Caught',    value: spamDetected !== null ? String(spamDetected) : '0',             color: '#F59E0B' },
                        ].map(s => (
                          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ color: s.color, fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <MonthlyUsageCard plan={plan} commentsUsed={commentsUsed} commentsLimit={commentsLimit} trialDaysLeft={trialDaysLeft} />
                  </div>
                </div>
              </div>

              {/* LIVE ACTIVITY PANEL — empty state when no real data */}
              <div className="r-live-panel ref-card" style={{ position: 'sticky', top: 74 }}>
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#FAFAFA', fontSize: 13.5, fontWeight: 700 }}>Live Activity</span>
                  <div className="ref-badge ref-badge-live">
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                    Live
                  </div>
                </div>
                <div style={{ padding: '0 14px', flex: 1 }}>
                  {/* Empty state — bot not active yet */}
                  <div className="r-empty-state" style={{ padding: '40px 16px' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={22} color="rgba(167,139,250,0.4)" />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, lineHeight: 1.65, maxWidth: 200 }}>
                      No live activity yet. Activity will appear here once the bot starts moderating.
                    </p>
                    <Link href="/live-feed" className="ref-btn-ghost" style={{ fontSize: 11.5, padding: '7px 14px', marginTop: 4 }}>
                      Go to Live Feed <ChevronRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV */}
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