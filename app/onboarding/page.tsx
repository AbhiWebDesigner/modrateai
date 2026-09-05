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

  const handleSkipGcp  = () => { setGcpSkipped(true); setStep('youtube'); };
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
    <div style={{ minHeight:'100vh', background:'#07050F', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:30, height:30, border:'2.5px solid rgba(255,120,30,0.15)', borderTopColor:'#FF7A1A', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{font-family:'Inter',ui-sans-serif,system-ui,sans-serif;letter-spacing:-0.015em;box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#07050F;color:#FAFAFA;overflow-x:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatA{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-12px) rotate(-5deg)}}
        @keyframes floatB{0%,100%{transform:translateY(0) rotate(5deg)}50%{transform:translateY(-16px) rotate(5deg)}}
        .u1{animation:up 0.55s cubic-bezier(0.16,1,0.3,1) 0.00s both}
        .u2{animation:up 0.55s cubic-bezier(0.16,1,0.3,1) 0.06s both}
        .u3{animation:up 0.55s cubic-bezier(0.16,1,0.3,1) 0.12s both}
        .u4{animation:up 0.55s cubic-bezier(0.16,1,0.3,1) 0.18s both}
        .u5{animation:up 0.55s cubic-bezier(0.16,1,0.3,1) 0.24s both}
        .u6{animation:up 0.55s cubic-bezier(0.16,1,0.3,1) 0.30s both}
        .fl{animation:floatA 7s ease-in-out infinite}
        .fr{animation:floatB 6s ease-in-out infinite}
        .btn-cta{width:100%;padding:15px 24px;border-radius:12px;font-size:15px;font-weight:700;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;background:linear-gradient(135deg,#FF8C00 0%,#FF3B30 100%);color:#fff;transition:transform 0.18s,box-shadow 0.18s;}
        .btn-cta:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 36px rgba(255,80,0,0.35);}
        .btn-cta:disabled{opacity:0.55;cursor:not-allowed;}
        .btn-skip{width:100%;padding:13px 24px;border-radius:12px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.09);cursor:pointer;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.45);display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.18s;}
        .btn-skip:hover{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.70);}
        .why-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}
        .why-card{background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px 14px;text-align:center;}
        .feat-row{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:15px 18px;display:flex;align-items:center;gap:14px;margin-bottom:10px;}
        .feat-icon{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
        .deco-card{background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 18px;backdrop-filter:blur(12px);}
        .glow-top{position:absolute;top:-180px;left:50%;transform:translateX(-50%);width:500px;height:380px;background:radial-gradient(ellipse at center,rgba(255,100,0,0.18) 0%,transparent 70%);pointer-events:none;}
        .glow-bl{position:absolute;bottom:-100px;left:-80px;width:340px;height:340px;background:radial-gradient(circle,rgba(100,30,220,0.14) 0%,transparent 70%);pointer-events:none;}
        .glow-br{position:absolute;bottom:-80px;right:-60px;width:280px;height:280px;background:radial-gradient(circle,rgba(220,40,100,0.09) 0%,transparent 70%);pointer-events:none;}
        .side-l{position:absolute;left:2%;top:15%;display:none;flex-direction:column;gap:12px;width:170px;}
        .side-r{position:absolute;right:2%;top:20%;display:none;flex-direction:column;align-items:flex-end;gap:12px;width:170px;}
        @media(min-width:1080px){.side-l,.side-r{display:flex!important;}}
        .tag{font-size:10.5px;color:rgba(255,130,0,0.75);font-style:italic;line-height:1.5;}
        .pill{display:inline-flex;align-items:center;gap:5px;background:rgba(255,140,0,0.10);border:1px solid rgba(255,140,0,0.22);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;color:rgba(255,140,0,0.9);margin-bottom:20px;}
        .step-connector{width:36px;height:1.5px;background:linear-gradient(90deg,rgba(255,140,0,0.5),rgba(255,255,255,0.1));}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#07050F', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>

        <div className="glow-top"/>
        <div className="glow-bl"/>
        <div className="glow-br"/>

        {/* Floating side decorations */}
        {step === 'gcp' && (
          <>
            <div className="side-l fl">
              <div className="deco-card">
                <div style={{ fontSize:24, marginBottom:6 }}>☁️</div>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.80)' }}>Google Cloud</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', marginTop:3 }}>Build without limits</div>
              </div>
            </div>
            <div className="side-r fr">
              <div className="deco-card" style={{ textAlign:'right' }}>
                <div style={{ fontSize:22, marginBottom:5 }}>⚡</div>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.80)' }}>10,000 units</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', marginTop:3 }}>Per day, free forever</div>
              </div>
            </div>
          </>
        )}

        {step === 'youtube' && (
          <>
            <div className="side-l fl">
              <div className="tag">Turn comments into a<br/>healthier community</div>
              <div className="deco-card" style={{ padding:'10px' }}>
                <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:8, height:58, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>▶</div>
              </div>
              <div className="deco-card" style={{ padding:'10px' }}>
                <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:8, height:48, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>▶</div>
              </div>
              <div className="tag" style={{ marginTop:4 }}>Less spam<br/>More real fans<br/>Bigger growth</div>
            </div>
            <div className="side-r fr">
              <div className="deco-card" style={{ width:165 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:32, height:32, background:'#FF0000', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>▶</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700 }}>YouTube</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)' }}>Creators</div>
                  </div>
                </div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>Build Better Communities</div>
              </div>
              <div className="tag" style={{ textAlign:'right', marginTop:6 }}>Safe Comments<br/>Happy Viewers<br/>Stronger Channel</div>
            </div>
          </>
        )}

        {/* Center content */}
        <div style={{ width:'100%', maxWidth:488, position:'relative', zIndex:10 }}>

          {/* Logo */}
          <div className="u1" style={{ display:'flex', alignItems:'center', gap:11, justifyContent:'center', marginBottom:32 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#FF8C00,#FF3B30,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 28px rgba(255,100,0,0.40)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.92"/>
              </svg>
            </div>
            <span style={{ fontWeight:800, fontSize:19, letterSpacing:'-0.03em' }}>ModerateAI</span>
            <div style={{ position:'absolute', top:0, right:0 }}>
              <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.30)', cursor:'pointer' }}>Need help?</span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="u2" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:32 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background: step==='youtube' ? 'rgba(34,197,94,0.12)' : 'rgba(255,140,0,0.12)', border:`2px solid ${step==='youtube' ? 'rgba(34,197,94,0.55)' : 'rgba(255,140,0,0.60)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color: step==='youtube' ? '#4ade80' : '#FF8C00' }}>
                {step === 'youtube' ? '✓' : '1'}
              </div>
              <span style={{ fontSize:14, fontWeight:600, color: step==='gcp' ? '#FAFAFA' : 'rgba(255,255,255,0.40)' }}>GCP Setup</span>
            </div>
            <div className="step-connector"/>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background: step==='youtube' ? 'rgba(255,140,0,0.12)' : 'rgba(255,255,255,0.04)', border:`2px solid ${step==='youtube' ? 'rgba(255,140,0,0.60)' : 'rgba(255,255,255,0.10)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color: step==='youtube' ? '#FF8C00' : 'rgba(255,255,255,0.25)' }}>2</div>
              <span style={{ fontSize:14, fontWeight:600, color: step==='youtube' ? '#FAFAFA' : 'rgba(255,255,255,0.28)' }}>YouTube</span>
            </div>
          </div>

          {/* ── GCP STEP ── */}
          {step === 'gcp' && (
            <>
              <div className="u3" style={{ textAlign:'center', marginBottom:24 }}>
                <div style={{ width:74, height:74, borderRadius:'50%', background:'rgba(255,140,0,0.07)', border:'2px solid rgba(255,140,0,0.18)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 0 44px rgba(255,100,0,0.10)' }}>
                  <span style={{ fontSize:32 }}>☁️</span>
                </div>
                <h1 style={{ fontSize:27, fontWeight:800, marginBottom:11, letterSpacing:'-0.03em' }}>Connect Your Google Cloud</h1>
                <p style={{ color:'rgba(255,255,255,0.42)', fontSize:14, lineHeight:1.75, maxWidth:360, margin:'0 auto' }}>
                  Connect your own GCP project to get{' '}
                  <strong style={{ color:'#FF8C00' }}>10,000 YouTube API units/day</strong>{' '}
                  — free forever.
                </p>
              </div>

              <div className="u4" style={{ marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                  <span style={{ fontSize:13, color:'#FF8C00' }}>📊</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#FF8C00', textTransform:'uppercase', letterSpacing:'0.06em' }}>Why connect GCP?</span>
                </div>
                <div className="why-grid">
                  {[
                    { icon:'⚡', t:'Your own 10,000\nAPI units/day',  s:'Free forever'       },
                    { icon:'🎬', t:'More videos and\ncomments scanned', s:'No limits'           },
                    { icon:'🛡️', t:'Faster moderation,\nless rate limiting', s:'Better performance' },
                    { icon:'📈', t:'Better performance\noverall',         s:'Scale your growth'  },
                  ].map(c => (
                    <div key={c.t} className="why-card">
                      <div style={{ fontSize:22, marginBottom:9 }}>{c.icon}</div>
                      <div style={{ fontSize:12.5, fontWeight:600, color:'rgba(255,255,255,0.82)', lineHeight:1.45, whiteSpace:'pre-line', marginBottom:5 }}>{c.t}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)' }}>{c.s}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="u5" style={{ marginBottom:14 }}>
                <div onClick={() => window.open('https://www.youtube.com/@moderateai', '_blank')}
                  style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'13px 16px', display:'flex', alignItems:'center', gap:13, cursor:'pointer' }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#f87171"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>Watch Setup Tutorial</div>
                    <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.38)', marginTop:1 }}>Step-by-step GCP setup guide (5 min)</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </div>
              </div>

              <div className="u6" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <button className="btn-cta" onClick={handleGcpSetup}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Open Google Cloud Console
                </button>
                <button className="btn-skip" onClick={handleSkipGcp}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  Skip — use shared quota (500 units/day)
                </button>
                <div style={{ textAlign:'center', marginTop:4 }}>
                  <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Complete GCP setup anytime in Settings → API Access.
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ── YOUTUBE STEP ── */}
          {step === 'youtube' && (
            <>
              <div className="u3" style={{ textAlign:'center', marginBottom:22 }}>
                <div style={{ width:74, height:74, borderRadius:'50%', background:'rgba(239,68,68,0.07)', border:'2px solid rgba(239,68,68,0.22)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:'0 0 44px rgba(239,68,68,0.09)' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="#f87171"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </div>
                <h1 style={{ fontSize:27, fontWeight:800, marginBottom:11, letterSpacing:'-0.03em' }}>Connect YouTube Channel</h1>
                <p style={{ color:'rgba(255,255,255,0.42)', fontSize:14, lineHeight:1.75, maxWidth:360, margin:'0 auto' }}>
                  Connect your YouTube channel so ModerateAI can start protecting your community.
                </p>
              </div>

              {gcpSkipped && (
                <div className="u4" style={{ background:'rgba(255,140,0,0.06)', border:'1px solid rgba(255,140,0,0.18)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>⚡</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.52)', lineHeight:1.65 }}>
                    Running on <strong style={{ color:'#FF8C00' }}>shared quota (500 units/day)</strong>. Connect GCP anytime in Settings → API Access.
                  </span>
                </div>
              )}

              {!gcpSkipped && (
                <div className="u4" style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.18)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>✅</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.52)', lineHeight:1.65 }}>
                    Google Cloud Console opened. Finish GCP setup in <strong style={{ color:'#4ade80' }}>Settings → API Access</strong> after connecting YouTube.
                  </span>
                </div>
              )}

              <div className="u5" style={{ marginBottom:18 }}>
                {[
                  { icon:'🛡️', bg:'rgba(99,102,241,0.10)',  t:'Automatic protection', s:'Bad comments hidden instantly'   },
                  { icon:'🤖', bg:'rgba(236,72,153,0.09)',  t:'AI auto-replies',       s:'Reply to fans in their language' },
                  { icon:'📊', bg:'rgba(34,197,94,0.09)',   t:'Real-time analytics',   s:'Track your channel health'       },
                ].map(r => (
                  <div key={r.t} className="feat-row">
                    <div className="feat-icon" style={{ background:r.bg }}>{r.icon}</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, letterSpacing:'-0.01em' }}>{r.t}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{r.s}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="u6" style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <button className="btn-cta" onClick={handleConnectYouTube} disabled={connecting}>
                  {connecting
                    ? <><div style={{ width:16, height:16, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Connecting…</>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg> Connect YouTube Channel</>
                  }
                </button>
                <button className="btn-skip" onClick={handleSkipYouTube}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  Skip — Go to Dashboard
                </button>
                <div style={{ textAlign:'center', marginTop:4 }}>
                  <span style={{ fontSize:11.5, color:'rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Secure. We only access the permissions you approve.
                  </span>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Bottom tagline */}
        <div style={{ position:'absolute', bottom:18, textAlign:'center', width:'100%' }}>
          <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.10)', letterSpacing:'0.18em', textTransform:'uppercase' }}>A Cleaner YouTube Community</span>
        </div>

      </div>
    </>
  );
}