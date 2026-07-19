'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Globe, Lock, BarChart3, MessageSquare,
  ChevronDown, Check, ArrowRight, Eye, EyeOff,
  CheckCircle, Languages, Cpu,
  TrendingUp, Filter, Bell, X, Menu, Sparkles
} from 'lucide-react';

/* ── FADE IN WRAPPER ── */
function FadeIn({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  return (
    <motion.div
      ref={ref} className={className} style={style}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
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
    let v = 0;
    const dur = 1600; const step = 16; const inc = to / (dur / step);
    const t = setInterval(() => {
      v += inc;
      if (v >= to) { setVal(to); clearInterval(t); } else setVal(Math.floor(v));
    }, step);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── LIVE FEED ── */
const COMMENTS = [
  { id: 1, author: 'Alex_Gaming99', text: 'This is absolute trash content, go delete yourself', badge: 'toxic', avatar: 'A' },
  { id: 2, author: 'SarahCreates', text: 'Amazing tutorial! I learned so much from this 🙌', badge: 'safe', avatar: 'S' },
  { id: 3, author: 'SpamBot_4921', text: 'FREE ROBUX → click my profile link NOW!!!', badge: 'spam', avatar: '?' },
  { id: 4, author: 'Rahul_K', text: 'यह वीडियो बहुत अच्छी है, धन्यवाद भाई', badge: 'safe', avatar: 'R' },
  { id: 5, author: 'h8r_2024', text: 'Nobody asked for your stupid opinion lmao', badge: 'toxic', avatar: 'H' },
  { id: 6, author: 'María_ES', text: 'Increíble contenido, sigue así campeón 🔥', badge: 'safe', avatar: 'M' },
  { id: 7, author: 'PromoKing', text: 'Earn $500/day from home - DM me NOW', badge: 'spam', avatar: 'P' },
];
const BADGE: Record<string, { bg: string; color: string; label: string }> = {
  toxic: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', label: 'Hidden' },
  spam:  { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', label: 'Blocked' },
  safe:  { bg: 'rgba(16,185,129,0.12)', color: '#34d399', label: 'Approved' },
};

function LiveFeed() {
  const [items, setItems] = useState<typeof COMMENTS>([]);
  const [scanning, setScanning] = useState(false);
  const idx = useRef(0);
  useEffect(() => {
    const tick = () => {
      setScanning(true);
      setTimeout(() => {
        const c = COMMENTS[idx.current % COMMENTS.length];
        idx.current++;
        setItems(prev => [c, ...prev].slice(0, 4));
        setScanning(false);
      }, 900);
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <AnimatePresence>
        {scanning && (
          <motion.div key="sc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', animation: 'lp-pulse 1s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11 }}>AI scanning…</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#F59E0B', opacity: 0.5, animation: `lp-bounce 0.8s ${i*0.18}s infinite` }} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {items.map((c, i) => {
          const b = BADGE[c.badge];
          return (
            <motion.div key={`${c.id}-${i}`}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1 - i * 0.2, y: 0 }} transition={{ duration: 0.28 }}
              style={{ background: c.badge === 'safe' ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.03)', border: `1px solid ${c.badge === 'safe' ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.1)'}`, borderRadius: 8, padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: c.badge === 'safe' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.badge === 'safe' ? '#34d399' : '#f87171', fontSize: 9, fontWeight: 700 }}>{c.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontWeight: 600 }}>{c.author}</span>
                  <span style={{ background: b.bg, color: b.color, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3 }}>{b.label}</span>
                </div>
                <p style={{ color: c.badge === 'safe' ? 'rgba(255,255,255,0.3)' : 'rgba(255,80,80,0.35)', fontSize: 10.5, margin: 0, textDecoration: c.badge !== 'safe' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</p>
              </div>
              {c.badge !== 'safe' ? <EyeOff size={11} color="rgba(239,68,68,0.4)" /> : <Eye size={11} color="rgba(16,185,129,0.4)" />}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── PRODUCT PREVIEW ── */
function ProductPreview() {
  return (
    <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)' }}>
      <div style={{ background: '#141414', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={9} color="rgba(255,255,255,0.25)" />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>moderateai.site/dashboard</span>
        </div>
        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'lp-pulse 2s infinite' }} /> Live
        </span>
      </div>
      <div style={{ background: '#0D0D0D', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', borderRadius: 6, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={10} color="white" />
          </div>
          <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 11 }}>ModerateAI</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Overview','Analytics','Settings'].map((t, i) => <span key={t} style={{ color: i===0 ? '#F59E0B' : 'rgba(255,255,255,0.28)', fontSize: 9.5, fontWeight: i===0 ? 600 : 400 }}>{t}</span>)}
        </div>
      </div>
      <div style={{ background: '#080808', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[{ label:'Scanned', value:'12,847', color:'#F59E0B' }, { label:'Hidden', value:'1,203', color:'#f87171' }, { label:'Replied', value:'847', color:'#60a5fa' }].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 7, padding: '8px 10px' }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#060606', padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-end', gap: 3, height: 46 }}>
        {[18,28,22,38,30,45,36,52,40,58,44,62].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, background: i > 9 ? 'rgba(245,158,11,0.65)' : 'rgba(255,255,255,0.07)' }} />
        ))}
      </div>
      <div style={{ padding: '11px 16px', background: '#060606' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live Feed</span>
          <span style={{ color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>AI Active</span>
        </div>
        <LiveFeed />
      </div>
    </div>
  );
}

/* ── DATA ── */
const STEPS = [
  { icon: Shield, label: 'Connect YouTube', detail: 'One-click OAuth — read-only comment access, revocable anytime.' },
  { icon: Cpu, label: 'AI monitors every comment', detail: 'Each comment reaches our model in under 200ms, before anyone sees it.' },
  { icon: Languages, label: 'Language auto-detected', detail: 'The model identifies language and applies culturally-aware rules automatically.' },
  { icon: EyeOff, label: 'Harmful content hidden', detail: 'Toxic and spam comments are hidden instantly — never permanently deleted.' },
  { icon: MessageSquare, label: 'AI replies naturally', detail: 'Genuine comments receive contextual replies in the commenter\'s own language.' },
  { icon: BarChart3, label: 'Analytics updated', detail: 'Every moderation event is logged to your dashboard in real time.' },
];
const FEATURES = [
  { icon: Cpu, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', title: 'Context-Aware AI', body: 'Reads intent, not just keywords. Sarcasm, mixed-language attacks — caught before anyone sees them.' },
  { icon: Languages, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', title: '100+ Languages', body: 'Hindi, Tamil, Arabic, Spanish, Korean — auto-detected. No manual language setup ever needed.' },
  { icon: MessageSquare, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'AI Auto-Replies', body: 'Genuine comments get a human-sounding reply in the commenter\'s own language. No templates.' },
  { icon: Bell, color: '#fb923c', bg: 'rgba(251,146,60,0.1)', title: 'Instant Alerts', body: 'Telegram notification the moment a coordinated spam attack begins on your channel.' },
  { icon: TrendingUp, color: '#34d399', bg: 'rgba(16,185,129,0.1)', title: 'Engagement Analytics', body: 'Comment volume, toxicity trends, reply performance — one dashboard, real time.' },
  { icon: Filter, color: '#f87171', bg: 'rgba(239,68,68,0.1)', title: 'Custom Rules', body: 'Keyword blocklists, sensitivity thresholds, safe-lists, language filters — fully configurable.' },
];
const SEC = [
  { icon: Lock, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', title: 'AES-256 Encryption', body: 'All credentials encrypted at rest — the same standard used by banks.' },
  { icon: Shield, color: '#10B981', bg: 'rgba(16,185,129,0.08)', title: 'OAuth 2.0 Only', body: 'Your password is never stored. Authentication uses YouTube\'s official OAuth with scoped tokens.' },
  { icon: Globe, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', title: 'Cloudflare Edge', body: 'DDoS protection, rate limiting, and TLS 1.3 on every request — globally.' },
  { icon: Eye, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', title: 'Zero Data Selling', body: 'Your comment data is never sold, shared, or used to train third-party models.' },
  { icon: Zap, color: '#fb923c', bg: 'rgba(251,146,60,0.08)', title: 'Session Control', body: 'Every active session is visible in your dashboard. Revoke any device at any time.' },
  { icon: Filter, color: '#f87171', bg: 'rgba(239,68,68,0.08)', title: 'Rate Limiting', body: 'All endpoints are rate-limited. Abuse patterns trigger automatic account protection.' },
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

/* ── PLANS (UPDATED) ── */
const PLANS = [
  {
    name: 'Free Trial',
    monthly: 0,
    annual: 0,
    desc: 'Try ModerateAI free for 19 days.',
    features: [
      '19-Day Free Trial',
      '1 YouTube Channel',
      '2,000 Comments Scanned',
      'AI Toxic Detection',
      'AI Spam Detection',
      'Review Queue',
      '250 AI Actions',
      'Smart AI Replies (Max 3 Per Video)',
      'Basic Analytics Dashboard',
      '10+ Languages',
      'Email Support',
    ],
    missing: [],
    cta: 'Start Free Trial',
    primary: false,
    hl: false,
    badge: null,
  },
  {
    name: 'Pro',
    monthly: 349,
    annual: 299,
    desc: 'Perfect for growing creators.',
    features: [
      '1 YouTube Channel',
      '25,000 Comments Scanned / Month',
      'AI Toxic Detection',
      'AI Spam Detection',
      'Auto Hide',
      'Review Queue',
      'Live Chat Moderation',
      'Progressive Live Chat Timeouts',
      '1,900 AI Actions / Month',
      'Smart AI Replies (Max 3 Per Video)',
      'Unlimited Automation Rules',
      'Full Analytics Dashboard',
      '50+ Languages',
      'Priority Email Support',
    ],
    missing: [],
    cta: 'Start 19-Day Trial',
    primary: true,
    hl: true,
    badge: 'Most Popular',
  },
  {
    name: 'Agency',
    monthly: 2499,
    annual: 2149,
    desc: 'Built for businesses & agencies.',
    features: [
      '2 YouTube Channels',
      '150,000 Comments Scanned / Month',
      'AI Toxic Detection',
      'AI Spam Detection',
      'Auto Hide',
      'Review Queue',
      'Live Chat Moderation',
      'Progressive Live Chat Timeouts',
      '15,000 AI Actions / Month',
      'Smart AI Replies (Max 3 Per Video)',
      'Unlimited Automation Rules',
      'Advanced Analytics Dashboard',
      'Telegram Alerts',
      '100+ Languages',
      'Dedicated Priority Support',
    ],
    missing: [],
    cta: 'Get Agency',
    primary: false,
    hl: false,
    badge: null,
  },
];

const FAQS = [
  { q: 'How does ModerateAI connect to YouTube?', a: 'You authorize via YouTube\'s official OAuth flow. We never store your password — only a revocable, scoped access token.' },
  { q: 'Which languages does the AI understand?', a: 'ModerateAI detects intent in 100+ languages — Hindi, Tamil, Arabic, Spanish, Korean, and more — with no extra configuration.' },
  { q: 'Will the AI accidentally hide genuine comments?', a: 'Our false-positive rate is under 0.3%. The model reads context, not just keywords. Every hidden comment is reviewable and restorable.' },
  { q: 'How long does setup take?', a: 'Under 2 minutes. Connect YouTube, choose your sensitivity level, done. No code, no plugins.' },
  { q: 'Can I customize what gets hidden?', a: 'Yes. Keyword rules, sensitivity thresholds, language filters, and safe-lists — or let the AI handle everything automatically.' },
  { q: 'Is my channel data secure?', a: 'AES-256 at rest, TLS 1.3 in transit, hosted on Cloudflare\'s edge. Your data is never sold or shared.' },
];

/* ══════════════════════════════════════════ MAIN ══════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 36);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

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

        .lp-nav {
          position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
          z-index: 200; width: calc(100% - 32px); max-width: 1120px;
          background: rgba(8,8,8,0.75); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 0 18px;
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          display: flex; align-items: center; height: 52px;
          transition: all 0.35s ease;
        }
        .lp-nav.scrolled { height: 48px; box-shadow: 0 4px 28px rgba(0,0,0,0.55); border-color: rgba(255,255,255,0.09); }
        .n-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; }
        .n-mark { background: linear-gradient(135deg,#F59E0B,#7C3AED); border-radius: 8px; width: 27px; height: 27px; display: flex; align-items: center; justify-content: center; }
        .n-name { color: #F0F0F0; font-weight: 800; font-size: 14.5px; letter-spacing: -0.025em; }
        .n-links { display: flex; align-items: center; margin: 0 auto; }
        .n-link { color: rgba(255,255,255,0.42); font-size: 13px; font-weight: 500; text-decoration: none; padding: 6px 10px; border-radius: 7px; transition: color 0.2s, background 0.2s; }
        .n-link:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.04); }
        .n-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .n-login { color: #FAFAFA; font-size: 13px; font-weight: 600; text-decoration: none; padding: 7px 16px; border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; transition: all 0.25s; }
        .n-login:hover { color: #FAFAFA; border-color: rgba(255,255,255,0.80); background: rgba(255,255,255,0.08); box-shadow: 0 0 20px rgba(255,255,255,0.25), 0 0 40px rgba(255,255,255,0.10); }
        .n-cta { background: #F59E0B; color: #080808; font-size: 12.5px; font-weight: 700; padding: 7px 14px; border-radius: 8px; text-decoration: none; transition: all 0.2s; white-space: nowrap; }
        .n-cta:hover { background: #FBBF24; box-shadow: 0 0 20px rgba(245,158,11,0.35); }
        .n-burger { display: none; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.6); padding: 4px; margin-left: auto; }
        @media (max-width: 800px) { .n-links, .n-login { display: none !important; } .n-burger { display: flex; } }

        .mob-menu {
          position: fixed; top: 72px; left: 14px; right: 14px; z-index: 199;
          background: rgba(10,10,12,0.97); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 12px; backdrop-filter: blur(28px);
          display: flex; flex-direction: column; gap: 3;
        }
        .mob-a { color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 500; text-decoration: none; padding: 10px 14px; border-radius: 9px; transition: all 0.18s; display: block; }
        .mob-a:hover { background: rgba(255,255,255,0.04); color: #F0F0F0; }

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
        .h-desc { color: rgba(255,255,255,0.4); font-size: 16px; line-height: 1.7; max-width: 450px; margin-bottom: 36px; font-weight: 400; }
        .h-btns { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
        .btn-p { display: inline-flex; align-items: center; gap: 7px; background: #F59E0B; color: #080808; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 10px; text-decoration: none; border: none; cursor: pointer; transition: all 0.22s; white-space: nowrap; }
        .btn-p:hover { background: #FBBF24; box-shadow: 0 0 28px rgba(245,158,11,0.35); transform: translateY(-1px); }
        .btn-g { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); color: rgba(255,255,255,0.78); font-weight: 600; font-size: 14px; padding: 12px 22px; border-radius: 10px; text-decoration: none; cursor: pointer; transition: all 0.22s; white-space: nowrap; }
        .btn-g:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); }
        .h-trust { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
        .h-trust-item { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.33); font-size: 12.5px; }
        .hero-right { animation: lp-float 7s ease-in-out infinite; }
        @media (max-width: 820px) { .hero-inner { grid-template-columns: 1fr; gap: 44px; } .hero { padding: 96px 20px 56px; } .hero-right { animation: none; } }

        .stats { background: #0E0E0E; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 40px 24px; }
        .stats-row { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0; }
        .s-cell { display: flex; flex-direction: column; align-items: center; padding: 12px 44px; position: relative; }
        .s-cell + .s-cell::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:1px; height:26px; background:rgba(255,255,255,0.07); }
        .s-num { font-size: 28px; font-weight: 900; color: #F0F0F0; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1; }
        .s-lbl { color: rgba(255,255,255,0.3); font-size: 11px; font-weight: 500; margin-top: 5px; letter-spacing: 0.05em; text-transform: uppercase; }
        @media (max-width: 580px) { .stats-row { display: grid; grid-template-columns: 1fr 1fr; } .s-cell { padding: 16px 20px; } .s-cell + .s-cell::before { display: none; } .s-cell:nth-child(odd):not(:first-child) { border-top: 1px solid rgba(255,255,255,0.05); } .s-cell:nth-child(even) { border-left: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.05); } }

        .section { padding: 96px 24px; }
        .section-sm { padding: 80px 24px; }
        .con { max-width: 1120px; margin: 0 auto; }
        .eyebrow { display: inline-flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.28); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .eyebrow-dark { display: inline-flex; align-items: center; gap: 5px; color: rgba(0,0,0,0.3); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        .sh { font-size: clamp(24px,3.4vw,42px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.1; margin-bottom: 16px; }
        .sh-dark { font-size: clamp(24px,3.4vw,42px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.1; margin-bottom: 16px; color: #0A0A0A; }
        .sub { color: rgba(255,255,255,0.38); font-size: 15.5px; line-height: 1.65; max-width: 480px; font-weight: 400; }
        .sub-dark { color: rgba(0,0,0,0.44); font-size: 15.5px; line-height: 1.65; max-width: 480px; font-weight: 400; }

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
        @media (max-width: 780px) { .how-grid { grid-template-columns: 1fr; gap: 40px; } }

        .feat-bg { background: #090909; }
        .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 48px; }
        .f-card { background: #101010; border: 1px solid rgba(255,255,255,0.055); border-radius: 16px; padding: 26px; transition: all 0.3s cubic-bezier(0.22,1,0.36,1); position: relative; overflow: hidden; }
        .f-card::after { content:''; position:absolute; inset:0; border-radius:16px; background: radial-gradient(ellipse 70% 70% at 0% 0%, rgba(245,158,11,0.045) 0%, transparent 70%); opacity:0; transition:opacity 0.3s; }
        .f-card:hover { border-color: rgba(245,158,11,0.13); transform: translateY(-2px); box-shadow: 0 18px 50px rgba(0,0,0,0.45); }
        .f-card:hover::after { opacity: 1; }
        .f-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .f-card h3 { font-size: 15px; font-weight: 700; color: #F0F0F0; margin-bottom: 7px; letter-spacing: -0.02em; }
        .f-card p { font-size: 13px; color: rgba(255,255,255,0.36); line-height: 1.6; }
        @media (max-width: 780px) { .feat-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px) { .feat-grid { grid-template-columns: 1fr; } }

        .lang-bg { background: linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%); }
        .lang-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 40px; }
        .l-chip { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.033); border: 1px solid rgba(255,255,255,0.063); border-radius: 26px; padding: 7px 15px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.48); transition: all 0.22s; }
        .l-chip:hover { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.2); color: rgba(255,255,255,0.82); }

        .sec-bg { background: #FAFAFA; }
        .sec-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 48px; }
        .s-card { background: #F2F2F0; border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 24px; transition: all 0.22s; }
        .s-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .s-ico { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .s-card h3 { font-size: 14px; font-weight: 700; color: #0A0A0A; margin-bottom: 5px; }
        .s-card p { font-size: 12.5px; color: rgba(0,0,0,0.42); line-height: 1.55; }
        @media (max-width: 780px) { .sec-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 460px) { .sec-grid { grid-template-columns: 1fr; } }

        .price-bg { background: #F5F5F3; }
        .p-toggle { display: inline-flex; background: rgba(0,0,0,0.06); border-radius: 9px; padding: 3px; margin: 24px auto 0; }
        .pt-btn { padding: 6px 17px; border-radius: 7px; font-size: 12.5px; font-weight: 600; border: none; cursor: pointer; transition: all 0.18s; }
        .pt-btn.on { background: #0A0A0A; color: #FAFAFA; }
        .pt-btn:not(.on) { background: transparent; color: rgba(0,0,0,0.38); }
        .price-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 40px; }
        .p-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 18px; padding: 28px; position: relative; transition: all 0.28s; }
        .p-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .p-card.hl { background: #0A0A0A; border-color: rgba(245,158,11,0.32); }
        .p-card.hl:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.09); }
        .p-badge { position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: #F59E0B; color: #080808; font-size: 9.5px; font-weight: 700; padding: 3px 12px; border-radius: 0 0 7px 7px; letter-spacing: 0.05em; white-space: nowrap; }
        .p-name { font-size: 12.5px; font-weight: 600; color: rgba(0,0,0,0.36); margin-bottom: 6px; }
        .hl .p-name { color: rgba(255,255,255,0.36); }
        .p-amt { font-size: 36px; font-weight: 900; color: #0A0A0A; letter-spacing: -0.04em; line-height: 1; font-variant-numeric: tabular-nums; }
        .hl .p-amt { color: #FAFAFA; }
        .p-per { font-size: 12.5px; font-weight: 500; color: rgba(0,0,0,0.28); }
        .hl .p-per { color: rgba(255,255,255,0.28); }
        .p-desc { font-size: 12.5px; color: rgba(0,0,0,0.4); margin: 14px 0 20px; line-height: 1.5; }
        .hl .p-desc { color: rgba(255,255,255,0.33); }
        .p-feats { display: flex; flex-direction: column; gap: 9px; margin-bottom: 22px; }
        .p-feat { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: rgba(0,0,0,0.58); }
        .hl .p-feat { color: rgba(255,255,255,0.62); }
        .p-miss { color: rgba(0,0,0,0.2) !important; }
        .hl .p-miss { color: rgba(255,255,255,0.17) !important; }
        .cta-p { display:block; width:100%; background:#F59E0B; color:#080808; font-weight:700; font-size:13px; padding:11px; border-radius:9px; border:none; cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .cta-p:hover { background:#FBBF24; box-shadow: 0 0 22px rgba(245,158,11,0.25); }
        .cta-gl { display:block; width:100%; background:rgba(0,0,0,0.05); color:#0A0A0A; font-weight:700; font-size:13px; padding:11px; border-radius:9px; border:1px solid rgba(0,0,0,0.07); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .cta-gl:hover { background:rgba(0,0,0,0.08); }
        .cta-dgl { display:block; width:100%; background:rgba(255,255,255,0.07); color:#FAFAFA; font-weight:700; font-size:13px; padding:11px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .cta-dgl:hover { background:rgba(255,255,255,0.1); }
        @media (max-width: 780px) { .price-cards { grid-template-columns: 1fr; max-width: 360px; margin-left: auto; margin-right: auto; } }

        .faq-bg { background: #FFFFFF; }
        .faq-list { margin-top: 48px; }
        .faq-item { border-bottom: 1px solid rgba(0,0,0,0.06); }
        .faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; gap:14px; padding:20px 0; background:none; border:none; cursor:pointer; text-align:left; }
        .faq-q { font-size: 15.5px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em; }
        .faq-ico { color: rgba(0,0,0,0.27); transition: transform 0.28s, color 0.28s; flex-shrink: 0; }
        .faq-ico.open { transform: rotate(180deg); color: #F59E0B; }
        .faq-a { font-size: 14px; color: rgba(0,0,0,0.48); line-height: 1.7; padding-bottom: 20px; max-width: 640px; }

        .cta-wrap { background: #080808; padding: 120px 24px; position: relative; overflow: hidden; }
        .cta-ambient { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 65% 65% at 50% 50%, rgba(139,92,246,0.09) 0%, transparent 70%); }
        .cta-inner { position: relative; z-index: 1; text-align: center; max-width: 620px; margin: 0 auto; }
        .cta-h { font-size: clamp(28px,4.8vw,52px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.08; margin-bottom: 16px; }
        .cta-sub { color: rgba(255,255,255,0.37); font-size: 15.5px; line-height: 1.65; margin-bottom: 32px; font-weight: 400; }
        .cta-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.17); border-radius:20px; padding:4px 13px; margin-bottom:24px; }
        .cta-btns { display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; }

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
            <span className="n-name">ModerateAI</span>
          </Link>
          <div className="n-links">
            {['Features','How It Works','Pricing','Security','Documentation'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} className="n-link">{item}</a>
            ))}
          </div>
          <div className="n-right">
            <Link href="/login" className="n-login">Login</Link>
          </div>
          <button className="n-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div className="mob-menu" initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} transition={{ duration:0.18 }}>
              {['Features','How It Works','Pricing','Security','Documentation'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} className="mob-a" onClick={() => setMenuOpen(false)}>{item}</a>
              ))}
              <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'7px 0' }} />
              <Link href="/login" className="mob-a">Login</Link>
              <Link href="/login" style={{ display:'block', background:'#F59E0B', color:'#080808', fontWeight:700, fontSize:14, padding:'11px 14px', borderRadius:8, textDecoration:'none', textAlign:'center', marginTop:4 }}>Start Free Trial →</Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HERO ── */}
        <section className="hero" id="features">
          <div className="hero-grid" />
          <div className="hero-inner">
            <div>
              <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6,delay:0.05 }}>
                <div className="h-badge">
                  <div className="h-badge-dot" />
                  <span className="h-badge-text">GPT-4 Powered Moderation</span>
                </div>
              </motion.div>
              <motion.h1 className="h1 serif" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7,delay:0.12,ease:[0.22,1,0.36,1] }}>
                Protect your YouTube<br />community before{' '}
                <span className="grad-text">toxicity spreads.</span>
              </motion.h1>
              <motion.p className="h-desc" initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6,delay:0.22 }}>
                ModerateAI scans every comment in real time — detecting spam, toxicity, and manipulation across 100+ languages — and hides harmful content before your audience ever sees it.
              </motion.p>
              <motion.div className="h-btns" initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.55,delay:0.32 }}>
                <Link href="/login" className="btn-p">Start Free Trial <ArrowRight size={14} /></Link>
                <a href="#how-it-works" className="btn-g">See How It Works</a>
              </motion.div>
              <motion.div className="h-trust" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5,delay:0.44 }}>
                {['No Credit Card','19-Day Free Trial','Setup in 2 minutes'].map(t => (
                  <div key={t} className="h-trust-item">
                    <CheckCircle size={13} style={{ color:'#10B981',flexShrink:0 }} /><span>{t}</span>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div className="hero-right"
              initial={{ opacity:0,y:24,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }}
              transition={{ duration:0.85,delay:0.18,ease:[0.22,1,0.36,1] }}>
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="stats">
          <div className="stats-row">
            {[
              { display: <><Counter to={100} suffix="+" /></>, label: 'Languages' },
              { display: '24/7', label: 'Live Protection' },
              { display: '<200ms', label: 'Response Time' },
              { display: <><Counter to={99.7} suffix="%" /></>, label: 'Detection Accuracy' },
              { display: '0', label: 'Lines of Code to Setup' },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="s-cell">
                  <span className="s-num">{s.display}</span>
                  <span className="s-lbl">{s.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="section how-bg" id="how-it-works">
          <div className="con">
            <div className="how-grid">
              <FadeIn>
                <div className="eyebrow"><Zap size={11} /> Process</div>
                <h2 className="sh serif">
                  From posted<br />to <span className="grad-text">protected</span><br />in under a second.
                </h2>
                <p className="sub">Six stages of AI analysis happen invisibly — before any viewer sees a harmful comment. No manual review.</p>
              </FadeIn>
              <div className="tl">
                <div className="tl-line" />
                {STEPS.map((s, i) => (
                  <FadeIn key={s.label} delay={i * 0.07}>
                    <div className="tl-row">
                      <div className="tl-dot"><s.icon size={15} color="rgba(245,158,11,0.75)" /></div>
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
              <div className="eyebrow"><Sparkles size={11} /> Features</div>
              <h2 className="sh serif">Everything your channel<br />needs to stay clean.</h2>
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
              <div className="eyebrow" style={{ justifyContent:'center' }}><Globe size={11} /> Language Support</div>
              <h2 className="sh serif">Your community speaks<br /><span className="grad-text">every language.</span><br />So does the AI.</h2>
              <p className="sub" style={{ margin:'0 auto' }}>Language is detected per comment automatically — no configuration needed.</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="lang-chips" style={{ justifyContent:'center' }}>
                {LANGS.map(l => (
                  <div key={l.name} className="l-chip"><span style={{ fontSize:14 }}>{l.flag}</span>{l.name}</div>
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
              <h2 className="sh-dark">Built for channels that<br />can't afford a breach.</h2>
              <p className="sub-dark">Enterprise-grade security on every creator account. No exceptions.</p>
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
              <div className="eyebrow-dark" style={{ justifyContent:'center' }}><Zap size={11} /> Pricing</div>
              <h2 className="sh-dark">Transparent pricing.<br />No surprises.</h2>
              <p className="sub-dark" style={{ margin:'0 auto' }}>Start free. Upgrade when you're ready. Cancel anytime.</p>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <div className="p-toggle">
                  <button className={`pt-btn${!annual?' on':''}`} onClick={() => setAnnual(false)}>Monthly</button>
                  <button className={`pt-btn${annual?' on':''}`} onClick={() => setAnnual(true)}>
                    Annual <span style={{ background:'#F59E0B', color:'#080808', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, marginLeft:4 }}>−14%</span>
                  </button>
                </div>
              </div>
            </FadeIn>
            <div className="price-cards">
              {PLANS.map((p, i) => (
                <FadeIn key={p.name} delay={i * 0.09}>
                  <div className={`p-card${p.hl?' hl':''}`}>
                    {p.badge && <div className="p-badge">{p.badge}</div>}
                    <div className="p-name">{p.name}</div>
                    <div className="p-amt">
                      {p.monthly === 0 ? '₹0' : `₹${annual ? p.annual : p.monthly}`}
                      {p.monthly > 0 && <span className="p-per">/mo</span>}
                    </div>
                    <div className="p-desc">{p.desc}</div>
                    <div className="p-feats">
                      {p.features.map(f => (
                        <div key={f} className="p-feat"><Check size={12} style={{ color:'#10B981',flexShrink:0 }} />{f}</div>
                      ))}
                      {p.missing.map(f => (
                        <div key={f} className={`p-feat p-miss${p.hl?' hl':''}`}><X size={12} style={{ color: p.hl ? 'rgba(255,255,255,0.17)' : 'rgba(0,0,0,0.17)', flexShrink:0 }} />{f}</div>
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
              <div className="eyebrow-dark" style={{ justifyContent:'center' }}>FAQ</div>
              <h2 className="sh-dark">Common questions</h2>
            </FadeIn>
            <div className="faq-list" style={{ textAlign:'left' }}>
              {FAQS.map((f, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-btn" onClick={() => setOpenFaq(openFaq===i?null:i)}>
                    <span className="faq-q">{f.q}</span>
                    <ChevronDown size={16} className={`faq-ico${openFaq===i?' open':''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq===i && (
                      <motion.p className="faq-a"
                        initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                        exit={{ opacity:0,height:0 }} transition={{ duration:0.25 }}>
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
                <div style={{ width:5,height:5,borderRadius:'50%',background:'#F59E0B',animation:'lp-pulse 2s infinite' }} />
                <span style={{ color:'rgba(245,158,11,0.88)',fontSize:12,fontWeight:600 }}>19-day free trial · no card needed</span>
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
                <Link href="/" className="n-logo" style={{ display:'inline-flex' }}>
                  <div className="n-mark"><Shield size={12} color="white" /></div>
                  <span className="n-name">ModerateAI</span>
                </Link>
                <p>AI-powered YouTube comment moderation. Protect your community before toxicity spreads.</p>
              </div>
              <div className="foot-col">
                <h4>Product</h4>
                {['Features','Pricing','Security','Documentation','Status'].map(t => <a key={t} href={`#${t.toLowerCase()}`} className="foot-a">{t}</a>)}
              </div>
              <div className="foot-col">
                <h4>Support</h4>
                <a href="#" className="foot-a">Help Center</a>
                <a href="mailto:support@moderateai.site" className="foot-a">Contact</a>
                <Link href="/privacy" className="foot-a">Privacy Policy</Link>
                <Link href="/terms" className="foot-a">Terms</Link>
              </div>
              <div className="foot-col">
                <h4>Connect</h4>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="foot-a">GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="foot-a">LinkedIn</a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="foot-a">YouTube</a>
                <a href="mailto:support@moderateai.site" className="foot-a">support@moderateai.site</a>
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