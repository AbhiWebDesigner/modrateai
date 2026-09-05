'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { connectYouTube } from '@/lib/useYouTubeConnection';

type Step = 'gcp' | 'youtube';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]             = useState<Step>('gcp');
  const [uid, setUid]               = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [gcpSkipped, setGcpSkipped] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace('/login'); return; }
      setUid(user.uid);
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists() && snap.data()?.onboarding_completed === true) {
        router.replace('/dashboard');
        return;
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSkipGcp  = () => { setGcpSkipped(true); setStep('youtube'); };
  const handleGcpSetup = () => { window.open('https://console.cloud.google.com', '_blank'); setGcpSkipped(false); setStep('youtube'); };

  const handleConnectYouTube = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      await connectYouTube(auth.currentUser);
    } catch { setConnecting(false); }
  };

  const handleSkipYouTube = async () => {
    if (!uid) return;
    try { await updateDoc(doc(db, 'users', uid), { onboarding_completed: true }); } catch {}
    router.replace('/dashboard');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#09060f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 30, height: 30, border: '2.5px solid rgba(255,120,30,0.15)', borderTopColor: '#FF7A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{font-family:'Inter',ui-sans-serif,system-ui,sans-serif;letter-spacing:-0.015em;box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#09060f;color:#FAFAFA;overflow-x:hidden;}

        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatL{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-14px) rotate(-3deg)}}
        @keyframes floatR{0%,100%{transform:translateY(0) rotate(3deg)}50%{transform:translateY(-10px) rotate(3deg)}}
        @keyframes pulse{0%,100%{opacity:0.7}50%{opacity:1}}

        .u1{animation:fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.00s both}
        .u2{animation:fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.07s both}
        .u3{animation:fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.14s both}
        .u4{animation:fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.21s both}
        .u5{animation:fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.28s both}
        .u6{animation:fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.35s both}
        .fl{animation:floatL 7s ease-in-out infinite}
        .fr{animation:floatR 6s ease-in-out infinite}

        .btn-cta{
          width:100%;padding:16px 24px;border-radius:14px;font-size:15px;font-weight:700;
          border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;
          background:linear-gradient(135deg,#FF8C00 0%,#FF4500 100%);
          color:#fff;transition:transform 0.18s,box-shadow 0.18s;
          box-shadow:0 4px 24px rgba(255,100,0,0.30);
        }
        .btn-cta:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 32px rgba(255,80,0,0.45);}
        .btn-cta:active:not(:disabled){transform:translateY(0);}
        .btn-cta:disabled{opacity:0.55;cursor:not-allowed;}

        .btn-skip{
          width:100%;padding:14px 24px;border-radius:14px;font-size:14px;font-weight:600;
          border:1px solid rgba(255,255,255,0.08);cursor:pointer;
          background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.50);
          display:flex;align-items:center;justify-content:center;gap:8px;
          transition:all 0.18s;backdrop-filter:blur(8px);
        }
        .btn-skip:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.75);}

        .why-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .why-card{
          background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:18px 14px;text-align:center;
          transition:border-color 0.2s;
        }
        .why-card:hover{border-color:rgba(255,140,0,0.20);}

        .feat-row{
          background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;padding:16px 18px;display:flex;align-items:center;
          gap:14px;margin-bottom:10px;transition:border-color 0.2s;
        }
        .feat-row:hover{border-color:rgba(255,140,0,0.15);}
        .feat-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

        .glass-card{
          background:rgba(20,12,35,0.75);border:1px solid rgba(255,140,0,0.15);
          border-radius:16px;padding:16px 18px;backdrop-filter:blur(16px);
          box-shadow:0 4px 24px rgba(0,0,0,0.4);
        }

        .side-l{position:absolute;left:3%;top:50%;transform:translateY(-50%);display:none;flex-direction:column;gap:14px;width:175px;}
        .side-r{position:absolute;right:3%;top:50%;transform:translateY(-50%);display:none;flex-direction:column;align-items:flex-end;gap:14px;width:175px;}
        @media(min-width:1100px){.side-l,.side-r{display:flex!important;}}

        .handwriting{font-size:12px;color:rgba(255,100,30,0.80);font-style:italic;line-height:1.6;font-weight:500;}
        .step-line{width:40px;height:1.5px;background:linear-gradient(90deg,rgba(255,140,0,0.40),rgba(255,255,255,0.08));}

        .icon-ring-gcp{
          width:80px;height:80px;border-radius:50%;
          background:rgba(30,20,8,0.9);
          border:2px solid rgba(255,140,0,0.55);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;
          box-shadow:0 0 0 8px rgba(255,140,0,0.07),0 0 40px rgba(255,100,0,0.20);
          animation:pulse 3s ease-in-out infinite;
        }
        .icon-ring-yt{
          width:80px;height:80px;border-radius:50%;
          background:rgba(30,8,8,0.9);
          border:2px solid rgba(255,60,60,0.55);
          display:flex;align-items:center;justify-content:center;
          margin:0 auto 20px;
          box-shadow:0 0 0 8px rgba(255,40,40,0.07),0 0 40px rgba(255,40,40,0.18);
          animation:pulse 3s ease-in-out infinite;
        }

        .dot{width:5px;height:5px;border-radius:50%;background:rgba(255,140,0,0.60);}
      `}</style>

      {/* ── Full page wrapper ── */}
      <div style={{ minHeight: '100vh', background: '#09060f', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>

        {/* ── Background: top arc glow ── */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120%', height: '420px', pointerEvents: 'none', zIndex: 0 }}>
          {/* Dark brown-orange arc — thin curved line at very top */}
          <svg viewBox="0 0 1200 420" style={{ width: '100%', height: '100%', position: 'absolute', top: 0 }} preserveAspectRatio="none">
            <defs>
              <radialGradient id="arcGlow" cx="50%" cy="0%" r="60%">
                <stop offset="0%" stopColor="#7a3800" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#3d1800" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#09060f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="600" cy="0" rx="580" ry="320" fill="url(#arcGlow)" />
            {/* The thin arc line */}
            <path d="M 80 180 Q 600 -60 1120 180" fill="none" stroke="rgba(180,80,10,0.35)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* ── Background: bottom purple glow + orange line ── */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '280px', pointerEvents: 'none', zIndex: 0 }}>
          <svg viewBox="0 0 1440 280" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
            <defs>
              <radialGradient id="purpleGlow" cx="50%" cy="100%" r="70%">
                <stop offset="0%" stopColor="#5b00a8" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#2d0060" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#09060f" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="orangeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#09060f" stopOpacity="0" />
                <stop offset="20%" stopColor="#ff8c00" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#ffaa00" stopOpacity="1" />
                <stop offset="80%" stopColor="#ff8c00" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#09060f" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Purple radial glow at bottom */}
            <rect x="0" y="0" width="1440" height="280" fill="url(#purpleGlow)" />
            {/* Orange thin horizontal line */}
            <line x1="0" y1="60" x2="1440" y2="60" stroke="url(#orangeLine)" strokeWidth="1.5" />
            {/* Floor reflection */}
            <rect x="0" y="62" width="1440" height="218" fill="url(#purpleGlow)" opacity="0.4" />
          </svg>
        </div>

        {/* ── Floating side panels — GCP step ── */}
        {step === 'gcp' && (
          <>
            <div className="side-l fl">
              <div className="glass-card" style={{ padding: '14px' }}>
                <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,140,0,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, fontSize: 24 }}>☁️</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>Google Cloud</div>
              </div>
              <div className="glass-card" style={{ padding: '12px 14px', opacity: 0.6 }}>
                <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.03)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>☁️</div>
              </div>
              <div className="handwriting">Power<br />Safer Communities</div>
            </div>

            <div className="side-r fr">
              <div className="glass-card" style={{ width: 168 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#4285F4" /><path d="M12 2C6.48 2 2 6.48 2 12" fill="#EA4335" /><path d="M12 2c5.52 0 10 4.48 10 10" fill="#FBBC05" /><path d="M2 12c0 5.52 4.48 10 10 10" fill="#34A853" /></svg>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Google Cloud</div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>Build without limits</div>
              </div>
              <div className="handwriting" style={{ textAlign: 'right' }}>Creators<br />Grow Better</div>
            </div>
          </>
        )}

        {/* ── Floating side panels — YouTube step ── */}
        {step === 'youtube' && (
          <>
            <div className="side-l fl">
              <div className="handwriting">Turn comments<br />into a healthier<br />community</div>
              <div className="glass-card" style={{ padding: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)"><polygon points="5,3 19,12 5,21" /></svg>
                </div>
              </div>
              <div className="glass-card" style={{ padding: '10px', opacity: 0.7 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.4)"><polygon points="5,3 19,12 5,21" /></svg>
                </div>
              </div>
              <div className="handwriting" style={{ marginTop: 4 }}>Less spam<br />More real fans<br />Bigger growth</div>
            </div>

            <div className="side-r fr">
              <div className="glass-card" style={{ width: 168 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, background: '#FF0000', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>YouTube</div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 }}>Creators<br />Build Better Communities</div>
              </div>
              <div className="handwriting" style={{ textAlign: 'right' }}>Safe Comments<br />Happy Viewers<br />Stronger Channel</div>
            </div>
          </>
        )}

        {/* ── Center content ── */}
        <div style={{ width: '100%', maxWidth: 492, position: 'relative', zIndex: 10 }}>

          {/* Logo + Need help */}
          <div className="u1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 30, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#FF8C00,#FF3B30,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(255,100,0,0.45)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.92" /></svg>
              </div>
              <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.03em' }}>ModerateAI</span>
            </div>
            <div style={{ position: 'absolute', right: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>Need help?</span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="u2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step === 'youtube' ? 'rgba(34,197,94,0.12)' : 'rgba(255,140,0,0.12)', border: `2px solid ${step === 'youtube' ? 'rgba(34,197,94,0.60)' : 'rgba(255,140,0,0.65)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: step === 'youtube' ? '#4ade80' : '#FF8C00' }}>
                {step === 'youtube' ? '✓' : '1'}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: step === 'gcp' ? '#FAFAFA' : 'rgba(255,255,255,0.38)' }}>GCP Setup</span>
            </div>
            <div className="step-line" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: step === 'youtube' ? 'rgba(255,140,0,0.12)' : 'rgba(255,255,255,0.04)', border: `2px solid ${step === 'youtube' ? 'rgba(255,140,0,0.65)' : 'rgba(255,255,255,0.10)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: step === 'youtube' ? '#FF8C00' : 'rgba(255,255,255,0.22)' }}>2</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: step === 'youtube' ? '#FAFAFA' : 'rgba(255,255,255,0.26)' }}>YouTube</span>
            </div>
          </div>

          {/* ── GCP STEP ── */}
          {step === 'gcp' && (
            <>
              {/* Icon + dots */}
              <div className="u3" style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ position: 'relative', width: 80, margin: '0 auto 18px' }}>
                  <div className="icon-ring-gcp">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M19 9.4A7 7 0 1012 4v1" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M12 16v4m-2 0h4" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                  </div>
                  <div className="dot" style={{ position: 'absolute', top: 4, right: -8 }} />
                  <div className="dot" style={{ position: 'absolute', bottom: 8, left: -10, width: 4, height: 4, opacity: 0.4 }} />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>Connect Your Google Cloud</h1>
                <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14, lineHeight: 1.8, maxWidth: 370, margin: '0 auto' }}>
                  Connect your own GCP project to get{' '}
                  <strong style={{ color: '#FF8C00' }}>10,000 YouTube API units/day</strong>{' '}
                  — free forever.
                </p>
              </div>

              {/* Why connect GCP */}
              <div className="u4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF8C00"><rect x="2" y="12" width="4" height="10" rx="1" /><rect x="9" y="8" width="4" height="14" rx="1" /><rect x="16" y="4" width="4" height="18" rx="1" /></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FF8C00', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Why connect GCP?</span>
                </div>
                <div className="why-grid">
                  {[
                    { bg: 'rgba(34,197,94,0.12)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#4ade80"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, t: 'Your own 10,000\nAPI units/day', s: 'Free forever' },
                    { bg: 'rgba(139,92,246,0.12)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><ellipse cx="12" cy="12" rx="10" ry="4" /><path d="M2 12c0 2.21 4.48 4 10 4s10-1.79 10-4" /><path d="M2 17c0 2.21 4.48 4 10 4s10-1.79 10-4" /></svg>, t: 'More videos and\ncomments scanned', s: 'No limits' },
                    { bg: 'rgba(251,191,36,0.10)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, t: 'Faster moderation,\nless rate limiting', s: 'Better performance' },
                    { bg: 'rgba(59,130,246,0.12)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#60a5fa"><rect x="2" y="12" width="4" height="10" rx="1" /><rect x="9" y="8" width="4" height="14" rx="1" /><rect x="16" y="4" width="4" height="18" rx="1" /></svg>, t: 'Better performance\noverall', s: 'Scale your growth' },
                  ].map(c => (
                    <div key={c.t} className="why-card">
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>{c.icon}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45, whiteSpace: 'pre-line', marginBottom: 5 }}>{c.t}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>{c.s}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tutorial */}
              <div className="u5" style={{ marginBottom: 14 }}>
                <div onClick={() => window.open('https://www.youtube.com/@moderateai', '_blank')}
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,140,0,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f87171"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>Watch Setup Tutorial</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Step-by-step GCP setup guide (5 min)</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </div>
              </div>

              {/* Buttons */}
              <div className="u6" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-cta" onClick={handleGcpSetup}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  Open Google Cloud Console
                </button>
                <button className="btn-skip" onClick={handleSkipGcp}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                  Skip — use shared quota (500 units/day)
                </button>
                <div style={{ textAlign: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    You can also complete GCP setup later in Settings → API Access.
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ── YOUTUBE STEP ── */}
          {step === 'youtube' && (
            <>
              <div className="u3" style={{ textAlign: 'center', marginBottom: 22 }}>
                <div className="icon-ring-yt">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#f87171"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>Connect YouTube Channel</h1>
                <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14, lineHeight: 1.8, maxWidth: 380, margin: '0 auto' }}>
                  Connect your YouTube channel so ModerateAI can start protecting your community.
                </p>
              </div>

              {/* Quota notice */}
              <div className="u4" style={{ background: 'rgba(255,140,0,0.05)', border: '1px solid rgba(255,140,0,0.18)', borderRadius: 14, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF8C00" style={{ flexShrink: 0, marginTop: 1 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>
                  {gcpSkipped
                    ? <>Running on <strong style={{ color: '#FF8C00' }}>shared quota (500 units/day)</strong>. Connect GCP anytime in Settings → API Access.</>
                    : <>Google Cloud Console opened. Complete GCP setup in <strong style={{ color: '#4ade80' }}>Settings → API Access</strong> after connecting.</>
                  }
                </span>
              </div>

              {/* Feature rows */}
              <div className="u5" style={{ marginBottom: 18 }}>
                {[
                  { bg: 'rgba(99,102,241,0.12)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, t: 'Automatic protection', s: 'Bad comments hidden instantly' },
                  { bg: 'rgba(236,72,153,0.10)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2"><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>, t: 'AI auto-replies', s: 'Reply to fans in their language' },
                  { bg: 'rgba(34,197,94,0.10)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#4ade80"><rect x="2" y="12" width="4" height="10" rx="1" /><rect x="9" y="8" width="4" height="14" rx="1" /><rect x="16" y="4" width="4" height="18" rx="1" /></svg>, t: 'Real-time analytics', s: 'Track your channel health' },
                ].map(r => (
                  <div key={r.t} className="feat-row">
                    <div className="feat-icon" style={{ background: r.bg }}>{r.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{r.t}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.36)', marginTop: 3 }}>{r.s}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="u6" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-cta" onClick={handleConnectYouTube} disabled={connecting}>
                  {connecting
                    ? <><div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Connecting…</>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg> Connect YouTube Channel</>
                  }
                </button>
                <div style={{ textAlign: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    Secure. We only access the permissions you approve.
                  </span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Bottom tagline */}
        <div style={{ position: 'absolute', bottom: 16, textAlign: 'center', width: '100%', zIndex: 10 }}>
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.10)', letterSpacing: '0.20em', textTransform: 'uppercase' }}>A Cleaner YouTube Community</span>
        </div>

      </div>
    </>
  );
}