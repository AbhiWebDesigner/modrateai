'use client';
import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Lock, Zap, BarChart2, TrendingUp, Globe,
  ShieldCheck, WifiOff, PlayCircle,
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { DashboardSidebar, DashboardBottomNav } from '@/app/components/DashboardLayout';

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
  hiddenThisMonth: number;
  hiddenLastMonth: number;
  repliesSent: number;
  avgResponseTime: number;
  falsePositiveRate: number;
  weeklyData: DailyPoint[];
  languageData: { name: string; value: number; color: string }[];
  spamTrend: { day: string; spam: number }[];
}

type Plan = 'free' | 'pro' | 'agency';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LANG_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#6b7280'];

const DEFAULT_ANALYTICS: AnalyticsData = {
  totalScanned: 0,
  totalHidden: 0,
  totalReplies: 0,
  hiddenThisMonth: 0,
  hiddenLastMonth: 0,
  repliesSent: 0,
  avgResponseTime: 0,
  falsePositiveRate: 0,
  weeklyData: DAYS.map((day) => ({ day, scanned: 0, hidden: 0, replies: 0 })),
  languageData: [
    { name: 'English',  value: 0, color: '#f59e0b' },
    { name: 'Hinglish', value: 0, color: '#8b5cf6' },
    { name: 'Telugu',   value: 0, color: '#06b6d4' },
    { name: 'Tamil',    value: 0, color: '#10b981' },
    { name: 'Hindi',    value: 0, color: '#ef4444' },
    { name: 'Other',    value: 0, color: '#6b7280' },
  ],
  spamTrend: DAYS.map((day) => ({ day, spam: 0 })),
};

// ─── Safe numeric coercion ────────────────────────────────────────────────────
function safeNum(val: unknown, fallback = 0): number {
  if (typeof val !== 'number' || !isFinite(val) || isNaN(val)) return fallback;
  return val;
}

// Returns display string for protection rate; never shows fake 99 / NaN / Infinity
function safeProtectionRate(totalScanned: number, totalHidden: number): string {
  if (totalScanned <= 0) return '—';
  const rate = ((totalScanned - totalHidden) / totalScanned) * 100;
  if (!isFinite(rate) || isNaN(rate)) return '—';
  return `${Math.min(100, Math.max(0, Math.round(rate)))}%`;
}

// ─── Tooltip types ────────────────────────────────────────────────────────────
interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

// ─── Shared Tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#9ca3af', marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── YouTube Not Connected empty state ────────────────────────────────────────
function YoutubeNotConnected() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <PlayCircle size={28} color="#f87171" />
      </div>
      <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 18, marginBottom: 10 }}>YouTube Channel Not Connected</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6, maxWidth: 360, marginBottom: 28 }}>
        Connect your YouTube channel to start tracking comments, spam detection, and moderation analytics in real time.
      </p>
      <a
        href="/settings"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #F59E0B, #d97706)', color: '#07030F', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 10, textDecoration: 'none' }}
      >
        <PlayCircle size={15} color="#07030F" />
        Connect YouTube Channel
      </a>
    </div>
  );
}

// ─── Agency Locked UI ─────────────────────────────────────────────────────────
function AgencyLockedUI() {
  // Static decorative preview data — NOT real analytics
  const previewArea = DAYS.map((day, i) => ({
    day,
    scanned: ([120, 180, 95, 220, 160, 300, 240] as const)[i],
    hidden:  ([12,  18,  8,  22,  14,  28,  20]  as const)[i],
  }));
  const previewBars = DAYS.map((day, i) => ({
    day,
    spam: ([40, 65, 30, 80, 55, 100, 75] as const)[i],
  }));
  const previewLang = [
    { name: 'English',  value: 42, color: '#f59e0b' },
    { name: 'Hinglish', value: 21, color: '#8b5cf6' },
    { name: 'Telugu',   value: 14, color: '#06b6d4' },
    { name: 'Tamil',    value: 10, color: '#10b981' },
    { name: 'Hindi',    value: 8,  color: '#ef4444' },
    { name: 'Other',    value: 5,  color: '#6b7280' },
  ];
  const agencyFeatures = [
    { icon: <BarChart2 size={18} color="#f59e0b" />, label: 'Multi-Account Analytics' },
    { icon: <TrendingUp size={18} color="#8b5cf6" />, label: 'Cross-Profile Trends' },
    { icon: <Globe size={18} color="#06b6d4" />, label: 'Client-Level Reporting' },
    { icon: <ShieldCheck size={18} color="#10b981" />, label: 'Advanced Threat Intel' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Decorative preview — blurred, dimmed, non-interactive */}
      <div style={{ filter: 'blur(3px) brightness(0.35)', pointerEvents: 'none', userSelect: 'none', opacity: 0.7 }}>
        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Multi-Account Comment Streams</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Aggregated across all client profiles</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={previewArea} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="pScannedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pHiddenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Area type="monotone" dataKey="scanned" stroke="#F59E0B" strokeWidth={2} fill="url(#pScannedGrad)" dot={false} />
              <Area type="monotone" dataKey="hidden"  stroke="#ef4444" strokeWidth={1.5} fill="url(#pHiddenGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="charts-grid" style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Language Detection</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, marginBottom: 20 }}>Breakdown across all scanned comments</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <PieChart width={150} height={150}>
                <Pie data={previewLang} cx={70} cy={70} innerRadius={44} outerRadius={68} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {previewLang.map((entry, i) => <Cell key={entry.name} fill={previewLang[i].color} />)}
                </Pie>
              </PieChart>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previewLang.map((lang) => (
                  <div key={lang.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color, display: 'inline-block' }} />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{lang.name}</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>{lang.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Cross-Profile Spam Trend</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, marginBottom: 20 }}>Aggregated daily spam across clients</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={previewBars} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Bar dataKey="spam" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stats-grid" style={{ display: 'grid', gap: 16 }}>
          {(['Total Hidden This Month', 'AI Replies Sent', 'False Positive Rate'] as const).map((label) => (
            <div key={label} className="glass-card" style={{ padding: 20 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>{label}</p>
              <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>—</p>
              <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: '#4ade80' }}>—</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
        <div style={{ background: 'rgba(7,3,15,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 24, padding: '40px 36px', maxWidth: 460, width: '90%', textAlign: 'center', boxShadow: '0 0 60px rgba(245,158,11,0.08)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(124,58,237,0.18))', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={28} color="#F59E0B" />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '4px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Coming Soon</span>
          </div>
          <h2 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Advanced Analytics</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            Advanced Analytics is an upcoming feature exclusive to the Agency plan. Multi-account reporting, cross-profile trend analysis, and client-level dashboards are on the way.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
            {agencyFeatures.map((f) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px' }}>
                {f.icon}
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>{f.label}</span>
              </div>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            We'll notify you as soon as Advanced Analytics goes live.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Basic Analytics (Free Trial) ─────────────────────────────────────────────
function BasicAnalytics({ data, youtubeConnected }: { data: AnalyticsData; youtubeConnected: boolean }) {
  if (!youtubeConnected) return <YoutubeNotConnected />;

  const hiddenDelta = data.hiddenThisMonth - data.hiddenLastMonth;
  const protectionDisplay = safeProtectionRate(data.totalScanned, data.totalHidden);
  const hasData = data.totalScanned > 0;

  return (
    <>
      {/* Area Chart */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Comments Scanned</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Weekly scanned vs hidden</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 10, padding: '4px 12px' }}>
            <Zap size={12} color="#F59E0B" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>Basic Analytics</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="scannedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hiddenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="scanned" name="Scanned" stroke="#F59E0B" strokeWidth={2} fill="url(#scannedGrad)" dot={false} />
            <Area type="monotone" dataKey="hidden"  name="Hidden"  stroke="#ef4444" strokeWidth={1.5} fill="url(#hiddenGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stat cards */}
      <div className="stats-grid" style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Total Scanned</p>
          <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>
            {hasData ? data.totalScanned.toLocaleString() : '—'}
          </p>
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
            {hasData ? 'All time' : 'No data yet'}
          </p>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Hidden This Month</p>
          <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>
            {hasData ? data.hiddenThisMonth.toLocaleString() : '—'}
          </p>
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: hiddenDelta >= 0 ? '#4ade80' : '#f87171' }}>
            {hasData ? `${hiddenDelta >= 0 ? '+' : ''}${hiddenDelta} vs last month` : 'No data yet'}
          </p>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Protection Rate</p>
          <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>{protectionDisplay}</p>
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: hasData ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
            {hasData ? 'Active' : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Upgrade nudge */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Zap size={16} color="#F59E0B" />
            <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 14 }}>Unlock Full Analytics</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            Upgrade to Pro for AI reply stats, language detection, spam trends, and false positive tracking.
          </p>
        </div>
        <a href="/billing" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #F59E0B, #d97706)', color: '#07030F', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Upgrade to Pro
        </a>
      </div>
    </>
  );
}

// ─── Full Analytics (Pro) ─────────────────────────────────────────────────────
function FullAnalytics({ data, youtubeConnected }: { data: AnalyticsData; youtubeConnected: boolean }) {
  if (!youtubeConnected) return <YoutubeNotConnected />;

  const hiddenDelta       = data.hiddenThisMonth - data.hiddenLastMonth;
  const protectionDisplay = safeProtectionRate(data.totalScanned, data.totalHidden);
  const hasData           = data.totalScanned > 0;
  const fprSafe           = safeNum(data.falsePositiveRate, 0);
  const avgTimeSafe       = safeNum(data.avgResponseTime, 0);

  return (
    <>
      {/* Area Chart — always shows weekly data; label is honest */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Comments Scanned</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Hidden vs. auto-replied — weekly view</p>
          </div>
          {/* Static label — range selector removed because only weekly data exists */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '6px 14px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Weekly</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="scannedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hiddenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="scanned" name="Scanned" stroke="#F59E0B" strokeWidth={2} fill="url(#scannedGrad)" dot={false} />
            <Area type="monotone" dataKey="hidden"  name="Hidden"  stroke="#ef4444" strokeWidth={1.5} fill="url(#hiddenGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Language + Spam */}
      <div className="charts-grid" style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Language Detection</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, marginBottom: 20 }}>Breakdown across all scanned comments</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <PieChart width={150} height={150}>
              <Pie data={data.languageData} cx={70} cy={70} innerRadius={44} outerRadius={68} paddingAngle={2} dataKey="value" strokeWidth={0}>
                {data.languageData.map((entry, i) => (
                  <Cell key={entry.name} fill={data.languageData[i].color} />
                ))}
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
          <h2 style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 15 }}>Spam Trend</h2>
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

      {/* Stat cards */}
      <div className="stats-grid" style={{ display: 'grid', gap: 16 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Total Hidden This Month</p>
          <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>
            {hasData ? data.hiddenThisMonth.toLocaleString() : '—'}
          </p>
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: hiddenDelta >= 0 ? '#4ade80' : '#f87171' }}>
            {hasData ? `${hiddenDelta >= 0 ? '+' : ''}${hiddenDelta} vs last month` : 'No data yet'}
          </p>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>AI Replies Sent</p>
          <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>
            {hasData ? data.repliesSent.toLocaleString() : '—'}
          </p>
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: '#4ade80' }}>
            {avgTimeSafe > 0 ? `Avg ${avgTimeSafe}s response time` : 'No replies yet'}
          </p>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Protection Rate</p>
          <p style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 32 }}>{protectionDisplay}</p>
          <p style={{ fontSize: 12, marginTop: 4, fontWeight: 600, color: hasData ? '#4ade80' : 'rgba(255,255,255,0.35)' }}>
            {hasData
              ? (fprSafe === 0 ? 'No false positives' : fprSafe < 1 ? 'Best in class' : 'Needs review')
              : 'No data yet'}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router  = useRouter();
  const mounted = useRef(true);

  const [user,             setUser]             = useState<User | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [plan,             setPlan]             = useState<Plan>('free');
  const [youtubeConnected, setYoutubeConnected] = useState<boolean>(false);
  const [data,             setData]             = useState<AnalyticsData>(DEFAULT_ANALYTICS);

  // Track mount state to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!mounted.current) return;
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // User doc — plan + YouTube connection state
  useEffect(() => {
    if (!user) return;
    const ref  = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!mounted.current) return;
        if (!snap.exists()) return;
        const d = snap.data();

        // Plan — support 'plan' or 'subscription.plan' field shapes
        const rawPlan =
          typeof d?.plan === 'string' ? d.plan :
          typeof d?.subscription?.plan === 'string' ? d.subscription.plan :
          'free';
        const normalizedPlan = rawPlan.toLowerCase().trim();
        if      (normalizedPlan === 'pro')    setPlan('pro');
        else if (normalizedPlan === 'agency') setPlan('agency');
        else                                  setPlan('free');

        // YouTube connection — support multiple field shapes
        const ytConnected =
           d?.youtube_connected === true ||
           d?.youtubeConnected === true ||
           d?.youtube?.connected === true ||
          (typeof d?.youtube?.channelId === 'string' && d.youtube.channelId.trim() !== '');
        setYoutubeConnected(ytConnected);
      },
      () => {
        // Firestore error — keep defaults, do not expose error details
        if (!mounted.current) return;
      },
    );
    return () => unsub();
  }, [user]);

  // Analytics data
  useEffect(() => {
    if (!user) return;
    const ref   = doc(db, 'analytics', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!mounted.current) return;
        if (!snap.exists()) return;
        const d = snap.data();

        // Weekly chart data — safely coerce each value
        const weeklyData: DailyPoint[] = DAYS.map((day, i) => ({
          day,
          scanned: safeNum(d.weekly?.scanned?.[i]),
          hidden:  safeNum(d.weekly?.hidden?.[i]),
          replies: safeNum(d.weekly?.replies?.[i]),
        }));

        const spamTrend = DAYS.map((day, i) => ({
          day,
          spam: safeNum(d.weekly?.spam?.[i]),
        }));

        // Language breakdown — safely coerce each value
        const langRaw: Record<string, unknown> =
          (d.languages !== null && typeof d.languages === 'object' && !Array.isArray(d.languages))
            ? (d.languages as Record<string, unknown>)
            : {};
        const langKeys  = ['english', 'hinglish', 'telugu', 'tamil', 'hindi', 'other'];
        const langNames = ['English', 'Hinglish', 'Telugu', 'Tamil', 'Hindi', 'Other'];
        const rawCounts = langKeys.map((k) => safeNum(langRaw[k] as unknown));
        const langTotal = rawCounts.reduce((a, b) => a + b, 0);
        const languageData = langNames.map((name, i) => ({
          name,
          value: langTotal > 0 ? Math.round((rawCounts[i] / langTotal) * 100) : 0,
          color: LANG_COLORS[i],
        }));

        const totalScanned   = safeNum(d.totalScanned);
        const totalHidden    = safeNum(d.totalHidden);
        const hiddenThisMonth = safeNum(d.hiddenThisMonth);
        const hiddenLastMonth = safeNum(d.hiddenLastMonth);
        const repliesSent    = safeNum(d.repliesSent);
        const avgResponseTime = safeNum(d.avgResponseTime);
        const falsePositiveRate = Math.max(0, Math.min(100, safeNum(d.falsePositiveRate)));

        setData({
          totalScanned,
          totalHidden,
          totalReplies:   safeNum(d.totalReplies),
          hiddenThisMonth,
          hiddenLastMonth,
          repliesSent,
          avgResponseTime,
          falsePositiveRate,
          weeklyData,
          languageData,
          spamTrend,
        });
      },
      () => {
        // Firestore error — keep defaults, do not crash or expose error details
        if (!mounted.current) return;
      },
    );
    return () => unsub();
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#07030F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '2px solid #F59E0B', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const firstName = (typeof user?.displayName === 'string' && user.displayName.trim())
    ? user.displayName.trim().split(' ')[0]
    : 'User';

  const planBadge: Record<Plan, { label: string; bg: string; color: string }> = {
    free:   { label: 'Basic Analytics',    bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B' },
    pro:    { label: 'Full Analytics',     bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa' },
    agency: { label: 'Advanced Analytics', bg: 'rgba(6,182,212,0.12)',   color: '#22d3ee' },
  };
  const badge = planBadge[plan];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07030F; color: white; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

        .desktop-sidebar { display: none; }
        .bottom-nav-wrap { display: flex; }
        .main-content    { margin-left: 0; padding-bottom: 80px; }

        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; flex-direction: column; }
          .bottom-nav-wrap { display: none !important; }
          .main-content    { margin-left: 228px; padding-bottom: 0; }
          .desktop-only    { display: flex !important; }
          .header-padding  { padding: 16px 32px !important; }
          .content-padding { padding: 28px 32px !important; }
          .charts-grid     { grid-template-columns: 1fr 1fr !important; }
          .stats-grid      { grid-template-columns: repeat(3,1fr) !important; }
        }

        .desktop-only    { display: none; }
        .header-padding  { padding: 12px 16px; }
        .content-padding { padding: 16px; }
        .charts-grid     { grid-template-columns: 1fr; }
        .stats-grid      { grid-template-columns: 1fr; }

        .glass-card { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; }
        .range-btn  { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
      `}</style>

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 55% 50% at 5% 15%, rgba(245,158,11,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 55% at 5% 95%, rgba(109,40,217,0.18) 0%, transparent 62%), #07030F', pointerEvents: 'none' }} />

      <div className="desktop-sidebar"><DashboardSidebar /></div>
      <div className="bottom-nav-wrap"><DashboardBottomNav /></div>

      <div className="main-content" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* HEADER */}
        <header className="header-padding" style={{ background: 'rgba(7,3,15,0.80)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 18 }}>Analytics</h1>

              {/* Plan tier badge */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: badge.bg, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {badge.label}
              </span>

              {/* Connection status — only for free/pro */}
              {plan !== 'agency' && (
                youtubeConnected ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.15)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#4ade80' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    Live
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.12)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#f87171' }}>
                    <WifiOff size={11} color="#f87171" />
                    Not Connected
                  </span>
                )
              )}
            </div>

            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {plan === 'agency'                        && 'Advanced Analytics — coming soon for Agency'}
              {plan !== 'agency' &&  youtubeConnected  && plan === 'free' && 'Basic moderation insights for your account'}
              {plan !== 'agency' &&  youtubeConnected  && plan === 'pro'  && 'Deep insights into your moderation footprint'}
              {plan !== 'agency' && !youtubeConnected  && 'Connect your YouTube channel to start seeing analytics'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="desktop-only" onClick={() => router.push('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '6px 12px 6px 6px' }}>
                {user?.photoURL ? (
                  <img src={user.photoURL} style={{ width: 32, height: 32, borderRadius: '50%' }} alt="avatar" />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
                    {firstName.charAt(0)}
                  </div>
                )}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{firstName}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.2, textTransform: 'capitalize' }}>{plan} plan</div>
                </div>
              </div>
            </button>

          </div>
        </header>

        {/* CONTENT */}
        <div className="content-padding" style={{ flex: 1 }}>
          {plan === 'free'   && <BasicAnalytics data={data} youtubeConnected={youtubeConnected} />}
          {plan === 'pro'    && <FullAnalytics   data={data} youtubeConnected={youtubeConnected} />}
          {plan === 'agency' && <AgencyLockedUI />}
        </div>

      </div>
    </>
  );
}