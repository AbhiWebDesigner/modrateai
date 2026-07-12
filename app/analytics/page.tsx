'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  LayoutDashboard, BarChart2, Zap, Bell, Settings,
  LogOut, Star, Play, Shield, Search, CreditCard
} from 'lucide-react';
const Youtube = Play;
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface DailyPoint {
  day: string;
  scanned: number;
  hidden: number;
  replies: number;
}

interface AnalyticsData {
  totalScanned: number;
  totalHidden: number;
  totalReplies: number;
  protectionRate: number;
  hiddenThisMonth: number;
  hiddenLastMonth: number;
  repliesSent: number;
  avgResponseTime: number;
  falsePositiveRate: number;
  weeklyData: DailyPoint[];
  languageData: { name: string; value: number; color: string }[];
  spamTrend: { day: string; spam: number }[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LANG_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#6b7280'];

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalScanned: 0, totalHidden: 0, totalReplies: 0, protectionRate: 99,
  hiddenThisMonth: 0, hiddenLastMonth: 0, repliesSent: 0,
  avgResponseTime: 0, falsePositiveRate: 0,
  weeklyData: DAYS.map((day) => ({ day, scanned: 0, hidden: 0, replies: 0 })),
  languageData: [
    { name: 'English', value: 0, color: '#f59e0b' },
    { name: 'Hinglish', value: 0, color: '#8b5cf6' },
    { name: 'Telugu', value: 0, color: '#06b6d4' },
    { name: 'Tamil', value: 0, color: '#10b981' },
    { name: 'Hindi', value: 0, color: '#ef4444' },
    { name: 'Other', value: 0, color: '#6b7280' },
  ],
  spamTrend: DAYS.map((day) => ({ day, spam: 0 })),
};

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard', active: false },
  { label: 'Analytics', icon: BarChart2, href: '/analytics', active: true },
  { label: 'Automation', icon: Zap, href: '/automation', active: false },
  { label: 'Alerts', icon: Bell, href: '/alerts', active: false },
{ label: 'Settings', icon: Settings, href: '/settings', active: false },
{ label: 'Billing', icon: CreditCard, href: '/billing', active: false },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#9ca3af', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const [range, setRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'analytics', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      const weeklyData: DailyPoint[] = DAYS.map((day, i) => ({
        day,
        scanned: d.weekly?.scanned?.[i] ?? 0,
        hidden: d.weekly?.hidden?.[i] ?? 0,
        replies: d.weekly?.replies?.[i] ?? 0,
      }));
      const spamTrend = DAYS.map((day, i) => ({ day, spam: d.weekly?.spam?.[i] ?? 0 }));
      const langRaw: Record<string, number> = d.languages ?? {};
      const total = Object.values(langRaw).reduce((a, b) => a + b, 0) || 1;
      const langNames = ['English', 'Hinglish', 'Telugu', 'Tamil', 'Hindi', 'Other'];
      const langKeys = ['english', 'hinglish', 'telugu', 'tamil', 'hindi', 'other'];
      const languageData = langNames.map((name, i) => ({
        name, value: Math.round(((langRaw[langKeys[i]] ?? 0) / total) * 100), color: LANG_COLORS[i],
      }));
      const hidden = d.totalHidden ?? 0;
      const scanned = d.totalScanned ?? 1;
      setData({
        totalScanned: d.totalScanned ?? 0, totalHidden: hidden,
        totalReplies: d.totalReplies ?? 0,
        protectionRate: Math.min(99, Math.round((1 - hidden / scanned) * 100)),
        hiddenThisMonth: d.hiddenThisMonth ?? 0, hiddenLastMonth: d.hiddenLastMonth ?? 0,
        repliesSent: d.repliesSent ?? 0, avgResponseTime: d.avgResponseTime ?? 0,
        falsePositiveRate: d.falsePositiveRate ?? 0,
        weeklyData, languageData, spamTrend,
      });
    });
    return () => unsub();
  }, [user]);

  const handleYouTubeConnect = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth?uid=${user?.uid}`;
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '2px solid #F59E0B', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const hiddenDelta = data.hiddenThisMonth - data.hiddenLastMonth;
  const firstName = user?.displayName?.split(' ')[0] || 'User';
  const plan = 'free';

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

        .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; font-size:14px; font-weight:500; text-decoration:none; transition:all 0.2s; color:rgba(255,255,255,0.5); }
        .nav-item:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.9); }
        .nav-item.active { background:rgba(245,158,11,0.12); color:#F59E0B; border-left:2px solid #F59E0B; }

        .bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; z-index:50; background:rgba(9,9,11,0.95); border-top:1px solid #27272A; backdrop-filter:blur(20px); padding:8px 0 env(safe-area-inset-bottom, 8px); }
        .bottom-nav-item { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; flex:1; padding:6px 4px; text-decoration:none; color:rgba(255,255,255,0.4); font-size:10px; font-weight:500; transition:all 0.2s; border:none; background:none; cursor:pointer; }
        .bottom-nav-item.active { color:#F59E0B; }
        .bottom-nav-item:hover { color:rgba(255,255,255,0.8); }

        .glass-card { background:#18181B; border:1px solid #27272A; border-radius:16px; }
        .upgrade-btn { background:linear-gradient(135deg,#F59E0B,#FBBF24); color:#09090B; font-weight:700; padding:10px 16px; border-radius:10px; border:none; cursor:pointer; font-size:13px; width:100%; transition:all 0.2s; }
        .logout-btn { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; font-size:14px; font-weight:500; color:rgba(255,255,255,0.4); background:none; border:none; cursor:pointer; width:100%; transition:all 0.2s; }
        .logout-btn:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.7); }
        .range-btn { padding:6px 12px; border-radius:8px; font-size:12px; font-weight:600; border:none; cursor:pointer; transition:all 0.2s; }
        .search-input { background:rgba(255,255,255,0.05); border:1px solid #27272A; border-radius:10px; padding:8px 16px 8px 36px; color:#FAFAFA; font-size:14px; outline:none; width:200px; transition:all 0.2s; }
        .search-input:focus { border-color:rgba(245,158,11,0.4); }
        .search-input::placeholder { color:rgba(255,255,255,0.3); }
        .connect-btn { background:#F59E0B; color:#09090B; font-weight:700; padding:8px 16px; border-radius:10px; border:none; cursor:pointer; font-size:14px; display:flex; align-items:center; gap:6px; transition:all 0.2s; white-space:nowrap; }
        .connect-btn:hover { background:#FBBF24; transform:translateY(-1px); }

        .sidebar { display:flex; }
        .main-content { margin-left:240px; }

        @media (max-width: 1023px) {
          .sidebar { display:none !important; }
          .main-content { margin-left:0 !important; padding-bottom:72px; }
          .bottom-nav { display:flex; }
          .desktop-only { display:none !important; }
          .header-padding { padding: 12px 16px !important; }
          .content-padding { padding: 16px !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }

        @media (min-width: 1024px) {
          .mobile-only { display:none !important; }
        }
      `}</style>

      <div className="premium-bg" />

      <main style={{ minHeight: '100vh', display: 'flex', position: 'relative', zIndex: 10 }}>

        {/* SIDEBAR */}
        <aside className="sidebar" style={{ width: 240, background: 'rgba(9,9,11,0.8)', borderRight: '1px solid #27272A', flexDirection: 'column', position: 'fixed', height: '100vh', backdropFilter: 'blur(20px)' }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #27272A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={18} color="white" />
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 17 }}>ModerateAI</span>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={`nav-item${item.active ? ' active' : ''}`}>
                <item.icon size={16} /> {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ padding: '12px 8px', borderTop: '1px solid #27272A', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Star size={14} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 13 }}>Upgrade to Pro</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>Unlock unlimited hidden comments and Telegram alerts.</p>
              <Link href="/pricing"><button className="upgrade-btn">Upgrade — ₹349/mo</button></Link>
            </div>
            <button onClick={() => signOut(auth).then(() => router.push('/login'))} className="logout-btn">
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
                <h1 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 18, margin: 0 }}>Analytics</h1>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.15)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#4ade80' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                  Live
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Deep insights into your moderation footprint</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="desktop-only" style={{ position: 'relative' }}>
                <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search comments, users..." />
              </div>

              {/* Connect YouTube — direct backend navigate */}
              <button className="connect-btn desktop-only" onClick={handleYouTubeConnect}>
                <Youtube size={16} /> Connect YouTube
              </button>

              {/* Avatar */}
              <button className="desktop-only" onClick={() => router.push('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.2 }}>{plan} plan</div>
                  </div>
                </div>
              </button>

              <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #27272A', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                <Bell size={16} color="rgba(255,255,255,0.6)" />
                <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: '#F59E0B', borderRadius: '50%' }}></span>
              </button>
            </div>
          </header>

          {/* CONTENT */}
          <div className="content-padding" style={{ padding: '28px 32px', flex: 1 }}>

            {/* Area Chart */}
            <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15, margin: 0 }}>Comments Scanned</h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Hidden vs. auto-replied trend</p>
                </div>
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
                  {(['Daily', 'Weekly', 'Monthly'] as const).map((r) => (
                    <button key={r} onClick={() => setRange(r)} className="range-btn" style={{ background: range === r ? 'rgba(255,255,255,0.12)' : 'transparent', color: range === r ? '#FAFAFA' : 'rgba(255,255,255,0.4)' }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="scannedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hiddenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="scanned" name="Scanned" stroke="#F59E0B" strokeWidth={2} fill="url(#scannedGrad)" dot={false} />
                  <Area type="monotone" dataKey="hidden" name="Hidden" stroke="#ef4444" strokeWidth={1.5} fill="url(#hiddenGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Language + Spam grid */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15, margin: 0 }}>Language Detection</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, marginBottom: 20 }}>Breakdown across all scanned comments</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <PieChart width={150} height={150}>
                    <Pie data={data.languageData} cx={70} cy={70} innerRadius={44} outerRadius={68} paddingAngle={2} dataKey="value" strokeWidth={0}>
                      {data.languageData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.languageData.map((lang) => (
                      <div key={lang.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{lang.name}</span>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>{lang.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 24 }}>
                <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15, margin: 0 }}>Spam Trend</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, marginBottom: 20 }}>Daily spam detected & auto-hidden</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.spamTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="spam" name="Spam" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom stat cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              <div className="glass-card" style={{ padding: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>Total Hidden This Month</p>
                <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32, margin: 0 }}>{data.hiddenThisMonth.toLocaleString()}</p>
                <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: hiddenDelta >= 0 ? '#4ade80' : '#f87171' }}>
                  {hiddenDelta >= 0 ? '+' : ''}{hiddenDelta} vs last month
                </p>
              </div>
              <div className="glass-card" style={{ padding: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>AI Replies Sent</p>
                <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32, margin: 0 }}>{data.repliesSent.toLocaleString()}</p>
                <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: '#4ade80' }}>
                  {data.avgResponseTime > 0 ? `Avg ${data.avgResponseTime}s response time` : 'No replies yet'}
                </p>
              </div>
              <div className="glass-card" style={{ padding: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>False Positive Rate</p>
                <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32, margin: 0 }}>{data.falsePositiveRate.toFixed(1)}%</p>
                <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: '#4ade80' }}>
                  {data.falsePositiveRate === 0 ? 'No data yet' : data.falsePositiveRate < 1 ? 'Best in class' : 'Needs review'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAV — mobile only */}
        <nav className="bottom-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`bottom-nav-item${item.active ? ' active' : ''}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
          <button className="bottom-nav-item" onClick={() => signOut(auth).then(() => router.push('/login'))}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>

      </main>
    </>
  );
}