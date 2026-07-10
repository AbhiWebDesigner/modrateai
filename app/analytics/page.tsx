'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  LayoutDashboard, BarChart2, Zap, Bell, Settings,
  Search, LogOut, Star, ChevronRight, Play
} from 'lucide-react';
const Youtube = Play;
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const LANG_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#6b7280'];

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalScanned: 0,
  totalHidden: 0,
  totalReplies: 0,
  protectionRate: 99,
  hiddenThisMonth: 0,
  hiddenLastMonth: 0,
  repliesSent: 0,
  avgResponseTime: 0,
  falsePositiveRate: 0,
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

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Analytics', icon: BarChart2, href: '/analytics', active: true },
  { label: 'Automation', icon: Zap, href: '/automation' },
  { label: 'Alerts', icon: Bell, href: '/alerts' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e1e32] border border-white/10 rounded-xl px-4 py-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>(DEFAULT_ANALYTICS);
  const [range, setRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [search, setSearch] = useState('');

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ── Firestore real-time listener ────────────────────────────────────────────
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

      const spamTrend = DAYS.map((day, i) => ({
        day,
        spam: d.weekly?.spam?.[i] ?? 0,
      }));

      const langRaw: Record<string, number> = d.languages ?? {};
      const total = Object.values(langRaw).reduce((a, b) => a + b, 0) || 1;
      const langNames = ['English', 'Hinglish', 'Telugu', 'Tamil', 'Hindi', 'Other'];
      const langKeys = ['english', 'hinglish', 'telugu', 'tamil', 'hindi', 'other'];
      const languageData = langNames.map((name, i) => ({
        name,
        value: Math.round(((langRaw[langKeys[i]] ?? 0) / total) * 100),
        color: LANG_COLORS[i],
      }));

      const hidden = d.totalHidden ?? 0;
      const scanned = d.totalScanned ?? 1;

      setData({
        totalScanned: d.totalScanned ?? 0,
        totalHidden: hidden,
        totalReplies: d.totalReplies ?? 0,
        protectionRate: Math.min(99, Math.round((1 - hidden / scanned) * 100)),
        hiddenThisMonth: d.hiddenThisMonth ?? 0,
        hiddenLastMonth: d.hiddenLastMonth ?? 0,
        repliesSent: d.repliesSent ?? 0,
        avgResponseTime: d.avgResponseTime ?? 0,
        falsePositiveRate: d.falsePositiveRate ?? 0,
        weeklyData,
        languageData,
        spamTrend,
      });
    });

    return () => unsub();
  }, [user]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hiddenDelta = data.hiddenThisMonth - data.hiddenLastMonth;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0f0f1a] sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-black text-sm">M</div>
          <span className="font-black text-white text-base tracking-tight">ModrateAI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
            </Link>
          ))}
        </nav>

        {/* Upgrade card */}
        <div className="mx-3 mb-4 p-3.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-gray-400 mb-2.5 leading-relaxed">Unlock unlimited hidden comments and alerts.</p>
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-1.5 rounded-lg transition-colors">
            Upgrade
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut(auth).then(() => router.push('/login'))}
          className="mx-3 mb-5 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#0f0f1a]/80 backdrop-blur border-b border-white/[0.06] px-8 py-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">Analytics</h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Deep insights into your moderation footprint</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search comments, users…"
              className="bg-white/[0.06] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-56 transition-colors"
            />
          </div>

          {/* Connect YouTube */}
          <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            <Youtube className="w-4 h-4" />
            Connect YouTube
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center text-xs font-black">
            {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{user?.displayName ?? 'User'}</p>
            <p className="text-xs text-gray-500 mt-0.5">Free plan</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-6 space-y-6 overflow-y-auto">

          {/* ── Area Chart: Comments Scanned ── */}
          <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-base font-black text-white">Comments Scanned</h2>
                <p className="text-xs text-gray-500 mt-0.5">Hidden vs. auto-replied trend</p>
              </div>
              <div className="flex gap-1 bg-white/[0.06] rounded-xl p-1">
                {(['Daily', 'Weekly', 'Monthly'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      range === r
                        ? 'bg-white/[0.12] text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="scannedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hiddenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="scanned" name="Scanned" stroke="#f59e0b" strokeWidth={2} fill="url(#scannedGrad)" dot={false} />
                <Area type="monotone" dataKey="hidden" name="Hidden" stroke="#ef4444" strokeWidth={1.5} fill="url(#hiddenGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Language Detection + Spam Trend ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Language Donut */}
            <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-black text-white">Language Detection</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-5">Breakdown across all scanned comments</p>
              <div className="flex items-center gap-6">
                <PieChart width={160} height={160}>
                  <Pie
                    data={data.languageData}
                    cx={75}
                    cy={75}
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {data.languageData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex-1 space-y-2">
                  {data.languageData.map((lang) => (
                    <div key={lang.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lang.color }} />
                        <span className="text-sm text-gray-300">{lang.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-400">{lang.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Spam Trend Bar */}
            <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-base font-black text-white">Spam Trend</h2>
              <p className="text-xs text-gray-500 mt-0.5 mb-5">Daily spam detected & auto-hidden</p>
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

          {/* ── Bottom Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Hidden This Month */}
            <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-2">Total Hidden This Month</p>
              <p className="text-3xl font-black text-white">{data.hiddenThisMonth.toLocaleString()}</p>
              <p className={`text-xs mt-1 font-semibold ${hiddenDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {hiddenDelta >= 0 ? '+' : ''}{hiddenDelta} vs last month
              </p>
            </div>

            {/* AI Replies Sent */}
            <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-2">AI Replies Sent</p>
              <p className="text-3xl font-black text-white">{data.repliesSent.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">
                {data.avgResponseTime > 0 ? `Avg ${data.avgResponseTime}s response time` : 'No replies yet'}
              </p>
            </div>

            {/* False Positive Rate */}
            <div className="bg-[#13131f] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-2">False Positive Rate</p>
              <p className="text-3xl font-black text-white">{data.falsePositiveRate.toFixed(1)}%</p>
              <p className="text-xs text-emerald-400 mt-1 font-semibold">
                {data.falsePositiveRate === 0 ? 'No data yet' : data.falsePositiveRate < 1 ? 'Best in class' : 'Needs review'}
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}