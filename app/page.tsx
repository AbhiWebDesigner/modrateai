'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Shield, Zap, Globe, Lock, BarChart3, MessageSquare,
  ChevronDown, Check, ArrowRight, Play, Eye, EyeOff,
  AlertTriangle, CheckCircle, Clock, Languages, Cpu,
  TrendingUp, Filter, Bell, Star, X, Menu
} from 'lucide-react';

/* ─── COMMENT FEED SIMULATION ─── */
const DEMO_COMMENTS = [
  { id: 1, author: 'Alex_Gaming99', text: 'This is absolute trash content, go delete yourself', verdict: 'TOXIC', badge: 'toxic', avatar: 'A' },
  { id: 2, author: 'SarahCreates', text: 'Amazing tutorial! I learned so much from this video 🙌', verdict: 'SAFE', badge: 'safe', avatar: 'S' },
  { id: 3, author: 'SpamBot_4921', text: 'FREE ROBUX → click my profile link NOW!!!', verdict: 'SPAM', badge: 'spam', avatar: '?' },
  { id: 4, author: 'Rahul_K', text: 'यह वीडियो बहुत अच्छी है, धन्यवाद भाई', verdict: 'SAFE', badge: 'safe', avatar: 'R' },
  { id: 5, author: 'h8r_2024', text: 'Nobody asked for your stupid opinion lmao', verdict: 'TOXIC', badge: 'toxic', avatar: 'H' },
  { id: 6, author: 'TechFanatic', text: 'What software do you use for editing? Subscribed!', verdict: 'SAFE', badge: 'safe', avatar: 'T' },
  { id: 7, author: 'PromoKing', text: 'Earn $500/day from home - DM me NOW', verdict: 'SPAM', badge: 'spam', avatar: 'P' },
  { id: 8, author: 'María_ES', text: 'Increíble contenido, sigue así campeón 🔥', verdict: 'SAFE', badge: 'safe', avatar: 'M' },
];

const BADGE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  toxic: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'Hidden' },
  spam: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c', label: 'Blocked' },
  safe: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'Approved' },
};

function CommentFeed() {
  const [visible, setVisible] = useState<typeof DEMO_COMMENTS>([]);
  const [scanning, setScanning] = useState<number | null>(null);
  const idx = useRef(0);

  useEffect(() => {
    const add = () => {
      const comment = DEMO_COMMENTS[idx.current % DEMO_COMMENTS.length];
      idx.current++;
      setScanning(comment.id);
      setTimeout(() => {
        setVisible(prev => [comment, ...prev].slice(0, 5));
        setScanning(null);
      }, 900);
    };
    add();
    const t = setInterval(add, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* scanning indicator */}
      {scanning && (
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeSlideIn 0.3s ease'
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1s infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>AI scanning comment…</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#F59E0B', opacity: 0.6, animation: `bounce 0.9s ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {visible.map((c, i) => {
        const b = BADGE_STYLES[c.badge];
        return (
          <div key={`${c.id}-${i}`} style={{
            background: c.badge === 'toxic' || c.badge === 'spam'
              ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${c.badge === 'safe' ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.12)'}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'fadeSlideIn 0.35s ease',
            opacity: i > 2 ? 0.5 - i * 0.05 : 1,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: c.badge === 'safe' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: c.badge === 'safe' ? '#34d399' : '#f87171', fontSize: 11, fontWeight: 700
            }}>{c.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>{c.author}</span>
                <span style={{
                  background: b.bg, color: b.color,
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                  letterSpacing: '0.05em'
                }}>{b.label}</span>
              </div>
              <p style={{
                color: c.badge === 'safe' ? 'rgba(255,255,255,0.5)' : 'rgba(255,100,100,0.5)',
                fontSize: 12, margin: 0, lineHeight: 1.4,
                textDecoration: c.badge !== 'safe' ? 'line-through' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>{c.text}</p>
            </div>
            {c.badge !== 'safe' && <EyeOff size={14} color="rgba(239,68,68,0.5)" style={{ flexShrink: 0, marginTop: 2 }} />}
            {c.badge === 'safe' && <Eye size={14} color="rgba(16,185,129,0.5)" style={{ flexShrink: 0, marginTop: 2 }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── BROWSER WINDOW MOCK ─── */
function BrowserWindow() {
  return (
    <div style={{
      background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={10} color="rgba(255,255,255,0.3)" />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>app.moderateai.site/dashboard</span>
        </div>
      </div>

      {/* Dashboard header */}
      <div style={{ background: '#0F0F0F', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', borderRadius: 7, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={12} color="white" />
          </div>
          <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 13 }}>ModerateAI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Live
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ background: '#0A0A0A', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Scanned', value: '12,847', color: '#F59E0B' },
          { label: 'Hidden', value: '1,203', color: '#f87171' },
          { label: 'Replied', value: '847', color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live comment feed */}
      <div style={{ padding: '14px 20px', background: '#080808' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Live Comment Feed</span>
          <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>AI Active</span>
        </div>
        <CommentFeed />
      </div>
    </div>
  );
}

/* ─── SECTION REVEAL HOOK ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── FAQ DATA ─── */
const FAQS = [
  { q: 'How does ModerateAI connect to YouTube?', a: 'You authorize ModerateAI through YouTube\'s official OAuth flow. We never store your password — only a revocable access token scoped to comment management.' },
  { q: 'Which languages does the AI understand?', a: 'ModerateAI detects intent and toxicity in 100+ languages including Hindi, Tamil, Arabic, Spanish, Portuguese, French, German, Japanese, Korean, and more — with no extra setup required.' },
  { q: 'Will the AI accidentally hide genuine comments?', a: 'Our false-positive rate is under 0.3%. The AI scores context, not just keywords. You can review every hidden comment and restore with one click from your dashboard.' },
  { q: 'How long does setup take?', a: 'Under 2 minutes. Connect your YouTube account, choose a sensitivity level, and the AI starts scanning immediately. No code, no plugins.' },
  { q: 'Can I customize what gets hidden?', a: 'Yes. You can set keyword rules, sensitivity thresholds, language filters, and safe-lists — or let the AI handle everything automatically.' },
  { q: 'Is my channel data secure?', a: 'All data is encrypted at rest with AES-256 and in transit with TLS 1.3. We are hosted on Cloudflare\'s edge network and never sell or share your data.' },
];

/* ─── PRICING ─── */
const PLANS = [
  {
    name: 'Free', price: { monthly: 0, annual: 0 }, priceLabel: '₹0',
    description: 'For creators just starting out.',
    features: ['1,500 comments/month', 'Basic spam detection', 'English & Hindi', 'Email alerts', '—', '—'],
    cta: 'Start Free', ctaStyle: 'secondary', highlight: false,
  },
  {
    name: 'Pro', price: { monthly: 349, annual: 299 }, priceLabel: '₹349',
    description: 'For creators who take community seriously.',
    features: ['25,000 comments/month', 'AI toxicity detection', '100+ languages', 'AI auto-replies', 'Telegram alerts', 'Priority support'],
    cta: 'Start 19-Day Trial', ctaStyle: 'primary', highlight: true,
  },
  {
    name: 'Agency', price: { monthly: 999, annual: 849 }, priceLabel: '₹999',
    description: 'For teams managing multiple channels.',
    features: ['Unlimited comments', 'Multi-channel dashboard', '100+ languages', 'AI auto-replies', 'Webhook integrations', 'Dedicated support'],
    cta: 'Contact Us', ctaStyle: 'secondary', highlight: false,
  },
];

/* ─── HOW IT WORKS ─── */
const STEPS = [
  { icon: Shield, label: 'Connect YouTube', detail: 'Authorize in one click via YouTube OAuth — read-only comment access.' },
  { icon: Cpu, label: 'AI scans comments', detail: 'Every new comment is sent to our moderation model in under 200ms.' },
  { icon: Languages, label: 'Language detected', detail: 'The model identifies language and switches context rules automatically.' },
  { icon: AlertTriangle, label: 'Intent analyzed', detail: 'Toxicity, spam, and manipulation signals are scored independently.' },
  { icon: EyeOff, label: 'Harmful content hidden', detail: 'Comments above your threshold are hidden before anyone else sees them.' },
  { icon: MessageSquare, label: 'AI reply generated', detail: 'Genuine comments receive a contextual AI reply in the comment\'s language.' },
  { icon: BarChart3, label: 'Analytics updated', detail: 'Every action is logged to your dashboard in real time.' },
];

/* ─── MAIN PAGE ─── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroReveal = useReveal();
  const statsReveal = useReveal();
  const howReveal = useReveal();
  const featReveal = useReveal();
  const secReveal = useReveal();
  const pricingReveal = useReveal();
  const faqReveal = useReveal();
  const ctaReveal = useReveal();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;0,14..32,900;1,14..32,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp { font-family: 'Inter', -apple-system, sans-serif; background: #090909; color: #FAFAFA; overflow-x: hidden; }

        /* NAVBAR */
        .lp-nav {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 100; width: calc(100% - 48px); max-width: 1160px;
          background: rgba(9,9,11,0.72); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 0 20px;
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          display: flex; align-items: center; height: 56px; gap: 8px;
          transition: box-shadow 0.3s, border-color 0.3s;
        }
        .lp-nav.scrolled {
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          border-color: rgba(255,255,255,0.10);
        }
        .nav-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
        .nav-logo-icon { background: linear-gradient(135deg,#F59E0B,#7C3AED); border-radius: 9px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
        .nav-logo-text { color: #FAFAFA; font-weight: 800; font-size: 15px; letter-spacing: -0.02em; }
        .nav-links { display: flex; align-items: center; gap: 2px; margin: 0 auto; }
        .nav-link { color: rgba(255,255,255,0.55); font-size: 13.5px; font-weight: 500; text-decoration: none; padding: 6px 12px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
        .nav-link:hover { color: #FAFAFA; background: rgba(255,255,255,0.05); }
        .nav-cta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .nav-login { color: rgba(255,255,255,0.6); font-size: 13.5px; font-weight: 500; text-decoration: none; padding: 6px 14px; border-radius: 8px; transition: color 0.2s; }
        .nav-login:hover { color: #FAFAFA; }
        .nav-trial { background: #F59E0B; color: #09090B; font-size: 13px; font-weight: 700; padding: 7px 16px; border-radius: 9px; text-decoration: none; transition: all 0.2s; white-space: nowrap; }
        .nav-trial:hover { background: #FBBF24; box-shadow: 0 0 20px rgba(245,158,11,0.35); }
        .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; color: rgba(255,255,255,0.7); margin-left: auto; }
        @media (max-width: 860px) {
          .nav-links, .nav-login { display: none !important; }
          .nav-hamburger { display: flex; }
          .lp-nav { width: calc(100% - 32px); }
        }

        /* MOBILE MENU */
        .mobile-menu {
          position: fixed; top: 82px; left: 16px; right: 16px; z-index: 99;
          background: rgba(13,13,15,0.97); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 16px; backdrop-filter: blur(24px);
          display: flex; flex-direction: column; gap: 4px;
        }
        .mobile-link { color: rgba(255,255,255,0.7); font-size: 15px; font-weight: 500; text-decoration: none; padding: 12px 16px; border-radius: 10px; transition: all 0.2s; }
        .mobile-link:hover { background: rgba(255,255,255,0.05); color: #FAFAFA; }

        /* SECTIONS */
        .section { position: relative; }

        /* REVEAL */
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .reveal.shown { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }

        /* ANIMATIONS */
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes gradientShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        @keyframes marqueeX { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        @keyframes lineGrow { from { height:0; } to { height:100%; } }

        /* HERO SECTION */
        .hero-section {
          min-height: 100vh;
          padding: 120px 24px 80px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 20% 20%, rgba(245,158,11,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 80% 80%, rgba(124,58,237,0.14) 0%, transparent 60%);
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 80%);
        }
        .hero-inner { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; max-width: 1160px; width: 100%; }
        .hero-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); border-radius: 20px; padding: 5px 14px 5px 10px; margin-bottom: 28px; }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #F59E0B; animation: pulse 2s infinite; }
        .hero-badge-text { color: #F59E0B; font-size: 12.5px; font-weight: 600; letter-spacing: 0.02em; }
        .hero-h1 { font-size: clamp(38px, 5vw, 62px); font-weight: 900; letter-spacing: -0.03em; line-height: 1.08; color: #FAFAFA; margin-bottom: 22px; }
        .hero-accent {
          background: linear-gradient(135deg, #F59E0B, #7C3AED);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: gradientShift 5s ease infinite;
        }
        .hero-desc { color: rgba(255,255,255,0.5); font-size: 17px; line-height: 1.65; max-width: 480px; margin-bottom: 36px; }
        .hero-buttons { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
        .btn-hero-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #F59E0B; color: #09090B; font-weight: 700; font-size: 15px;
          padding: 13px 24px; border-radius: 12px; text-decoration: none; border: none; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-hero-primary:hover { background: #FBBF24; box-shadow: 0 0 30px rgba(245,158,11,0.4); transform: translateY(-1px); }
        .btn-hero-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10);
          color: #FAFAFA; font-weight: 600; font-size: 15px;
          padding: 13px 24px; border-radius: 12px; text-decoration: none; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-hero-secondary:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); }
        .hero-trust { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .hero-trust-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.4); font-size: 13px; }
        .hero-trust-check { color: #10B981; }
        .hero-right { animation: float 6s ease-in-out infinite; }

        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; gap: 48px; }
          .hero-right { animation: none; }
          .hero-section { padding: 100px 20px 60px; }
        }

        /* STATS STRIP */
        .stats-strip {
          background: #111111; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 40px 24px; overflow: hidden;
        }
        .stats-inner { display: flex; align-items: center; justify-content: center; gap: 0; max-width: 1160px; margin: 0 auto; flex-wrap: wrap; }
        .stat-item { display: flex; flex-direction: column; align-items: center; padding: 0 48px; position: relative; }
        .stat-item + .stat-item::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 1px; height: 32px; background: rgba(255,255,255,0.08); }
        .stat-num { font-size: 32px; font-weight: 900; color: #FAFAFA; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1; }
        .stat-label { color: rgba(255,255,255,0.35); font-size: 12.5px; font-weight: 500; margin-top: 5px; letter-spacing: 0.03em; text-transform: uppercase; }
        @media (max-width: 640px) { .stat-item { padding: 16px 24px; } .stat-item + .stat-item::before { display: none; } }

        /* HOW IT WORKS */
        .how-section { background: linear-gradient(180deg, #0E0E0E 0%, #111111 100%); padding: 100px 24px; }
        .section-label { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.35); font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
        .section-title { font-size: clamp(28px,4vw,46px); font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 16px; }
        .section-sub { color: rgba(255,255,255,0.45); font-size: 16px; line-height: 1.6; max-width: 520px; }
        .timeline { position: relative; margin-top: 60px; }
        .timeline-line { position: absolute; left: 23px; top: 0; bottom: 0; width: 1px; background: linear-gradient(180deg, #F59E0B 0%, rgba(124,58,237,0.3) 100%); }
        .timeline-item { display: flex; gap: 24px; padding-bottom: 40px; position: relative; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-dot { width: 46px; height: 46px; border-radius: 14px; background: #171717; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; z-index: 1; transition: all 0.3s; }
        .timeline-item:hover .timeline-dot { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); }
        .timeline-content { padding-top: 10px; }
        .timeline-content h3 { font-size: 16px; font-weight: 700; color: #FAFAFA; margin-bottom: 5px; }
        .timeline-content p { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.55; }
        @media (min-width: 860px) {
          .how-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
          .timeline-line { left: 23px; }
        }

        /* FEATURES BENTO */
        .feat-section { background: #0D0D0D; padding: 100px 24px; }
        .bento-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto; gap: 16px; margin-top: 60px; }
        .bento-card {
          background: #131313; border: 1px solid rgba(255,255,255,0.06); border-radius: 20px;
          padding: 32px; transition: all 0.3s; position: relative; overflow: hidden;
        }
        .bento-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          background: radial-gradient(ellipse 60% 60% at 20% 20%, rgba(245,158,11,0.04) 0%, transparent 70%);
          opacity: 0; transition: opacity 0.3s;
        }
        .bento-card:hover { border-color: rgba(245,158,11,0.15); transform: translateY(-2px); }
        .bento-card:hover::before { opacity: 1; }
        .bento-large { grid-column: span 2; padding: 40px; }
        .bento-icon { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .bento-card h3 { font-size: 19px; font-weight: 800; color: #FAFAFA; margin-bottom: 10px; letter-spacing: -0.02em; }
        .bento-card p { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.6; }
        @media (max-width: 640px) { .bento-grid { grid-template-columns: 1fr; } .bento-large { grid-column: span 1; } }

        /* LANGUAGE */
        .lang-section { background: linear-gradient(180deg, #111111 0%, #0C0C0C 100%); padding: 100px 24px; }
        .lang-chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 40px; }
        .lang-chip {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 30px; padding: 8px 18px; font-size: 13.5px; font-weight: 500;
          color: rgba(255,255,255,0.55); cursor: default; transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .lang-chip:hover { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.25); color: #FAFAFA; }
        .lang-flag { font-size: 16px; line-height: 1; }

        /* SECURITY */
        .sec-section { background: #FFFFFF; padding: 100px 24px; }
        .sec-section .section-label { color: rgba(0,0,0,0.35); }
        .sec-section .section-title { color: #0A0A0A; }
        .sec-section .section-sub { color: rgba(0,0,0,0.5); }
        .sec-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 56px; }
        .sec-card {
          background: #F9F9F9; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px;
          padding: 28px; transition: all 0.2s;
        }
        .sec-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .sec-card-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .sec-card h3 { font-size: 15px; font-weight: 700; color: #0A0A0A; margin-bottom: 6px; }
        .sec-card p { font-size: 13.5px; color: rgba(0,0,0,0.45); line-height: 1.55; }
        @media (max-width: 860px) { .sec-cards { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 500px) { .sec-cards { grid-template-columns: 1fr; } }

        /* PRICING */
        .pricing-section { background: #F7F7F5; padding: 100px 24px; }
        .pricing-section .section-label { color: rgba(0,0,0,0.35); }
        .pricing-section .section-title { color: #0A0A0A; }
        .pricing-section .section-sub { color: rgba(0,0,0,0.5); }
        .pricing-toggle { display: inline-flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.06); border-radius: 12px; padding: 4px; margin: 32px auto 0; }
        .pricing-toggle-btn { padding: 8px 20px; border-radius: 9px; font-size: 13.5px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
        .pricing-toggle-btn.active { background: #0A0A0A; color: #FAFAFA; }
        .pricing-toggle-btn:not(.active) { background: transparent; color: rgba(0,0,0,0.45); }
        .pricing-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; }
        .pricing-card {
          background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px;
          padding: 32px; position: relative; transition: all 0.3s;
        }
        .pricing-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.1); transform: translateY(-3px); }
        .pricing-card.highlighted { background: #0A0A0A; border-color: rgba(245,158,11,0.4); }
        .pricing-card.highlighted:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 40px rgba(245,158,11,0.12); }
        .pricing-badge { position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: #F59E0B; color: #0A0A0A; font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 0 0 9px 9px; letter-spacing: 0.04em; white-space: nowrap; }
        .pricing-name { font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.4); margin-bottom: 8px; }
        .pricing-card.highlighted .pricing-name { color: rgba(255,255,255,0.4); }
        .pricing-price { font-size: 40px; font-weight: 900; color: #0A0A0A; letter-spacing: -0.03em; line-height: 1; margin-bottom: 6px; font-variant-numeric: tabular-nums; }
        .pricing-card.highlighted .pricing-price { color: #FAFAFA; }
        .pricing-desc { font-size: 13.5px; color: rgba(0,0,0,0.45); margin-bottom: 28px; }
        .pricing-card.highlighted .pricing-desc { color: rgba(255,255,255,0.35); }
        .pricing-features { display: flex; flex-direction: column; gap: 11px; margin-bottom: 28px; }
        .pricing-feat { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: rgba(0,0,0,0.65); }
        .pricing-card.highlighted .pricing-feat { color: rgba(255,255,255,0.7); }
        .pricing-feat-x { color: rgba(0,0,0,0.2); }
        .pricing-cta-primary { width: 100%; background: #F59E0B; color: #0A0A0A; font-weight: 700; font-size: 14px; padding: 13px; border-radius: 11px; border: none; cursor: pointer; transition: all 0.2s; text-align: center; display: block; text-decoration: none; }
        .pricing-cta-primary:hover { background: #FBBF24; box-shadow: 0 0 24px rgba(245,158,11,0.3); }
        .pricing-cta-secondary { width: 100%; background: rgba(0,0,0,0.06); color: #0A0A0A; font-weight: 700; font-size: 14px; padding: 13px; border-radius: 11px; border: 1px solid rgba(0,0,0,0.08); cursor: pointer; transition: all 0.2s; text-align: center; display: block; text-decoration: none; }
        .pricing-cta-secondary:hover { background: rgba(0,0,0,0.09); }
        @media (max-width: 860px) { .pricing-cards { grid-template-columns: 1fr; max-width: 400px; margin-left: auto; margin-right: auto; } }

        /* FAQ */
        .faq-section { background: #FFFFFF; padding: 100px 24px; }
        .faq-section .section-label { color: rgba(0,0,0,0.35); }
        .faq-section .section-title { color: #0A0A0A; }
        .faq-list { margin-top: 56px; display: flex; flex-direction: column; }
        .faq-item { border-bottom: 1px solid rgba(0,0,0,0.07); }
        .faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px 0; background: none; border: none; cursor: pointer; text-align: left; }
        .faq-q-text { font-size: 16.5px; font-weight: 700; color: #0A0A0A; }
        .faq-chevron { color: rgba(0,0,0,0.3); transition: transform 0.3s; flex-shrink: 0; }
        .faq-chevron.open { transform: rotate(180deg); color: #F59E0B; }
        .faq-a { font-size: 15px; color: rgba(0,0,0,0.55); line-height: 1.7; padding-bottom: 24px; max-width: 680px; }

        /* CTA */
        .cta-section {
          background: #090909; padding: 120px 24px;
          position: relative; overflow: hidden;
        }
        .cta-bg {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 70% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%);
        }
        .cta-inner { position: relative; z-index: 1; text-align: center; max-width: 680px; margin: 0 auto; }
        .cta-title { font-size: clamp(32px,5vw,56px); font-weight: 900; letter-spacing: -0.03em; line-height: 1.08; margin-bottom: 20px; }
        .cta-sub { color: rgba(255,255,255,0.45); font-size: 17px; line-height: 1.6; margin-bottom: 36px; }
        .cta-buttons { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }

        /* FOOTER */
        .footer { background: #000000; border-top: 1px solid rgba(255,255,255,0.05); padding: 60px 24px 32px; }
        .footer-inner { max-width: 1160px; margin: 0 auto; }
        .footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .footer-brand p { color: rgba(255,255,255,0.35); font-size: 13.5px; line-height: 1.6; margin-top: 14px; max-width: 260px; }
        .footer-col h4 { color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
        .footer-link { display: block; color: rgba(255,255,255,0.4); font-size: 13.5px; text-decoration: none; margin-bottom: 10px; transition: color 0.2s; }
        .footer-link:hover { color: rgba(255,255,255,0.8); }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .footer-copy { color: rgba(255,255,255,0.25); font-size: 13px; }
        .footer-tagline { color: rgba(255,255,255,0.2); font-size: 12.5px; }
        @media (max-width: 860px) { .footer-top { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 500px) { .footer-top { grid-template-columns: 1fr; } }

        .container { max-width: 1160px; margin: 0 auto; }

        /* Scrollbar for landing */
        .lp ::-webkit-scrollbar { width: 4px; }
        .lp ::-webkit-scrollbar-track { background: #090909; }
        .lp ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
      `}</style>

      <div className="lp">

        {/* ── NAVBAR ── */}
        <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon"><Shield size={15} color="white" /></div>
            <span className="nav-logo-text">ModerateAI</span>
          </Link>

          <div className="nav-links">
            {['Features','How It Works','Pricing','Security','Documentation'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} className="nav-link">{item}</a>
            ))}
          </div>

          <div className="nav-cta">
            <Link href="/login" className="nav-login">Login</Link>
            <Link href="/login" className="nav-trial">Start Free Trial</Link>
          </div>

          <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu">
            {['Features','How It Works','Pricing','Security','Documentation'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} className="mobile-link" onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
            <Link href="/login" className="mobile-link">Login</Link>
            <Link href="/login" style={{ background: '#F59E0B', color: '#090909', fontWeight: 700, fontSize: 15, padding: '13px 16px', borderRadius: 10, textDecoration: 'none', textAlign: 'center', display: 'block', marginTop: 4 }}>Start Free Trial →</Link>
          </div>
        )}

        {/* ── HERO ── */}
        <section className="hero-section" id="features">
          <div className="hero-bg" />
          <div className="hero-grid" />

          <div className="hero-inner" ref={heroReveal.ref}>
            {/* Left */}
            <div>
              <div className={`reveal${heroReveal.visible ? ' shown' : ''}`}>
                <div className="hero-badge">
                  <div className="hero-badge-dot" />
                  <span className="hero-badge-text">GPT-4 Powered Moderation</span>
                </div>
              </div>

              <h1 className={`hero-h1 reveal${heroReveal.visible ? ' shown' : ''} reveal-delay-1`}>
                Protect your YouTube community before{' '}
                <span className="hero-accent">toxicity spreads.</span>
              </h1>

              <p className={`hero-desc reveal${heroReveal.visible ? ' shown' : ''} reveal-delay-2`}>
                ModerateAI scans every comment in real time — detecting spam, toxicity, and manipulation across 100+ languages — and hides harmful content before your audience ever sees it.
              </p>

              <div className={`hero-buttons reveal${heroReveal.visible ? ' shown' : ''} reveal-delay-3`}>
                <Link href="/login" className="btn-hero-primary">
                  Start Free Trial <ArrowRight size={16} />
                </Link>
                <a href="#how-it-works" className="btn-hero-secondary">
                  <Play size={15} /> See How It Works
                </a>
              </div>

              <div className={`hero-trust reveal${heroReveal.visible ? ' shown' : ''} reveal-delay-4`}>
                {['19-Day Free Trial', 'No Credit Card', 'Setup under 2 minutes'].map(t => (
                  <div key={t} className="hero-trust-item">
                    <CheckCircle size={14} className="hero-trust-check" style={{ color: '#10B981', flexShrink: 0 }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live browser window */}
            <div className={`hero-right reveal${heroReveal.visible ? ' shown' : ''} reveal-delay-2`}>
              <BrowserWindow />
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <div className="stats-strip" ref={statsReveal.ref}>
          <div className="stats-inner">
            {[
              { num: '100+', label: 'Languages' },
              { num: '24/7', label: 'Live Protection' },
              { num: '<200ms', label: 'Response Time' },
              { num: '99.7%', label: 'Accuracy Rate' },
              { num: '0', label: 'Setup Code' },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`stat-item reveal${statsReveal.visible ? ' shown' : ''}`}
                style={{ transitionDelay: `${i * 0.07}s` }}
              >
                <span className="stat-num">{s.num}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="how-section" id="how-it-works" ref={howReveal.ref}>
          <div className="container">
            <div className="how-inner">
              <div>
                <div className={`reveal${howReveal.visible ? ' shown' : ''}`}>
                  <div className="section-label">
                    <Zap size={12} /> Process
                  </div>
                  <h2 className="section-title">
                    From comment posted<br />
                    <span className="hero-accent">to threat removed</span><br />
                    in under a second.
                  </h2>
                  <p className="section-sub">
                    Seven stages of AI analysis happen invisibly before any viewer sees a harmful comment. No manual review. No plugins.
                  </p>
                </div>
              </div>

              <div className={`reveal${howReveal.visible ? ' shown' : ''} reveal-delay-2`}>
                <div className="timeline">
                  <div className="timeline-line" />
                  {STEPS.map((step, i) => (
                    <div key={step.label} className="timeline-item" style={{ transitionDelay: `${i * 0.06}s` }}>
                      <div className="timeline-dot">
                        <step.icon size={18} color="rgba(245,158,11,0.8)" />
                      </div>
                      <div className="timeline-content">
                        <h3>{step.label}</h3>
                        <p>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES BENTO ── */}
        <section className="feat-section" ref={featReveal.ref}>
          <div className="container">
            <div className={`reveal${featReveal.visible ? ' shown' : ''}`}>
              <div className="section-label"><Star size={12} /> Features</div>
              <h2 className="section-title">Everything your channel<br />needs to stay protected.</h2>
            </div>

            <div className="bento-grid">
              {/* Large card */}
              <div className={`bento-card bento-large reveal${featReveal.visible ? ' shown' : ''} reveal-delay-1`}
                style={{ background: 'linear-gradient(135deg, #131313 0%, #0D0D0D 100%)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center' }}>
                  <div>
                    <div className="bento-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                      <Cpu size={22} color="#F59E0B" />
                    </div>
                    <h3 style={{ fontSize: 22 }}>AI Context Detection</h3>
                    <p style={{ fontSize: 15 }}>
                      Unlike keyword filters, ModerateAI reads intent. Sarcasm, dog-whistles, mixed-language attacks — the model catches what rules miss, with a false-positive rate under 0.3%.
                    </p>
                  </div>
                  <div style={{ background: '#0A0A0A', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { text: 'great video bro keep it up 👍', score: 2, label: 'SAFE' },
                      { text: 'go kys nobody likes you here', score: 97, label: 'TOXIC' },
                      { text: 'FREE SUBS → click profile NOW', score: 99, label: 'SPAM' },
                    ].map(row => (
                      <div key={row.text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.text}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                          background: row.label === 'SAFE' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: row.label === 'SAFE' ? '#34d399' : '#f87171',
                          flexShrink: 0
                        }}>{row.label} {row.score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 smaller cards */}
              {[
                {
                  icon: Languages, iconBg: 'rgba(96,165,250,0.12)', iconColor: '#60a5fa',
                  title: '100+ Languages', body: 'Hindi, Tamil, Arabic, Spanish, Korean — the AI switches context rules per language automatically.'
                },
                {
                  icon: MessageSquare, iconBg: 'rgba(167,139,250,0.12)', iconColor: '#a78bfa',
                  title: 'AI Auto-Replies', body: 'Genuine comments get a human-sounding reply in the commenter\'s own language. No templates.'
                },
                {
                  icon: Bell, iconBg: 'rgba(251,146,60,0.12)', iconColor: '#fb923c',
                  title: 'Instant Alerts', body: 'Get notified via Telegram the moment a coordinated spam attack or hate campaign begins.'
                },
                {
                  icon: TrendingUp, iconBg: 'rgba(16,185,129,0.12)', iconColor: '#34d399',
                  title: 'Engagement Analytics', body: 'Track comment volume, toxicity trends, and reply performance over time on a single dashboard.'
                },
              ].map((card, i) => (
                <div
                  key={card.title}
                  className={`bento-card reveal${featReveal.visible ? ' shown' : ''}`}
                  style={{ transitionDelay: `${0.2 + i * 0.08}s` }}
                >
                  <div className="bento-icon" style={{ background: card.iconBg }}>
                    <card.icon size={20} color={card.iconColor} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LANGUAGE SUPPORT ── */}
        <section className="lang-section" id="language-support" ref={howReveal.ref}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 0 }}>
              <div className="section-label" style={{ justifyContent: 'center' }}><Globe size={12} /> Language Support</div>
              <h2 className="section-title">Your community speaks<br /><span className="hero-accent">every language.</span><br />So does the AI.</h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>ModerateAI detects the language of each comment automatically and applies culturally-aware moderation rules — no manual configuration needed.</p>
            </div>

            <div className="lang-chips">
              {[
                { flag: '🇮🇳', name: 'Hindi' }, { flag: '🇮🇳', name: 'Tamil' }, { flag: '🇮🇳', name: 'Telugu' },
                { flag: '🇮🇳', name: 'Bengali' }, { flag: '🇮🇳', name: 'Marathi' }, { flag: '🇮🇳', name: 'Kannada' },
                { flag: '🇺🇸', name: 'English' }, { flag: '🇪🇸', name: 'Spanish' }, { flag: '🇵🇹', name: 'Portuguese' },
                { flag: '🇫🇷', name: 'French' }, { flag: '🇩🇪', name: 'German' }, { flag: '🇯🇵', name: 'Japanese' },
                { flag: '🇰🇷', name: 'Korean' }, { flag: '🇨🇳', name: 'Chinese' }, { flag: '🇸🇦', name: 'Arabic' },
                { flag: '🇷🇺', name: 'Russian' }, { flag: '🇮🇩', name: 'Indonesian' }, { flag: '🇹🇷', name: 'Turkish' },
                { flag: '🇮🇹', name: 'Italian' }, { flag: '🇵🇱', name: 'Polish' },
                { flag: '🌍', name: '+80 more' },
              ].map(l => (
                <div key={l.name} className="lang-chip">
                  <span className="lang-flag">{l.flag}</span>
                  {l.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECURITY ── */}
        <section className="sec-section" id="security" ref={secReveal.ref}>
          <div className="container">
            <div className={`reveal${secReveal.visible ? ' shown' : ''}`}>
              <div className="section-label"><Lock size={12} /> Security</div>
              <h2 className="section-title">Built for channels that<br />can't afford a breach.</h2>
              <p className="section-sub">Enterprise-grade security, applied to every creator account. No exceptions.</p>
            </div>

            <div className="sec-cards">
              {[
                { icon: Lock, iconBg: 'rgba(245,158,11,0.1)', iconColor: '#F59E0B', title: 'AES-256 Encryption', body: 'All tokens, user data, and channel credentials are encrypted at rest with AES-256 — the same standard used by banks.' },
                { icon: Shield, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10B981', title: 'OAuth 2.0 Only', body: 'We never see your Google password. Authentication goes through YouTube\'s official OAuth 2.0 flow with scoped, revocable tokens.' },
                { icon: Globe, iconBg: 'rgba(96,165,250,0.1)', iconColor: '#60a5fa', title: 'Cloudflare Edge', body: 'Hosted behind Cloudflare\'s global CDN with DDoS protection, rate limiting, and TLS 1.3 on every request.' },
                { icon: Eye, iconBg: 'rgba(167,139,250,0.1)', iconColor: '#a78bfa', title: 'Zero Data Selling', body: 'Your comment data, channel stats, and audience information are never sold, shared, or used to train third-party models.' },
                { icon: Clock, iconBg: 'rgba(251,146,60,0.1)', iconColor: '#fb923c', title: 'Session Management', body: 'Every active session is logged and visible in your dashboard. Revoke access from any device at any time.' },
                { icon: Filter, iconBg: 'rgba(239,68,68,0.1)', iconColor: '#f87171', title: 'Rate Limiting', body: 'All API endpoints are rate-limited and monitored. Abuse patterns trigger automatic account protection.' },
              ].map((card, i) => (
                <div
                  key={card.title}
                  className={`sec-card reveal${secReveal.visible ? ' shown' : ''}`}
                  style={{ transitionDelay: `${i * 0.07}s` }}
                >
                  <div className="sec-card-icon" style={{ background: card.iconBg }}>
                    <card.icon size={18} color={card.iconColor} />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="pricing-section" id="pricing" ref={pricingReveal.ref}>
          <div className="container">
            <div className={`reveal${pricingReveal.visible ? ' shown' : ''}`} style={{ textAlign: 'center' }}>
              <div className="section-label" style={{ justifyContent: 'center' }}><Zap size={12} /> Pricing</div>
              <h2 className="section-title">Transparent pricing.<br />No surprises.</h2>
              <p className="section-sub" style={{ margin: '0 auto' }}>Start free. Upgrade when you're ready. Cancel anytime.</p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="pricing-toggle">
                  <button className={`pricing-toggle-btn${!annual ? ' active' : ''}`} onClick={() => setAnnual(false)}>Monthly</button>
                  <button className={`pricing-toggle-btn${annual ? ' active' : ''}`} onClick={() => setAnnual(true)}>
                    Annual <span style={{ background: '#F59E0B', color: '#0A0A0A', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, marginLeft: 4 }}>-14%</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pricing-cards">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.name}
                  className={`pricing-card${plan.highlight ? ' highlighted' : ''} reveal${pricingReveal.visible ? ' shown' : ''}`}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  {plan.highlight && <div className="pricing-badge">MOST POPULAR</div>}
                  <div className="pricing-name">{plan.name}</div>
                  <div className="pricing-price">
                    {plan.name === 'Free' ? '₹0' : `₹${annual ? plan.price.annual : plan.price.monthly}`}
                    {plan.name !== 'Free' && <span style={{ fontSize: 14, fontWeight: 500, color: plan.highlight ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>/mo</span>}
                  </div>
                  <div className="pricing-desc">{plan.description}</div>
                  <div className="pricing-features">
                    {plan.features.map(f => (
                      <div key={f} className="pricing-feat">
                        {f === '—'
                          ? <X size={14} className="pricing-feat-x" style={{ color: plan.highlight ? 'rgba(255,255,255,0.2)' : undefined, flexShrink: 0 }} />
                          : <Check size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                        }
                        <span style={{ color: f === '—' ? (plan.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') : undefined }}>{f === '—' ? 'Not included' : f}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/login"
                    className={plan.ctaStyle === 'primary' ? 'pricing-cta-primary' : 'pricing-cta-secondary'}
                    style={plan.highlight && plan.ctaStyle !== 'primary' ? { background: 'rgba(255,255,255,0.08)', color: '#FAFAFA', border: '1px solid rgba(255,255,255,0.12)' } : {}}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="faq-section" ref={faqReveal.ref}>
          <div className="container" style={{ maxWidth: 760 }}>
            <div className={`reveal${faqReveal.visible ? ' shown' : ''}`} style={{ textAlign: 'center' }}>
              <div className="section-label" style={{ justifyContent: 'center' }}>FAQ</div>
              <h2 className="section-title">Common questions</h2>
            </div>

            <div className={`faq-list reveal${faqReveal.visible ? ' shown' : ''} reveal-delay-1`}>
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="faq-q-text">{faq.q}</span>
                    <ChevronDown size={18} className={`faq-chevron${openFaq === i ? ' open' : ''}`} />
                  </button>
                  {openFaq === i && <p className="faq-a">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section" ref={ctaReveal.ref}>
          <div className="cta-bg" />
          <div className={`cta-inner reveal${ctaReveal.visible ? ' shown' : ''}`}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '5px 16px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#F59E0B', fontSize: 12.5, fontWeight: 600 }}>19-day free trial · no card needed</span>
            </div>
            <h2 className="cta-title">
              Ready to protect<br />
              <span className="hero-accent">your community?</span>
            </h2>
            <p className="cta-sub">
              Join creators who stopped losing subscribers to toxic comments. Set up takes less than 2 minutes.
            </p>
            <div className="cta-buttons">
              <Link href="/login" className="btn-hero-primary">
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn-hero-secondary">See how it works</a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-top">
              <div className="footer-brand">
                <Link href="/" className="nav-logo" style={{ display: 'inline-flex' }}>
                  <div className="nav-logo-icon"><Shield size={14} color="white" /></div>
                  <span className="nav-logo-text">ModerateAI</span>
                </Link>
                <p>AI-powered YouTube comment moderation. Protect your community before toxicity spreads.</p>
              </div>

              <div className="footer-col">
                <h4>Product</h4>
                <a href="#features" className="footer-link">Features</a>
                <a href="#pricing" className="footer-link">Pricing</a>
                <a href="#security" className="footer-link">Security</a>
                <a href="#" className="footer-link">Documentation</a>
                <a href="#" className="footer-link">Status</a>
              </div>

              <div className="footer-col">
                <h4>Support</h4>
                <a href="#" className="footer-link">Help Center</a>
                <a href="mailto:support@moderateai.site" className="footer-link">Contact</a>
                <Link href="/privacy" className="footer-link">Privacy Policy</Link>
                <Link href="/terms" className="footer-link">Terms of Service</Link>
              </div>

              <div className="footer-col">
                <h4>Connect</h4>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-link">GitHub</a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-link">LinkedIn</a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer-link">YouTube</a>
                <a href="mailto:support@moderateai.site" className="footer-link">support@moderateai.site</a>
              </div>
            </div>

            <div className="footer-bottom">
              <span className="footer-copy">© 2026 ModerateAI. All rights reserved.</span>
              <span className="footer-tagline">Built for YouTube creators.</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}