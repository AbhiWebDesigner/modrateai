'use client';
import { useState, useEffect } from 'react';
import { Shield, Trash2, MessageSquare, Eye, Settings, LogOut, Home, BarChart3, Bell, ChevronRight, Zap, Search, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setUserData(userSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };
  const handleYouTubeConnect = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth?uid=${user?.uid}`;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '2px solid #F59E0B', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const plan = (userData?.plan as string) || 'free';
  const commentsUsed = (userData?.comments_used as number) || 0;
  const commentsLimit = (userData?.comments_limit as number) || 1500;
  const youtubeConnected = (userData?.youtube_connected as boolean) || false;
  const usagePercent = Math.min(100, (commentsUsed / commentsLimit) * 100);
  const firstName = user?.displayName?.split(' ')[0] || 'User';

  const navItems = [
    { icon: Home, label: 'Overview', href: '/dashboard', active: true },
    { icon: BarChart3, label: 'Analytics', href: '/analytics', active: false },
    { icon: Zap, label: 'Automation', href: '/automation', active: false },
    { icon: Bell, label: 'Alerts', href: '/alerts', active: false },
    { icon: Settings, label: 'Settings', href: '/settings', active: false },
    { icon: CreditCard, label: 'Billing', href: '/billing', active: false },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #09090B; }
        ::-webkit-scrollbar-thumb { background: #27272A; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

        /* SIDEBAR NAV */
        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; font-size:14px; font-weight:500; text-decoration:none; transition:all 0.2s; color:rgba(255,255,255,0.5); }
        .nav-item:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.9); }
        .nav-item.active { background:rgba(245,158,11,0.12); color:#F59E0B; border-left:2px solid #F59E0B; }

        /* BOTTOM NAV (mobile) */
        .bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; z-index:50; background:rgba(9,9,11,0.95); border-top:1px solid #27272A; backdrop-filter:blur(20px); padding:8px 0 env(safe-area-inset-bottom, 8px); }
        .bottom-nav-item { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; flex:1; padding:6px 4px; text-decoration:none; color:rgba(255,255,255,0.4); font-size:10px; font-weight:500; transition:all 0.2s; border:none; background:none; cursor:pointer; }
        .bottom-nav-item.active { color:#F59E0B; }
        .bottom-nav-item:hover { color:rgba(255,255,255,0.8); }

        .stat-card { background:#18181B; border:1px solid #27272A; border-radius:16px; padding:20px; transition:all 0.2s; }
        .stat-card:hover { border-color:rgba(245,158,11,0.2); }
        .glass-card { background:#18181B; border:1px solid #27272A; border-radius:16px; }
        .search-input { background:rgba(255,255,255,0.05); border:1px solid #27272A; border-radius:10px; padding:8px 16px 8px 36px; color:#FAFAFA; font-size:14px; outline:none; width:240px; transition:all 0.2s; }
        .search-input:focus { border-color:rgba(245,158,11,0.4); background:rgba(255,255,255,0.07); }
        .search-input::placeholder { color:rgba(255,255,255,0.3); }
        .connect-btn { background:#F59E0B; color:#09090B; font-weight:700; padding:10px 20px; border-radius:10px; border:none; cursor:pointer; font-size:14px; display:flex; align-items:center; gap:6px; transition:all 0.2s; white-space:nowrap; }
        .connect-btn:hover { background:#FBBF24; transform:translateY(-1px); }
        .upgrade-btn { background:linear-gradient(135deg,#F59E0B,#FBBF24); color:#09090B; font-weight:700; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; font-size:13px; width:100%; transition:all 0.2s; }
        .upgrade-btn:hover { opacity:0.9; transform:translateY(-1px); }
        .logout-btn { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.4); background:none; border:none; cursor:pointer; width:100%; transition:all 0.2s; }
        .logout-btn:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7); }
        .avatar-btn { background:none; border:none; cursor:pointer; padding:0; transition:all 0.2s; }
        .avatar-btn:hover { opacity:0.85; transform:scale(1.05); }

        /* SIDEBAR — visible on md+ */
        .sidebar { display:flex; }
        .main-content { margin-left:240px; }

        /* RESPONSIVE */
        @media (max-width: 1023px) {
          .sidebar { display:none !important; }
          .main-content { margin-left:0 !important; padding-bottom:72px; }
          .bottom-nav { display:flex; }
          .desktop-search { display:none !important; }
          .desktop-avatar { display:none !important; }
          .stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .bottom-grid { grid-template-columns: 1fr !important; }
          .header-padding { padding: 12px 16px !important; }
          .content-padding { padding: 16px !important; }
          .connect-banner { flex-direction:column !important; align-items:flex-start !important; gap:12px !important; }
          .connect-banner-btn { width:100% !important; justify-content:center !important; }
          .mobile-connect-btn { display:flex !important; }
        }

       @media (min-width: 1024px) {
          .mobile-connect-btn { display:none !important; }
        }
      `}</style>

      <div className="premium-bg" />

      <main style={{ minHeight: '100vh', display: 'flex', position: 'relative', zIndex: 10 }}>

        {/* SIDEBAR — desktop only */}
        <aside className="sidebar" style={{ width: 240, background: 'rgba(9,9,11,0.8)', borderRight: '1px solid #27272A', flexDirection: 'column', position: 'fixed', height: '100vh', backdropFilter: 'blur(20px)' }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #27272A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} color="white" />
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17 }}>ModerateAI</span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`nav-item${item.active ? ' active' : ''}`}>
                <item.icon size={16} /> {item.label}
              </Link>
            ))}
          </nav>

          {/* Upgrade + Logout */}
          <div style={{ padding: '12px 8px', borderTop: '1px solid #27272A', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plan === 'free' && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Zap size={14} color="#F59E0B" />
                  <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 13 }}>Upgrade to Pro</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>Unlock unlimited hidden comments and Telegram alerts.</p>
                <Link href="/pricing">
                  <button className="upgrade-btn">Upgrade — ₹299/mo</button>
                </Link>
              </div>
            )}
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* HEADER */}
          <header className="header-padding" style={{ background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #27272A', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 18, margin: 0 }}>Overview</h1>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: youtubeConnected ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: youtubeConnected ? '#4ade80' : '#fb923c' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: youtubeConnected ? '#22c55e' : '#f97316', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                  {youtubeConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                Welcome back, {firstName} 👋 — {youtubeConnected ? 'Your channel is protected' : 'Connect YouTube to start'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Search — desktop only */}
              <div className="desktop-search" style={{ position: 'relative' }}>
                <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="search-input" placeholder="Search comments, users..." />
              </div>

              {/* Bell */}
              <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #27272A', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                <Bell size={16} color="rgba(255,255,255,0.6)" />
                <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: '#F59E0B', borderRadius: '50%' }}></span>
              </button>

              {/* Connect YouTube — desktop only */}
              {!youtubeConnected && (
                <button onClick={handleYouTubeConnect} className="connect-btn desktop-search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Connect YouTube
                </button>
              )}

              {/* Avatar — desktop only */}
              <button className="avatar-btn desktop-avatar" onClick={() => router.push('/settings')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid #27272A', borderRadius: 12, padding: '6px 12px 6px 6px' }}>
                  {user?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="avatar" />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                      {firstName.charAt(0)}
                    </div>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{firstName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'capitalize', lineHeight: 1.2 }}>{plan} plan</div>
                  </div>
                </div>
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="content-padding" style={{ padding: '28px 32px', flex: 1 }}>

            {/* Connect Banner */}
            {!youtubeConnected && (
              <div className="connect-banner" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(245,158,11,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Connect your YouTube channel</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>Currently viewing demo data. Connect to start real-time moderation.</div>
                  </div>
                </div>
                <button onClick={handleYouTubeConnect} className="connect-btn connect-banner-btn">
                  Connect now <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* STAT CARDS */}
            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { icon: Eye, label: 'Comments Scanned', value: commentsUsed.toLocaleString(), iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.15)' },
                { icon: Trash2, label: 'Hidden', value: '0', iconColor: '#f87171', iconBg: 'rgba(239,68,68,0.15)' },
                { icon: MessageSquare, label: 'Auto-Replies', value: '0', iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.15)' },
                { icon: Shield, label: 'Protection Status', value: youtubeConnected ? 'Active' : 'Inactive', iconColor: youtubeConnected ? '#4ade80' : '#fb923c', iconBg: youtubeConnected ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.15)' },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div style={{ width: 36, height: 36, background: s.iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <s.icon size={18} color={s.iconColor} />
                  </div>
                  <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* BOTTOM GRID */}
            <div className="bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16 }}>

              {/* Monthly Usage */}
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15, margin: 0 }}>Monthly Usage</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>
                      {plan} plan · resets in 12 days
                    </p>
                  </div>
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase' }}>{plan}</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>{commentsUsed.toLocaleString()}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}> / {commentsLimit.toLocaleString()} comments</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${usagePercent}%`, background: 'linear-gradient(90deg,#F59E0B,#7C3AED)', borderRadius: 8, transition: 'width 0.5s ease' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  <span>{usagePercent.toFixed(0)}% used</span>
                  <span>{(commentsLimit - commentsUsed).toLocaleString()} left</span>
                </div>
                {plan === 'free' && (
                  <Link href="/pricing">
                    <button className="upgrade-btn">Upgrade to Pro — ₹299/mo</button>
                  </Link>
                )}
              </div>

              {/* Recent Activity */}
              <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272A' }}>
                  <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15, margin: 0 }}>Recent Activity</h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Live moderation events</p>
                </div>
                <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <Shield size={36} color="rgba(255,255,255,0.1)" />
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: 0, textAlign: 'center' }}>
                    {youtubeConnected ? 'No activity yet' : 'Connect YouTube to see real-time activity'}
                  </p>
                  {!youtubeConnected && (
                    <button onClick={handleYouTubeConnect} className="connect-btn" style={{ marginTop: 4 }}>
                      Connect YouTube →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV — mobile only */}
        <nav className="bottom-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`bottom-nav-item${item.active ? ' active' : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
          <button className="bottom-nav-item" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>

      </main>
    </>
  );
}