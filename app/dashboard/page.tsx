'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Globe, Lock, BarChart3, MessageSquare,
  ChevronDown, Check, ArrowRight, Eye, EyeOff,
  CheckCircle, Clock, Languages, Cpu,
  TrendingUp, Filter, Bell, X, Menu, Sparkles
} from 'lucide-react';

/* ── COUNTER ANIMATION ── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = to / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── LIVE COMMENT FEED ── */
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
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'lp-pulse 1s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>AI scanning…</span>
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
            <motion.div
              key={`${c.id}-${i}`}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1 - i * 0.18, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: c.badge === 'safe' ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.03)',
                border: `1px solid ${c.badge === 'safe' ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.1)'}`,
                borderRadius: 8, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 9,
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: c.badge === 'safe' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.badge === 'safe' ? '#34d399' : '#f87171', fontSize: 10, fontWeight: 700 }}>{c.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600 }}>{c.author}</span>
                  <span style={{ background: b.bg, color: b.color, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em' }}>{b.label}</span>
                </div>
                <p style={{ color: c.badge === 'safe' ? 'rgba(255,255,255,0.35)' : 'rgba(255,100,100,0.35)', fontSize: 11, margin: 0, textDecoration: c.badge !== 'safe' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</p>
              </div>
              {c.badge !== 'safe' ? <EyeOff size={12} color="rgba(239,68,68,0.4)" /> : <Eye size={12} color="rgba(16,185,129,0.4)" />}
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
    <div style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 48px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)' }}>
      {/* Chrome bar */}
      <div style={{ background: '#141414', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 5, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={9} color="rgba(255,255,255,0.25)" />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>app.moderateai.site/dashboard</span>
        </div>
        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'lp-pulse 2s infinite' }} /> Live
        </span>
      </div>

      {/* App header */}
      <div style={{ background: '#0D0D0D', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', borderRadius: 7, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={11} color="white" />
          </div>
          <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12 }}>ModerateAI</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Overview','Analytics','Settings'].map((t,i) => <span key={t} style={{ color: i===0 ? '#F59E0B' : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: i===0?600:400 }}>{t}</span>)}
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: '#080808', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[{ label:'Scanned', value:'12,847', color:'#F59E0B' }, { label:'Hidden', value:'1,203', color:'#f87171' }, { label:'Replied', value:'847', color:'#60a5fa' }].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 8, padding: '9px 11px' }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tiny graph */}
      <div style={{ background: '#060606', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-end', gap: 3, height: 52 }}>
        {[18,28,22,38,30,45,36,52,40,58,44,62].map((h,i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: i > 9 ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>

      {/* Feed */}
      <div style={{ padding: '12px 18px', background: '#060606' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live Feed</span>
          <span style={{ color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>AI Active</span>
        </div>
        <LiveFeed />
      </div>
    </div>
  );
}

/* ── FAQ DATA ── */
const FAQS = [
  { q: 'How does ModerateAI connect to YouTube?', a: 'You authorize via YouTube\'s official OAuth flow. We never store your password — only a revocable, scoped access token.' },
  { q: 'Which languages does the AI understand?', a: 'ModerateAI detects intent in 100+ languages — Hindi, Tamil, Arabic, Spanish, Korean, and more — with no extra configuration.' },
  { q: 'Will the AI accidentally hide genuine comments?', a: 'Our false-positive rate is under 0.3%. The model reads context, not just keywords. Every hidden comment is reviewable and restorable.' },
  { q: 'How long does setup take?', a: 'Under 2 minutes. Connect YouTube, choose your sensitivity level, done. No code, no plugins, no team required.' },
  { q: 'Can I customize what gets hidden?', a: 'Yes. Keyword rules, sensitivity thresholds, language filters, and safe-lists — or let the AI handle everything automatically.' },
  { q: 'Is my channel data secure?', a: 'AES-256 at rest, TLS 1.3 in transit, hosted on Cloudflare\'s edge. Your data is never sold or shared.' },
];

/* ── PRICING ── */
const PLANS = [
  { name: 'Free', monthly: 0, annual: 0, desc: 'For creators just starting out.', features: ['1,500 comments/month','Basic spam detection','English & Hindi','Email alerts'], missing: ['AI auto-replies','Telegram alerts'], cta: 'Start Free', primary: false, badge: null },
  { name: 'Pro', monthly: 349, annual: 299, desc: 'For creators who care about community.', features: ['25,000 comments/month','AI toxicity detection','100+ languages','AI auto-replies','Telegram alerts','Priority support'], missing: [], cta: 'Start 19-Day Trial', primary: true, badge: 'Most Popular' },
  { name: 'Agency', monthly: 999, annual: 849, desc: 'For teams managing multiple channels.', features: ['Unlimited comments','Multi-channel','100+ languages','AI auto-replies','Webhook integrations','Dedicated support'], missing: [], cta: 'Contact Us', primary: false, badge: null },
];

/* ── STEPS ── */
const STEPS = [
  { icon: Shield, label: 'Connect YouTube', detail: 'One-click OAuth — read-only comment access, revocable anytime.' },
  { icon: Cpu, label: 'AI monitors every comment', detail: 'Each comment reaches our model in under 200ms, before anyone else sees it.' },
  { icon: Languages, label: 'Language auto-detected', detail: 'The model identifies language and applies culturally-aware rules automatically.' },
  { icon: EyeOff, label: 'Harmful content hidden', detail: 'Toxic and spam comments are hidden instantly — never permanently deleted.' },
  { icon: MessageSquare, label: 'AI replies naturally', detail: 'Genuine comments receive contextual replies in the commenter\'s own language.' },
  { icon: BarChart3, label: 'Analytics updated', detail: 'Every moderation event is logged to your dashboard in real time.' },
];

/* ── FEATURES ── */
const FEATURES = [
  { icon: Cpu, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', title: 'Context-Aware AI', body: 'Reads intent, not just keywords. Sarcasm, dog-whistles, mixed-language attacks — caught before anyone sees them.' },
  { icon: Languages, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', title: '100+ Languages', body: 'Hindi, Tamil, Arabic, Spanish, Korean — auto-detected. No manual language setup ever needed.' },
  { icon: MessageSquare, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'AI Auto-Replies', body: 'Genuine comments get a human-sounding reply in the commenter\'s own language. No templates.' },
  { icon: Bell, color: '#fb923c', bg: 'rgba(251,146,60,0.1)', title: 'Instant Alerts', body: 'Telegram notification the moment a coordinated spam attack or hate campaign begins on your channel.' },
  { icon: TrendingUp, color: '#34d399', bg: 'rgba(16,185,129,0.1)', title: 'Engagement Analytics', body: 'Comment volume, toxicity trends, reply performance — one dashboard, real time.' },
  { icon: Filter, color: '#f87171', bg: 'rgba(239,68,68,0.1)', title: 'Custom Rules', body: 'Keyword blocklists, sensitivity thresholds, safe-lists, language filters — fully configurable.' },
];

/* ── SECURITY CARDS ── */
const SEC = [
  { icon: Lock, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', title: 'AES-256 Encryption', body: 'All credentials encrypted at rest — the same standard used by banks.' },
  { icon: Shield, color: '#10B981', bg: 'rgba(16,185,129,0.08)', title: 'OAuth 2.0 Only', body: 'Your password is never stored. Authentication uses YouTube\'s official OAuth with scoped tokens.' },
  { icon: Globe, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', title: 'Cloudflare Edge', body: 'DDoS protection, rate limiting, and TLS 1.3 on every request — globally.' },
  { icon: Eye, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', title: 'Zero Data Selling', body: 'Your comment data is never sold, shared, or used to train third-party models.' },
  { icon: Clock, color: '#fb923c', bg: 'rgba(251,146,60,0.08)', title: 'Session Control', body: 'Every active session is visible in your dashboard. Revoke any device at any time.' },
  { icon: Zap, color: '#f87171', bg: 'rgba(239,68,68,0.08)', title: 'Rate Limiting', body: 'All endpoints are rate-limited. Abuse patterns trigger automatic account protection.' },
];

/* ── LANGUAGES ── */
const LANGS = [
  { flag: '🇮🇳', name: 'Hindi' }, { flag: '🇮🇳', name: 'Tamil' }, { flag: '🇮🇳', name: 'Telugu' },
  { flag: '🇮🇳', name: 'Kannada' }, { flag: '🇮🇳', name: 'Bengali' }, { flag: '🇮🇳', name: 'Marathi' },
  { flag: '🇺🇸', name: 'English' }, { flag: '🇪🇸', name: 'Spanish' }, { flag: '🇵🇹', name: 'Portuguese' },
  { flag: '🇫🇷', name: 'French' }, { flag: '🇩🇪', name: 'German' }, { flag: '🇯🇵', name: 'Japanese' },
  { flag: '🇰🇷', name: 'Korean' }, { flag: '🇸🇦', name: 'Arabic' }, { flag: '🇷🇺', name: 'Russian' },
  { flag: '🇮🇩', name: 'Indonesian' }, { flag: '🇹🇷', name: 'Turkish' }, { flag: '🇨🇳', name: 'Chinese' },
  { flag: '🇮🇹', name: 'Italian' }, { flag: '🌍', name: '+80 more' },
];

/* ── SECTION WRAPPER ── */
function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      style={style}
    >
      {children}
    </motion.section>
  );
}

/* ══════════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -60]);

  useEffect(() => {
    const u = scrollY.on('change', v => setScrolled(v > 40));
    return () => u();
  }, [scrollY]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp {
          font-family: 'Inter', -apple-system, sans-serif;
          background: #080808;
          color: #F0F0F0;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── NOISE TEXTURE ── */
        .lp::before {
          content: '';
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* ── NAV ── */
        .lp-nav {
          position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
          z-index: 200; width: calc(100% - 40px); max-width: 1120px;
          background: rgba(8,8,8,0.7); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 0 18px;
          backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          display: flex; align-items: center; height: 52px; gap: 8px;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-nav.scrolled {
          height: 48px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.6);
          border-color: rgba(255,255,255,0.09);
        }
        .nav-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
        .nav-logo-mark { background: linear-gradient(135deg,#F59E0B,#7C3AED); border-radius: 9px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
        .nav-logo-text { color: #F0F0F0; font-weight: 800; font-size: 15px; letter-spacing: -0.025em; }
        .nav-links { display: flex; align-items: center; gap: 0; margin: 0 auto; }
        .nav-link { color: rgba(255,255,255,0.45); font-size: 13px; font-weight: 500; text-decoration: none; padding: 6px 11px; border-radius: 7px; transition: color 0.2s, background 0.2s; }
        .nav-link:hover { color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.04); }
        .nav-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .nav-login { color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500; text-decoration: none; padding: 6px 12px; border-radius: 7px; transition: color 0.2s; }
        .nav-login:hover { color: rgba(255,255,255,0.9); }
        .nav-cta { background: #F59E0B; color: #080808; font-size: 12.5px; font-weight: 700; padding: 7px 15px; border-radius: 8px; text-decoration: none; transition: all 0.2s; white-space: nowrap; letter-spacing: -0.01em; }
        .nav-cta:hover { background: #FBBF24; box-shadow: 0 0 22px rgba(245,158,11,0.35); }
        .nav-burger { display: none; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.6); padding: 6px; margin-left: auto; }
        @media (max-width: 820px) { .nav-links, .nav-login { display: none !important; } .nav-burger { display: flex; } .lp-nav { width: calc(100% - 28px); } }

        /* ── MOBILE MENU ── */
        .mob-menu {
          position: fixed; top: 76px; left: 14px; right: 14px; z-index: 199;
          background: rgba(10,10,12,0.97); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 14px; backdrop-filter: blur(28px);
          display: flex; flex-direction: column; gap: 3;
        }
        .mob-link { color: rgba(255,255,255,0.6); font-size: 15px; font-weight: 500; text-decoration: none; padding: 11px 14px; border-radius: 9px; transition: all 0.2s; display: block; }
        .mob-link:hover { background: rgba(255,255,255,0.04); color: #F0F0F0; }

        /* ── ANIMATIONS ── */
        @keyframes lp-pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes lp-bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)} }
        @keyframes lp-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)} }
        @keyframes lp-gradshift { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }
        @keyframes lp-spin { to{transform:rotate(360deg)} }

        /* ── TYPOGRAPHY ── */
        .serif { font-family: 'Playfair Display', Georgia, serif; }
        .gradient-text {
          background: linear-gradient(135deg, #F59E0B 0%, #EC4899 50%, #8B5CF6 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: lp-gradshift 5s ease infinite;
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh; padding: 130px 24px 90px;
          position: relative; display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .hero-ambient {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 65% 55% at 15% 15%, rgba(245,158,11,0.09) 0%, transparent 60%),
            radial-gradient(ellipse 55% 55% at 85% 85%, rgba(139,92,246,0.11) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 15%, rgba(124,58,237,0.07) 0%, transparent 50%);
        }
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 75% 65% at 50% 40%, black 15%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 75% 65% at 50% 40%, black 15%, transparent 80%);
        }
        .hero-inner { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; max-width: 1120px; width: 100%; }
        .hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 20px; padding: 5px 14px 5px 10px; margin-bottom: 32px; }
        .hero-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #F59E0B; animation: lp-pulse 2s infinite; }
        .hero-badge-text { color: rgba(245,158,11,0.9); font-size: 12px; font-weight: 600; letter-spacing: 0.02em; }
        .hero-h1 { font-size: clamp(36px,4.8vw,60px); font-weight: 800; letter-spacing: -0.035em; line-height: 1.07; color: #F0F0F0; margin-bottom: 24px; }
        .hero-desc { color: rgba(255,255,255,0.42); font-size: 16.5px; line-height: 1.7; max-width: 460px; margin-bottom: 38px; font-weight: 400; }
        .hero-btns { display: flex; align-items: center; gap: 11px; flex-wrap: wrap; margin-bottom: 32px; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #F59E0B; color: #080808; font-weight: 700; font-size: 14.5px;
          padding: 13px 22px; border-radius: 11px; text-decoration: none; border: none; cursor: pointer;
          transition: all 0.25s; white-space: nowrap; letter-spacing: -0.01em;
        }
        .btn-primary:hover { background: #FBBF24; box-shadow: 0 0 32px rgba(245,158,11,0.38); transform: translateY(-1px); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.8); font-weight: 600; font-size: 14.5px;
          padding: 13px 22px; border-radius: 11px; text-decoration: none; cursor: pointer;
          transition: all 0.25s; white-space: nowrap;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); }
        .hero-trust { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .hero-trust-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.35); font-size: 12.5px; }
        @media (max-width: 860px) { .hero-inner { grid-template-columns: 1fr; gap: 52px; } .hero { padding: 110px 20px 60px; } }

        /* ── STATS STRIP ── */
        .stats-strip { background: #0E0E0E; border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04); padding: 44px 24px; }
        .stats-inner { max-width: 1120px; margin: 0 auto; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; }
        .stat-cell { display: flex; flex-direction: column; align-items: center; padding: 0 52px; position: relative; }
        .stat-cell + .stat-cell::before { content:''; position:absolute; left:0; top:50%; transform:translateY(-50%); width:1px; height:28px; background:rgba(255,255,255,0.07); }
        .stat-num { font-size: 30px; font-weight: 900; color: #F0F0F0; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; line-height: 1; }
        .stat-lbl { color: rgba(255,255,255,0.3); font-size: 11.5px; font-weight: 500; margin-top: 5px; letter-spacing: 0.05em; text-transform: uppercase; }
        @media (max-width: 600px) { .stat-cell { padding: 14px 24px; } .stat-cell + .stat-cell::before { display: none; } }

        /* ── HOW IT WORKS ── */
        .how-section { background: linear-gradient(180deg, #0C0C0C 0%, #0F0F0F 100%); padding: 110px 24px; }
        .eyebrow { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.28); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 18px; }
        .section-h { font-size: clamp(26px,3.6vw,44px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.1; margin-bottom: 18px; }
        .section-sub { color: rgba(255,255,255,0.38); font-size: 15.5px; line-height: 1.65; max-width: 500px; font-weight: 400; }
        .how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 88px; align-items: start; }
        .timeline { position: relative; margin-top: 52px; }
        .tl-line { position: absolute; left: 20px; top: 8px; bottom: 8px; width: 1px; background: linear-gradient(180deg, rgba(245,158,11,0.6) 0%, rgba(139,92,246,0.2) 100%); }
        .tl-item { display: flex; gap: 20px; padding-bottom: 36px; }
        .tl-item:last-child { padding-bottom: 0; }
        .tl-dot { width: 40px; height: 40px; border-radius: 11px; background: #131313; border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1; transition: all 0.3s; }
        .tl-item:hover .tl-dot { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.28); }
        .tl-body { padding-top: 8px; }
        .tl-body h3 { font-size: 15px; font-weight: 700; color: #F0F0F0; margin-bottom: 4px; letter-spacing: -0.02em; }
        .tl-body p { font-size: 13.5px; color: rgba(255,255,255,0.35); line-height: 1.55; }
        @media (max-width: 820px) { .how-grid { grid-template-columns: 1fr; gap: 48px; } }

        /* ── FEATURES ── */
        .feat-section { background: #090909; padding: 110px 24px; }
        .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 56px; }
        .feat-card {
          background: #101010; border: 1px solid rgba(255,255,255,0.055); border-radius: 18px;
          padding: 28px; transition: all 0.35s cubic-bezier(0.22,1,0.36,1); position: relative; overflow: hidden; cursor: default;
        }
        .feat-card::after { content:''; position:absolute; inset:0; border-radius:18px; background: radial-gradient(ellipse 70% 70% at 0% 0%, rgba(245,158,11,0.05) 0%, transparent 70%); opacity:0; transition:opacity 0.35s; }
        .feat-card:hover { border-color: rgba(245,158,11,0.14); transform: translateY(-3px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .feat-card:hover::after { opacity: 1; }
        .feat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .feat-card h3 { font-size: 16px; font-weight: 700; color: #F0F0F0; margin-bottom: 8px; letter-spacing: -0.02em; }
        .feat-card p { font-size: 13.5px; color: rgba(255,255,255,0.38); line-height: 1.6; }
        @media (max-width: 820px) { .feat-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 520px) { .feat-grid { grid-template-columns: 1fr; } }

        /* ── LANGUAGE ── */
        .lang-section { background: linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%); padding: 110px 24px; }
        .lang-chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 44px; }
        .lang-chip {
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.065);
          border-radius: 28px; padding: 8px 16px; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.5); transition: all 0.25s; cursor: default;
        }
        .lang-chip:hover { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.22); color: rgba(255,255,255,0.85); }

        /* ── SECURITY ── */
        .sec-section { background: #FAFAFA; padding: 110px 24px; }
        .sec-section .eyebrow { color: rgba(0,0,0,0.3); }
        .sec-section .section-h { color: #0A0A0A; }
        .sec-section .section-sub { color: rgba(0,0,0,0.45); }
        .sec-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-top: 56px; }
        .sec-card { background: #F2F2F0; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 26px; transition: all 0.25s; }
        .sec-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .sec-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
        .sec-card h3 { font-size: 14.5px; font-weight: 700; color: #0A0A0A; margin-bottom: 5px; }
        .sec-card p { font-size: 13px; color: rgba(0,0,0,0.42); line-height: 1.55; }
        @media (max-width: 820px) { .sec-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px) { .sec-grid { grid-template-columns: 1fr; } }

        /* ── PRICING ── */
        .price-section { background: #F5F5F3; padding: 110px 24px; }
        .price-section .eyebrow { color: rgba(0,0,0,0.3); }
        .price-section .section-h { color: #0A0A0A; }
        .price-section .section-sub { color: rgba(0,0,0,0.45); }
        .price-toggle { display: inline-flex; background: rgba(0,0,0,0.06); border-radius: 10px; padding: 3px; margin: 28px auto 0; }
        .ptog-btn { padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
        .ptog-btn.on { background: #0A0A0A; color: #FAFAFA; }
        .ptog-btn:not(.on) { background: transparent; color: rgba(0,0,0,0.4); }
        .price-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-top: 44px; }
        .price-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 20px; padding: 30px; position: relative; transition: all 0.3s; }
        .price-card:hover { box-shadow: 0 18px 52px rgba(0,0,0,0.08); transform: translateY(-3px); }
        .price-card.hl { background: #0A0A0A; border-color: rgba(245,158,11,0.35); }
        .price-card.hl:hover { box-shadow: 0 18px 52px rgba(0,0,0,0.45), 0 0 44px rgba(245,158,11,0.1); }
        .price-badge { position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: #F59E0B; color: #080808; font-size: 10px; font-weight: 700; padding: 3px 13px; border-radius: 0 0 8px 8px; letter-spacing: 0.05em; white-space: nowrap; }
        .price-name { font-size: 13px; font-weight: 600; color: rgba(0,0,0,0.38); margin-bottom: 7px; }
        .hl .price-name { color: rgba(255,255,255,0.38); }
        .price-amt { font-size: 38px; font-weight: 900; color: #0A0A0A; letter-spacing: -0.04em; line-height: 1; margin-bottom: 5px; font-variant-numeric: tabular-nums; }
        .hl .price-amt { color: #FAFAFA; }
        .price-per { font-size: 13px; font-weight: 500; color: rgba(0,0,0,0.3); }
        .hl .price-per { color: rgba(255,255,255,0.3); }
        .price-desc { font-size: 13px; color: rgba(0,0,0,0.42); margin: 16px 0 22px; line-height: 1.5; }
        .hl .price-desc { color: rgba(255,255,255,0.35); }
        .price-feats { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
        .price-feat { display: flex; align-items: center; gap: 9px; font-size: 13px; color: rgba(0,0,0,0.6); }
        .hl .price-feat { color: rgba(255,255,255,0.65); }
        .price-feat-miss { color: rgba(0,0,0,0.2) !important; }
        .hl .price-feat-miss { color: rgba(255,255,255,0.18) !important; }
        .pcta-primary { display:block; width:100%; background:#F59E0B; color:#080808; font-weight:700; font-size:13.5px; padding:12px; border-radius:10px; border:none; cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .pcta-primary:hover { background:#FBBF24; box-shadow:0 0 24px rgba(245,158,11,0.28); }
        .pcta-ghost { display:block; width:100%; background:rgba(0,0,0,0.05); color:#0A0A0A; font-weight:700; font-size:13.5px; padding:12px; border-radius:10px; border:1px solid rgba(0,0,0,0.07); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .pcta-ghost:hover { background:rgba(0,0,0,0.08); }
        .pcta-hl-ghost { display:block; width:100%; background:rgba(255,255,255,0.07); color:#FAFAFA; font-weight:700; font-size:13.5px; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; text-align:center; text-decoration:none; transition:all 0.2s; }
        .pcta-hl-ghost:hover { background:rgba(255,255,255,0.1); }
        @media (max-width: 820px) { .price-cards { grid-template-columns: 1fr; max-width: 380px; margin-left: auto; margin-right: auto; } }

        /* ── FAQ ── */
        .faq-section { background: #FFFFFF; padding: 110px 24px; }
        .faq-section .eyebrow { color: rgba(0,0,0,0.3); }
        .faq-section .section-h { color: #0A0A0A; }
        .faq-list { margin-top: 52px; }
        .faq-item { border-bottom: 1px solid rgba(0,0,0,0.06); }
        .faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:22px 0; background:none; border:none; cursor:pointer; text-align:left; }
        .faq-q { font-size: 16px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em; }
        .faq-icon { color: rgba(0,0,0,0.28); transition: transform 0.3s, color 0.3s; flex-shrink: 0; }
        .faq-icon.open { transform: rotate(180deg); color: #F59E0B; }
        .faq-a { font-size: 14.5px; color: rgba(0,0,0,0.5); line-height: 1.7; padding-bottom: 22px; max-width: 660px; }

        /* ── CTA ── */
        .cta-section { background: #080808; padding: 130px 24px; position: relative; overflow: hidden; }
        .cta-ambient { position:absolute; inset:0; pointer-events:none; background: radial-gradient(ellipse 65% 70% at 50% 50%, rgba(139,92,246,0.1) 0%, transparent 70%); }
        .cta-inner { position:relative; z-index:1; text-align:center; max-width:640px; margin:0 auto; }
        .cta-h { font-size: clamp(30px,5vw,54px); font-weight: 900; letter-spacing: -0.035em; line-height: 1.08; margin-bottom: 18px; }
        .cta-sub { color: rgba(255,255,255,0.38); font-size: 16px; line-height: 1.65; margin-bottom: 36px; font-weight: 400; }
        .cta-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.18); border-radius:20px; padding:5px 14px; margin-bottom:28px; }
        .cta-btns { display:flex; align-items:center; justify-content:center; gap:11px; flex-wrap:wrap; }

        /* ── FOOTER ── */
        .footer { background: #000000; border-top: 1px solid rgba(255,255,255,0.04); padding: 56px 24px 28px; }
        .footer-inner { max-width: 1120px; margin: 0 auto; }
        .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 44px; margin-bottom: 44px; }
        .footer-brand p { color: rgba(255,255,255,0.28); font-size: 13px; line-height: 1.65; margin-top: 12px; max-width: 240px; }
        .footer-col h4 { color: rgba(255,255,255,0.4); font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 14px; }
        .footer-a { display:block; color:rgba(255,255,255,0.35); font-size:13px; text-decoration:none; margin-bottom:9px; transition:color 0.2s; }
        .footer-a:hover { color:rgba(255,255,255,0.75); }
        .footer-bottom { border-top:1px solid rgba(255,255,255,0.04); padding-top:24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
        .footer-copy { color:rgba(255,255,255,0.2); font-size:12.5px; }
        .footer-tag { color:rgba(255,255,255,0.16); font-size:12px; }
        @media (max-width: 820px) { .footer-top { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .footer-top { grid-template-columns: 1fr; } }

        .container { max-width: 1120px; margin: 0 auto; }
        .centered { text-align: center; }
        .divider-v { width:1px; height:28px; background:rgba(255,255,255,0.07); }
      `}</style>

      <div className="lp">

        {/* ── NAVBAR ── */}
        <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark"><Shield size={14} color="white" /></div>
            <span className="nav-logo-text">ModerateAI</span>
          </Link>

          <div className="nav-links">
            {['Features','How It Works','Pricing','Security','Documentation'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} className="nav-link">{item}</a>
            ))}
          </div>

          <div className="nav-actions">
            <Link href="/login" className="nav-login">Login</Link>
            <Link href="/login" className="nav-cta">Start Free Trial</Link>
          </div>

          <button className="nav-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div className="mob-menu" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration: 0.2 }}>
              {['Features','How It Works','Pricing','Security','Documentation'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} className="mob-link" onClick={() => setMenuOpen(false)}>{item}</a>
              ))}
              <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'8px 0' }} />
              <Link href="/login" className="mob-link">Login</Link>
              <Link href="/login" style={{ display:'block', background:'#F59E0B', color:'#080808', fontWeight:700, fontSize:14, padding:'12px 14px', borderRadius:9, textDecoration:'none', textAlign:'center', marginTop:4 }}>
                Start Free Trial →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HERO ── */}
        <section className="hero" id="features">
          <div className="hero-ambient" />
          <div className="hero-grid" />

          <motion.div className="hero-inner" style={{ y: heroY }}>
            {/* Left */}
            <div>
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.1 }}>
                <div className="hero-badge">
                  <div className="hero-badge-dot" />
                  <span className="hero-badge-text">GPT-4 Powered Moderation</span>
                </div>
              </motion.div>

              <motion.h1 className="hero-h1 serif" initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, delay:0.18, ease:[0.22,1,0.36,1] }}>
                Protect your YouTube<br />community before{' '}
                <span className="gradient-text">toxicity spreads.</span>
              </motion.h1>

              <motion.p className="hero-desc" initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7, delay:0.28 }}>
                ModerateAI scans every comment in real time — detecting spam, toxicity, and manipulation across 100+ languages — and hides harmful content before your audience ever sees it.
              </motion.p>

              <motion.div className="hero-btns" initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.38 }}>
                <Link href="/login" className="btn-primary">
                  Start Free Trial <ArrowRight size={15} />
                </Link>
                <a href="#how-it-works" className="btn-ghost">
                  See How It Works
                </a>
              </motion.div>

              <motion.div className="hero-trust" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.6, delay:0.5 }}>
                {['No Credit Card','19-Day Free Trial','Setup in 2 minutes'].map(t => (
                  <div key={t} className="hero-trust-item">
                    <CheckCircle size={13} style={{ color:'#10B981', flexShrink:0 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — product preview */}
            <motion.div
              initial={{ opacity:0, y:32, scale:0.97 }}
              animate={{ opacity:1, y:0, scale:1 }}
              transition={{ duration:0.9, delay:0.25, ease:[0.22,1,0.36,1] }}
              style={{ animation: 'lp-float 7s ease-in-out infinite' }}
            >
              <ProductPreview />
            </motion.div>
          </motion.div>
        </section>

        {/* ── STATS STRIP ── */}
        <Section style={{ position:'relative', zIndex:1 }}>
          <div className="stats-strip">
            <div className="stats-inner">
              {[
                { num: 100, suffix: '+', label: 'Languages' },
                { label: '24/7', labelNum: true, caption: 'Live Protection' },
                { num: 200, suffix: 'ms', label: 'Response Time', prefix: '<' },
                { label: '0', labelNum: true, caption: 'Lines of Code to Setup' },
                { label: '99.7%', labelNum: true, caption: 'Detection Accuracy' },
              ].map((s: any, i) => (
                <motion.div
                  key={i} className="stat-cell"
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ delay: i*0.07, duration:0.5 }}
                >
                  <span className="stat-num">
                    {s.num !== undefined
                      ? <>{s.prefix || ''}<Counter to={s.num} suffix={s.suffix || ''} /></>
                      : s.label
                    }
                  </span>
                  <span className="stat-lbl">{s.caption || s.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── HOW IT WORKS ── */}
        <section className="how-section" id="how-it-works">
          <div className="container">
            <div className="how-grid">
              <Section>
                <div className="eyebrow"><Zap size={11} /> Process</div>
                <h2 className="section-h serif">
                  From posted<br />to <span className="gradient-text">protected</span><br />in under a second.
                </h2>
                <p className="section-sub">Six stages of AI analysis happen invisibly — before any viewer sees a harmful comment. No manual review.</p>
              </Section>

              <div className="timeline">
                <div className="tl-line" />
                {STEPS.map((s, i) => (
                  <motion.div
                    key={s.label} className="tl-item"
                    initial={{ opacity:0, x:16 }} whileInView={{ opacity:1, x:0 }}
                    viewport={{ once:true, margin:'-60px' }}
                    transition={{ delay: i*0.08, duration:0.5, ease:[0.22,1,0.36,1] }}
                  >
                    <div className="tl-dot"><s.icon size={16} color="rgba(245,158,11,0.75)" /></div>
                    <div className="tl-body">
                      <h3>{s.label}</h3>
                      <p>{s.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="feat-section" id="features-grid">
          <div className="container">
            <Section>
              <div className="eyebrow"><Sparkles size={11} /> Features</div>
              <h2 className="section-h serif">Everything your channel<br />needs to stay clean.</h2>
            </Section>

            <div className="feat-grid">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title} className="feat-card"
                  initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-40px' }}
                  transition={{ delay: i*0.07, duration:0.55, ease:[0.22,1,0.36,1] }}
                >
                  <div className="feat-icon" style={{ background: f.bg }}><f.icon size={19} color={f.color} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LANGUAGES ── */}
        <section className="lang-section">
          <div className="container">
            <Section style={{ textAlign:'center' }}>
              <div className="eyebrow" style={{ justifyContent:'center' }}><Globe size={11} /> Language Support</div>
              <h2 className="section-h serif">Your community speaks<br /><span className="gradient-text">every language.</span><br />So does the AI.</h2>
              <p className="section-sub" style={{ margin:'0 auto' }}>Language is detected automatically per comment — culturally-aware rules applied instantly, no manual setup.</p>
            </Section>

            <motion.div
              className="lang-chips"
              initial={{ opacity:0 }} whileInView={{ opacity:1 }}
              viewport={{ once:true }} transition={{ duration:0.6, delay:0.2 }}
            >
              {LANGS.map(l => (
                <div key={l.name} className="lang-chip">
                  <span style={{ fontSize:15 }}>{l.flag}</span>
                  {l.name}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── SECURITY ── */}
        <section className="sec-section" id="security">
          <div className="container">
            <Section>
              <div className="eyebrow"><Lock size={11} /> Security</div>
              <h2 className="section-h">Built for channels that<br />can't afford a breach.</h2>
              <p className="section-sub">Enterprise-grade security on every creator account. No exceptions.</p>
            </Section>

            <div className="sec-grid">
              {SEC.map((s, i) => (
                <motion.div
                  key={s.title} className="sec-card"
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-40px' }}
                  transition={{ delay: i*0.07, duration:0.5 }}
                >
                  <div className="sec-icon" style={{ background: s.bg }}><s.icon size={17} color={s.color} /></div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="price-section" id="pricing">
          <div className="container">
            <Section style={{ textAlign:'center' }}>
              <div className="eyebrow" style={{ justifyContent:'center' }}><Zap size={11} /> Pricing</div>
              <h2 className="section-h">Transparent pricing.<br />No surprises.</h2>
              <p className="section-sub" style={{ margin:'0 auto' }}>Start free. Upgrade when you're ready. Cancel anytime.</p>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <div className="price-toggle">
                  <button className={`ptog-btn${!annual?' on':''}`} onClick={() => setAnnual(false)}>Monthly</button>
                  <button className={`ptog-btn${annual?' on':''}`} onClick={() => setAnnual(true)}>
                    Annual <span style={{ background:'#F59E0B', color:'#080808', fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, marginLeft:5 }}>−14%</span>
                  </button>
                </div>
              </div>
            </Section>

            <div className="price-cards">
              {PLANS.map((p, i) => (
                <motion.div
                  key={p.name}
                  className={`price-card${p.primary?' hl':''}`}
                  initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ delay: i*0.1, duration:0.55 }}
                >
                  {p.badge && <div className="price-badge">{p.badge}</div>}
                  <div className="price-name">{p.name}</div>
                  <div className="price-amt">
                    {p.monthly === 0 ? '₹0' : `₹${annual ? p.annual : p.monthly}`}
                    {p.monthly > 0 && <span className="price-per">/mo</span>}
                  </div>
                  <div className="price-desc">{p.desc}</div>
                  <div className="price-feats">
                    {p.features.map(f => (
                      <div key={f} className="price-feat">
                        <Check size={13} style={{ color:'#10B981', flexShrink:0 }} />
                        {f}
                      </div>
                    ))}
                    {p.missing.map(f => (
                      <div key={f} className={`price-feat price-feat-miss`}>
                        <X size={13} style={{ color: p.primary ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)', flexShrink:0 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/login"
                    className={p.primary ? 'pcta-primary' : p.name === 'Agency' ? 'pcta-hl-ghost' : 'pcta-ghost'}
                    style={!p.primary && p.name !== 'Agency' ? {} : {}}
                  >
                    {p.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section">
          <div className="container" style={{ maxWidth:720 }}>
            <Section style={{ textAlign:'center' }}>
              <div className="eyebrow" style={{ justifyContent:'center' }}>FAQ</div>
              <h2 className="section-h">Common questions</h2>
            </Section>

            <div className="faq-list">
              {FAQS.map((f, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-btn" onClick={() => setOpenFaq(openFaq===i ? null : i)}>
                    <span className="faq-q">{f.q}</span>
                    <ChevronDown size={17} className={`faq-icon${openFaq===i?' open':''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.p
                        className="faq-a"
                        initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                        exit={{ opacity:0, height:0 }} transition={{ duration:0.28 }}
                      >
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
        <section className="cta-section">
          <div className="cta-ambient" />
          <Section>
            <div className="cta-inner">
              <div className="cta-pill">
                <div style={{ width:5, height:5, borderRadius:'50%', background:'#F59E0B', animation:'lp-pulse 2s infinite' }} />
                <span style={{ color:'rgba(245,158,11,0.9)', fontSize:12, fontWeight:600 }}>19-day free trial · no card needed</span>
              </div>
              <h2 className="cta-h serif">
                Ready to protect<br /><span className="gradient-text">your community?</span>
              </h2>
              <p className="cta-sub">Join creators who stopped losing subscribers to toxic comments. Setup takes less than 2 minutes.</p>
              <div className="cta-btns">
                <Link href="/login" className="btn-primary">Start Free Trial <ArrowRight size={15} /></Link>
                <a href="#how-it-works" className="btn-ghost">See how it works</a>
              </div>
            </div>
          </Section>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-top">
              <div className="footer-brand">
                <Link href="/" className="nav-logo" style={{ display:'inline-flex' }}>
                  <div className="nav-logo-mark"><Shield size={13} color="white" /></div>
                  <span className="nav-logo-text">ModerateAI</span>
                </Link>
                <p>AI-powered YouTube comment moderation. Protect your community before toxicity spreads.</p>
              </div>
              <div className="footer-col">
                <h4>Product</h4>
                {['Features','Pricing','Security','Documentation','Status'].map(t => <a key={t} href={`#${t.toLowerCase()}`} className="footer-a">{t}</a>)}
              </div>
              <div className="footer-col">
                <h4>Support</h4>
                <a href="#" className="footer-a">Help Center</a>
                <a href="mailto:support@moderateai.site" className="footer-a">Contact</a>
                <Link href="/privacy" className="footer-a">Privacy Policy</Link>
                <Link href="/terms" className="footer-a">Terms</Link>
              </div>
              <div className="footer-col">
                <h4>Connect</h4>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-a">GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-a">LinkedIn</a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer-a">YouTube</a>
                <a href="mailto:support@moderateai.site" className="footer-a">support@moderateai.site</a>
              </div>
            </div>
            <div className="footer-bottom">
              <span className="footer-copy">© 2026 ModerateAI. All rights reserved.</span>
              <span className="footer-tag">Built for YouTube creators.</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}