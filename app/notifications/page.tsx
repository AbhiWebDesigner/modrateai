'use client';
import { useState, useEffect } from 'react';
import {
  Bell, Shield, Zap, CreditCard, Play, CheckCheck,
  LayoutDashboard, Rss, Settings, LogOut, BarChart2,
  MoreHorizontal, Info, AlertTriangle, Gift, Star,
  Megaphone, UserCheck, X, ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  doc, onSnapshot, collection, query, orderBy,
  updateDoc, writeBatch, DocumentData, Timestamp, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifCategory = 'all' | 'system' | 'youtube' | 'billing' | 'alerts' | 'updates';

interface Notif {
  id: string;
  type: 'welcome' | 'system' | 'youtube' | 'billing' | 'alert' | 'update' | 'feature';
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { key: NotifCategory; label: string }[] = [
  { key: 'all',     label: 'All'       },
  { key: 'system',  label: 'System'    },
  { key: 'youtube', label: 'YouTube'   },
  { key: 'billing', label: 'Billing'   },
  { key: 'alerts',  label: 'Alerts'    },
  { key: 'updates', label: 'Updates'   },
];

function typeToCategory(type: Notif['type']): NotifCategory {
  if (type === 'system' || type === 'welcome') return 'system';
  if (type === 'youtube') return 'youtube';
  if (type === 'billing') return 'billing';
  if (type === 'alert')   return 'alerts';
  if (type === 'update' || type === 'feature') return 'updates';
  return 'system';
}

// ─── Icon + color per type ────────────────────────────────────────────────────

function notifIcon(type: Notif['type']): { icon: any; color: string; bg: string } {
  const map: Record<Notif['type'], { icon: any; color: string; bg: string }> = {
    welcome: { icon: Gift,         color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
    system:  { icon: Shield,       color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
    youtube: { icon: Play,         color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    billing: { icon: CreditCard,   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    alert:   { icon: AlertTriangle,color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
    update:  { icon: Megaphone,    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
    feature: { icon: Star,         color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  };
  return map[type] ?? { icon: Info, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' };
}

// ─── Time ago ─────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ─── Seed default notifications for new users ─────────────────────────────────

async function seedDefaultNotifs(uid: string) {
  const ref = collection(db, 'users', uid, 'notifications');
  const defaults: Omit<Notif, 'id' | 'createdAt'>[] = [
    {
      type: 'welcome', read: false,
      title: 'Welcome to ModerateAI! 🎉',
      body: 'Your AI moderator is ready. Connect your YouTube channel to start protecting your community in real time.',
      link: '/settings',
    },
    {
      type: 'system', read: false,
      title: 'All systems operational',
      body: 'AI moderation engine is running normally. All services are healthy.',
    },
    {
      type: 'feature', read: false,
      title: 'New: Progressive Live Chat Timeouts',
      body: 'Repeat offenders in live chat now receive escalating timeouts automatically. Enable it in Moderation settings.',
      link: '/moderation',
    },
    {
      type: 'billing', read: true,
      title: 'Free plan — 2,000 comments / month',
      body: 'You are on the Free plan. Upgrade to Pro for 25,000 comments, unlimited automation rules, and priority support.',
      link: '/billing',
    },
    {
      type: 'update', read: true,
      title: 'Terms of Service updated',
      body: 'Our Terms of Service were updated on Aug 1, 2026. Please review the changes in the Help section.',
      link: '/terms',
    },
  ];

  const batch = writeBatch(db);
  defaults.forEach((n, i) => {
    const docRef = doc(ref);
    batch.set(docRef, {
      ...n,
      createdAt: Timestamp.fromMillis(Date.now() - i * 3600_000),
    });
  });
  await batch.commit();
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const [user,       setUser]       = useState<User | null>(null);
  const [userData,   setUserData]   = useState<DocumentData | null>(null);
  const [notifs,     setNotifs]     = useState<Notif[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState<NotifCategory>('all');
  const [moreOpen,   setMoreOpen]   = useState(false);

    useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);

      unsubUser = onSnapshot(doc(db, 'users', u.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data());
      });

      const notifsRef = collection(db, 'users', u.uid, 'notifications');
      const q = query(notifsRef, orderBy('createdAt', 'desc'));

      unsubNotifs = onSnapshot(q, async (snap) => {
        if (snap.empty) {
          await seedDefaultNotifs(u.uid);
          return;
        }
        const docs: Notif[] = snap.docs.map(d => {
          const data = d.data();
          const ts = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date();
          return {
            id: d.id,
            type: data.type,
            title: data.title,
            body: data.body,
            read: data.read ?? false,
            createdAt: ts,
            link: data.link,
          };
        });
        setNotifs(docs);
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      unsubUser?.();
      unsubNotifs?.();
    };
  }, [router]);
  
  const handleLogout = async () => { await signOut(auth); router.push('/'); };

  const markRead = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'notifications', id), { read: true });
  };

  const markAllRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'users', user.uid, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteNotif = async (id: string) => {
    if (!user) return;
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
  };

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const initials  = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const userPhoto = user?.photoURL || (userData?.photo as string) || null;
  const plan      = (userData?.plan as string) || 'free';
  const planLabel = plan === 'pro' ? 'Pro Plan' : plan === 'agency' ? 'Agency' : 'Free Plan';

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = notifs.filter(n => {
    if (category === 'all') return true;
    return typeToCategory(n.type) === category;
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

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
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
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
          display:flex;flex-direction:column;position:fixed;height:100vh;left:0;top:0;z-index:40;overflow:hidden;
          background:radial-gradient(ellipse 80% 40% at -10% 0%,rgba(180,90,0,0.35) 0%,transparent 60%),radial-gradient(ellipse 60% 30% at -5% 30%,rgba(150,70,0,0.20) 0%,transparent 55%),#0c0a0e;}
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
          color:#FBBF24;border-color:rgba(245,158,11,0.25);font-weight:700;}
        .r-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:18px;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,#FBBF24,#F59E0B,#D97706);box-shadow:0 0 10px rgba(245,158,11,0.8);}
        .r-upgrade{margin:0 7px 7px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.14);border-radius:13px;padding:13px;}
        .r-sidebar-bottom{padding:7px 7px 18px;border-top:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:2px;}
        .r-btn-logout{display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:9px;font-size:12px;font-weight:500;
          color:rgba(255,255,255,0.28);background:none;border:none;cursor:pointer;width:100%;transition:all 0.18s;}
        .r-btn-logout:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);}
        .r-btn-upgrade{width:100%;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;font-weight:700;font-size:11.5px;
          padding:8px;border-radius:8px;border:none;cursor:pointer;text-align:center;text-decoration:none;display:block;}

        .r-main{margin-left:216px;min-height:100vh;display:flex;flex-direction:column;position:relative;z-index:1;width:calc(100% - 216px);}

        .r-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.92);backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.05);padding:0 22px;height:56px;
          display:flex;align-items:center;gap:10px;box-shadow:0 4px 24px rgba(0,0,0,0.25);}

        .r-mobile-topbar{display:none;position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.96);
          backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.05);
          padding:0 12px;height:52px;align-items:center;gap:8px;box-shadow:0 2px 16px rgba(0,0,0,0.3);}

        .r-content{padding:24px 28px;flex:1;animation:fadeIn 0.3s ease;max-width:720px;width:100%;box-sizing:border-box;}

        .n-card{background:rgba(13,12,20,0.99);border:1px solid rgba(255,255,255,0.07);border-radius:14px;
          transition:border-color 0.18s,background 0.18s;cursor:pointer;animation:slideIn 0.22s ease;}
        .n-card:hover{border-color:rgba(255,255,255,0.12);background:rgba(18,16,28,0.99);}
        .n-card.unread{border-color:rgba(124,58,237,0.2);background:rgba(124,58,237,0.04);}
        .n-card.unread:hover{border-color:rgba(124,58,237,0.3);}

        .n-cat-btn{padding:6px 14px;border-radius:20px;font-size:11.5px;font-weight:600;border:1px solid rgba(255,255,255,0.07);
          cursor:pointer;transition:all 0.18s;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);}
        .n-cat-btn.active{background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.3);color:#a78bfa;}
        .n-cat-btn:hover:not(.active){background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);}

        .r-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;
          background:rgba(10,10,15,0.97);border-top:1px solid rgba(255,255,255,0.06);
          backdrop-filter:blur(24px);padding:6px 4px env(safe-area-inset-bottom,6px);}
        .r-bnav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;
          flex:1;padding:5px 4px;text-decoration:none;color:rgba(255,255,255,0.32);
          border:none;background:none;cursor:pointer;transition:color 0.18s;}
        .r-bnav-icon{width:38px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:9px;}

        @media(min-width:1024px){
          .r-bottom-nav{display:none!important;}
          .r-mobile-topbar{display:none!important;}
        }
        @media(max-width:1023px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;padding-bottom:80px;}
          .r-bottom-nav{display:flex!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-content{padding:16px 14px;}
        }
      `}</style>

      <div className="r-bg" style={{ display: 'flex' }}>

        {/* SIDEBAR */}
        <aside className="r-sidebar">
          <div style={{ position: 'absolute', top: '-60px', left: '-80px', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,90,0,0.55) 0%,rgba(160,65,0,0.28) 35%,transparent 70%)', pointerEvents: 'none', zIndex: 0, filter: 'blur(18px)' }} />
          <div className="r-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div className="r-logo-mark"><Shield size={16} color="white" strokeWidth={2.2} /></div>
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 14.5, letterSpacing: '-0.02em' }}>ModerateAI</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 500, marginTop: 1 }}>YouTube AI Moderator</div>
              </div>
            </div>
          </div>
          <nav className="r-nav">
            {SIDEBAR_NAV.map(item => (
              <Link key={item.href} href={item.href} className="r-nav-item">
                <item.icon size={13} strokeWidth={1.8} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </Link>
            ))}
          </nav>
          {plan === 'free' && (
            <div className="r-upgrade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Zap size={10} color="#a78bfa" />
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 11 }}>Upgrade to Pro</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 9 }}>
                {['25,000 comments / month', 'Unlimited automation rules', 'Priority support', '1,900 AI actions / month'].map(f => (
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
            <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, width: 33, height: 33, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <ChevronLeft size={14} color="rgba(255,255,255,0.5)" />
            </button>
            <h1 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.28)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 800, color: '#a78bfa' }}>
                {unreadCount} unread
              </span>
            )}
            <div style={{ flex: 1 }} />
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 8, padding: '6px 12px', color: '#34d399', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
            <button onClick={() => router.push('/settings')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '4px 10px 4px 4px', cursor: 'pointer' }}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 9 }}>{initials}</div>
              }
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 12, lineHeight: 1.2 }}>{firstName}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, lineHeight: 1.2 }}>{planLabel}</div>
              </div>
            </button>
          </header>

          {/* MOBILE TOPBAR */}
          <header className="r-mobile-topbar">
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} color="rgba(255,255,255,0.6)" />
            </button>
            <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 15 }}>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.28)', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#a78bfa' }}>{unreadCount}</span>
            )}
            <div style={{ flex: 1 }} />
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#34d399', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCheck size={13} /> All read
              </button>
            )}
          </header>

          {/* CONTENT */}
          <div className="r-content">

            {/* CATEGORY FILTER */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {CATEGORIES.map(c => {
                const count = c.key === 'all'
                  ? notifs.filter(n => !n.read).length
                  : notifs.filter(n => !n.read && typeToCategory(n.type) === c.key).length;
                return (
                  <button
                    key={c.key}
                    className={`n-cat-btn${category === c.key ? ' active' : ''}`}
                    onClick={() => setCategory(c.key)}
                  >
                    {c.label}
                    {count > 0 && (
                      <span style={{ marginLeft: 5, background: 'rgba(124,58,237,0.2)', borderRadius: 10, padding: '0px 5px', fontSize: 9.5, fontWeight: 800, color: '#a78bfa' }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* NOTIFICATIONS LIST */}
            {filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={22} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No notifications</div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, lineHeight: 1.6 }}>You're all caught up. New notifications will appear here.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(n => {
                  const cfg = notifIcon(n.type);
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={`n-card${!n.read ? ' unread' : ''}`}
                      onClick={() => {
                        if (!n.read) markRead(n.id);
                        if (n.link) router.push(n.link);
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'flex-start' }}>

                        {/* Icon */}
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: cfg.bg, border: `1px solid ${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} color={cfg.color} strokeWidth={1.8} />
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                            <span style={{ color: n.read ? 'rgba(255,255,255,0.7)' : '#FAFAFA', fontSize: 13, fontWeight: n.read ? 600 : 700 }}>{n.title}</span>
                            {!n.read && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', flexShrink: 0, boxShadow: '0 0 6px rgba(124,58,237,0.6)' }} />
                            )}
                          </div>
                          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, lineHeight: 1.55, marginBottom: 6 }}>{n.body}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10.5 }}>{timeAgo(n.createdAt)}</span>
                            {n.link && (
                              <span style={{ color: '#a78bfa', fontSize: 10.5, fontWeight: 600 }}>View →</span>
                            )}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'rgba(255,255,255,0.18)', transition: 'color 0.15s', flexShrink: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM NAV */}
        <nav className="r-bottom-nav">
          <Link href="/dashboard" className="r-bnav-item">
            <span className="r-bnav-icon"><LayoutDashboard size={22} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Overview</span>
          </Link>
          <Link href="/live-feed" className="r-bnav-item">
            <span className="r-bnav-icon"><Rss size={22} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Live Feed</span>
          </Link>
          <Link href="/alerts" className="r-bnav-item">
            <span className="r-bnav-icon"><Bell size={22} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Alerts</span>
          </Link>
          <button className="r-bnav-item" onClick={() => setMoreOpen(v => !v)}>
            <span className="r-bnav-icon"><MoreHorizontal size={22} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>More</span>
          </button>
        </nav>

        {/* MORE DRAWER */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'fixed', bottom: 68, left: 10, right: 10, zIndex: 60, background: 'rgba(20,8,45,0.85)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 18, padding: '6px 6px 10px', boxShadow: '0 -8px 40px rgba(0,0,0,0.65)', backdropFilter: 'blur(28px)', animation: 'slideUp 0.18s ease' }}>
              <div style={{ width: 30, height: 3, background: 'rgba(255,255,255,0.09)', borderRadius: 3, margin: '6px auto 12px' }} />
              {[
                { icon: CreditCard, label: 'Billing',    href: '/billing',    color: '#F59E0B' },
                { icon: BarChart2,  label: 'Analytics',  href: '/analytics',  color: '#34d399' },
                { icon: Shield,     label: 'Moderation', href: '/moderation', color: '#60a5fa' },
                { icon: Settings,   label: 'Settings',   href: '/settings',   color: '#a78bfa' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: 'rgba(255,255,255,0.72)', fontWeight: 600, fontSize: 13 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.color}12`, border: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={14} color={item.color} strokeWidth={1.8} />
                  </div>
                  {item.label}
                </Link>
              ))}
              <div style={{ margin: '6px 12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 600, fontSize: 13, width: '100%' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={14} color="#f87171" strokeWidth={1.8} />
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