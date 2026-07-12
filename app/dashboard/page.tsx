'use client';
import { useState, useEffect } from 'react';
import {
  Shield, MessageSquare, Eye, Settings, LogOut,
  Home, BarChart3, Bell, Zap, Search,
  Layers, Radio, Activity, Wifi, Cpu,
  TrendingUp, TrendingDown, CheckCircle, Target
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

/* ── MINI SPARKLINE ── */
function Sparkline({ color, up = true }: { color: string; up?: boolean }) {
  const points = up
    ? [28, 22, 32, 24, 36, 28, 42, 34, 48, 38, 56, 44, 62]
    : [62, 58, 52, 60, 48, 54, 44, 50, 40, 46, 38, 42, 36];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 36; const w = 80;
  const pts = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${color.replace('#', '')})`} />
    </svg>
  );
}

/* ── SYSTEM HEALTH ROW ── */
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
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{sub}</div>
      </div>
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor }} />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600 }}>{value}</span>
        </div>
      )}
    </div>
  );
}

/* ── MODERATION ACCURACY CARD ── */
function AccuracyCard({ accuracy }: { accuracy: number | null }) {
  const pct = accuracy ?? 0;
  // Gauge ring math
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  const color = pct >= 90 ? '#34d399' : pct >= 70 ? '#F59E0B' : '#f87171';
  const label = pct >= 90 ? 'Excellent' : pct >= 70 ? 'Good' : 'Needs review';

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

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Gauge */}
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
          {/* Fill */}
          <circle
            cx={70} cy={70} r={r} fill="none"
            stroke={color}
            strokeWidth={10}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        {/* Center label */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#FAFAFA', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{pct}<span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>%</span></span>
          <span style={{ color, fontSize: 11, fontWeight: 700, marginTop: 2 }}>{label}</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'True Positive', value: `${pct}%`, color: '#34d399' },
          { label: 'False Positive', value: `${(100 - pct).toFixed(1)}%`, color: '#f87171' },
        ].map(s => (
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

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) setUserData(snap.data());
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };
  const handleYouTubeConnect = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth?uid=${user?.uid}`;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#08080A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  /* ── REAL DATA FROM FIRESTORE ── */
  const plan = (userData?.plan as string) || 'free';
  const commentsScanned   = (userData?.comments_scanned   as number) ?? (userData?.comments_used as number) ?? null;
  const hiddenComments    = (userData?.hidden_comments     as number) ?? null;
  const aiReplies         = (userData?.ai_replies          as number) ?? null;
  const avgResponseMs     = (userData?.avg_response_ms     as number) ?? null;
  const moderationAcc     = (userData?.moderation_accuracy as number) ?? null;
  const commentsUsed      = (userData?.comments_used       as number) || 0;
  const commentsLimit     = (userData?.comments_limit      as number) || 1500;
  const youtubeConnected  = (userData?.youtube_connected   as boolean) || false;
  const usagePercent      = Math.min(100, (commentsUsed / commentsLimit) * 100);
  const firstName         = user?.displayName?.split(' ')[0] || 'User';
  const initials          = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const planLabel         = plan === 'free' ? 'Free Trial' : plan === 'pro' ? 'Pro' : plan === 'agency' ? 'Agency' : 'Free Trial';

  /* Format helpers */
  const fmt = (n: number | null) => n === null ? '—' : n >= 1000 ? n.toLocaleString() : String(n);
  const fmtMs = (ms: number | null) => ms === null ? '—' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;

  const navItems = [
    { icon: Home,     label: 'Overview',    href: '/dashboard',   active: true  },
    { icon: Radio,    label: 'Live Feed',   href: '/live-feed',   active: false },
    { icon: BarChart3,label: 'Analytics',   href: '/analytics',   active: false },
    { icon: Zap,      label: 'Automations', href: '/automation',  active: false },
    { icon: Bell,     label: 'Alerts',      href: '/alerts',      active: false },
    { icon: Layers,   label: 'Channels',    href: '/channels',    active: false },
    { icon: Settings, label: 'Settings',    href: '/settings',    active: false },
  ];

  /* Stat cards — null means no data yet, shows "—" */
  const statCards = [
    { label: 'Comments Scanned', value: fmt(commentsScanned), trend: null, up: true,  color: '#F59E0B', icon: MessageSquare },
    { label: 'Hidden Comments',  value: fmt(hiddenComments),  trend: null, up: true,  color: '#f87171', icon: Eye          },
    { label: 'AI Replies',       value: fmt(aiReplies),       trend: null, up: true,  color: '#a78bfa', icon: MessageSquare},
    { label: 'Avg Response',     value: fmtMs(avgResponseMs), trend: null, up: false, color: '#34d399', icon: Activity     },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; }
        html, body { background: #08080A; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #08080A; }
        ::-webkit-scrollbar-thumb { background: #1E1E22; border-radius: 4px; }

        /* ── SIDEBAR ── */
        .db-sidebar {
          width: 224px; min-width: 224px;
          background: #0C0C0F;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          position: fixed; height: 100vh; left: 0; top: 0;
          z-index: 40;
          box-shadow: inset -1px 0 0 rgba(255,255,255,0.04), 4px 0 32px rgba(245,158,11,0.06);
        }
        .db-sidebar::before {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 2px; border-radius: 2px;
          background: linear-gradient(180deg, transparent, rgba(245,158,11,0.5), rgba(245,158,11,0.8), rgba(245,158,11,0.5), transparent);
          box-shadow: 0 0 12px rgba(245,158,11,0.4), 0 0 28px rgba(245,158,11,0.15);
        }

        .db-logo { padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .db-logo-inner { display: flex; align-items: center; gap: 10px; }
        .db-logo-mark { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #F59E0B, #7C3AED); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-logo-text { color: #FAFAFA; font-weight: 800; font-size: 15px; letter-spacing: -0.02em; }

        .db-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; }
        .db-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 9px;
          font-size: 13.5px; font-weight: 500;
          text-decoration: none; color: rgba(255,255,255,0.42);
          transition: all 0.18s; border: 1px solid transparent;
          position: relative;
        }
        .db-nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); }
        .db-nav-item.active {
          background: rgba(245,158,11,0.09);
          color: #F59E0B;
          border-color: rgba(245,158,11,0.15);
        }
        .db-nav-item.active::before {
          content: '';
          position: absolute; left: -8px; top: 50%; transform: translateY(-50%);
          width: 3px; height: 20px; border-radius: 0 2px 2px 0;
          background: #F59E0B;
          box-shadow: 0 0 8px rgba(245,158,11,0.6);
        }
        .db-nav-live { display: inline-flex; align-items: center; gap: 4px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.2); border-radius: 10px; padding: 2px 6px; font-size: 9px; font-weight: 700; color: #F59E0B; margin-left: auto; letter-spacing: 0.04em; }
        .db-nav-live-dot { width: 4px; height: 4px; border-radius: 50%; background: #F59E0B; animation: pulse 2s infinite; }

        .db-upgrade {
          margin: 0 8px 8px;
          background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.16);
          border-radius: 12px; padding: 14px;
        }

        .db-sidebar-bottom { padding: 8px 8px 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 6px; }

        /* ── MAIN ── */
        .db-main { margin-left: 224px; min-height: 100vh; display: flex; flex-direction: column; }

        /* ── TOPBAR ── */
        .db-topbar {
          position: sticky; top: 0; z-index: 30;
          background: rgba(8,8,10,0.85); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 0 28px; height: 60px;
          display: flex; align-items: center; gap: 16px;
        }
        .db-search {
          flex: 1; max-width: 460px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 0 14px 0 36px; height: 36px;
          color: #FAFAFA; font-size: 13px; outline: none;
          transition: all 0.2s;
        }
        .db-search:focus { border-color: rgba(245,158,11,0.35); background: rgba(255,255,255,0.06); }
        .db-search::placeholder { color: rgba(255,255,255,0.25); }
        .db-status-pill { display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.16); font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); white-space: nowrap; }
        .db-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; }
        .db-icon-btn { width: 36px; height: 36px; border-radius: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; position: relative; }
        .db-icon-btn:hover { background: rgba(255,255,255,0.07); }
        .db-yt-btn { display: flex; align-items: center; gap: 8px; background: #F59E0B; color: #08080A; font-weight: 700; font-size: 13px; padding: 0 16px; height: 36px; border-radius: 9px; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .db-yt-btn:hover { background: #FBBF24; box-shadow: 0 0 20px rgba(245,158,11,0.35); }
        .db-avatar { display: flex; align-items: center; gap: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 4px 10px 4px 4px; cursor: pointer; transition: all 0.2s; }
        .db-avatar:hover { border-color: rgba(255,255,255,0.12); }

        /* ── CONTENT ── */
        .db-content { padding: 28px; flex: 1; animation: fadeIn 0.4s ease; }

        .db-page-title { font-size: 28px; font-weight: 900; color: #FAFAFA; letter-spacing: -0.03em; margin-bottom: 4px; }
        .db-page-sub { color: rgba(255,255,255,0.38); font-size: 13.5px; }

        /* ── STAT CARDS ── */
        .db-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
        .db-stat {
          background: #0F0F13; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px;
          transition: border-color 0.2s;
          display: flex; flex-direction: column; gap: 12px;
        }
        .db-stat:hover { border-color: rgba(255,255,255,0.10); }
        .db-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .db-stat-label { color: rgba(255,255,255,0.42); font-size: 12.5px; font-weight: 500; }
        .db-stat-value { font-size: 30px; font-weight: 900; color: #FAFAFA; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1; }
        .db-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; }
        .db-stat-empty { font-size: 30px; font-weight: 900; color: rgba(255,255,255,0.18); letter-spacing: -0.04em; line-height: 1; }

        /* ── BOTTOM GRID ── */
        .db-bottom { display: grid; grid-template-columns: 1fr 1fr 1.1fr; gap: 14px; }

        .db-card { background: #0F0F13; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; }
        .db-card-header { padding: 18px 20px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .db-card-title { color: #FAFAFA; font-size: 14px; font-weight: 700; letter-spacing: -0.015em; }
        .db-card-sub { color: rgba(255,255,255,0.35); font-size: 11.5px; margin-top: 2px; }
        .db-card-body { padding: 18px 20px; }

        /* ── USAGE ── */
        .db-usage-big { font-size: 32px; font-weight: 900; color: #FAFAFA; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1; }
        .db-usage-of { color: rgba(255,255,255,0.3); font-size: 14px; font-weight: 500; }
        .db-usage-bar { height: 7px; background: rgba(255,255,255,0.07); border-radius: 8px; overflow: hidden; margin: 10px 0 6px; }
        .db-usage-fill { height: 100%; border-radius: 8px; background: linear-gradient(90deg, #F59E0B, #7C3AED); transition: width 0.6s ease; }
        .db-usage-row { display: flex; justify-content: space-between; font-size: 11.5px; color: rgba(255,255,255,0.35); margin-bottom: 16px; }
        .db-plan-badge { display: inline-flex; align-items: center; gap: 5px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 4px 10px; font-size: 11px; font-weight: 700; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px; }

        /* ── SYSTEM HEALTH ── */
        .db-health-badge { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: #34d399; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 6px; padding: 3px 8px; }

        /* ── BUTTONS ── */
        .db-btn-primary { background: #F59E0B; color: #08080A; font-weight: 700; font-size: 13px; padding: 10px 18px; border-radius: 9px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; text-decoration: none; white-space: nowrap; }
        .db-btn-primary:hover { background: #FBBF24; box-shadow: 0 0 22px rgba(245,158,11,0.3); }
        .db-btn-upgrade { width: 100%; background: linear-gradient(135deg, #F59E0B, #FBBF24); color: #08080A; font-weight: 700; font-size: 12.5px; padding: 9px; border-radius: 9px; border: none; cursor: pointer; transition: all 0.2s; text-align: center; text-decoration: none; display: block; }
        .db-btn-upgrade:hover { opacity: 0.9; transform: translateY(-1px); }
        .db-btn-logout { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: 9px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.35); background: none; border: none; cursor: pointer; width: 100%; transition: all 0.2s; }
        .db-btn-logout:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.65); }

        /* ── BOTTOM NAV (mobile only) ── */
        .db-bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: rgba(8,8,10,0.96); border-top: 1px solid rgba(255,255,255,0.06); backdrop-filter: blur(20px); padding: 10px 0 env(safe-area-inset-bottom, 10px); }
        .db-bnav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 6px 4px; text-decoration: none; color: rgba(255,255,255,0.35); border: none; background: none; cursor: pointer; transition: color 0.18s; }
        .db-bnav-item.active { color: #F59E0B; }
        .db-bnav-item:hover { color: rgba(255,255,255,0.7); }
        /* active icon gets subtle amber glow bg pill */
        .db-bnav-item.active .db-bnav-icon { background: rgba(245,158,11,0.12); border-radius: 10px; }
        .db-bnav-icon { width: 40px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: background 0.18s; }
        /* hide labels on mobile — icons only */
        .db-bnav-label { display: none; }

        /* ── RESPONSIVE ── */
        /* Phone: ≤ 767px — bottom nav, no sidebar */
        @media (max-width: 767px) {
          .db-sidebar { display: none; }
          .db-main { margin-left: 0; padding-bottom: 68px; }
          .db-bottom-nav { display: flex; }
          .db-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
          .db-bottom { grid-template-columns: 1fr; }
          .db-content { padding: 14px; }
          .db-topbar { padding: 0 14px; }
          .db-topbar-search { display: none !important; }
          .db-topbar-status { display: none !important; }
        }
        /* Tablet: 768px–1023px — sidebar visible, no bottom nav */
        @media (min-width: 768px) and (max-width: 1023px) {
          .db-bottom-nav { display: none; }
          .db-stats { grid-template-columns: repeat(2, 1fr); }
          .db-bottom { grid-template-columns: 1fr 1fr; }
          .db-content { padding: 20px; }
          .db-topbar { padding: 0 20px; }
        }
        /* Desktop/Laptop: ≥ 1024px — full sidebar, 4-col stats, 3-col bottom */
        @media (min-width: 1024px) {
          .db-bottom-nav { display: none; }
        }
      `}</style>

      <div style={{ display: 'flex', background: '#08080A', minHeight: '100vh' }}>

        {/* ── SIDEBAR ── */}
        <aside className="db-sidebar">
          {/* Logo — no badge */}
          <div className="db-logo">
            <div className="db-logo-inner">
              <div className="db-logo-mark"><Shield size={18} color="white" /></div>
              <div>
                <div className="db-logo-text">ModerateAI</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="db-nav">
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={`db-nav-item${item.active ? ' active' : ''}`}>
                <item.icon size={15} />
                {item.label}
                {item.active && (
                  <span className="db-nav-live">
                    <span className="db-nav-live-dot" /> live
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Upgrade — free plan only */}
          {plan === 'free' && (
            <div className="db-upgrade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Zap size={12} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 12 }}>Upgrade to Pro</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.55, marginBottom: 10 }}>
                Unlock unlimited hidden comments and Telegram alerts.
              </p>
              <Link href="/billing" className="db-btn-upgrade">Upgrade — ₹349/mo</Link>
            </div>
          )}

          {/* Bottom */}
          <div className="db-sidebar-bottom">
            <button onClick={handleLogout} className="db-btn-logout">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="db-main">

          {/* TOPBAR */}
          <header className="db-topbar">
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, maxWidth: 460 }} className="db-topbar-search">
              <Search size={13} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input className="db-search" placeholder="Search comments, videos, users…" />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>⌘K</span>
            </div>

            {/* Status */}
            <div className="db-status-pill db-topbar-status">
              <div className="db-status-dot" />
              All systems operational
            </div>

            <div style={{ flex: 1 }} />

            {/* Connect YouTube — only if not connected */}
            {!youtubeConnected && (
              <button onClick={handleYouTubeConnect} className="db-yt-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Connect YouTube
              </button>
            )}

            {/* Bell */}
            <button className="db-icon-btn">
              <Bell size={15} color="rgba(255,255,255,0.55)" />
              <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, background: '#F59E0B', borderRadius: '50%', border: '1.5px solid #08080A' }} />
            </button>

            {/* Avatar */}
            <div className="db-avatar" onClick={() => router.push('/settings')} style={{ cursor: 'pointer' }}>
              {user?.photoURL
                ? <img src={user.photoURL} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11 }}>{initials}</div>
              }
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 12.5, lineHeight: 1.2 }}>{firstName}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10.5, lineHeight: 1.2 }}>{planLabel} plan</div>
              </div>
              <span style={{ background: plan === 'free' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: plan === 'free' ? '#F59E0B' : '#34d399', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.04em', marginLeft: 2 }}>
                {plan === 'free' ? 'FREE' : plan.toUpperCase()}
              </span>
            </div>
          </header>

          {/* CONTENT */}
          <div className="db-content">

            {/* Page heading — clean, no badges/subtitle */}
            <div style={{ marginBottom: 24 }}>
              <h1 className="db-page-title">Overview</h1>
            </div>

            {/* STAT CARDS — real Firebase data */}
            <div className="db-stats" style={{ marginBottom: 20 }}>
              {statCards.map((s) => {
                const hasData = s.value !== '—';
                return (
                  <div key={s.label} className="db-stat">
                    <div className="db-stat-top">
                      <span className="db-stat-label">{s.label}</span>
                      {hasData && (
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${s.color}18`, border: `1px solid ${s.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <s.icon size={13} color={s.color} />
                        </div>
                      )}
                    </div>
                    <div className="db-stat-bottom">
                      {hasData ? (
                        <>
                          <div className="db-stat-value">{s.value}</div>
                          <Sparkline color={s.color} up={s.up} />
                        </>
                      ) : (
                        <div className="db-stat-empty">—</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM GRID */}
            <div className="db-bottom">

              {/* Monthly Usage */}
              <div className="db-card">
                <div className="db-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div className="db-card-title">Monthly Usage</div>
                    <div className="db-card-sub">Comment scan quota</div>
                  </div>
                  <div className="db-plan-badge">
                    <Zap size={9} /> {planLabel}
                  </div>
                </div>
                <div className="db-card-body">
                  <div style={{ marginBottom: 14 }}>
                    <span className="db-usage-big">{commentsUsed.toLocaleString()}</span>
                    <span className="db-usage-of"> / {commentsLimit.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                    <span>Used</span>
                    <span>Quota</span>
                  </div>
                  <div className="db-usage-bar">
                    <div className="db-usage-fill" style={{ width: `${usagePercent}%` }} />
                  </div>
                  <div className="db-usage-row">
                    <span>{usagePercent.toFixed(0)}% used</span>
                    <span>{(commentsLimit - commentsUsed).toLocaleString()} remaining</span>
                  </div>
                  {plan === 'free' && (
                    <Link href="/billing" className="db-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                      <Zap size={13} /> Upgrade plan
                    </Link>
                  )}
                </div>
              </div>

              {/* Moderation Accuracy */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title">Moderation Accuracy</div>
                  <div className="db-card-sub">AI confidence · rolling 24h</div>
                </div>
                <AccuracyCard accuracy={moderationAcc} />
              </div>

              {/* System Health */}
              <div className="db-card">
                <div className="db-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="db-card-title">System Health</div>
                    <div className="db-card-sub">Live infra status</div>
                  </div>
                  <div className="db-health-badge">
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                    Healthy
                  </div>
                </div>
                <div className="db-card-body" style={{ paddingTop: 6 }}>
                  <HealthRow icon={Wifi} label="API Status" sub="Operational" value="38ms" color="#34d399" dot="green" />
                  <HealthRow icon={Zap} label="Webhook Delivery" sub="100% · 2m" value="Live" color="#60a5fa" dot="green" />
                  <HealthRow icon={() => (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f87171">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  )} label="Channel" sub="@moderateai · demo" color="#f87171" dot="amber" />
                  <HealthRow icon={Cpu} label="AI Model" sub="gpt-mod-v4" value="p95 210ms" color="#a78bfa" dot="green" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM NAV — phone only, icons only */}
        <nav className="db-bottom-nav">
          {navItems.slice(0, 5).map(item => (
            <Link key={item.href} href={item.href} className={`db-bnav-item${item.active ? ' active' : ''}`} title={item.label}>
              <span className="db-bnav-icon">
                <item.icon size={20} />
              </span>
              <span className="db-bnav-label">{item.label}</span>
            </Link>
          ))}
          <button className="db-bnav-item" onClick={handleLogout} title="Logout">
            <span className="db-bnav-icon">
              <LogOut size={20} />
            </span>
            <span className="db-bnav-label">Logout</span>
          </button>
        </nav>

      </div>
    </>
  );
}