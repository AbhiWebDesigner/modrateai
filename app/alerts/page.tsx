'use client';
import { useState, useEffect } from 'react';
import {
  Bell, Send, LayoutDashboard, BarChart2, Zap, Settings,
MoreHorizontal, CreditCard, Layers, LogOut, Rss, Shield, MessageSquare} 
from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

const BOTTOM_NAV = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Overview'   },
  { href: '/live-feed',  icon: Rss,             label: 'Live Feed'  },
  { href: '/automation', icon: Zap,             label: 'Automation' },
  { href: '/alerts',     icon: Bell,            label: 'Alerts'     },
];

const SIDEBAR_NAV = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Overview'   },
  { href: '/analytics',  icon: BarChart2,       label: 'Analytics'  },
  { href: '/automation', icon: Zap,             label: 'Automation' },
  { href: '/alerts',     icon: Bell,            label: 'Alerts'     },
];

const MORE_ITEMS = [

  { href: '/billing',         icon: CreditCard, label: 'Billing',          color: '#F59E0B' },
  { href: '/channels',        icon: Layers,     label: 'Channels',         color: '#60a5fa' },
  { href: '/analytics',       icon: BarChart2,  label: 'Analytics',        color: '#a78bfa' },
  { href: '/human-ai-replies',icon: MessageSquare, label: 'Human-AI Replies', color: '#34d399' },
  { href: '/notifications',   icon: Bell,       label: 'Notifications',    color: '#f87171' },
  { href: '/settings',        icon: Settings,   label: 'Settings',         color: '#94a3b8' },
];

const NOTIFICATION_EVENTS = [
  { id: 'toxic_hidden',    label: 'Toxic comment hidden',     desc: 'Every time a comment is auto-hidden',    default: false },
  { id: 'auto_reply',      label: 'Auto-reply sent',          desc: 'When ModerateAI replies on your behalf', default: false },
  { id: 'user_timeout',    label: 'User timeout / ban',       desc: 'When a user hits a timeout tier',        default: false },
  { id: 'repeat_offender', label: 'Repeat offender detected', desc: '10+ toxic messages from same user',      default: true  },
  { id: 'daily_summary',   label: 'Daily summary',            desc: 'Once-a-day overview at 9 AM IST',        default: false },
  { id: 'weekly_report',   label: 'Weekly analytics report',  desc: 'Every Monday with trends and insights',  default: true  },
];

export default function AlertsPage() {
  const router   = useRouter();
  const pathname = usePathname();

  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [saved,             setSaved]             = useState(false);
  const [moreOpen,          setMoreOpen]          = useState(false);
  const [user,              setUser]              = useState<any>(null);
  const [userEmail,         setUserEmail]         = useState('');
  const [userPlan,          setUserPlan]          = useState('free');
  const [emailConnected,    setEmailConnected]    = useState(true);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramUsername,  setTelegramUsername]  = useState('');
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_EVENTS.map(e => [e.id, e.default]))
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setUserEmail(u.email || '');
      try {
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        if (userSnap.exists()) setUserPlan(userSnap.data().plan || 'free');
        const alertSnap = await getDoc(doc(db, 'users', u.uid, 'settings', 'alerts'));
        if (alertSnap.exists()) {
          const d = alertSnap.data();
          if (d.telegramConnected !== undefined) setTelegramConnected(d.telegramConnected);
          if (d.emailConnected    !== undefined) setEmailConnected(d.emailConnected);
          if (d.telegramUsername)                setTelegramUsername(d.telegramUsername);
          if (d.toggles)                         setToggles(d.toggles);
        }
      } catch {}
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'alerts'), {
        telegramConnected, emailConnected, telegramUsername, toggles, updatedAt: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const handleLogout = async () => { await signOut(auth); router.push('/'); };

  const initials  = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  const plan      = userPlan;
  const planLabel = plan === 'agency' ? 'Agency plan' : plan === 'pro' ? 'Pro plan' : 'Free plan';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid rgba(245,158,11,0.2)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',-apple-system,sans-serif;}
        html,body{background:#0a0a0f;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

        /* SIDEBAR */
        .r-sidebar{
          width:220px;min-width:220px;background:#0c0a0e;
          border-right:1px solid rgba(245,158,11,0.12);
          display:flex;flex-direction:column;
          position:fixed;height:100vh;left:0;top:0;z-index:40;
          box-shadow:4px 0 40px rgba(0,0,0,0.6);
          overflow:hidden;
        }
        .r-glow1{position:absolute;top:-60px;left:-80px;width:340px;height:340px;border-radius:50%;
          background:radial-gradient(circle,rgba(200,90,0,0.55) 0%,rgba(160,65,0,0.28) 35%,transparent 70%);
          pointer-events:none;z-index:0;filter:blur(18px);}
        .r-glow2{position:absolute;top:160px;left:-60px;width:220px;height:220px;border-radius:50%;
          background:radial-gradient(circle,rgba(180,75,0,0.30) 0%,rgba(130,55,0,0.12) 40%,transparent 70%);
          pointer-events:none;z-index:0;filter:blur(22px);}
        .r-sidebar::before{content:'';position:absolute;left:0;top:18%;bottom:18%;width:2px;
          border-radius:0 3px 3px 0;z-index:10;
          background:linear-gradient(180deg,transparent 0%,rgba(245,158,11,0.3) 15%,rgba(251,191,36,0.95) 50%,rgba(245,158,11,0.3) 85%,transparent 100%);
          box-shadow:0 0 8px rgba(245,158,11,0.7),0 0 20px rgba(245,158,11,0.35);}
        .r-logo{padding:22px 18px 18px;border-bottom:1px solid rgba(255,255,255,0.04);position:relative;z-index:1;}
        .r-logo-mark{width:38px;height:38px;border-radius:12px;flex-shrink:0;
          background:linear-gradient(135deg,#F59E0B 0%,#D97706 40%,#7C3AED 100%);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 16px rgba(245,158,11,0.4),0 0 0 1px rgba(245,158,11,0.2),inset 0 1px 0 rgba(255,255,255,0.2);}
        .r-nav{flex:1;padding:14px 10px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;position:relative;z-index:1;}
        .r-nav-item{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:12px;
          font-size:13.5px;font-weight:500;text-decoration:none;color:rgba(220,195,165,0.52);
          transition:all 0.22s cubic-bezier(.4,0,.2,1);border:1px solid transparent;position:relative;overflow:hidden;}
        .r-nav-item:hover{background:rgba(245,158,11,0.055);color:rgba(240,220,190,0.88);transform:translateX(3px);border-color:rgba(245,158,11,0.08);}
        .r-nav-item.active{
          background:linear-gradient(135deg,rgba(245,158,11,0.18) 0%,rgba(245,158,11,0.08) 100%);
          color:#FBBF24;border-color:rgba(245,158,11,0.22);font-weight:700;
          box-shadow:0 0 24px rgba(245,158,11,0.25),0 0 48px rgba(245,158,11,0.10),inset 0 0 20px rgba(245,158,11,0.08);
        }
        .r-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:22px;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,#FBBF24,#F59E0B,#D97706);
          box-shadow:0 0 10px rgba(245,158,11,0.9),0 0 24px rgba(245,158,11,0.4);}
        .r-upgrade{margin:0 10px 10px;background:linear-gradient(135deg,rgba(245,158,11,0.07),rgba(245,158,11,0.04));
          border:1px solid rgba(245,158,11,0.14);border-radius:14px;padding:15px;position:relative;z-index:1;}
        .r-btn-upgrade{width:100%;background:linear-gradient(135deg,#F59E0B,#FBBF24);color:#08080A;font-weight:700;font-size:12.5px;
          padding:10px;border-radius:10px;border:none;cursor:pointer;text-decoration:none;display:block;text-align:center;}
        .r-sidebar-bottom{padding:8px 10px 22px;border-top:1px solid rgba(255,255,255,0.04);position:relative;z-index:1;}
        .r-btn-logout{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:10px;font-size:13px;font-weight:500;
          color:rgba(255,255,255,0.3);background:none;border:none;cursor:pointer;width:100%;transition:all 0.18s;}
        .r-btn-logout:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.6);}

        /* LAYOUT */
        .r-main{margin-left:220px;min-height:100vh;display:flex;flex-direction:column;}
        .r-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.92);backdrop-filter:blur(28px);
          border-bottom:1px solid rgba(255,255,255,0.05);padding:0 28px;height:60px;
          display:flex;align-items:center;gap:12px;box-shadow:0 4px 32px rgba(0,0,0,0.3);}
        .r-search{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:10px;padding:0 14px 0 36px;height:36px;color:#FAFAFA;font-size:13px;outline:none;width:240px;}
        .r-search::placeholder{color:rgba(255,255,255,0.25);}
        .r-search:focus{border-color:rgba(245,158,11,0.3);}

        /* CARDS */
        .a-card{background:rgba(16,16,22,0.95);border:1px solid rgba(255,255,255,0.07);border-radius:16px;
          backdrop-filter:blur(16px);transition:border-color 0.2s;}
        .a-card:hover{border-color:rgba(255,255,255,0.11);}

        /* TOGGLE */
        .a-toggle{width:44px;height:24px;border-radius:99px;border:none;cursor:pointer;
          position:relative;transition:background 0.2s;flex-shrink:0;}
        .a-knob{position:absolute;top:2px;width:20px;height:20px;background:#fff;border-radius:50%;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);transition:left 0.2s cubic-bezier(.4,0,.2,1);}

        /* BOTTOM NAV */
        .r-bnav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;
          background:rgba(10,10,15,0.97);border-top:1px solid rgba(255,255,255,0.07);
          backdrop-filter:blur(24px);padding:6px 0 env(safe-area-inset-bottom,6px);}
        .r-bnav-inner{display:flex;justify-content:space-around;align-items:center;}
        .r-bnav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;
          padding:6px 16px;text-decoration:none;color:rgba(255,255,255,0.35);
          background:none;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color 0.15s;}
        .r-bnav-btn.active{color:#F59E0B;}
        .r-bnav-icon{width:36px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:9px;}
        .r-bnav-btn.active .r-bnav-icon{background:rgba(245,158,11,0.12);}
        .r-bnav-label{font-size:9px;font-weight:500;line-height:1;}
        .r-bnav-btn.active .r-bnav-label{font-weight:700;}

        /* RESPONSIVE */
        @media(max-width:1023px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;padding-bottom:72px;}
          .r-bnav{display:block!important;}
          .r-topbar{padding:0 14px;height:54px;}
          .r-topbar-search{display:none!important;}
          .r-content{padding:16px!important;max-width:100%!important;margin:0!important;}
          .a-channel-grid{grid-template-columns:1fr!important;gap:10px!important;}
        }
        @media(min-width:768px) and (max-width:1023px){
          .a-channel-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media(min-width:1024px){.r-bnav{display:none!important;}}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex' }}>

        {/* SIDEBAR */}
        <aside className="r-sidebar">
          <div className="r-glow1" /><div className="r-glow2" />
          <div className="r-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div className="r-logo-mark"><Shield size={18} color="white" strokeWidth={2.2} /></div>
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.025em' }}>ModerateAI</div>
                <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 10, fontWeight: 500, marginTop: 1 }}>Enterprise · v2</div>
              </div>
            </div>
          </div>
          <nav className="r-nav">
            {SIDEBAR_NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`r-nav-item${active ? ' active' : ''}`}>
                  <item.icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
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
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, lineHeight: 1.65, marginBottom: 11 }}>Unlock unlimited hidden comments and Telegram alerts.</p>
              <Link href="/billing" className="r-btn-upgrade">Upgrade</Link>
            </div>
          )}
          <div className="r-sidebar-bottom">
            <button onClick={handleLogout} className="r-btn-logout"><LogOut size={14} strokeWidth={1.8} /> Logout</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="r-main" style={{ width: '100%' }}>

          {/* Topbar — title left, everything else right */}
          <header className="r-topbar">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.03em' }}>Alerts</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '3px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.8)', animation: 'pulse 2s infinite' }} />
                <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>Live</span>
              </div>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }} className="r-topbar-search">
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round">
                <circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input className="r-search" placeholder="Search comments, users…" />
            </div>
            {/* Bell */}
            <button style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <Bell size={16} color="rgba(255,255,255,0.45)" strokeWidth={1.8} />
            </button>
            {/* Connect YouTube */}
            <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', flexShrink: 0 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="#08080A"><polygon points="5,3 19,12 5,21"/></svg>
              <span style={{ color: '#08080A', fontWeight: 700, fontSize: 12.5 }}>Connect YouTube</span>
            </button>
            {/* User */}
            <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '4px 11px 4px 4px', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 11 }}>{initials}</div>
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 12.5, lineHeight: 1.2 }}>{user?.displayName || 'User'}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10.5 }}>{planLabel}</div>
              </div>
            </Link>
          </header>

          {/* CONTENT */}
          <div className="r-content" style={{ padding: '20px 32px', flex: 1, animation: 'fadeIn 0.3s ease', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 16 }}>Get notified where you already are</p>

            {/* Channel cards — full width grid */}
            <div className="a-channel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

              {/* Telegram */}
              <div className="a-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(34,158,217,0.12)', border: '1px solid rgba(34,158,217,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Send size={17} color="#229ED9" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14.5 }}>Telegram</span>
                      <span style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.22)', color: '#a78bfa', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Agency</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12 }}>Instant DMs when action is needed</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 12px', color: 'rgba(255,255,255,0.25)', fontSize: 11.5, fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>Agency only</div>
                </div>
              </div>

              {/* Email */}
              <div className="a-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={17} color="#F59E0B" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14.5 }}>Email</span>
                      <span style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Free</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 12 }}>Daily digest of moderation activity</p>
                  </div>
                  {emailConnected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}>✓ Connected</span>
                      <button style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Manage</button>
                    </div>
                  )}
                </div>
                {emailConnected && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 9 }}>
                    <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11.5 }}>Sending to <span style={{ color: '#FAFAFA', fontWeight: 600 }}>{userEmail}</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Settings — full width */}
            <div className="a-card" style={{ padding: '20px 24px', marginBottom: 8 }}>
              <div style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Notification Settings</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12.5 }}>Choose which events trigger alerts</div>
              </div>
              {NOTIFICATION_EVENTS.map(({ id, label, desc }, i) => (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '7px 0', borderBottom: i < NOTIFICATION_EVENTS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{desc}</p>
                  </div>
                  <button
                    className="a-toggle"
                    style={{ background: toggles[id] ? '#F59E0B' : 'rgba(255,255,255,0.1)', boxShadow: toggles[id] ? '0 0 10px rgba(245,158,11,0.35)' : 'none' }}
                    onClick={() => setToggles(p => ({ ...p, [id]: !p[id] }))}
                  >
                    <div className="a-knob" style={{ left: toggles[id] ? 22 : 2 }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Save preferences */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} disabled={saving} style={{
                background: saved ? 'linear-gradient(135deg,#34d399,#10b981)' : 'linear-gradient(135deg,#F59E0B,#FBBF24)',
                color: '#08080A', fontWeight: 800, fontSize: 13.5, padding: '12px 32px', borderRadius: 12,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
                boxShadow: saved ? '0 2px 14px rgba(52,211,153,0.3)' : '0 4px 20px rgba(245,158,11,0.4)',
                transition: 'all 0.2s',
              }}>
                {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save preferences'}
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV — untouched */}
        <nav className="r-bnav">
          <div className="r-bnav-inner">
            {BOTTOM_NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`r-bnav-btn${active ? ' active' : ''}`}>
                  <span className="r-bnav-icon"><item.icon size={20} strokeWidth={active ? 2.2 : 1.7} /></span>
                  <span className="r-bnav-label">{item.label}</span>
                </Link>
              );
            })}
            <button className={`r-bnav-btn${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)}>
              <span className="r-bnav-icon"><MoreHorizontal size={20} strokeWidth={1.7} /></span>
              <span className="r-bnav-label">More</span>
            </button>
          </div>
        </nav>

        {/* MORE DRAWER */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
            <div style={{
              position: 'fixed', bottom: 68, left: 10, right: 10, zIndex: 60,
              background: 'rgba(14,14,20,0.98)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, overflow: 'hidden',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.7)', backdropFilter: 'blur(28px)',
              animation: 'slideUp 0.2s ease',
            }}>
              <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '12px auto 10px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{initials}</div>
                <div>
                  <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 13.5 }}>{user?.displayName || 'User'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11 }}>{planLabel}</div>
                </div>
              </div>
              <div style={{ padding: '6px 8px' }}>
                {MORE_ITEMS.map(({ href, icon: Icon, label, color }) => (
                  <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 10px', borderRadius: 12, textDecoration: 'none', color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: 14, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={color} strokeWidth={1.8} />
                    </div>
                    {label}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6, paddingTop: 6 }}>
                  <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 600, fontSize: 14, width: '100%', borderRadius: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(248,113,113,0.09)', border: '1px solid rgba(248,113,113,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <LogOut size={15} color="#f87171" strokeWidth={1.8} />
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}