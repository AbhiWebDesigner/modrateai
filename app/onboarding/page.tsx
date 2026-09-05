'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

type Step = 'gcp' | 'youtube';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]             = useState<Step>('gcp');
  const [uid, setUid]               = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [gcpSkipped, setGcpSkipped] = useState(false);
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

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

  const handleSkipGcp = () => { setGcpSkipped(true); setStep('youtube'); };
  const handleGcpSetup = () => { window.open('https://console.cloud.google.com', '_blank'); setGcpSkipped(false); setStep('youtube'); };

  const handleConnectYouTube = async () => {
    if (!uid) return;
    setConnecting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      window.location.href = `${BACKEND}/api/auth/youtube?token=${token}`;
    } catch { setConnecting(false); }
  };

  const handleSkipYouTube = async () => {
    if (!uid) return;
    try { await updateDoc(doc(db, 'users', uid), { onboarding_completed: true }); } catch {}
    router.replace('/dashboard');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080610', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(255,160,30,0.2)', borderTopColor: '#FF9500', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{font-family:'Inter',ui-sans-serif,system-ui,sans-serif;box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#080610;color:white;overflow-x:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatL{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-14px) rotate(-6deg)}}
        @keyframes floatR{0%,100%{transform:translateY(0) rotate(6deg)}50%{transform:translateY(-10px) rotate(6deg)}}
        @keyframes pulseGlow{0%,100%{opacity:0.5}50%{opacity:1}}
        .fade-up{animation:fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both}
        .float-l{animation:floatL 6s ease-in-out infinite}
        .float-r{animation:floatR 7s ease-in-out infinite}
        .btn-main{width:100%;padding:16px 24px;border-radius:14px;font-size:16px;font-weight:700;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:transform 0.2s,box-shadow 0.2s;letter-spacing:-0.01em;}
        .btn-main:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(255,120,0,0.35);}
        .btn-main:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
        .btn-ghost{width:100%;padding:14px 24px;border-radius:14px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.10);cursor:pointer;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.50);display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;}
        .btn-ghost:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.75);}
        .feat-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:14px;margin-bottom:10px;}
        .feat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
        .why-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 14px;text-align:center;flex:1;}
        .ambient{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080610', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>

        {/* Ambient glows */}
        <div className="ambient" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(255,100,0,0.15) 0%, transparent 70%)', top: -200, left: '50%', transform: 'translateX(-50%)' }} />
        <div className="ambient" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(120,40,255,0.12) 0%, transparent 70%)', bottom: 0, left: -100 }} />
        <div className="ambient" style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(255,60,120,0.08) 0%, transparent 70%)', bottom: 0, right: -80 }} />

        {/* Floating decorative cards — desktop only */}
        {step === 'gcp' && (
          <>
            <div className="float-l" style={{ position: 'absolute', left: '4%', top: '20%', display: 'none', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px', width: 160, backdropFilter: 'blur(20px)' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>☁️</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Google Cloud</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Build without limits</div>
              </div>
            </div>
            <div className="float-r" style={{ position: 'absolute', right: '4%', top: '25%', display: 'none', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px', width: 160, backdropFilter: 'blur(20px)' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>⚡</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>10,000 units</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Per day, free forever</div>
              </div>
            </div>
          </>
        )}
        {step === 'youtube' && (
          <>
            <div className="float-l" style={{ position: 'absolute', left: '4%', top: '18%', display: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', width: 155, backdropFilter: 'blur(20px)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8, fontStyle: 'italic' }}>Turn comments into a healthier community</div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', width: 140, backdropFilter: 'blur(20px)', marginTop: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,150,0,0.7)', marginTop: 12, fontStyle: 'italic', lineHeight: 1.4 }}>Less spam<br />More real fans<br />Bigger growth</div>
            </div>
            <div className="float-r" style={{ position: 'absolute', right: '4%', top: '22%', display: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px', width: 170, backdropFilter: 'blur(20px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, background: '#FF0000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>▶</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>YouTube</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Creators</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Build Better Communities</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,150,0,0.7)', marginTop: 14, fontStyle: 'italic', lineHeight: 1.5, textAlign: 'right' }}>Safe Comments<br />Happy Viewers<br />Stronger Channel</div>
            </div>
          </>
        )}

        <style>{`@media(min-width:1100px){.float-l,.float-r{display:flex!important;flex-direction:column;}}`}</style>

        {/* Main content */}
        <div style={{ width: '100%', maxWidth: 500, position: 'relative', zIndex: 10 }}>

          {/* Logo */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#FF9500,#FF3B30,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(255,120,0,0.4)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#FAFAFA', letterSpacing: '-0.03em' }}>ModerateAI</span>
          </div>

          {/* Step indicator */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36, animationDelay: '0.05s' }}>
            {(['gcp', 'youtube'] as Step[]).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: s === 'gcp' && step === 'youtube' ? 'rgba(34,197,94,0.15)' : step === s ? 'rgba(255,149,0,0.15)' : 'rgba(255,255,255,0.05)', border: `2px solid ${s === 'gcp' && step === 'youtube' ? 'rgba(34,197,94,0.5)' : step === s ? 'rgba(255,149,0,0.6)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: s === 'gcp' && step === 'youtube' ? '#4ade80' : step === s ? '#FF9500' : 'rgba(255,255,255,0.25)' }}>
                    {s === 'gcp' && step === 'youtube' ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: step === s ? '#FAFAFA' : 'rgba(255,255,255,0.30)', letterSpacing: '-0.01em' }}>{s === 'gcp' ? 'GCP Setup' : 'YouTube'}</span>
                </div>
                {i === 0 && <div style={{ width: 32, height: 1, background: step === 'youtube' ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)' }} />}
              </div>
            ))}
          </div>

          {/* ── GCP STEP ── */}
          {step === 'gcp' && (
            <>
              {/* Icon */}
              <div className="fade-up" style={{ textAlign: 'center', marginBottom: 28, animationDelay: '0.1s' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,149,0,0.08)', border: '2px solid rgba(255,149,0,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(255,120,0,0.12)' }}>
                  <span style={{ fontSize: 30 }}>☁️</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FAFAFA', marginBottom: 10, letterSpacing: '-0.03em', lineHeight: 1.2 }}>Connect Your Google Cloud</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
                  Connect your own GCP project to get <strong style={{ color: '#FF9500' }}>10,000 YouTube API units/day</strong> — free forever.
                </p>
              </div>

              {/* Why GCP — 4 cards */}
              <div className="fade-up" style={{ animationDelay: '0.15s', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#FF9500' }}>📊</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9500', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Why connect GCP?</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { icon: '⚡', title: 'Your own 10,000\nAPI units/day', sub: 'Free forever' },
                    { icon: '🎬', title: 'More videos and\ncomments scanned', sub: 'No limits' },
                    { icon: '🛡️', title: 'Faster moderation,\nless rate limiting', sub: 'Better performance' },
                    { icon: '📈', title: 'Better performance\noverall', sub: 'Scale your growth' },
                  ].map(item => (
                    <div key={item.title} className="why-card">
                      <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#FAFAFA', lineHeight: 1.4, whiteSpace: 'pre-line', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tutorial */}
              <div className="fade-up" style={{ animationDelay: '0.2s', marginBottom: 16 }}>
                <div
                  onClick={() => window.open('https://www.youtube.com/@moderateai', '_blank')}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f87171"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA' }}>Watch Setup Tutorial</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>Step-by-step GCP setup guide (5 min)</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </div>
              </div>

              {/* Buttons */}
              <div className="fade-up" style={{ animationDelay: '0.25s', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-main" onClick={handleGcpSetup} style={{ background: 'linear-gradient(135deg,#FF9500,#FF3B30)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Open Google Cloud Console
                </button>
                <button className="btn-ghost" onClick={handleSkipGcp}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  Skip — use shared quota (500 units/day)
                </button>
              </div>

              <div className="fade-up" style={{ animationDelay: '0.3s', marginTop: 14, textAlign: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  You can also complete GCP setup later in Settings → API Access.
                </span>
              </div>
            </>
          )}

          {/* ── YOUTUBE STEP ── */}
          {step === 'youtube' && (
            <>
              <div className="fade-up" style={{ textAlign: 'center', marginBottom: 28, animationDelay: '0.1s' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(239,68,68,0.10)' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="#f87171"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FAFAFA', marginBottom: 10, letterSpacing: '-0.03em' }}>Connect YouTube Channel</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.7, maxWidth: 360, margin: '0 auto' }}>
                  Connect your YouTube channel so ModerateAI can start protecting your community.
                </p>
              </div>

              {gcpSkipped && (
                <div className="fade-up" style={{ animationDelay: '0.15s', background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.18)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚡</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                    Running on <strong style={{ color: '#FF9500' }}>shared quota (500 units/day)</strong>. Connect GCP anytime in Settings → API Access.
                  </span>
                </div>
              )}

              {!gcpSkipped && (
                <div className="fade-up" style={{ animationDelay: '0.15s', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>✅</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                    Google Cloud Console opened. After setup, finish GCP in <strong style={{ color: '#4ade80' }}>Settings → API Access</strong>.
                  </span>
                </div>
              )}

              <div className="fade-up" style={{ animationDelay: '0.2s', marginBottom: 20 }}>
                {[
                  { icon: '🛡️', bg: 'rgba(99,102,241,0.12)', title: 'Automatic protection', sub: 'Bad comments hidden instantly' },
                  { icon: '🤖', bg: 'rgba(236,72,153,0.10)', title: 'AI auto-replies', sub: 'Reply to fans in their language' },
                  { icon: '📊', bg: 'rgba(34,197,94,0.10)', title: 'Real-time analytics', sub: 'Track your channel health' },
                ].map(item => (
                  <div key={item.title} className="feat-card">
                    <div className="feat-icon" style={{ background: item.bg }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#FAFAFA', letterSpacing: '-0.01em' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="fade-up" style={{ animationDelay: '0.25s', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-main" onClick={handleConnectYouTube} disabled={connecting} style={{ background: 'linear-gradient(135deg,#FF3B30,#FF9500)' }}>
                  {connecting
                    ? <><div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Connecting…</>
                    : <><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg> Connect YouTube Channel</>
                  }
                </button>
                <button className="btn-ghost" onClick={handleSkipYouTube}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  Skip — Go to Dashboard
                </button>
              </div>

              <div className="fade-up" style={{ animationDelay: '0.3s', marginTop: 14, textAlign: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Secure. We only access the permissions you approve.
                </span>
              </div>
            </>
          )}

        </div>

        {/* Bottom tagline */}
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>A Cleaner YouTube Community</span>
        </div>
      </div>
    </>
  );
}