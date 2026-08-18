'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Globe, Lock, BarChart3, MessageSquare,
  ChevronDown, Check, ArrowRight, Eye, EyeOff,
  CheckCircle, Languages, Cpu,
  TrendingUp, Filter, Bell, X, Menu, Sparkles, Play
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

/* ── FADE IN ── */
function FadeIn({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  return (
    <motion.div ref={ref} className={className} style={style}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ── COUNTER ── */
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20px 0px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let v = 0; const dur = 1600; const step = 16; const inc = to / (dur / step);
    const t = setInterval(() => { v += inc; if (v >= to) { setVal(to); clearInterval(t); } else setVal(Math.floor(v)); }, step);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── LIVE FEED DATA ── */
const COMMENTS = [
  { id: 1, author: 'Alex_Gaming98', text: 'This is spam content promoting...', badge: 'toxic', avatar: 'A', time: '2s ago' },
  { id: 2, author: 'CryptoMaster', text: 'Potential scam or misleading info...', badge: 'spam', avatar: 'C', time: '5s ago' },
  { id: 3, author: 'CreatorFan_123', text: 'Thanks for the great content!', badge: 'safe', avatar: 'CF', time: '8s ago' },
  { id: 4, author: 'Rahul_K', text: 'यह वीडियो बहुत अच्छी है, धन्यवाद', badge: 'safe', avatar: 'R', time: '12s ago' },
  { id: 5, author: 'h8r_2024', text: 'Nobody asked for your opinion lmao', badge: 'toxic', avatar: 'H', time: '15s ago' },
  { id: 6, author: 'PromoKing', text: 'Earn $500/day from home - DM me NOW', badge: 'spam', avatar: 'P', time: '18s ago' },
];

const BADGE: Record<string, { bg: string; color: string; label: string; border: string }> = {
  toxic: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Hidden', border: 'rgba(239,68,68,0.3)' },
  spam: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', label: 'Flagged', border: 'rgba(249,115,22,0.3)' },
  safe: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Replied', border: 'rgba(16,185,129,0.3)' },
};

function LiveFeed({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<typeof COMMENTS>([]);
  const [scanning, setScanning] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    const tick = () => {
      setScanning(true);
      setTimeout(() => {
        const c = COMMENTS[idx.current % COMMENTS.length]; idx.current++;
        setItems(prev => [c, ...prev].slice(0, compact ? 3 : 4)); setScanning(false);
      }, 900);
    };
    tick(); const t = setInterval(tick, 3000); return () => clearInterval(t);
  }, [compact]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <AnimatePresence>
        {scanning && (
          <motion.div key="sc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', animation: 'lp-pulse 1s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10 }}>AI scanning…</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#F59E0B', opacity: 0.5, animation: `lp-bounce 0.8s ${i * 0.18}s infinite` }} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {items.map((c, i) => {
          const b = BADGE[c.badge];
          return (
            <motion.div key={`${c.id}-${i}`}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1 - i * 0.18, y: 0 }} transition={{ duration: 0.28 }}
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 7, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: c.badge === 'safe' ? 'rgba(16,185,129,0.15)' : c.badge === 'spam' ? 'rgba(249,115,22,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.badge === 'safe' ? '#34d399' : c.badge === 'spam' ? '#fb923c' : '#f87171', fontSize: 8, fontWeight: 700 }}>{c.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: 600 }}>@{c.author}</span>
                  <span style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontSize: 8.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{b.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginLeft: 'auto' }}>{c.time}</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── DASHBOARD PREVIEW (used everywhere) ── */
function DashboardPreview() {
  const SIDEBAR_ICONS = [
    { icon: BarChart3, color: '#F59E0B', active: true },
    { icon: TrendingUp, color: 'rgba(255,255,255,0.25)', active: false },
    { icon: MessageSquare, color: 'rgba(255,255,255,0.25)', active: false },
    { icon: Shield, color: 'rgba(255,255,255,0.25)', active: false },
    { icon: Filter, color: 'rgba(255,255,255,0.25)', active: false },
    { icon: Bell, color: 'rgba(255,255,255,0.25)', active: false },
  ];

  return (
    <div style={{
      background: '#0D0D14',
      borderRadius: 20,
      overflow: 'hidden',
      border: '1.5px solid rgba(139,92,246,0.55)',
      boxShadow: '0 0 0 1px rgba(139,92,246,0.15), 0 0 30px rgba(139,92,246,0.35), 0 0 60px rgba(139,92,246,0.2), 0 0 90px rgba(236,72,153,0.12), 0 24px 60px rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{ background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', borderRadius: 8, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={12} color="white" />
          </div>
          <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 13 }}>Moderate<span style={{ color: '#F59E0B' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={14} color="rgba(255,255,255,0.3)" />
          <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(16,185,129,0.25)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'lp-pulse 2s infinite' }} /> Live
          </span>
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <div style={{ width: 36, background: '#0A0A12', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 6, flexShrink: 0 }}>
          {SIDEBAR_ICONS.map((s, i) => (
            <div key={i} style={{
              width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: s.active ? 'rgba(245,158,11,0.12)' : 'transparent',
              border: s.active ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
            }}>
              <s.icon size={13} color={s.active ? '#F59E0B' : 'rgba(255,255,255,0.22)'} />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Nav tabs */}
          <div style={{ background: '#0E0E14', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0 10px', display: 'flex', gap: 0, overflowX: 'auto', flexShrink: 0 }}>
            {['Overview', 'Analytics', 'Automation', 'Alerts', 'Settings'].map((t, i) => (
              <div key={t} style={{ padding: '9px 8px', fontSize: 9.5, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#F59E0B' : 'rgba(255,255,255,0.25)', borderBottom: i === 0 ? '2px solid #F59E0B' : '2px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>{t}</div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ background: '#09090F', padding: '10px 10px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {[
              { label: 'Comments Scanned', value: '12,847', change: '+18.6%', color: '#F59E0B', pts: '0,18 10,14 20,16 30,10 40,12 50,6 60,4' },
              { label: 'Toxic Hidden', value: '1,203', change: '+24.5%', color: '#f87171', pts: '0,16 10,18 20,12 30,14 40,8 50,10 60,5' },
              { label: 'AI Replied', value: '847', change: '+16.3%', color: '#60a5fa', pts: '0,18 10,15 20,17 30,11 40,13 50,7 60,4' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '8px 8px' }}>
                <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 7.5, marginBottom: 3, lineHeight: 1.3 }}>{s.label}</div>
                <div style={{ color: s.color, fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums', marginBottom: 1 }}>{s.value}</div>
                <div style={{ color: '#34d399', fontSize: 7.5, fontWeight: 600, marginBottom: 3 }}>{s.change}</div>
                <svg width="100%" height="18" viewBox="0 0 60 20">
                  <polyline points={s.pts} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" />
                </svg>
              </div>
            ))}
          </div>

          {/* Accuracy chart */}
          <div style={{ background: '#07070D', padding: '10px 10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 8, marginBottom: 2 }}>Detection Accuracy</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ color: '#F0F0F0', fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em' }}>98.2%</span>
                  <span style={{ color: '#34d399', fontSize: 8, fontWeight: 600 }}>+2.4%</span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '2px 7px', fontSize: 8, color: 'rgba(255,255,255,0.28)' }}>Today ▾</div>
            </div>
            <div style={{ position: 'relative', height: 46 }}>
              <svg width="100%" height="46" viewBox="0 0 300 46" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,38 C20,36 40,30 60,24 C80,18 100,26 120,18 C140,10 160,14 180,7 C200,1 220,5 240,2 C260,0 280,1 300,0" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
                <path d="M0,38 C20,36 40,30 60,24 C80,18 100,26 120,18 C140,10 160,14 180,7 C200,1 220,5 240,2 C260,0 280,1 300,0 L300,46 L0,46 Z" fill="url(#mChartGrad)" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'].map(t => (
                  <span key={t} style={{ color: 'rgba(255,255,255,0.16)', fontSize: 6.5 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Live feed */}
          <div style={{ padding: '8px 10px 12px', background: '#06060C', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9.5, fontWeight: 600 }}>Live Moderation Feed</span>
              <span style={{ color: '#8B5CF6', fontSize: 8.5, fontWeight: 600 }}>View All</span>
            </div>
            <LiveFeed compact />
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── DATA ── */
const STEPS = [
  { icon: Shield, label: 'Connect YouTube', detail: 'Secure OAuth connection with read-only access.', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { icon: Cpu, label: 'AI monitors every comment', detail: 'Each comment is analyzed in real time by our AI.', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { icon: Languages, label: 'Language auto-detected', detail: 'Detects 100+ languages and applies cultural rules.', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { icon: EyeOff, label: 'Harmful content hidden', detail: 'Toxic and spam comments are hidden instantly.', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  { icon: MessageSquare, label: 'AI replies naturally', detail: 'Genuine comments receive contextual replies.', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { icon: BarChart3, label: 'Analytics updated', detail: 'Every moderation event is logged in real time.', color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
];

const FEATURES = [
  { icon: Cpu, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', title: 'AI Spam & Toxic Detection', body: 'Advanced AI models detect spam, hate speech, scams, and harmful content.' },
  { icon: Zap, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', title: 'Auto Moderation', body: 'Automatically hide, block, or take action based on your custom rules.' },
  { icon: MessageSquare, color: '#f87171', bg: 'rgba(239,68,68,0.1)', title: 'AI-Powered Replies', body: 'Smart, context-aware replies that engage your audience naturally.' },
  { icon: Bell, color: '#fb923c', bg: 'rgba(251,146,60,0.1)', title: 'Instant Alerts', body: 'Get notified the moment a coordinated spam attack begins on your channel.' },
  { icon: TrendingUp, color: '#34d399', bg: 'rgba(16,185,129,0.1)', title: 'Engagement Analytics', body: 'Comment volume, toxicity trends, reply performance — one dashboard.' },
  { icon: Filter, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', title: 'Custom Rules', body: 'Keyword blocklists, sensitivity thresholds, safe-lists — fully configurable.' },
];

const SEC = [
  { icon: Lock, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', title: 'Industry-Standard Encryption', body: 'Your data is protected using industry-standard encryption both in transit and at rest.' },
  { icon: Shield, color: '#10B981', bg: 'rgba(16,185,129,0.08)', title: 'Secure OAuth Authentication', body: 'Official YouTube OAuth authentication with secure scoped access. Your password is never stored.' },
  { icon: Globe, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', title: 'Enterprise-Grade Infrastructure', body: 'Global protection, encrypted connections, and intelligent traffic filtering help safeguard every request.' },
  { icon: Eye, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', title: 'Zero Data Selling', body: 'Your channel and moderation data is never sold, shared, or used to train third-party AI models.' },
  { icon: Zap, color: '#fb923c', bg: 'rgba(251,146,60,0.08)', title: 'Secure Session Management', body: 'View active sessions, revoke access instantly, and maintain full control over your account.' },
  { icon: Filter, color: '#f87171', bg: 'rgba(239,68,68,0.08)', title: 'Intelligent Rate Limiting', body: 'Automatic abuse detection and smart request throttling help protect your account and platform stability.' },
];

const LANGS = [
  { flag: '🇮🇳', name: 'Hindi' }, { flag: '🇮🇳', name: 'Tamil' }, { flag: '🇮🇳', name: 'Telugu' },
  { flag: '🇮🇳', name: 'Kannada' }, { flag: '🇮🇳', name: 'Bengali' }, { flag: '🇮🇳', name: 'Marathi' },
  { flag: '🇺🇸', name: 'English' }, { flag: '🇪🇸', name: 'Spanish' }, { flag: '🇵🇹', name: 'Portuguese' },
  { flag: '🇫🇷', name: 'French' }, { flag: '🇩🇪', name: 'German' }, { flag: '🇯🇵', name: 'Japanese' },
  { flag: '🇰🇷', name: 'Korean' }, { flag: '🇸🇦', name: 'Arabic' }, { flag: '🇷🇺', name: 'Russian' },
  { flag: '🇮🇩', name: 'Indonesian' }, { flag: '🇹🇷', name: 'Turkish' }, { flag: '🇨🇳', name: 'Chinese' },
  { flag: '🇮🇹', name: 'Italian' }, { flag: '🌍', name: '+80 more' },
];

const PLANS = [
  {
    name: 'Free Trial', monthly: 0, annual: 0,
    desc: 'Try ModerateAI free for 19 days.',
    features: ['19-Day Free Trial', '1 YouTube Channel', '2,000 Comments Scanned', 'AI Toxic Detection', 'AI Spam Detection', 'Review Queue', '250 AI Actions', 'Smart AI Replies (Max 3 Per Video)', 'Basic Analytics Dashboard', '10+ Languages', 'Email Support'],
    missing: [], cta: 'Start Free Trial', primary: false, hl: false, badge: null,
  },
  {
    name: 'Pro', monthly: 349, annual: 299,
    desc: 'Perfect for growing creators.',
    features: ['1 YouTube Channel', '25,000 Comments Scanned / Month', 'AI Toxic Detection', 'AI Spam Detection', 'Auto Hide', 'Review Queue', 'Live Chat Moderation', 'Progressive Live Chat Timeouts', '1,900 AI Actions / Month', 'Smart AI Replies (Max 3 Per Video)', 'Unlimited Automation Rules', 'Full Analytics Dashboard', '50+ Languages', 'Priority Email Support'],
    missing: [], cta: 'Start 19-Day Trial', primary: true, hl: true, badge: 'Most Popular',
  },
  {
    name: 'Agency', monthly: 2499, annual: 2149,
    desc: 'Built for businesses & agencies.',
    features: ['2 YouTube Channels', '150,000 Comments Scanned / Month', 'AI Toxic Detection', 'AI Spam Detection', 'Auto Hide', 'Review Queue', 'Live Chat Moderation', 'Progressive Live Chat Timeouts', '15,000 AI Actions / Month', 'Smart AI Replies (Max 3 Per Video)', 'Unlimited Automation Rules', 'Advanced Analytics Dashboard', 'Telegram Alerts', '100+ Languages', 'Dedicated Priority Support'],
    missing: [], cta: 'Get Agency', primary: false, hl: false, badge: null,
  },
];

const FAQS = [
  { q: 'How does ModerateAI connect to YouTube?', a: 'You authorize via YouTube\'s official OAuth flow. We never store your password — only a revocable, scoped access token.' },
  { q: 'Which languages does the AI understand?', a: 'ModerateAI detects intent in 100+ languages — Hindi, Tamil, Arabic, Spanish, Korean, and more — with no extra configuration.' },
  { q: 'Will the AI accidentally hide genuine comments?', a: 'Our AI is designed for high accuracy with a very low false-positive rate. It reads context, not just keywords. Every hidden comment is reviewable and restorable.' },
  { q: 'How long does setup take?', a: 'Under 2 minutes. Connect YouTube, choose your sensitivity level, done. No code, no plugins.' },
  { q: 'Can I customize what gets hidden?', a: 'Yes. Keyword rules, sensitivity thresholds, language filters, and safe-lists — or let the AI handle everything automatically.' },
  { q: 'Is my channel data secure?', a: 'Your data is protected using industry-standard encryption in transit and at rest. It is never sold, shared, or used to train third-party models.' },
];

/* ══ MAIN ══ */
export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { router.replace('/dashboard'); } else { setAuthChecked(true); }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 36);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  if (!authChecked) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp {
          font-family: 'Inter', -apple-system, sans-serif;
          background: #080808; color: #F0F0F0;
          overflow-x: hidden; -webkit-font-smoothing: antialiased;
        }

        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes lp-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes lp-grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .serif { font-family: 'Playfair Display', Georgia, serif; }

        .grad-text {
          background: linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: lp-grad 5s ease infinite;
        }

        /* ══ NAVBAR — Desktop ══ */
        .lp-nav {
          position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
          z-index: 200; width: calc(100% - 32px); max-width: 1120px;
          background: rgba(8,8,8,0.75); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 0 18px;
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          display: flex; align-items: center; height: 52px;
          transition: all 0.35s ease;
        }
        .lp-nav.scrolled { height: 48px; box-shadow: 0 4px 28px rgba(0,0,0,0.55); }
        .n-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; }
        .n-mark { background: linear-gradient(135deg,#F59E0B,#7C3AED); border-radius: 8px; width: 27px; height: 27px; display: flex; align-items: center; justify-content: center; }
        .n-name { color: #F0F0F0; font-weight: 800; font-size: 14.5px; letter-spacing: -0.025em; }
        .n-name span { color: #F59E0B; }
        .n-links { display: flex; align-items: center; margin: 0 auto; }
        .n-link { color: rgba(255,255,255,0.42); font-size: 13px; font-weight: 500; text-decoration: none; padding: 6px 10px; border-radius: 7px; transition: color 0.2s, background 0.2s; }
        .n-link:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.04); }
        .n-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .n-login { color: #FAFAFA; font-size: 13px; font-weight: 600; text-decoration: none; padding: 7px 16px; border: 1px solid rgba(139,92,246,0.6); border-radius: 8px; transition: all 0.25s; box-shadow: 0 0 10px rgba(139,92,246,0.15); }
        .n-login:hover { border-color: rgba(139,92,246,1); background: rgba(139,92,246,0.1); box-shadow: 0 0 20px rgba(139,92,246,0.3); }
        .n-burger { display: none; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.6); padding: 4px; }

        /* ══ NAVBAR — Mobile ══ */
        @media (max-width: 800px) {
          .lp-nav {
            top: 0; left: 0; right: 0; transform: none;
            width: 100%; max-width: 100%;
            border-radius: 0;
            border-left: none; border-right: none; border-top: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding: 0 16px; height: 56px;
            background: rgba(6,6,10,0.96);
          }
          .lp-nav.scrolled { height: 52px; }
          .n-links { display: none !important; }
          .n-right { display: none !important; }
          .n-burger { display: flex !important; margin-left: auto; }
          .n-mob-login { display: flex !important; }
        }

        .n-mob-login {
          display: none;
          color: #FAFAFA; font-size: 13px; font-weight: 600;
          text-decoration: none; padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
          margin-left: auto; margin-right: 8px;
          align-items: center;
        }

        .mob-menu {
          position: fixed; top: 56px; left: 0; right: 0; z-index: 199;
          background: rgba(6,6,10,0.98); border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 16px 16px; backdrop-filter: blur(28px);
          display: flex; flex-direction: column; gap: 2px;
        }
        .mob-a { color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 500; text-decoration: none; padding: 11px 14px; border-radius: 9px; transition: all 0.18s; display: block; }
        .mob-a:hover { background: rgba(255,255,255,0.04); color: #F0F0F0; }

        /* ══ HERO — Desktop ══ */
        .hero {
          padding: 112px 24px 72px; position: relative; overflow: hidden;
          background:
            radial-gradient(ellipse 70% 55% at 15% 20%, rgba(245,158,11,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 55% 55% at 85% 80%, rgba(139,92,246,0.1) 0%, transparent 60%),
            #080808;
        }
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, black 10%, transparent 80%);
        }
        .hero-inner {
          position: relative; z-index: 2; max-width: 1120px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
        }
        .h-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 20px; padding: 5px 14px 5px 10px; margin-bottom: 28px; }
        .h-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #F59E0B; animation: lp-pulse 2s infinite; }
        .h-badge-text { color: rgba(245,158,11,0.88); font-size: 12px; font-weight: 600; letter-spacing: 0.02em; }
        .h1 { font-size: clamp(34px, 4.5vw, 58px); font-weight: 800; letter-spacing: -0.035em; line-height: 1.08; color: #F0F0F0; margin-bottom: 22px; }
        .h-desc { color: rgba(255,255,255,0.4); font-size: 16px; line-height: 1.7; max-width: 450px; margin-bottom: 36px; }
        .h-btns { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
        .btn-p { display: inline-flex; align-items: center; gap: 7px; background: #F59E0B; color: #080808; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 10px; text-decoration: none; border: none; cursor: pointer; transition: all 0.22s; white-space: nowrap; }
        .btn-p:hover { background: #FBBF24; box-shadow: 0 0 28px rgba(245,158,11,0.35); transform: translateY(-1px); }
        .btn-g { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); color: rgba(255,255,255,0.78); font-weight: 600; font-size: 14px; padding: 12px 22px; border-radius: 10px; text-decoration: none; cursor: pointer; transition: all 0.22s; white-space: nowrap; }
        .btn-g:hover { background: rgba(255,255,255,0.08); }
        .h-trust { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
        .h-trust-item { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.33); font-size: 12.5px; }
        .hero-right { animation: lp-float 7s ease-in-out infinite; }

        /* ══ HERO — Mobile ══ */
        @media (max-width: 800px) {
          .hero {
            padding: 68px 0 0;
            background:
              radial-gradient(ellipse 140% 55% at 50% -5%, rgba(139,92,246,0.2) 0%, transparent 55%),
              radial-gradient(ellipse 80% 50% at 5% 70%, rgba(245,158,11,0.06) 0%, transparent 55%),
              #06060E;
            min-height: 100svh;
            display: flex; flex-direction: column;
          }
          .hero-grid { display: none; }
          .hero-inner {
            display: flex !important;
            flex-direction: column !important;
            gap: 0 !important;
            padding: 0 !important;
            align-items: stretch !important;
            flex: 1;
          }
          .hero-left-mob { padding: 28px 20px 20px; order: 1; }
          .hero-right {
            animation: none !important;
            order: 2;
            padding: 16px 16px 32px;
            background: radial-gradient(ellipse 100% 70% at 50% 20%, rgba(139,92,246,0.1) 0%, transparent 65%);
          }
          .h-badge { margin-bottom: 16px; padding: 4px 12px 4px 9px; }
          .h-badge-text { font-size: 11px; }
          .h1 { font-size: 28px !important; line-height: 1.13 !important; margin-bottom: 14px !important; letter-spacing: -0.03em !important; }
          .h-desc { font-size: 13.5px !important; line-height: 1.6 !important; margin-bottom: 20px !important; color: rgba(255,255,255,0.36) !important; max-width: 100% !important; }
          .h-btns { flex-direction: row !important; gap: 8px !important; margin-bottom: 16px !important; }
          .btn-p { font-size: 13px !important; padding: 11px 16px !important; border-radius: 9px !important; flex: 1; justify-content: center; }
          .btn-g { font-size: 13px !important; padding: 11px 14px !important; border-radius: 9px !important; flex: 1; justify-content: center; gap: 5px !important; }
          .h-trust { gap: 10px !important; }
          .h-trust-item { font-size: 11px !important; gap: 4px !important; }
        }

        /* ══ STATS ══ */
        .stats { background: #0E0E0E; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 40px 24px; }
        .stats-row { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; }
        .s-cell { display: flex; flex-direction: column; align-items: center; padding: 12px 44px; position: relative; }
        .s-cell + .s-cell::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:1px; height:26px; background:rgba(255,255,255,0.07); }
        .s-num { font-size: 28px; font-weight: 900; color: #F0F0F0; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1; }
        .s-lbl { color: rgba(255,255,255,0.3); font-size: 11px; font-weight: 500; margin-top: 5px; letter-spacing: 0.05em; text-transform: uppercase; }
        .s-icon-wrap { display: none; }
        .s-text { display: flex; flex-direction: column; align-items: center; }

        @media (max-width: 800px) {
          .stats {
            background: transparent;
            border: none;
            padding: 16px 16px 0;
          }
          .stats-inner-mob {
            background: #0A0A12;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            overflow: hidden;
          }
          .stats-row {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            flex-wrap: unset !important;
          }
          .s-cell {
            padding: 14px 14px !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 11px !important;
            position: relative;
          }
          .s-cell::before { display: none !important; }
          .s-cell:nth-child(1) { border-bottom: 1px solid rgba(255,255,255,0.05); }
          .s-cell:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.05); border-left: 1px solid rgba(255,255,255,0.05); }
          .s-cell:nth-child(3) {}
          .s-cell:nth-child(4) { border-left: 1px solid rgba(255,255,255,0.05); }
          .s-cell:nth-child(5) { display: none !important; }
          .s-icon-wrap {
            display: flex !important;
            width: 34px; height: 34px; border-radius: 9px;
            align-items: center; justify-content: center; flex-shrink: 0;
          }
          .s-text { align-items: flex-start !important; }
          .s-num { font-size: 18px !important; }
          .s-lbl { font-size: 10px !important; margin-top: 2px !important; letter-spacing: 0.02em !important; }
        }

        /* ══ SECTIONS ══ */
        .section { padding: 96px 24px; }
        .con { max-width: 1120px; margin: 0 auto; }
        .eyebrow { display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.28); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .eyebrow-dark { display: inline-flex; align-items: center; gap: 5px; color: rgba(0,0,0,0.3); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .sh { font-size: clamp(24px,3.4vw,42px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.1; margin-bottom: 16px; }
        .sh-dark { font-size: clamp(24px,3.4vw,42px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.1; margin-bottom: 16px; color: #0A0A0A; }
        .sub { color: rgba(255,255,255,0.38); font-size: 15.5px; line-height: 1.65; max-width: 480px; }
        .sub-dark { color: rgba(0,0,0,0.44); font-size: 15.5px; line-height: 1.65; max-width: 480px; }

        .mob-pill { display: none; }
        @media (max-width: 800px) {
          .mob-pill {
            display: inline-flex !important;
            align-items: center; gap: 6px;
            background: rgba(139,92,246,0.1);
            border: 1px solid rgba(139,92,246,0.22);
            border-radius: 20px; padding: 4px 12px;
            margin-bottom: 14px;
            font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: #a78bfa;
          }
          .eyebrow { display: none !important; }
          .section { padding: 52px 20px !important; }
        }

        /* ══ HOW IT WORKS ══ */
        .how-bg { background: linear-gradient(180deg, #0C0C0C 0%, #0F0F0F 100%); }
        .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        .tl { position: relative; margin-top: 48px; }
        .tl-line { position: absolute; left: 19px; top: 6px; bottom: 6px; width: 1px; background: linear-gradient(180deg, rgba(245,158,11,0.6) 0%, rgba(139,92,246,0.18) 100%); }
        .tl-row { display: flex; gap: 18px; padding-bottom: 32px; }
        .tl-row:last-child { padding-bottom: 0; }
        .tl-dot { width: 38px; height: 38px; border-radius: 10px; background: #131313; border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1; transition: all 0.28s; }
        .tl-row:hover .tl-dot { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.26); }
        .tl-body { padding-top: 7px; }
        .tl-body h3 { font-size: 14.5px; font-weight: 700; color: #F0F0F0; margin-bottom: 4px; letter-spacing: -0.02em; }
        .tl-body p { font-size: 13px; color: rgba(255,255,255,0.33); line-height: 1.55; }

        @media (max-width: 800px) {
          .how-bg { background: #06060E; }
          .how-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .tl { margin-top: 24px !important; }
          .tl-line { left: 21px !important; background: linear-gradient(180deg, rgba(139,92,246,0.5) 0%, rgba(245,158,11,0.15) 100%) !important; }
          .tl-row { gap: 14px !important; padding-bottom: 22px !important; }
          .tl-dot {
            width: 42px !important; height: 42px !important; border-radius: 12px !important;
            background: var(--sdot-bg) !important;
            border: 1px solid var(--sdot-border) !important;
          }
          .tl-body h3 { font-size: 13px !important; }
          .tl-body p { font-size: 11.5px !important; color: rgba(255,255,255,0.28) !important; }
        }

        /* ══ FEATURES ══ */
        .feat-bg { background: #090909; }
        .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 48px; }
        .f-card { background: #101010; border: 1px solid rgba(255,255,255,0.055); border-radius: 16px; padding: 26px; transition: all 0.3s; position: relative; overflow: hidden; }
        .f-card:hover { border-color: rgba(245,158,11,0.13); transform: translateY(-2px); box-shadow: 0 18px 50px rgba(0,0,0,0.45); }
        .f-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .f-card h3 { font-size: 15px; font-weight: 700; color: #F0F0F0; margin-bottom: 7px; }
        .f-card p { font-size: 13px; color: rgba(255,255,255,0.36); line-height: 1.6; }

        @media (max-width: 800px) {
          .feat-bg { background: #06060E; }
          .feat-grid { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; margin-top: 20px !important; }
          .f-card { padding: 14px 12px !important; border-radius: 12px !important; background: rgba(255,255,255,0.025) !important; border: 1px solid rgba(255,255,255,0.055) !important; }
          .f-icon { width: 34px !important; height: 34px !important; border-radius: 9px !important; margin-bottom: 9px !important; }
          .f-card h3 { font-size: 11.5px !important; margin-bottom: 4px !important; }
          .f-card p { font-size: 10px !important; line-height: 1.45 !important; color: rgba(255,255,255,0.28) !important; }
        }

        /* ══ LANGUAGES ══ */
        .lang-bg { background: linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%); }
        .lang-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 40px; }
        .l-chip { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.033); border: 1px solid rgba(255,255,255,0.063); border-radius: 26px; padding: 7px 15px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.48); transition: all 0.22s; }
        .l-chip:hover { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.2); color: rgba(255,255,255,0.82); }

        @media (max-width: 800px) {
          .lang-bg { background: #06060E; }
          .l-chip { font-size: 11.5px !important; padding: 6px 11px !important; }
          .lang-chips { gap: 6px !important; margin-top: 20px !important; }
        }

        /* ══ SECURITY ══ */
        .sec-bg { background: #FAFAFA; }
        .sec-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 48px; }
        .s-card { background: #F2F2F0; border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 24px; transition: all 0.22s; }
        .s-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .s-ico { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .s-card h3 { font-size: 14px; font-weight: 700; color: #0A0A0A; margin-bottom: 5px; }
        .s-card p { font-size: 12.5px; color: rgba(0,0,0,0.42); line-height: 1.55; }
        @media (max-width: 780px) { .sec-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 460px) { .sec-grid { grid-template-columns: 1fr; } }

        /* ══ PRICING ══ */
        .price-bg { background: #F5F5F3; }
        .p-toggle { display: inline-flex; background: rgba(0,0,0,0.06); border-radius: 9px; padding: 3px; margin: 24px auto 0; }
        .pt-btn { padding: 6px 17px; border-radius: 7px; font-size: 12.5px; font-weight: 600; border: none; cursor: pointer; transition: all 0.18s; }
        .pt-btn.on { background: #0A0A0A; color: #FAFAFA; }
        .pt-btn:not(.on) { background: transparent; color: rgba(0,0,0,0.38); }
        .price-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 40px; }
        .p-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 28px; position: relative; transition: all 0.28s; }
        .p-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .p-card.hl { background: #0A0A0A; border-color: rgba(245,158,11,0.32); }
        .p-badge { position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: #F59E0B; color: #080808; font-size: 9.5px; font-weight: 700; padding: 3px 12px; border-radius: 0 0 7px 7px; white-space: nowrap; }
        .p-name { font-size: 12.5px; font-weight: 600; color: rgba(0,0,0,0.36); margin-bottom: 6px; }
        .hl .p-name { color: rgba(255,255,255,0.36); }
        .p-amt { font-size: 36px; font-weight: 900; color: #0A0A0A; letter-spacing: -0.04em; line-height: 1; }
        .hl .p-amt { color: #FAFAFA; }
        .p-per { font-size: 12.5px; font-weight: 500; color: rgba(0,0,0,0.28); }
        .hl .p-per { color: rgba(255,255,255,0.28); }
        .p-desc { font-size: 12.5px; color: rgba(0,0,0,0.4); margin: 14px 0 20px; line-height: 1.5; }
        .hl .p-desc { color: rgba(255,255,255,0.33); }
        .p-feats { display: flex; flex-direction: column; gap: 9px; margin-bottom: 22px; }
        .p-feat { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: rgba(0,0,0,0.58); }
        .hl .p-feat { color: rgba(255,255,255,0.62); }
        .cta-p { display:block; width:100%; background:#F59E0B; color:#080808; font-weight:700; font-size:13px; padding:11px; border-radius:9px; border:none; cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .cta-p:hover { background:#FBBF24; box-shadow: 0 0 22px rgba(245,158,11,0.25); }
        .cta-gl { display:block; width:100%; background:rgba(0,0,0,0.05); color:#0A0A0A; font-weight:700; font-size:13px; padding:11px; border-radius:9px; border:1px solid rgba(0,0,0,0.07); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .cta-dgl { display:block; width:100%; background:rgba(255,255,255,0.07); color:#FAFAFA; font-weight:700; font-size:13px; padding:11px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        @media (max-width: 780px) { .price-cards { grid-template-columns: 1fr; max-width: 360px; margin-left: auto; margin-right: auto; } }

        /* ══ FAQ ══ */
        .faq-bg { background: #FFFFFF; }
        .faq-list { margin-top: 48px; }
        .faq-item { border-bottom: 1px solid rgba(0,0,0,0.06); }
        .faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:20px 0; background:none; border:none; cursor:pointer; text-align:left; }
        .faq-q { font-size: 15.5px; font-weight: 700; color: #0A0A0A; }
        .faq-ico { color: rgba(0,0,0,0.27); transition: transform 0.28s, color 0.28s; flex-shrink: 0; }
        .faq-ico.open { transform: rotate(180deg); color: #F59E0B; }
        .faq-a { font-size: 14px; color: rgba(0,0,0,0.48); line-height: 1.7; padding-bottom: 20px; max-width: 640px; }

        /* ══ CTA ══ */
        .cta-wrap { background: #080808; padding: 120px 24px; position: relative; overflow: hidden; }
        .cta-ambient { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 65% 65% at 50% 50%, rgba(139,92,246,0.09) 0%, transparent 70%); }
        .cta-inner { position: relative; z-index: 1; text-align: center; max-width: 620px; margin: 0 auto; }
        .cta-h { font-size: clamp(28px,4.8vw,52px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.08; margin-bottom: 16px; }
        .cta-sub { color: rgba(255,255,255,0.37); font-size: 15.5px; line-height: 1.65; margin-bottom: 32px; }
        .cta-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.17); border-radius:20px; padding:4px 13px; margin-bottom:24px; }
        .cta-btns { display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; }

        /* ══ FOOTER ══ */
        .foot { background: #000; border-top: 1px solid rgba(255,255,255,0.04); padding: 52px 24px 26px; }
        .foot-in { max-width: 1120px; margin: 0 auto; }
        .foot-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .foot-brand p { color: rgba(255,255,255,0.26); font-size: 13px; line-height: 1.65; margin-top: 12px; max-width: 230px; }
        .foot-col h4 { color: rgba(255,255,255,0.38); font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 13px; }
        .foot-a { display:block; color:rgba(255,255,255,0.33); font-size:13px; text-decoration:none; margin-bottom:8px; transition:color 0.18s; }
        .foot-a:hover { color:rgba(255,255,255,0.72); }
        .foot-bot { border-top:1px solid rgba(255,255,255,0.04); padding-top:22px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .foot-copy { color:rgba(255,255,255,0.2); font-size:12px; }
        .foot-tag { color:rgba(255,255,255,0.15); font-size:12px; }
        @media (max-width: 780px) { .foot-top { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 440px) { .foot-top { grid-template-columns: 1fr; } }

        .centered { text-align: center; }
      `}</style>

      <div className="lp">

        {/* ── NAVBAR ── */}
        <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
          <Link href="/" className="n-logo">
            <div className="n-mark"><Shield size={13} color="white" /></div>
            <span className="n-name">Moderate<span>AI</span></span>
          </Link>
          <div className="n-links">
            {['Features', 'Pricing', 'Docs', 'Security'].map(item => (
              <a key={item} href={item === 'Docs' ? '/documentation' : `#${item.toLowerCase()}`} className="n-link">{item}</a>
            ))}
          </div>
          <Link href="/login" className="n-mob-login">Login</Link>
          <div className="n-right">
            <Link href="/login" className="n-login">Login</Link>
          </div>
          <button className="n-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div className="mob-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {['Features', 'Pricing', 'Docs', 'Security'].map(item => (
                <a key={item} href={item === 'Docs' ? '/documentation' : `#${item.toLowerCase()}`} className="mob-a" onClick={() => setMenuOpen(false)}>{item}</a>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '7px 0' }} />
              <Link href="/login" style={{ display: 'block', background: '#F59E0B', color: '#080808', fontWeight: 700, fontSize: 14, padding: '11px 14px', borderRadius: 8, textDecoration: 'none', textAlign: 'center', marginTop: 4 }}>Start Free Trial →</Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HERO ── */}
        <section className="hero" id="features">
          <div className="hero-grid" />
          <div className="hero-inner">

            {/* Left / Text */}
            <div className="hero-left-mob">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}>
                <div className="h-badge">
                  <div className="h-badge-dot" />
                  <span className="h-badge-text">⚡ AI-Powered YouTube Moderation</span>
                </div>
              </motion.div>
              <motion.h1 className="h1 serif" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}>
                Protect your<br />YouTube community<br />before <span className="grad-text">toxicity spreads.</span>
              </motion.h1>
              <motion.p className="h-desc" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}>
                ModerateAI scans every comment in real time to detect spam, toxicity, and manipulation across 100+ languages and hides harmful content before your audience ever sees it.
              </motion.p>
              <motion.div className="h-btns" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.32 }}>
                <Link href="/login" className="btn-p">Start Free Trial <ArrowRight size={14} /></Link>
                <a href="#how-it-works" className="btn-g"><Play size={12} /> See How It Works</a>
              </motion.div>
              <motion.div className="h-trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.44 }}>
                {['No Credit Card', '10-Day Free Trial', 'Setup in 2 Minutes'].map(t => (
                  <div key={t} className="h-trust-item">
                    <CheckCircle size={12} style={{ color: '#10B981', flexShrink: 0 }} /><span>{t}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right / Preview — same on both mobile & desktop */}
            <motion.div className="hero-right"
              initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}>
              <DashboardPreview />
            </motion.div>

          </div>
        </section>

        {/* ── STATS ── */}
        <div className="stats">
          <div className="stats-inner-mob">
            <div className="stats-row">
              {[
                { display: <><Counter to={100} suffix="+" /></>, label: 'Languages Supported', icon: <Globe size={15} color="#8B5CF6" />, iconBg: 'rgba(139,92,246,0.12)' },
                { display: '24/7', label: 'Real-time Protection', icon: <Shield size={15} color="#F59E0B" />, iconBg: 'rgba(245,158,11,0.12)' },
                { display: 'Real-time', label: 'AI Moderation', icon: <Zap size={15} color="#fb923c" />, iconBg: 'rgba(251,146,60,0.12)' },
                { display: '98.2%', label: 'High Detection Rate', icon: <TrendingUp size={15} color="#f87171" />, iconBg: 'rgba(239,68,68,0.12)' },
                { display: '0', label: 'Lines of Code to Setup', icon: <Cpu size={15} color="#34d399" />, iconBg: 'rgba(16,185,129,0.12)' },
              ].map((s, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div className="s-cell">
                    <div className="s-icon-wrap" style={{ background: s.iconBg }}>{s.icon}</div>
                    <div className="s-text">
                      <span className="s-num">{s.display}</span>
                      <span className="s-lbl">{s.label}</span>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="section how-bg" id="how-it-works">
          <div className="con">
            <div className="how-grid">
              <FadeIn>
                <div className="mob-pill"><Zap size={10} /> Our Process</div>
                <div className="eyebrow"><Zap size={11} /> Process</div>
                <h2 className="sh serif">
                  From posted to <span className="grad-text">protected</span>{' '}in under a second.
                </h2>
                <p className="sub">Six stages of AI analysis happen invisibly — before any viewer sees a harmful comment. No manual review.</p>
                <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 16px', transition: 'all 0.2s' }}>Learn More <ArrowRight size={13} /></a>
              </FadeIn>
              <div className="tl">
                <div className="tl-line" />
                {STEPS.map((s, i) => (
                  <FadeIn key={s.label} delay={i * 0.07}>
                    <div className="tl-row" style={{ ['--sdot-bg' as string]: s.bg, ['--sdot-border' as string]: s.color + '55' }}>
                      <div className="tl-dot"><s.icon size={16} color={s.color} /></div>
                      <div className="tl-body"><h3>{s.label}</h3><p>{s.detail}</p></div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="section feat-bg" id="features-detail">
          <div className="con">
            <FadeIn>
              <div className="mob-pill"><Sparkles size={10} /> Features</div>
              <h2 className="sh serif">Everything your channel<br />needs to stay <span className="grad-text">clean.</span></h2>
            </FadeIn>
            <div className="feat-grid">
              {FEATURES.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.06}>
                  <div className="f-card">
                    <div className="f-icon" style={{ background: f.bg }}><f.icon size={18} color={f.color} /></div>
                    <h3>{f.title}</h3>
                    <p>{f.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── LANGUAGES ── */}
        <section className="section lang-bg">
          <div className="con centered">
            <FadeIn>
              <div className="mob-pill" style={{ justifyContent: 'center' }}><Globe size={10} /> Languages</div>
              <h2 className="sh serif">Your community speaks<br /><span className="grad-text">every language.</span><br />So does the AI.</h2>
              <p className="sub" style={{ margin: '0 auto' }}>Language is detected per comment automatically — no configuration needed.</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="lang-chips" style={{ justifyContent: 'center' }}>
                {LANGS.map(l => (
                  <div key={l.name} className="l-chip"><span style={{ fontSize: 14 }}>{l.flag}</span>{l.name}</div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── SECURITY ── */}
        <section className="section sec-bg" id="security">
          <div className="con">
            <FadeIn>
              <div className="eyebrow-dark"><Lock size={11} /> Security</div>
              <h2 className="sh-dark">Built for creators who<br />take security seriously.</h2>
              <p className="sub-dark">Enterprise-grade security, privacy, and account protection designed to keep your YouTube channel safe.</p>
            </FadeIn>
            <div className="sec-grid">
              {SEC.map((s, i) => (
                <FadeIn key={s.title} delay={i * 0.06}>
                  <div className="s-card">
                    <div className="s-ico" style={{ background: s.bg }}><s.icon size={16} color={s.color} /></div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="section price-bg" id="pricing">
          <div className="con centered">
            <FadeIn>
              <div className="eyebrow-dark" style={{ justifyContent: 'center' }}><Zap size={11} /> Pricing</div>
              <h2 className="sh-dark">Transparent pricing.<br />No surprises.</h2>
              <p className="sub-dark" style={{ margin: '0 auto' }}>Start free. Upgrade when you're ready. Cancel anytime.</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="p-toggle">
                  <button className={`pt-btn${!annual ? ' on' : ''}`} onClick={() => setAnnual(false)}>Monthly</button>
                  <button className={`pt-btn${annual ? ' on' : ''}`} onClick={() => setAnnual(true)}>
                    Annual <span style={{ background: '#F59E0B', color: '#080808', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>−14%</span>
                  </button>
                </div>
              </div>
            </FadeIn>
            <div className="price-cards">
              {PLANS.map((p, i) => (
                <FadeIn key={p.name} delay={i * 0.09}>
                  <div className={`p-card${p.hl ? ' hl' : ''}`}>
                    {p.badge && <div className="p-badge">{p.badge}</div>}
                    <div className="p-name">{p.name}</div>
                    <div className="p-amt">
                      {p.monthly === 0 ? '₹0' : `₹${annual ? p.annual : p.monthly}`}
                      {p.monthly > 0 && <span className="p-per">/mo</span>}
                    </div>
                    <div className="p-desc">{p.desc}</div>
                    <div className="p-feats">
                      {p.features.map(f => (
                        <div key={f} className="p-feat"><Check size={12} style={{ color: '#10B981', flexShrink: 0 }} />{f}</div>
                      ))}
                    </div>
                    <Link href="/login" className={p.primary ? 'cta-p' : p.hl ? 'cta-dgl' : 'cta-gl'}>{p.cta}</Link>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section faq-bg">
          <div className="con centered" style={{ maxWidth: 700 }}>
            <FadeIn>
              <div className="eyebrow-dark" style={{ justifyContent: 'center' }}>FAQ</div>
              <h2 className="sh-dark">Common questions</h2>
            </FadeIn>
            <div className="faq-list" style={{ textAlign: 'left' }}>
              {FAQS.map((f, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="faq-q">{f.q}</span>
                    <ChevronDown size={16} className={`faq-ico${openFaq === i ? ' open' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.p className="faq-a"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                        {f.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-wrap">
          <div className="cta-ambient" />
          <FadeIn>
            <div className="cta-inner">
              <div className="cta-pill">
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', animation: 'lp-pulse 2s infinite' }} />
                <span style={{ color: 'rgba(245,158,11,0.88)', fontSize: 12, fontWeight: 600 }}>19-day free trial · no card needed</span>
              </div>
              <h2 className="cta-h serif">
                Ready to protect<br /><span className="grad-text">your community?</span>
              </h2>
              <p className="cta-sub">Join creators who stopped losing subscribers to toxic comments. Setup takes less than 2 minutes.</p>
              <div className="cta-btns">
                <Link href="/login" className="btn-p">Start Free Trial <ArrowRight size={14} /></Link>
                <a href="#how-it-works" className="btn-g">See how it works</a>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── FOOTER ── */}
        <footer className="foot">
          <div className="foot-in">
            <div className="foot-top">
              <div className="foot-brand">
                <Link href="/" className="n-logo" style={{ display: 'inline-flex' }}>
                  <div className="n-mark"><Shield size={12} color="white" /></div>
                  <span className="n-name">Moderate<span>AI</span></span>
                </Link>
                <p>AI-powered YouTube comment moderation. Protect your community before toxicity spreads.</p>
              </div>
              <div className="foot-col">
                <h4>Product</h4>
                {['Features', 'Pricing', 'Security'].map(t => <a key={t} href={`#${t.toLowerCase()}`} className="foot-a">{t}</a>)}
                <Link href="/documentation" className="foot-a">Documentation</Link>
              </div>
              <div className="foot-col">
                <h4>Support</h4>
                <Link href="/help" className="foot-a">Help Center</Link>
                <Link href="mailto:ModerateAiSite@protonmail.com" className="foot-a">Contact</Link>
                <Link href="/privacy" className="foot-a">Privacy Policy</Link>
                <Link href="/terms" className="foot-a">Terms</Link>
              </div>
              <div className="foot-col">
                <h4>Connect</h4>
                <Link href="https://github.com" target="_blank" rel="noreferrer" className="foot-a">GitHub</Link>
                <Link href="https://www.youtube.com/channel/UCTOhz49DO1Oyo64-ux0DiSw" target="_blank" rel="noreferrer" className="foot-a">YouTube</Link>
              </div>
            </div>
            <div className="foot-bot">
              <span className="foot-copy">© 2026 ModerateAI. All rights reserved.</span>
              <span className="foot-tag">Built for YouTube creators.</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}