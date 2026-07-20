'use client';
import { useState, useEffect } from 'react';
import {
  Check, Lock, Key, Smartphone,
  User as UserIcon, ExternalLink, Pencil,
  Bell, LayoutDashboard, BarChart2, Zap, Settings, Star,
  Monitor, Globe, LogOut,
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
  { href: '/live-feed', icon: BarChart2, label: 'Live Feed' },
  { href: '/moderation', icon: Star, label: 'Moderation' },
  { href: '/automation', icon: Zap, label: 'Automation' },
  { href: '/analytics', icon: BarChart2,  label: 'Analytics' },
  { href: '/alerts',    icon: Bell,       label: 'Alerts' },
  { href: '/billing',   icon: ExternalLink, label: 'Billing' },
  { href: '/settings',  icon: Settings, label: 'Settings' },
];

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
  const [memberSince, setMemberSince] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      setFullName(firebaseUser.displayName || '');
      if (firebaseUser.metadata.creationTime) {
        const date = new Date(firebaseUser.metadata.creationTime);
        setMemberSince(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
      }
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
        const data = snap.data();
        setUserPlan(data.plan || 'free');
       const channelName = data.youtube_channel_name || data.youtube_channel_handle || '';
       const isConnected = data.youtube_connected === true;
       if (isConnected && channelName) setYoutubeChannel(channelName);
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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#08080A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(245,158,11,0.25)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const initial = user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const planLabel = userPlan === 'agency' ? 'Agency plan' : userPlan === 'pro' ? 'Pro plan' : 'Free plan';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #08080A; }

        .s-bg { position: fixed; inset: 0; z-index: 0; background: #08080A; overflow: hidden; }
        .s-bg::before {
          content: '';
          position: absolute; inset: -10%;
          background:
            radial-gradient(45% 38% at 12% 10%, rgba(245,158,11,0.10) 0%, transparent 62%),
            radial-gradient(48% 42% at 90% 88%, rgba(124,58,237,0.14) 0%, transparent 65%),
            radial-gradient(60% 60% at 50% 50%, rgba(20,20,23,0.4) 0%, #08080A 72%);
          animation: driftGlow 26s ease-in-out infinite;
        }
        .s-bg-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(90% 70% at 50% 0%, #000 0%, transparent 75%);
        }
        @keyframes driftGlow { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(-1%,1%,0) scale(1.03); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }

        /* Page layout */
        .page-wrap { display: flex; min-height: 100vh; position: relative; z-index: 10; }

        /* Sidebar */
        .sidebar {
          width: 224px; flex-shrink: 0;
          background: rgba(255,255,255,0.02);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 30;
        }
        .sidebar-logo { padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 8px; }
        .sidebar-nav { padding: 12px 8px; flex: 1; }
        .s-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px; margin-bottom: 2px;
          color: rgba(255,255,255,0.45); text-decoration: none;
          font-size: 13px; font-weight: 600;
          transition: background 0.2s, color 0.2s;
        }
        .s-nav-link:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
        .s-nav-link.active { background: rgba(255,255,255,0.08); color: #FAFAFA; }
        .sidebar-upgrade { margin: 12px; padding: 12px; border-radius: 12px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.18); }

        /* Main */
        .main { flex: 1; margin-left: 224px; display: flex; flex-direction: column; }

        /* Header */
        .top-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky; top: 0; z-index: 20;
          background: rgba(8,8,10,0.85); backdrop-filter: blur(20px);
        }
        .search-box {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 8px 12px;
        }
        .search-box input { background: transparent; border: none; outline: none; color: #FAFAFA; font-size: 13px; width: 180px; }
        .search-box input::placeholder { color: rgba(255,255,255,0.35); }
        .yt-btn { display: flex; align-items: center; gap: 6px; background: #FBBF24; color: #0A0A0B; border: none; border-radius: 10px; padding: 8px 14px; font-weight: 800; font-size: 13px; cursor: pointer; }

        /* Content area */
        .content-area { flex: 1; padding: 32px 32px 40px; max-width: 1100px; }

        /* Tabs */
        .tabs-row { display: flex; gap: 6px; margin-bottom: 28px; }
        .tab-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 10px;
          font-size: 13px; font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer; transition: all 0.2s;
          background: transparent; color: rgba(255,255,255,0.45);
        }
        .tab-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); }
        .tab-btn.active { background: rgba(245,158,11,0.12); color: #FBBF24; border-color: rgba(245,158,11,0.25); }

        /* Cards grid */
        .cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card-full { grid-column: 1 / -1; }
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 24px;
        }
        .card-title { color: #FAFAFA; font-weight: 700; font-size: 15px; margin-bottom: 4px; }
        .card-sub { color: rgba(255,255,255,0.45); font-size: 13px; margin-bottom: 18px; }

        /* Info row */
        .info-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .info-row:last-of-type { border-bottom: none; }
        .info-label { color: rgba(255,255,255,0.45); font-size: 13px; display: flex; align-items: center; gap: 8px; }
        .info-value { color: #FAFAFA; font-size: 13px; font-weight: 600; }

        /* Inputs */
        .field-label { display: block; color: rgba(255,255,255,0.55); font-size: 12px; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
        .field-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09); border-radius: 10px;
          padding: 11px 14px; font-size: 14px; color: #FAFAFA;
          transition: border-color 0.2s, background 0.2s; outline: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.25); }
        .field-input:focus { border-color: rgba(245,158,11,0.45); background: rgba(255,255,255,0.045); }
        .field-input:disabled { color: rgba(255,255,255,0.35); cursor: not-allowed; }

        /* Buttons */
        .btn-primary { width: 100%; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; background: linear-gradient(135deg, #F59E0B, #EA580C); color: #0A0A0B; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(245,158,11,0.2); }
        .btn-primary.saved { background: linear-gradient(135deg, #10B981, #059669); color: white; }
        .btn-google { width: 100%; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.05); color: #FAFAFA; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; text-decoration: none; }
        .btn-google:hover { background: rgba(255,255,255,0.08); }

        /* Status badges */
        .badge-green { background: rgba(52,211,153,0.12); color: #34D399; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-gray { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-yellow { background: rgba(245,158,11,0.12); color: #FBBF24; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

        /* Toggle */
        .toggle { width: 44px; height: 24px; border-radius: 100px; border: none; cursor: pointer; position: relative; transition: background 0.2s; }
        .toggle-thumb { position: absolute; top: 2px; width: 20px; height: 20px; border-radius: 50%; background: white; transition: left 0.2s; }

        /* Session card */
        .session-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; }

        /* Warning box */
        .warn-box { padding: 14px 16px; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.18); border-radius: 12px; display: flex; align-items: flex-start; gap: 10px; }

        /* Mobile bottom nav */
        .mob-nav { display: none; }

        @media (max-width: 1024px) {
          .sidebar { display: none; }
          .main { margin-left: 0; }
          .search-box { display: none; }
          .yt-btn { display: none; }
          .profile-text { display: none; }
          .mob-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(17,17,17,0.95); backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
            z-index: 50; justify-content: space-around;
          }
          .mob-nav-item { display: flex; flex-direction: column; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.45); font-size: 10px; font-weight: 600; padding: 6px 10px; border-radius: 10px; text-decoration: none; }
          .mob-nav-item.active { color: #FBBF24; }
          .content-area { padding: 20px 16px 100px; }
          .cards-grid { grid-template-columns: 1fr; }
          .card-full { grid-column: 1; }
          .tabs-row { overflow-x: auto; padding-bottom: 4px; }
          .tab-btn { white-space: nowrap; }
        }
      `}</style>

      <div className="s-bg"><div className="s-bg-grid" /></div>

      <div className="page-wrap">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div style={{ width: 30, height: 30, background: '#FBBF24', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#000', fontWeight: 900, fontSize: 13 }}>M</span>
            </div>
            <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 14 }}>ModerateAI</span>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} className={`s-nav-link ${pathname === href ? 'active' : ''}`}>
                <Icon size={15} />{label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-upgrade">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Star size={12} color="#FBBF24" />
              <span style={{ color: '#FBBF24', fontWeight: 700, fontSize: 11 }}>Upgrade to Pro</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 8 }}>Unlock unlimited comments and alerts.</p>
            <button style={{ width: '100%', background: '#FBBF24', color: '#000', border: 'none', borderRadius: 8, padding: '6px 0', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Upgrade</button>
          </div>
        </aside>

        {/* Main */}
        <div className="main">

          {/* Header */}
          <header className="top-bar">
            <div>
              <h1 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 18 }}>Settings</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Manage your account preferences</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="search-box">
                <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                  <p style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12 }}>{user?.displayName || 'User'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{planLabel}</p>
                </div>
              </Link>
            </div>
          </header>

          {/* Content */}
          <div className="content-area">

            {/* Tabs */}
            <div className="tabs-row">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`tab-btn ${activeTab === id ? 'active' : ''}`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="cards-grid fade-up">
                <div className="card">
                  <p className="card-title">Personal information</p>
                  <p className="card-sub">Update your profile details</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    {user?.photoURL
                      ? <img src={user.photoURL} alt="avatar" style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.10)' }} />
                      : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20 }}>{initial}</div>
                    }
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '7px 14px', color: '#FAFAFA', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Pencil size={12} /> Change
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label className="field-label">Full name</label>
                      <input className="field-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="field-label">Email</label>
                      <input className="field-input" type="email" value={user?.email || ''} disabled />
                    </div>
                    <button onClick={handleSaveProfile} className={`btn-primary ${profileSaved ? 'saved' : ''}`}>
                      {profileSaved ? <><Check size={14} /> Saved</> : 'Save changes'}
                    </button>
                  </div>
                </div>

                <div className="card">
                  <p className="card-title">YouTube channel</p>
                  <p className="card-sub">Connect your YouTube channel</p>
                  <div style={{ marginBottom: 14 }}>
                    <label className="field-label">Channel URL</label>
                    <div style={{ position: 'relative' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.6.6 9.4.6 9.4.6s7.8 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="rgba(255,255,255,0.3)" />
                        <path d="M9.8 15.6V8.4l6.2 3.6-6.2 3.6z" fill="white" />
                      </svg>
                      <input className="field-input" type="text" value={youtubeChannel} onChange={(e) => setYoutubeChannel(e.target.value)} placeholder="Not connected" style={{ paddingLeft: 36 }} />
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label"><Globe size={13} /> Status</span>
                    <span className={youtubeChannel ? 'badge-green' : 'badge-gray'}>{youtubeChannel ? 'Connected' : 'Not connected'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Plan</span>
                    <span className="badge-yellow">{planLabel}</span>
                  </div>
                  <button onClick={handleSaveProfile} className="btn-primary" style={{ marginTop: 16 }}>
                    Save channel
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="cards-grid fade-up">
                <div className="card">
                  <p className="card-title">Login method</p>
                  <p className="card-sub">How you sign in to ModerateAI</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.18)', borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(66,133,244,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14 }}>Google OAuth</p>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Official Google sign-in</p>
                    </div>
                    <span className="badge-green">✓ Active</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📧 Email</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📅 Member since</span>
                    <span className="info-value">{memberSince || 'Recently'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">🔗 Auth provider</span>
                    <span className="info-value">Google OAuth 2.0</span>
                  </div>
                  <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="btn-google" style={{ marginTop: 16 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Manage Google account →
                  </a>
                </div>

                <div className="card">
                  <p className="card-title">Password</p>
                  <p className="card-sub">Managed by your Google account</p>
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 16 }}>
                    <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Managed by Google</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>Your password is controlled by your Google account. ModerateAI never stores or manages passwords directly.</p>
                  </div>
                  <span className="badge-gray" style={{ marginBottom: 16, display: 'inline-block' }}>Read only</span>
                  <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="btn-google">
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Manage Google account →
                  </a>
                </div>
              </div>
            )}

            {/* 2FA TAB */}
            {activeTab === '2fa' && (
              <div className="cards-grid fade-up">
                <div className="card">
                  <p className="card-title">Two-step verification</p>
                  <p className="card-sub">Managed via your Google account</p>
                  <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 12 }}>
                    <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Managed by Google</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6 }}>ModerateAI uses Google OAuth and cannot access your Google security settings. Manage 2FA directly from Google.</p>
                  </div>
                  <div className="warn-box" style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <p style={{ color: '#FBBF24', fontSize: 13, lineHeight: 1.6 }}>We strongly recommend enabling 2-step verification on your Google account for maximum security.</p>
                  </div>
                  <a href="https://myaccount.google.com/signinoptions/two-step-verification" target="_blank" rel="noopener noreferrer" className="btn-google">
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Manage 2-Step Verification →
                  </a>
                </div>

                <div className="card">
                  <p className="card-title">Active sessions</p>
                  <p className="card-sub">Devices currently signed in</p>
                  <div className="session-card">
                    <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Monitor size={16} color="rgba(255,255,255,0.6)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13 }}>Current browser</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Signed in · {memberSince || 'Recently'}</p>
                    </div>
                    <span className="badge-green">This device</span>
                  </div>
                </div>
              </div>
            )}

            {/* ENCRYPTION TAB */}
            {activeTab === 'encryption' && (
              <div className="cards-grid fade-up">
                <div className="card card-full">
                  <p className="card-title">Data encryption</p>
                  <p className="card-sub">Your data security settings</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { title: 'End-to-end encryption', desc: 'All data encrypted in transit and at rest', locked: true },
                      { title: 'YouTube token encryption', desc: 'Access tokens encrypted with AES-256', locked: true },
                      { title: 'Comment data encryption', desc: 'Hidden comments stored with encryption', locked: false },
                    ].map((item) => (
                      <div key={item.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Key size={15} color="#34D399" />
                          </div>
                          <div>
                            <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13 }}>{item.title}</p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{item.desc}</p>
                          </div>
                        </div>
                        {item.locked
                          ? <span className="badge-green">Always on</span>
                          : <button onClick={() => setEncryptionEnabled(!encryptionEnabled)} className="toggle" style={{ background: encryptionEnabled ? '#34D399' : 'rgba(255,255,255,0.12)' }}>
                              <div className="toggle-thumb" style={{ left: encryptionEnabled ? 22 : 2 }} />
                            </button>
                        }
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.16)', borderRadius: 12 }}>
                    <p style={{ color: '#34D399', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={13} /> Your data is secure
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, marginTop: 5, lineHeight: 1.6 }}>
                      ModerateAI uses AES-256 encryption. YouTube credentials are never stored in plain text.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="mob-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={`mob-nav-item ${pathname === href ? 'active' : ''}`}>
            <Icon size={19} />{label}
          </Link>
        ))}
      </nav>
    </>
  );
}