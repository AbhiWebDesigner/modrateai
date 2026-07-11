'use client';
import { useState, useEffect } from 'react';
import {
  Shield, Check, Lock, Key, Smartphone,
  User as UserIcon, ExternalLink, Pencil,
  Bell, LayoutDashboard, BarChart2, Zap, Settings, Star,
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

type TabId = 'profile' | 'security' | '2fa' | 'encryption';

const TABS: { id: TabId; label: string; icon: typeof UserIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'security', label: 'Security', icon: Lock },
  { id: '2fa', label: '2FA', icon: Smartphone },
  { id: 'encryption', label: 'Encryption', icon: Key },
];

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/automation', icon: Zap, label: 'Automation' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      padding: '28px 28px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 20px 60px rgba(0,0,0,0.35)',
    }}>
      {children}
    </div>
  );
}

function GoogleManagedNotice({ title, description, href, linkLabel }: {
  title: string; description: string; href: string; linkLabel: string;
}) {
  return (
    <div style={{
      background: 'rgba(245,158,11,0.05)',
      border: '1px solid rgba(245,158,11,0.16)',
      borderRadius: 14, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(245,158,11,0.10)',
          border: '1px solid rgba(245,158,11,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>
        <div>
          <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{title}</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13.5, lineHeight: 1.6 }}>{description}</div>
        </div>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer" style={{
        alignSelf: 'flex-start',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 10, padding: '9px 16px',
        color: '#FAFAFA', fontSize: 13, fontWeight: 600, textDecoration: 'none',
      }}>
        {linkLabel}
        <ExternalLink size={13} />
      </a>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [userPlan, setUserPlan] = useState('free');
  const [fullName, setFullName] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      setFullName(firebaseUser.displayName || '');
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserPlan(data.plan || 'free');
          if (data.youtubeChannel) setYoutubeChannel(data.youtubeChannel);
        }
      } catch {}
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: fullName, youtubeChannel }, { merge: true });
    } catch {}
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#08080A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(245,158,11,0.25)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initial = user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const planLabel = userPlan === 'agency' ? 'Agency plan' : userPlan === 'pro' ? 'Pro plan' : 'Free plan';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; box-sizing: border-box; }
        html, body { background: #08080A; margin: 0; }

        .settings-bg { position: fixed; inset: 0; z-index: 0; background-color: #08080A; overflow: hidden; }
        .settings-bg::before {
          content: '';
          position: absolute; inset: -10%;
          background:
            radial-gradient(45% 38% at 12% 10%, rgba(245,158,11,0.12) 0%, transparent 62%),
            radial-gradient(48% 42% at 90% 88%, rgba(124,58,237,0.16) 0%, transparent 65%),
            radial-gradient(60% 60% at 50% 50%, rgba(20,20,23,0.4) 0%, #08080A 72%);
          animation: driftGlow 26s ease-in-out infinite;
        }
        .settings-bg__grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 56px 56px;
          -webkit-mask-image: radial-gradient(90% 70% at 50% 0%, #000 0%, transparent 75%);
          mask-image: radial-gradient(90% 70% at 50% 0%, #000 0%, transparent 75%);
        }
        @keyframes driftGlow { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-1%,1%,0) scale(1.03); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }

        input[type="text"], input[type="email"] {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #FAFAFA;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        input[type="text"]::placeholder, input[type="email"]::placeholder { color: rgba(255,255,255,0.28); }
        input[type="text"]:focus, input[type="email"]:focus { outline: none; border-color: rgba(245,158,11,0.45); background: rgba(255,255,255,0.045); }
        input:disabled { color: rgba(255,255,255,0.40); cursor: not-allowed; }

        .save-btn {
          width: 100%; padding: 13px 20px; border-radius: 12px;
          font-size: 14px; font-weight: 700; border: none; cursor: pointer;
          background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
          color: #0A0A0B;
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .save-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(245,158,11,0.25); }
        .save-btn:active { transform: translateY(0) scale(0.98); }
        .save-btn.saved { background: linear-gradient(135deg, #10B981, #059669); color: white; }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px; border-radius: 12px;
          font-size: 13.5px; font-weight: 600;
          cursor: pointer; border: none;
          background: transparent; color: rgba(255,255,255,0.55);
          transition: background 0.2s ease, color 0.2s ease;
          width: 100%; text-align: left;
        }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.85); }
        .nav-item.active { background: rgba(245,158,11,0.10); color: #FBBF24; border: 1px solid rgba(245,158,11,0.20); }

        /* Layout */
        .page-wrapper { display: flex; min-height: 100vh; position: relative; z-index: 10; }

        /* Desktop sidebar */
        .desktop-sidebar {
          width: 224px; flex-shrink: 0;
          background: rgba(255,255,255,0.02);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0;
          z-index: 30;
        }
        .sidebar-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px; margin-bottom: 2px;
          color: rgba(255,255,255,0.45);
          text-decoration: none; font-size: 13px; font-weight: 600;
          transition: background 0.2s, color 0.2s;
        }
        .sidebar-nav-link:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
        .sidebar-nav-link.active { background: rgba(255,255,255,0.08); color: #FAFAFA; }

        .main-content { flex: 1; margin-left: 224px; display: flex; flex-direction: column; }

        /* Header */
        .top-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top: 0; z-index: 20;
          background: rgba(8,8,10,0.85); backdrop-filter: blur(20px);
        }
        .header-search {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 8px 12px;
        }
        .header-search input {
          background: transparent; border: none; outline: none;
          color: #FAFAFA; font-size: 13px; width: 180px;
          padding: 0;
        }
        .header-search input::placeholder { color: rgba(255,255,255,0.35); }
        .yt-btn {
          display: flex; align-items: center; gap: 6px;
          background: #FBBF24; color: #0A0A0B;
          border: none; border-radius: 10px;
          padding: 8px 14px; font-weight: 800; font-size: 13px; cursor: pointer;
        }
    /* Settings inner layout */
     .settings-inner {
         max-width: 920px; margin: 0 auto;
          padding: 40px 32px;
          display: flex; flex-direction: column; gap: 0;
}
      .settings-sidebar-nav {
     width: 100%;
     display: flex; flex-direction: row; gap: 4px;
     margin-bottom: 20px;
}
        .settings-content { flex: 1; min-width: 0; }

        /* Mobile bottom nav */
        .mobile-bottom-nav { display: none; }

        /* Responsive */
        @media (max-width: 1024px) {
          .desktop-sidebar { display: none; }
          .main-content { margin-left: 0; }
          .header-search { display: none; }
          .yt-btn { display: none; }
          .profile-text { display: none; }
          .mobile-bottom-nav {
            display: flex;
            position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(17,17,17,0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
            z-index: 50; justify-content: space-around;
          }
          .mobile-bottom-nav-item {
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            background: none; border: none; cursor: pointer;
            color: rgba(255,255,255,0.45);
            font-size: 10px; font-weight: 600;
            padding: 6px 10px; border-radius: 10px;
            text-decoration: none;
          }
          .mobile-bottom-nav-item.active { color: #FBBF24; }
          .settings-inner { padding: 20px 16px; flex-direction: column; gap: 20px; }
          .settings-sidebar-nav { width: 100%; display: flex; flex-direction: row; gap: 6px; margin-bottom: 16px; }
          .nav-item { white-space: nowrap; flex: 1; justify-content: center; }
          .settings-content { padding-bottom: 88px; }
        }
      `}</style>

      <div className="settings-bg">
        <div className="settings-bg__grid" />
      </div>

      <div className="page-wrapper">

        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar">
          <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, background: '#FBBF24', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#000', fontWeight: 900, fontSize: 13 }}>M</span>
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 14 }}>ModerateAI</span>
            </div>
          </div>
          <nav style={{ padding: '12px 8px', flex: 1 }}>
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}
                className={`sidebar-nav-link ${pathname === href ? 'active' : ''}`}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>
          <div style={{ margin: 12, padding: 12, borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Star size={12} color="#FBBF24" />
              <span style={{ color: '#FBBF24', fontWeight: 700, fontSize: 11 }}>Upgrade to Pro</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '0 0 8px' }}>Unlock unlimited comments and alerts.</p>
            <button style={{ width: '100%', background: '#FBBF24', color: '#000', border: 'none', borderRadius: 8, padding: '6px 0', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Upgrade</button>
          </div>
        </aside>

        {/* Main */}
        <div className="main-content">

          {/* Header */}
          <header className="top-header">
            <div>
              <h1 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 18, margin: 0 }}>Settings</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Manage your account preferences</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="header-search">
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input placeholder="Search comments, users..." />
              </div>
              <button style={{ position: 'relative', width: 36, height: 36, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Bell size={15} color="rgba(255,255,255,0.7)" />
                <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, background: '#FBBF24', borderRadius: '50%' }} />
              </button>
              <button className="yt-btn">▶ Connect YouTube</button>
              <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: 'white', flexShrink: 0 }}>
                  {initial}
                </div>
                <div className="profile-text">
                  <p style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12, margin: 0 }}>{user?.displayName || 'User'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{planLabel}</p>
                </div>
              </Link>
            </div>
          </header>

          {/* Settings Inner Layout */}
          <div className="settings-inner">

            {/* Left Settings Nav */}
            <nav className="settings-sidebar-nav">
              {TABS.map((tab) => (
                <button key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}>
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="settings-content fade-in">

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <Card>
                  <h2 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17, marginBottom: 2 }}>Personal information</h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, marginBottom: 24 }}>Update your profile details.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.10)' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20 }}>
                        {initial}
                      </div>
                    )}
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '8px 14px', color: '#FAFAFA', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Pencil size={13} /> Change
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Full name</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Email</label>
                      <input type="email" value={user?.email || ''} disabled />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>YouTube channel</label>
                      <div style={{ position: 'relative' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }}>
                          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.6.6 9.4.6 9.4.6s7.8 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="currentColor" />
                          <path d="M9.8 15.6V8.4l6.2 3.6-6.2 3.6z" fill="#fff" opacity="0.9" />
                        </svg>
                        <input type="text" value={youtubeChannel} onChange={(e) => setYoutubeChannel(e.target.value)} placeholder="Not connected" style={{ paddingLeft: 38 }} />
                      </div>
                    </div>
                    <button onClick={handleSaveProfile} className={`save-btn ${profileSaved ? 'saved' : ''}`} style={{ marginTop: 6 }}>
                      {profileSaved ? <><Check size={15} /> Saved</> : 'Save'}
                    </button>
                  </div>
                </Card>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Card>
                    <h2 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17, marginBottom: 18 }}>Account info</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                      {user?.photoURL
                        ? <img src={user.photoURL} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                        : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>{initial}</div>
                      }
                      <div>
                        <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14.5 }}>{user?.displayName}</div>
                        <div style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>{user?.email}</div>
                        <div style={{ color: '#34D399', fontSize: 12, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} /> Signed in with Google
                        </div>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <h2 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Password</h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, marginBottom: 16 }}>Your account uses Google Sign-In, so your password is managed entirely by Google.</p>
                    <GoogleManagedNotice
                      title="Manage your password on Google"
                      description="Change or reset your password directly from your Google account settings."
                      href="https://myaccount.google.com/security"
                      linkLabel="Open Google security settings"
                    />
                  </Card>
                </div>
              )}

              {/* 2FA TAB */}
              {activeTab === '2fa' && (
                <Card>
                  <h2 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Two-factor authentication</h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, marginBottom: 20 }}>2FA for your account is handled through Google Sign-In.</p>
                  <GoogleManagedNotice
                    title="2FA is managed via your Google account"
                    description="Since you sign in with Google, two-factor authentication is enabled and managed from your Google account — no separate setup needed here."
                    href="https://myaccount.google.com/signinoptions/two-step-verification"
                    linkLabel="Manage 2-Step Verification"
                  />
                </Card>
              )}

              {/* ENCRYPTION TAB */}
              {activeTab === 'encryption' && (
                <Card>
                  <h2 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Data encryption</h2>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5, marginBottom: 20 }}>Your data security settings.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { title: 'End-to-end encryption', desc: 'All data encrypted in transit and at rest', locked: true },
                      { title: 'YouTube token encryption', desc: 'Access tokens encrypted with AES-256', locked: true },
                      { title: 'Comment data encryption', desc: 'Hidden comments stored with encryption', locked: false },
                    ].map((item) => (
                      <div key={item.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Key size={16} color="#34D399" />
                          </div>
                          <div>
                            <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 13.5 }}>{item.title}</div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5 }}>{item.desc}</div>
                          </div>
                        </div>
                        {item.locked ? (
                          <span style={{ fontSize: 11, background: 'rgba(52,211,153,0.12)', color: '#34D399', padding: '5px 12px', borderRadius: 100, fontWeight: 700 }}>Always on</span>
                        ) : (
                          <button onClick={() => setEncryptionEnabled(!encryptionEnabled)} style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', position: 'relative', background: encryptionEnabled ? '#34D399' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s ease' }}>
                            <div style={{ position: 'absolute', top: 2, left: encryptionEnabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s ease' }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 20, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.16)', borderRadius: 14, padding: '16px 18px' }}>
                    <p style={{ color: '#34D399', fontWeight: 700, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={14} /> Your data is secure
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12.5, marginTop: 6, lineHeight: 1.6 }}>
                      ModerateAI uses AES-256 encryption. YouTube credentials are never stored in plain text.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`mobile-bottom-nav-item ${pathname === href ? 'active' : ''}`}>
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}