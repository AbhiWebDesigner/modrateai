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

/* ── DASHBOARD PREVIEW ── */
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
      border: '1px solid rgba(139,92,246,0.3)',
      boxShadow: '0 0 0 1px rgba(139,92,246,0.1), 0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(139,92,246,0.1), 0 32px 80px rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ background: '#111118', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', borderRadius: 8, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={12} color="white" />
          </div>
          <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em' }}>Moderate<span style={{ color: '#F59E0B' }}>AI</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={14} color="rgba(255,255,255,0.3)" />
          <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(16,185,129,0.25)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'lp-pulse 2s infinite' }} /> Live
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
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

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#0E0E14', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0 10px', display: 'flex', gap: 0, overflowX: 'auto', flexShrink: 0 }}>
            {['Overview', 'Analytics', 'Automation', 'Alerts', 'Settings'].map((t, i) => (
              <div key={t} style={{ padding: '9px 8px', fontSize: 9.5, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#F59E0B' : 'rgba(255,255,255,0.25)', borderBottom: i === 0 ? '2px solid #F59E0B' : '2px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>{t}</div>
            ))}
          </div>

          <div style={{ background: '#09090F', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {[
              { label: 'Comments Scanned', value: '12,847', change: '+18.6%', color: '#F59E0B', pts: '0,18 10,14 20,16 30,10 40,12 50,6 60,4' },
              { label: 'Toxic Hidden', value: '1,203', change: '+24.5%', color: '#f87171', pts: '0,16 10,18 20,12 30,14 40,8 50,10 60,5' },
              { label: 'AI Replied', value: '847', change: '+16.3%', color: '#60a5fa', pts: '0,18 10,15 20,17 30,11 40,13 50,7 60,4' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '8px' }}>
                <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 7.5, marginBottom: 3 }}>{s.label}</div>
                <div style={{ color: s.color, fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums', marginBottom: 1 }}>{s.value}</div>
                <div style={{ color: '#34d399', fontSize: 7.5, fontWeight: 600, marginBottom: 3 }}>{s.change}</div>
                <svg width="100%" height="18" viewBox="0 0 60 20">
                  <polyline points={s.pts} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" />
                </svg>
              </div>
            ))}
          </div>

          <div style={{ background: '#07070D', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp {
          font-family: 'Inter', -apple-system, sans-serif;
          background: #050508;
          color: #F0F0F0;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes lp-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes lp-grad {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes lp-shimmer {
          0%{transform:translateX(-100%)}
          100%{transform:translateX(100%)}
        }

        .grad-text {
          background: linear-gradient(135deg, #F59E0B 0%, #EC4899 45%, #8B5CF6 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: lp-grad 5s ease infinite;
        }

        /* ══ NAVBAR ══ */
        .lp-nav {
          position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
          z-index: 200; width: calc(100% - 40px); max-width: 1100px;
          background: rgba(5,5,8,0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 0 20px;
          backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
          display: flex; align-items: center; height: 54px;
          transition: all 0.35s ease;
        }
        .lp-nav.scrolled {
          height: 50px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08);
        }
        .n-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
        .n-mark {
          background: linear-gradient(135deg,#F59E0B,#7C3AED);
          border-radius: 9px; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(245,158,11,0.25);
        }
        .n-name { color: #F0F0F0; font-weight: 800; font-size: 15px; letter-spacing: -0.03em; }
        .n-name span { color: #F59E0B; }
        .n-links { display: flex; align-items: center; margin: 0 auto; gap: 2px; }
        .n-link {
          color: rgba(255,255,255,0.4); font-size: 13.5px; font-weight: 500;
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .n-link:hover { color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.05); }
        .n-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .n-login {
          color: #FAFAFA; font-size: 13px; font-weight: 600;
          text-decoration: none; padding: 8px 18px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 9px; transition: all 0.25s;
          background: rgba(255,255,255,0.04);
        }
        .n-login:hover {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.08);
          box-shadow: 0 0 20px rgba(139,92,246,0.15);
        }
        .n-burger { display: none; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.6); padding: 4px; }

        @media (max-width: 1024px) {
          .lp-nav {
            top: 0; left: 0; right: 0; transform: none;
            width: 100%; max-width: 100%; border-radius: 0;
            border-left: none; border-right: none; border-top: none;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding: 0 16px; height: 56px;
            background: rgba(5,5,8,0.97);
          }
          .n-links { display: none !important; }
          .n-right { display: none !important; }
          .n-burger { display: flex !important; margin-left: auto; }
          .n-mob-login { display: flex !important; }
        }

        .n-mob-login {
          display: none; color: #FAFAFA; font-size: 13px; font-weight: 600;
          text-decoration: none; padding: 7px 14px;
          border: 1px solid rgba(255,255,255,0.15); border-radius: 8px;
          margin-left: auto; margin-right: 8px; align-items: center;
        }

        .mob-menu {
          position: fixed; top: 56px; left: 0; right: 0; z-index: 199;
          background: rgba(5,5,8,0.99); border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 16px 16px; backdrop-filter: blur(32px);
          display: flex; flex-direction: column; gap: 2px;
        }
        .mob-a {
          color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 500;
          text-decoration: none; padding: 11px 14px; border-radius: 9px;
          transition: all 0.18s; display: block;
        }
        .mob-a:hover { background: rgba(255,255,255,0.04); color: #F0F0F0; }

        /* ══ HERO ══ */
        .hero {
          min-height: 100vh;
          padding: 120px 24px 80px;
          position: relative; overflow: hidden;
          background: #050508;
          display: flex; align-items: center;
        }

        /* Noise texture overlay */
        .hero::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0; opacity: 0.4;
        }

        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 90% 80% at 50% 30%, black 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 90% 80% at 50% 30%, black 0%, transparent 75%);
          z-index: 1;
        }

        /* Purple glow right */
        .hero-orb {
          position: absolute; right: -5%; top: 50%; transform: translateY(-52%);
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(109,40,217,0.28) 0%, rgba(168,85,247,0.12) 35%, rgba(236,72,153,0.06) 60%, transparent 75%);
          pointer-events: none; z-index: 1; filter: blur(2px);
        }

        /* Amber glow left */
        .hero-orb2 {
          position: absolute; left: -8%; top: 30%;
          width: 380px; height: 380px; border-radius: 50%;
          background: radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 65%);
          pointer-events: none; z-index: 1;
        }

        /* Bottom center glow */
        .hero-orb3 {
          position: absolute; left: 50%; bottom: -10%; transform: translateX(-50%);
          width: 500px; height: 200px; border-radius: 50%;
          background: radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%);
          pointer-events: none; z-index: 1;
        }

        .hero-inner {
          position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; width: 100%;
          display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center;
        }

        /* Hero badge */
        .h-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(245,158,11,0.07);
          border: 1px solid rgba(245,158,11,0.18);
          border-radius: 30px; padding: 6px 16px 6px 10px;
          margin-bottom: 28px; position: relative; overflow: hidden;
        }
        .h-badge::after {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.08), transparent);
          animation: lp-shimmer 3s infinite;
        }
        .h-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #F59E0B;
          box-shadow: 0 0 6px rgba(245,158,11,0.6);
          animation: lp-pulse 2s infinite;
        }
        .h-badge-text { color: rgba(245,158,11,0.9); font-size: 12px; font-weight: 600; letter-spacing: 0.01em; }

        /* Headline */
        .h1 {
          font-size: clamp(36px, 4.8vw, 64px);
          font-weight: 900;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: #F5F5F5;
          margin-bottom: 24px;
        }

        /* Subtext */
        .h-desc {
          color: rgba(255,255,255,0.38);
          font-size: 16.5px;
          line-height: 1.72;
          max-width: 440px;
          margin-bottom: 38px;
          font-weight: 400;
        }

        /* CTA buttons */
        .h-btns {
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap; margin-bottom: 32px;
        }
        .btn-p {
          display: inline-flex; align-items: center; gap: 8px;
          background: #F59E0B; color: #080808;
          font-weight: 700; font-size: 14.5px;
          padding: 13px 26px; border-radius: 11px;
          text-decoration: none; border: none; cursor: pointer;
          transition: all 0.22s; white-space: nowrap;
          box-shadow: 0 0 0 0 rgba(245,158,11,0);
          letter-spacing: -0.01em;
        }
        .btn-p:hover {
          background: #FBBF24;
          box-shadow: 0 0 32px rgba(245,158,11,0.4), 0 8px 24px rgba(245,158,11,0.2);
          transform: translateY(-1px);
        }
        .btn-g {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          font-weight: 600; font-size: 14.5px;
          padding: 13px 24px; border-radius: 11px;
          text-decoration: none; cursor: pointer;
          transition: all 0.22s; white-space: nowrap;
        }
        .btn-g:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.9);
        }

        /* Play icon */
        .play-ring {
          width: 20px; height: 20px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; padding-left: 1px;
        }

        /* Trust row */
        .h-trust { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .h-trust-item {
          display: flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.3); font-size: 13px; font-weight: 500;
        }

        /* Floating dashboard */
        .hero-right { animation: lp-float 8s ease-in-out infinite; }

        @media (max-width: 1024px) {
          .hero {
            padding: 70px 0 0;
            min-height: 100svh;
            display: flex; flex-direction: column;
            align-items: stretch;
          }
          .hero-orb { width: 300px; height: 300px; right: -20%; top: 30%; }
          .hero-orb2 { display: none; }
          .hero-grid { display: none; }
          .hero-inner {
            display: flex !important; flex-direction: column !important;
            gap: 0 !important; padding: 0 !important;
            align-items: stretch !important; flex: 1;
          }
          .hero-left-mob { padding: 28px 20px 20px; order: 1; }
          .hero-right {
            animation: none !important; order: 2;
            padding: 16px 16px 32px;
          }
          .h-badge { margin-bottom: 18px; }
          .h-badge-text { font-size: 11px; }
          .h1 { font-size: 30px !important; line-height: 1.1 !important; margin-bottom: 16px !important; }
          .h-desc { font-size: 14px !important; margin-bottom: 22px !important; max-width: 100% !important; }
          .h-btns { gap: 8px !important; margin-bottom: 18px !important; }
          .btn-p { font-size: 13.5px !important; padding: 12px 18px !important; flex: 1; justify-content: center; }
          .btn-g { font-size: 13.5px !important; padding: 12px 16px !important; flex: 1; justify-content: center; }
          .h-trust { gap: 12px !important; }
          .h-trust-item { font-size: 11.5px !important; }
        }

        /* ══ STATS ══ */
        .stats { background: #0A0A0F; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 44px 24px; }
        .stats-row { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; }
        .s-cell { display: flex; flex-direction: column; align-items: center; padding: 12px 48px; position: relative; }
        .s-cell + .s-cell::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:1px; height:28px; background:rgba(255,255,255,0.07); }
        .s-num { font-size: 30px; font-weight: 900; color: #F0F0F0; letter-spacing: -0.045em; font-variant-numeric: tabular-nums; line-height: 1; }
        .s-lbl { color: rgba(255,255,255,0.28); font-size: 11px; font-weight: 500; margin-top: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
        .s-icon-wrap { display: none; }
        .s-text { display: flex; flex-direction: column; align-items: center; }

        @media (max-width: 1024px) {
          .stats { background: transparent; border: none; padding: 16px 16px 0; }
          .stats-inner-mob { background: #0A0A12; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
          .stats-row { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; }
          .s-cell { padding: 14px !important; flex-direction: row !important; align-items: center !important; gap: 11px !important; }
          .s-cell::before { display: none !important; }
          .s-cell:nth-child(1) { border-bottom: 1px solid rgba(255,255,255,0.05); }
          .s-cell:nth-child(2) { border-bottom: 1px solid rgba(255,255,255,0.05); border-left: 1px solid rgba(255,255,255,0.05); }
          .s-cell:nth-child(4) { border-left: 1px solid rgba(255,255,255,0.05); }
          .s-cell:nth-child(5) { display: none !important; }
          .s-icon-wrap { display: flex !important; width: 34px; height: 34px; border-radius: 9px; align-items: center; justify-content: center; flex-shrink: 0; }
          .s-text { align-items: flex-start !important; }
          .s-num { font-size: 18px !important; }
          .s-lbl { font-size: 10px !important; margin-top: 2px !important; }
        }

        /* ══ SECTIONS ══ */
        .section { padding: 100px 24px; }

        @media (max-width: 1024px) {
          .hero { min-height: auto !important; padding: 80px 20px 48px !important; }
          .section { padding: 56px 20px !important; }
        }
        .con { max-width: 1100px; margin: 0 auto; }
        .eyebrow { display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.25); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .eyebrow-dark { display: inline-flex; align-items: center; gap: 5px; color: rgba(0,0,0,0.28); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .sh { font-size: clamp(26px,3.6vw,44px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.08; margin-bottom: 16px; }
        .sh-dark { font-size: clamp(26px,3.6vw,44px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.08; margin-bottom: 16px; color: #0A0A0A; }
        .sub { color: rgba(255,255,255,0.36); font-size: 15.5px; line-height: 1.68; max-width: 480px; }
        .sub-dark { color: rgba(0,0,0,0.42); font-size: 15.5px; line-height: 1.68; max-width: 480px; }

        .mob-pill { display: none; }
        @media (max-width: 1024px) {
          .mob-pill {
            display: inline-flex !important; align-items: center; gap: 6px;
            background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.22);
            border-radius: 20px; padding: 4px 12px; margin-bottom: 14px;
            font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; color: #a78bfa;
          }
          .eyebrow { display: none !important; }
          .section { padding: 56px 20px !important; }
        }

        /* ══ HOW IT WORKS ══ */
        .how-bg { background: #080810; }
        .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        .tl { position: relative; margin-top: 48px; }
        .tl-line { position: absolute; left: 19px; top: 6px; bottom: 6px; width: 1px; background: linear-gradient(180deg, rgba(245,158,11,0.55) 0%, rgba(139,92,246,0.15) 100%); }
        .tl-row { display: flex; gap: 18px; padding-bottom: 32px; }
        .tl-row:last-child { padding-bottom: 0; }
        .tl-dot { width: 38px; height: 38px; border-radius: 10px; background: #131320; border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1; transition: all 0.28s; }
        .tl-row:hover .tl-dot { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.26); }
        .tl-body { padding-top: 7px; }
        .tl-body h3 { font-size: 14.5px; font-weight: 700; color: #F0F0F0; margin-bottom: 4px; letter-spacing: -0.02em; }
        .tl-body p { font-size: 13px; color: rgba(255,255,255,0.32); line-height: 1.55; }

        @media (max-width: 1024px) {
          .how-bg { background: #06060E; }
          .how-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .tl { margin-top: 24px !important; }
          .tl-row { gap: 14px !important; padding-bottom: 22px !important; }
          .tl-dot { width: 42px !important; height: 42px !important; background: var(--sdot-bg) !important; border: 1px solid var(--sdot-border) !important; }
          .tl-body h3 { font-size: 13px !important; }
          .tl-body p { font-size: 11.5px !important; color: rgba(255,255,255,0.28) !important; }
        }

        /* ══ FEATURES ══ */
        .feat-bg { background: #060609; }
        .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 52px; }
        .f-card {
          background: #0E0E18; border: 1px solid rgba(255,255,255,0.055);
          border-radius: 18px; padding: 28px; transition: all 0.3s;
          position: relative; overflow: hidden;
        }
        .f-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 18px;
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
          pointer-events: none;
        }
        .f-card:hover { border-color: rgba(245,158,11,0.15); transform: translateY(-3px); box-shadow: 0 20px 56px rgba(0,0,0,0.5); }
        .f-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .f-card h3 { font-size: 15px; font-weight: 700; color: #F0F0F0; margin-bottom: 8px; letter-spacing: -0.02em; }
        .f-card p { font-size: 13.5px; color: rgba(255,255,255,0.34); line-height: 1.62; }

        @media (max-width: 1024px) {
          .feat-bg { background: #06060E; }
          .feat-grid { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; margin-top: 20px !important; }
          .f-card { padding: 14px 12px !important; border-radius: 12px !important; background: rgba(255,255,255,0.025) !important; }
          .f-icon { width: 34px !important; height: 34px !important; border-radius: 9px !important; margin-bottom: 9px !important; }
          .f-card h3 { font-size: 11.5px !important; margin-bottom: 4px !important; }
          .f-card p { font-size: 10px !important; line-height: 1.45 !important; color: rgba(255,255,255,0.28) !important; }
        }

        /* ══ LANGUAGES ══ */
        .lang-bg { background: #07070C; }
        .lang-chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 44px; }
        .l-chip {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 30px; padding: 8px 16px; font-size: 13.5px; font-weight: 500;
          color: rgba(255,255,255,0.45); transition: all 0.22s;
        }
        .l-chip:hover { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.22); color: rgba(255,255,255,0.85); }

        @media (max-width: 1024px) {
          .lang-bg { background: #06060E; }
          .l-chip { font-size: 11.5px !important; padding: 6px 11px !important; }
          .lang-chips { gap: 6px !important; margin-top: 20px !important; }
        }

        /* ══ SECURITY ══ */
        .sec-bg { background: #FAFAFA; }
        .sec-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 52px; }
        .s-card { background: #F0F0EE; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 26px; transition: all 0.22s; }
        .s-card:hover { box-shadow: 0 10px 32px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .s-ico { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .s-card h3 { font-size: 14px; font-weight: 700; color: #0A0A0A; margin-bottom: 6px; letter-spacing: -0.02em; }
        .s-card p { font-size: 12.5px; color: rgba(0,0,0,0.4); line-height: 1.58; }
        @media (max-width: 780px) { .sec-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 460px) { .sec-grid { grid-template-columns: 1fr; } }

        /* ══ PRICING ══ */
        .price-bg { background: #F4F4F2; }
        .p-toggle { display: inline-flex; background: rgba(0,0,0,0.06); border-radius: 10px; padding: 3px; margin: 24px auto 0; }
        .pt-btn { padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.18s; }
        .pt-btn.on { background: #0A0A0A; color: #FAFAFA; }
        .pt-btn:not(.on) { background: transparent; color: rgba(0,0,0,0.35); }
        .price-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 44px; }
        .p-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 20px; padding: 30px; position: relative; transition: all 0.28s; }
        .p-card:hover { box-shadow: 0 18px 52px rgba(0,0,0,0.09); transform: translateY(-2px); }
        .p-card.hl { background: #0A0A0A; border-color: rgba(245,158,11,0.35); box-shadow: 0 0 40px rgba(245,158,11,0.08); }
        .p-badge { position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: #F59E0B; color: #080808; font-size: 9.5px; font-weight: 800; padding: 3px 14px; border-radius: 0 0 8px 8px; white-space: nowrap; letter-spacing: 0.03em; }
        .p-name { font-size: 12px; font-weight: 700; color: rgba(0,0,0,0.35); margin-bottom: 8px; letter-spacing: 0.05em; text-transform: uppercase; }
        .hl .p-name { color: rgba(255,255,255,0.35); }
        .p-amt { font-size: 38px; font-weight: 900; color: #0A0A0A; letter-spacing: -0.045em; line-height: 1; }
        .hl .p-amt { color: #FAFAFA; }
        .p-per { font-size: 13px; font-weight: 500; color: rgba(0,0,0,0.28); }
        .hl .p-per { color: rgba(255,255,255,0.28); }
        .p-desc { font-size: 13px; color: rgba(0,0,0,0.4); margin: 14px 0 22px; line-height: 1.55; }
        .hl .p-desc { color: rgba(255,255,255,0.33); }
        .p-feats { display: flex; flex-direction: column; gap: 9px; margin-bottom: 24px; }
        .p-feat { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(0,0,0,0.56); }
        .hl .p-feat { color: rgba(255,255,255,0.62); }
        .cta-p { display:block; width:100%; background:#F59E0B; color:#080808; font-weight:700; font-size:13.5px; padding:12px; border-radius:10px; border:none; cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; letter-spacing:-0.01em; }
        .cta-p:hover { background:#FBBF24; box-shadow: 0 0 24px rgba(245,158,11,0.28); }
        .cta-gl { display:block; width:100%; background:rgba(0,0,0,0.05); color:#0A0A0A; font-weight:700; font-size:13.5px; padding:12px; border-radius:10px; border:1px solid rgba(0,0,0,0.08); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .cta-dgl { display:block; width:100%; background:rgba(255,255,255,0.07); color:#FAFAFA; font-weight:700; font-size:13.5px; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.12); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        @media (max-width: 780px) { .price-cards { grid-template-columns: 1fr; max-width: 360px; margin-left: auto; margin-right: auto; } }

        /* ══ FAQ ══ */
        .faq-bg { background: #FFFFFF; }
        .faq-list { margin-top: 52px; }
        .faq-item { border-bottom: 1px solid rgba(0,0,0,0.06); }
        .faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:22px 0; background:none; border:none; cursor:pointer; text-align:left; }
        .faq-q { font-size: 16px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em; }
        .faq-ico { color: rgba(0,0,0,0.25); transition: transform 0.28s, color 0.28s; flex-shrink: 0; }
        .faq-ico.open { transform: rotate(180deg); color: #F59E0B; }
        .faq-a { font-size: 14.5px; color: rgba(0,0,0,0.46); line-height: 1.72; padding-bottom: 22px; max-width: 640px; }

        /* ══ CTA SECTION ══ */
        .cta-wrap { background: #050508; padding: 130px 24px; position: relative; overflow: hidden; }
        .cta-ambient {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(109,40,217,0.12) 0%, rgba(236,72,153,0.05) 50%, transparent 75%);
        }
        .cta-inner { position: relative; z-index: 1; text-align: center; max-width: 600px; margin: 0 auto; }
        .cta-h { font-size: clamp(30px,5vw,56px); font-weight: 900; letter-spacing: -0.04em; line-height: 1.06; margin-bottom: 18px; }
        .cta-sub { color: rgba(255,255,255,0.36); font-size: 16px; line-height: 1.68; margin-bottom: 36px; }
        .cta-pill { display:inline-flex; align-items:center; gap:7px; background:rgba(245,158,11,0.07); border:1px solid rgba(245,158,11,0.18); border-radius:20px; padding:5px 14px; margin-bottom:28px; }
        .cta-btns { display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; }

        /* ══ FOOTER ══ */
        .foot { background: #000; border-top: 1px solid rgba(255,255,255,0.04); padding: 56px 24px 28px; }
        .foot-in { max-width: 1100px; margin: 0 auto; }
        .foot-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 44px; }
        .foot-brand p { color: rgba(255,255,255,0.24); font-size: 13px; line-height: 1.68; margin-top: 12px; max-width: 230px; }
        .foot-col h4 { color: rgba(255,255,255,0.35); font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 14px; }
        .foot-a { display:block; color:rgba(255,255,255,0.3); font-size:13.5px; text-decoration:none; margin-bottom:9px; transition:color 0.18s; }
        .foot-a:hover { color:rgba(255,255,255,0.75); }
        .foot-bot { border-top:1px solid rgba(255,255,255,0.04); padding-top:24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .foot-copy { color:rgba(255,255,255,0.18); font-size:12.5px; }
        .foot-tag { color:rgba(255,255,255,0.12); font-size:12.5px; }
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
              <Link href="/login" style={{ display: 'block', background: '#F59E0B', color: '#080808', fontWeight: 700, fontSize: 14, padding: '12px 14px', borderRadius: 9, textDecoration: 'none', textAlign: 'center', marginTop: 4 }}>Start Free Trial →</Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HERO ── */}
        <section className="hero" id="features">
          <div className="hero-grid" />
          <div className="hero-orb" />
          <div className="hero-orb2" />
          <div className="hero-orb3" />

          <div className="hero-inner">

            {/* Left */}
            <div className="hero-left-mob">

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}>
                <div className="h-badge">
                  <div className="h-badge-dot" />
                  <span className="h-badge-text">⚡ AI-Powered YouTube Moderation</span>
                </div>
              </motion.div>

              <motion.h1 className="h1"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}>
                Protect your<br />YouTube community<br />before{' '}
                <span className="grad-text">toxicity spreads.</span>
              </motion.h1>

              <motion.p className="h-desc"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.22 }}>
                ModerateAI scans every comment in real time to detect spam, toxicity, and manipulation across 100+ languages and hides harmful content before your audience ever sees it.
              </motion.p>

              <motion.div className="h-btns"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}>
                <Link href="/login" className="btn-p">
                  Start Free Trial <ArrowRight size={15} />
                </Link>
                <a href="#how-it-works" className="btn-g">
                  <span className="play-ring">▷</span> See How It Works
                </a>
              </motion.div>

              <motion.div className="h-trust"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.44 }}>
                {['No Credit Card', '19-Day Free Trial', 'Setup in 2 Minutes'].map(t => (
                  <div key={t} className="h-trust-item">
                    <CheckCircle size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Dashboard */}
            <motion.div className="hero-right"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
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
                <h2 className="sh">
                  From posted to <span className="grad-text">protected</span>{' '}in under a second.
                </h2>
                <p className="sub">Six stages of AI analysis happen invisibly — before any viewer sees a harmful comment. No manual review.</p>
                <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 24, color: 'rgba(255,255,255,0.5)', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '10px 18px', transition: 'all 0.2s' }}>Learn More <ArrowRight size={13} /></a>
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
              <h2 className="sh">Everything your channel<br />needs to stay <span className="grad-text">clean.</span></h2>
            </FadeIn>
            <div className="feat-grid">
              {FEATURES.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.06}>
                  <div className="f-card">
                    <div className="f-icon" style={{ background: f.bg }}><f.icon size={19} color={f.color} /></div>
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
              <h2 className="sh">Your community speaks<br /><span className="grad-text">every language.</span><br />So does the AI.</h2>
              <p className="sub" style={{ margin: '0 auto' }}>Language is detected per comment automatically — no configuration needed.</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="lang-chips" style={{ justifyContent: 'center' }}>
                {LANGS.map(l => (
                  <div key={l.name} className="l-chip"><span style={{ fontSize: 15 }}>{l.flag}</span>{l.name}</div>
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
                    <div className="s-ico" style={{ background: s.bg }}><s.icon size={17} color={s.color} /></div>
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
                    Annual <span style={{ background: '#F59E0B', color: '#080808', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4, marginLeft: 4 }}>−14%</span>
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
                        <div key={f} className="p-feat"><Check size={13} style={{ color: '#10B981', flexShrink: 0 }} />{f}</div>
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
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'lp-pulse 2s infinite', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }} />
                <span style={{ color: 'rgba(245,158,11,0.9)', fontSize: 12.5, fontWeight: 600 }}>19-day free trial · no card needed</span>
              </div>
              <h2 className="cta-h">
                Ready to protect<br /><span className="grad-text">your community?</span>
              </h2>
              <p className="cta-sub">Join creators who stopped losing subscribers to toxic comments. Setup takes less than 2 minutes.</p>
              <div className="cta-btns">
                <Link href="/login" className="btn-p">Start Free Trial <ArrowRight size={15} /></Link>
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