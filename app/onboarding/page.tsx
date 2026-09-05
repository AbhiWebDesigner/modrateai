'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Shield, Youtube, ChevronRight, ExternalLink, CheckCircle, SkipForward } from 'lucide-react';

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

  const handleSkipGcp = () => {
    setGcpSkipped(true);
    setStep('youtube');
  };

  const handleGcpSetup = () => {
    // Open Google Cloud Console in new tab for actual setup
    window.open('https://console.cloud.google.com', '_blank');
    // Move to YouTube step — GCP setup happens separately in Settings
    setGcpSkipped(false);
    setStep('youtube');
  };

  const handleConnectYouTube = async () => {
    if (!uid) return;
    setConnecting(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      window.location.href = `${BACKEND}/api/auth/youtube?token=${token}`;
    } catch {
      setConnecting(false);
    }
  };

  const handleSkipYouTube = async () => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), { onboarding_completed: true });
    } catch {}
    router.replace('/dashboard');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #09090B; color: white; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .btn-primary { background: linear-gradient(135deg,#F59E0B,#EA580C); color: white; border: none; border-radius: 12px; padding: 14px 24px; font-size: 15px; font-weight: 700; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(245,158,11,0.25); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-ghost { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.75); }
        .step-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%), #09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Logo */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#EA580C,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#FAFAFA' }}>ModerateAI</span>
          </div>

          {/* Progress */}
          <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
            {(['gcp', 'youtube'] as Step[]).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step === s ? 'rgba(245,158,11,0.15)' : s === 'gcp' && step === 'youtube' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${step === s ? 'rgba(245,158,11,0.50)' : s === 'gcp' && step === 'youtube' ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  color: step === s ? '#F59E0B' : s === 'gcp' && step === 'youtube' ? '#4ade80' : 'rgba(255,255,255,0.25)'
                }}>
                  {s === 'gcp' && step === 'youtube' ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: step === s ? '#FAFAFA' : 'rgba(255,255,255,0.30)' }}>
                  {s === 'gcp' ? 'GCP Setup' : 'YouTube'}
                </span>
                {i === 0 && <ChevronRight size={14} color="rgba(255,255,255,0.20)" />}
              </div>
            ))}
          </div>

          {/* ── Step 1: GCP ── */}
          {step === 'gcp' && (
            <div className="fade-up">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span style={{ fontSize: 24 }}>☁️</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FAFAFA', marginBottom: 8 }}>Connect Your Google Cloud</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                  Connect your own GCP project to get <strong style={{ color: '#F59E0B' }}>10,000 YouTube API units/day</strong> — free forever.
                </p>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 8 }}>Why connect GCP?</div>
                {['Your own 10,000 API units/day (free)', 'More videos and comments scanned', 'Faster moderation, less rate limiting', 'Better performance overall'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <CheckCircle size={12} color="#4ade80" />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{t}</span>
                  </div>
                ))}
              </div>

              <div
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)', borderRadius: 12, padding: '14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                onClick={() => window.open('https://www.youtube.com/@moderateai', '_blank')}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Youtube size={18} color="#f87171" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA' }}>Watch Setup Tutorial</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.40)' }}>Step-by-step GCP setup guide (5 min)</div>
                </div>
                <ExternalLink size={14} color="rgba(255,255,255,0.30)" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-primary" onClick={handleGcpSetup}>
                  Open Google Cloud Console <ExternalLink size={15} />
                </button>
                <button className="btn-ghost" onClick={handleSkipGcp}>
                  <SkipForward size={14} /> Skip — use shared quota (500 units/day)
                </button>
              </div>

              <p style={{ textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.25)', marginTop: 12, lineHeight: 1.5 }}>
                You can also complete GCP setup later in Settings → API Access
              </p>
            </div>
          )}

          {/* ── Step 2: YouTube ── */}
          {step === 'youtube' && (
            <div className="fade-up">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Youtube size={26} color="#f87171" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FAFAFA', marginBottom: 8 }}>Connect YouTube Channel</h1>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
                  Connect your YouTube channel so ModerateAI can start protecting your community.
                </p>
              </div>

              {gcpSkipped && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  ⚡ Running on <strong style={{ color: '#F59E0B' }}>shared quota (500 units/day)</strong>. Connect GCP anytime in Settings → API Access.
                </div>
              )}

              {!gcpSkipped && (
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                  ✅ Google Cloud Console opened. Complete the setup and come back — <strong style={{ color: '#4ade80' }}>finish GCP in Settings → API Access</strong> after connecting YouTube.
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                {[
                  { icon: '🛡️', title: 'Automatic protection', sub: 'Bad comments hidden instantly' },
                  { icon: '🤖', title: 'AI auto-replies', sub: 'Reply to fans in their language' },
                  { icon: '📊', title: 'Real-time analytics', sub: 'Track your channel health' },
                ].map(item => (
                  <div key={item.title} className="step-card">
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FAFAFA' }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.40)', marginTop: 2 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn-primary" onClick={handleConnectYouTube} disabled={connecting}>
                  {connecting
                    ? <><div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Connecting…</>
                    : <><Youtube size={16} /> Connect YouTube Channel</>
                  }
                </button>
                <button className="btn-ghost" onClick={handleSkipYouTube}>
                  <SkipForward size={14} /> Skip — Go to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}