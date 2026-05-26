'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Globe, BarChart3, Bell, MessageSquare, Check, ChevronRight, Star, AlertTriangle } from 'lucide-react';

export default function Home() {
  return (
    <main style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }} className="min-h-screen text-white">
      <style>{`
        body { background: #08080f; }
        .grad-text { background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-bg { background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.2) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(6,182,212,0.1) 0%, transparent 60%), #08080f; }
        .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); }
        .card:hover { background: rgba(255,255,255,0.06); border-color: rgba(59,130,246,0.3); transform: translateY(-4px); transition: all 0.3s; }
        .gold-btn { background: linear-gradient(135deg, #3b82f6, #06b6d4); color: #fff; font-weight: 800; }
        .gold-btn:hover { opacity: 0.9; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,0.35); }
        .purple-glow { box-shadow: 0 0 40px rgba(59,130,246,0.15); }
        .badge { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); }
        .section-bg { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .pricing-featured { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.1)); border: 2px solid rgba(59,130,246,0.5) !important; }
        .lang-featured { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.4); color: #60a5fa; }
        .stat-num { background: linear-gradient(135deg, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .nav-bg { background: rgba(8,8,15,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .comment-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; }
        .timeout-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px; margin-bottom: 8px; }
      `}</style>

      {/* NAV */}
      <nav className="nav-bg fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3">
        <Link href="/">
          <Image src="/logo.svg" alt="ModrateAI" width={160} height={36} priority />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="#how" className="text-sm text-gray-400 hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
          <Link href="/demo" className="text-sm text-gray-400 hover:text-white transition-colors">Demo</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Login</Link>
          <Link href="/login" className="gold-btn px-5 py-2.5 rounded-xl text-sm transition-all">Start for free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-bg min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="badge inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-blue-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          AI bot is live — protecting channels right now
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em' }} className="mb-6">
          Stop toxic comments.<br />
          <span className="grad-text">Automatically.</span><br />
          In every language.
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mb-10 leading-relaxed">
          AI-powered YouTube moderation for Telugu, Hindi, Tamil, Kannada, Malayalam, Punjabi and 100+ languages. Bad comments hidden for review. Live chat timeouts. Auto-replied. 24/7.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <Link href="/login" className="gold-btn px-8 py-4 rounded-xl text-lg transition-all">Start free trial →</Link>
          <Link href="/demo" className="border border-white/15 text-gray-300 px-8 py-4 rounded-xl text-lg hover:bg-white/5 transition-colors">Try demo</Link>
        </div>
        <p className="text-sm text-gray-600">✓ No credit card &nbsp;✓ 19-day free trial &nbsp;✓ Cancel anytime</p>

        {/* DEMO CARD */}
        <div className="mt-16 w-full max-w-lg purple-glow rounded-2xl overflow-hidden card text-left">
          <div className="px-5 py-3 border-b border-white/8 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
            <span className="text-xs text-gray-500 ml-2">ModrateAI — Live comment moderation</span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { user: 'Ravi Kumar', text: 'Bhai bohot acha video tha! 🙌', status: '✓ KEPT', bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
              { user: 'anonymous_x', text: 'ni amma [abusive Telugu slang]', status: '🙈 HIDDEN', bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
              { user: 'Priya Sharma', text: 'ella unaru? video chala bagundi!', status: '↩ REPLIED', bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
              { user: 'troll_99 (3rd offense)', text: 'kys bro [repeat offender]', status: '⏱ 10s TIMEOUT', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
            ].map((c, i) => (
              <div key={i} className="comment-card flex items-center justify-between p-3">
                <div>
                  <div className="text-xs font-bold text-gray-300">{c.user}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{c.text}</div>
                </div>
                <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }} className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ml-3">{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="section-bg">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/6">
          {[
            { num: '10+', label: 'Indian languages' },
            { num: '2 min', label: 'Scan interval' },
            { num: '99%', label: 'AI accuracy' },
            { num: '24/7', label: 'Auto protection' },
          ].map((s) => (
            <div key={s.label} className="text-center py-8 px-4">
              <div className="stat-num text-3xl font-black mb-1">{s.num}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-4" style={{ background: '#08080f' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-3 text-center">How it works</p>
          <h2 className="text-4xl font-black mb-4 text-center">Smart moderation that learns</h2>
          <p className="text-gray-500 text-center mb-12">Repeat offenders get progressively longer timeouts. Connect once, protect forever.</p>

          <div className="card rounded-2xl p-6 mb-12">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-blue-400" />
              <p className="text-blue-400 text-sm font-bold">Live Chat Progressive Timeout System</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { range: '1st – 2nd offense', timeout: '10 seconds', color: '#4ade80', bg: 'rgba(34,197,94,0.08)' },
                { range: '3rd – 14th offense', timeout: '30 minutes', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                { range: '15th – 20th+ offense', timeout: '24 hours', color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
                { range: '10 bad words spam', timeout: 'Auto hide + 24hr timeout', color: '#c084fc', bg: 'rgba(168,85,247,0.08)' },
              ].map((t) => (
                <div key={t.range} className="timeout-row" style={{ background: t.bg, border: `1px solid ${t.color}22` }}>
                  <span className="text-sm text-gray-400">{t.range}</span>
                  <span className="text-sm font-black" style={{ color: t.color }}>{t.timeout}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { num: '01', title: 'Connect YouTube', desc: 'One-click Google login. No API keys or technical setup.' },
              { num: '02', title: 'AI scans everything', desc: 'Every 2 minutes — all videos, shorts, posts, live chats scanned.' },
              { num: '03', title: 'Hide for review', desc: 'Bad comments hidden from public. You review and decide from dashboard.' },
              { num: '04', title: 'Auto-reply', desc: 'Good comments get AI replies with 45 second natural delay.' },
            ].map((step, i) => (
              <div key={i} className="card rounded-2xl p-6">
                <div className="text-5xl font-black mb-4" style={{ color: 'rgba(59,130,246,0.2)' }}>{step.num}</div>
                <h3 className="font-bold mb-2 text-white">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4 section-bg">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-3 text-center">Features</p>
          <h2 className="text-4xl font-black mb-16 text-center">Everything your channel needs</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Globe, title: 'Multilingual AI', desc: 'Detects toxic content in Telugu, Hindi, Tamil, Kannada, Punjabi, Malayalam and 100+ languages including Romanized scripts.', color: '#3b82f6' },
              { icon: Zap, title: 'Live chat timeouts', desc: '1st-2nd offense: 10sec. 3rd-14th: 30min. 15th-20th+: 24hr timeout. Spam with 10+ bad words: auto-hide + 24hr ban.', color: '#06b6d4' },
              { icon: MessageSquare, title: 'Smart auto-replies', desc: '3 AI replies per video on free plan. Replies to good comments with 45 second natural delay. Unlimited on Pro.', color: '#3b82f6' },
              { icon: BarChart3, title: 'Comments review', desc: 'All hidden bad comments from videos, shorts, posts available in your dashboard for review. Restore or delete permanently.', color: '#06b6d4' },
              { icon: Bell, title: 'Spam detection', desc: 'Repeated bad words and spam messages automatically trigger hide or progressive timeout — no manual setup needed.', color: '#3b82f6' },
              { icon: AlertTriangle, title: 'All content protected', desc: 'Videos, Shorts, Posts, Live chats — everything scanned every 2 minutes. Bad ones hidden, good ones replied.', color: '#06b6d4' },
            ].map((f, i) => (
              <div key={i} className="card rounded-2xl p-6" style={{ transition: 'all 0.3s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = `${f.color}44`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}18` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LANGUAGES */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(6,182,212,0.08) 100%), #08080f' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-3">Language support</p>
          <h2 className="text-4xl font-black mb-4">Every Indian language. Every slang.</h2>
          <p className="text-gray-500 mb-10">Including Romanized text — people typing Telugu or Hindi in English are caught too.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Punjabi', 'Bengali', 'Marathi', 'Gujarati', 'Odia', 'Urdu', 'Bhojpuri', 'English', 'Arabic', 'Spanish', 'French', 'Korean', 'Japanese', '+ 82 more'].map((lang) => (
              <span key={lang} className={['Telugu','Hindi','Tamil','Kannada','Malayalam','Punjabi'].includes(lang) ? 'lang-featured px-4 py-2 rounded-full text-sm font-bold' : 'px-4 py-2 rounded-full text-sm text-gray-500'} style={!['Telugu','Hindi','Tamil','Kannada','Malayalam','Punjabi'].includes(lang) ? { border: '1px solid rgba(255,255,255,0.1)' } : {}}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-4" style={{ background: '#08080f' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-3 text-center">Pricing</p>
          <h2 className="text-4xl font-black mb-4 text-center">Simple pricing. No surprises.</h2>
          <p className="text-gray-500 text-center mb-16">Start free for 19 days. Pay via UPI, card, or net banking.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free Trial', price: '₹0', period: '/month', tagline: 'Try before you pay',
                badge: null, featured: false, trialDays: '19-day free trial',
                features: ['1 YouTube channel', '1,500 comments scanned/month', 'All videos + Shorts + Posts scanned', 'Unlimited bad comments hidden for review', 'Live chat progressive timeouts', 'Spam detection & auto-hide', '3 AI replies per video (45s delay)', '10+ Indian languages', 'Basic dashboard'],
                cta: 'Start free trial', href: '/login'
              },
              {
                name: 'Pro', price: '₹299', period: '/month', tagline: 'For growing creators',
                badge: 'MOST POPULAR', featured: true, trialDays: '7-day free trial',
                features: ['1 YouTube channel', '5,000 comments scanned/month', 'All videos + Shorts + Posts + Live chat', 'Unlimited bad comments hidden for review', 'Live chat progressive timeouts', 'Spam detection & auto-hide', 'Auto-replies scale with comments (45s delay)', '100+ world languages', 'Full analytics dashboard', 'Telegram alerts', 'Priority support'],
                cta: 'Get Pro', href: '/login'
              },
              {
                name: 'Agency', price: '₹1,900', period: '/month', tagline: 'Unlimited everything',
                badge: null, featured: false, trialDays: '7-day free trial',
                features: ['1 YouTube channel', 'Unlimited comments scanned', 'All videos + Shorts + Posts + Live chat', 'Unlimited bad comment hiding', 'Advanced timeout controls', 'Unlimited auto-replies', '100+ world languages', 'Advanced analytics + exports', 'Telegram + WhatsApp alerts', 'Dedicated support', 'API access'],
                cta: 'Get Agency', href: '/login'
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 flex flex-col relative ${plan.featured ? 'pricing-featured' : 'card'}`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 gold-btn text-xs font-black px-4 py-1.5 rounded-full">{plan.badge}</div>
                )}
                <div className="text-xl font-black mb-1 text-white">{plan.name}</div>
                <div className="text-sm mb-6 text-gray-500">{plan.tagline}</div>
                <div className="text-5xl font-black mb-1 text-white">{plan.price}<span className="text-base font-normal text-gray-500">{plan.period}</span></div>
                <div className="text-sm mb-6 text-blue-400">✦ {plan.trialDays}</div>
                <div className="h-px bg-white/8 mb-6"></div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-400">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`w-full text-center py-3 rounded-xl font-bold transition-all ${plan.featured ? 'gold-btn' : 'border border-white/15 text-white hover:bg-white/5'}`}>
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4 section-bg">
        <div className="max-w-5xl mx-auto">
          <p className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-3 text-center">What creators say</p>
          <h2 className="text-4xl font-black mb-16 text-center">Telugu & Hindi YouTubers love it</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Ravi Kumar', role: 'Tech YouTuber · 85K subs', text: '"Finally a tool that understands Telugu slang! It hides 200+ abusive comments and I can review them later from the dashboard."', avatar: 'RK', color: '#3b82f6' },
              { name: 'Priya Sharma', role: 'Lifestyle creator · 120K subs', text: '"The timeout system is brilliant! Repeat trolls get longer and longer bans automatically. My live streams are so peaceful now!"', avatar: 'PS', color: '#06b6d4' },
              { name: 'Karthik Vlogs', role: 'Travel creator · 45K subs', text: '"The auto-reply feature with 45 second delay feels so natural. My audience thinks I am super active but ModrateAI does all the work!"', avatar: 'KV', color: '#3b82f6' },
            ].map((t, i) => (
              <div key={i} className="card rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-blue-400 fill-blue-400" />)}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(59,130,246,0.15) 0%, transparent 70%), #08080f', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-5xl font-black mb-4">Your community deserves<br /><span className="grad-text">a safe space.</span></h2>
        <p className="text-gray-500 mb-8 text-lg">Join Indian YouTubers who trust ModrateAI to protect their channels 24/7</p>
        <Link href="/login" className="gold-btn inline-flex items-center gap-2 px-10 py-4 rounded-xl text-lg transition-all">
          Start 19-day free trial — no credit card <ChevronRight className="w-5 h-5" />
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
        <Image src="/logo.svg" alt="ModrateAI" width={120} height={28} />
        <div className="flex gap-6">
          <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-400">Privacy</Link>
          <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-400">Terms</Link>
          <Link href="/demo" className="text-sm text-gray-600 hover:text-gray-400">Demo</Link>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-400">Contact</a>
        </div>
        <div className="text-sm text-gray-600">© 2026 ModrateAI. Made in India 🇮🇳</div>
      </footer>
    </main>
  );
}