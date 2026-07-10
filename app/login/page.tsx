'use client';
import { Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 55%, #7C3AED 100%)',
        borderRadius: '50%',
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset, 0 4px 16px rgba(245,158,11,0.30)',
        flexShrink: 0,
      }}>
        <Shield size={size * 0.50} color="white" strokeWidth={2.25} />
      </div>
      <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
        ModrateAI
      </span>
    </Link>
  );
}

function FeatureRow({ label, delay }: { label: string; delay: string }) {
  return (
    <div className="feature-row" style={{ animationDelay: delay, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(245,158,11,0.15)',
        border: '1px solid rgba(245,158,11,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color: '#FBBF24', fontSize: 11, fontWeight: 700 }}>✓</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.80)', fontSize: 15, letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photo: user.photoURL,
          plan: 'free',
          comments_used: 0,
          comments_limit: 1500,
          created_at: new Date().toISOString(),
          youtube_connected: false,
        });
      }
      router.push('/dashboard');
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const features = [
    'Detects toxic comments in 100+ languages',
    'Progressive live-chat timeouts',
    'AI auto-replies with natural human delay',
    'Cancel anytime — 19-day free trial',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -0.02em; box-sizing: border-box; margin: 0; padding: 0;
        }
        html, body { background: #0D0B0E; }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-gradient-text {
          background: linear-gradient(90deg, #F59E0B, #FB923C, #FBBF24, #F59E0B);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease infinite;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up-1 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .fade-up-2 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s forwards; opacity: 0; }
        .fade-up-3 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.16s forwards; opacity: 0; }
        .fade-up-4 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.24s forwards; opacity: 0; }
        .fade-up-5 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.32s forwards; opacity: 0; }
        .fade-up-6 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.40s forwards; opacity: 0; }
        .feature-row { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }

        .google-btn {
          position: relative; width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          background: #FAFAFA; color: #0A0A0B;
          padding: 15px 24px; border-radius: 14px;
          font-size: 15px; font-weight: 600;
          border: none; cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          letter-spacing: -0.01em;
        }
        .google-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(245,158,11,0.20), 0 6px 18px rgba(0,0,0,0.25);
        }
        .google-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.20); }
          50% { box-shadow: 0 0 0 1px rgba(245,158,11,0.40), 0 0 20px rgba(245,158,11,0.14); }
        }
        .badge-pulse { animation: glowPulse 3s ease-in-out infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.15); border-top-color: #0A0A0B;
          animation: spin 0.75s linear infinite;
        }

        .auth-left { display: none !important; }
        @media (min-width: 1024px) {
          .auth-left { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>

      {/* Full page — single background, no hard split */}
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
        /* Single background with amber top-left, purple bottom-left, dark right */
        background: `
          radial-gradient(ellipse 60% 55% at 5% 15%, rgba(245,158,11,0.38) 0%, transparent 60%),
          radial-gradient(ellipse 65% 60% at 5% 95%, rgba(109,40,217,0.55) 0%, transparent 62%),
          radial-gradient(ellipse 45% 70% at 50% 50%, rgba(20,10,30,0.85) 0%, transparent 80%),
          #0D0B0E
        `,
      }}>

        {/* LEFT PANEL */}
        <div
          className="auth-left"
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '36px 52px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Grid overlay left only */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            WebkitMaskImage: 'radial-gradient(75% 65% at 30% 30%, #000 0%, transparent 70%)',
            maskImage: 'radial-gradient(75% 65% at 30% 30%, #000 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo top */}
          <div style={{ position: 'relative', zIndex: 2 }} className="fade-up-1">
            <Logo />
          </div>

          {/* Content vertically centered */}
          <div style={{
            position: 'relative', zIndex: 2,
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 460,
            paddingTop: 20,
          }}>
            <div className="relative">
              <h2
                className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.05]"
                style={{ color: '#FAFAFA' }}
              >
                Sign in and start<br />moderating in <span className="animated-gradient-text">60 seconds</span>.
              </h2>
              <p className="mt-5" style={{ color: 'rgba(255,255,255,0.60)', fontSize: 16, maxWidth: '38rem' }}>
                One-click Google login. We only ask for the YouTube permissions moderation actually needs.
              </p>
              <div className="mt-8" style={{ display: 'grid', gap: 12 }}>
                {features.map((feature, index) => (
                  <FeatureRow key={feature} label={feature} delay={`${index * 0.08}s`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — dark but not pure black, matches reference */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          background: 'rgba(10,8,14,0.80)',
          backdropFilter: 'blur(0px)',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Mobile logo */}
            <div className="mobile-logo fade-up-1" style={{ marginBottom: 32 }}>
              <Logo size={34} />
            </div>

            {/* Badge */}
            <div className="fade-up-1" style={{ marginBottom: 28 }}>
              <span className="badge-pulse" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 100, padding: '6px 14px',
                color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 500,
              }}>
                <Sparkles size={12} color="#FBBF24" />
                New: Live-chat timeouts
              </span>
            </div>

            {/* Heading */}
            <div className="fade-up-2">
              <h2 style={{ fontSize: 40, fontWeight: 800, color: '#FAFAFA', marginBottom: 8, lineHeight: 1.1 }}>
                Welcome back
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, marginBottom: 32 }}>
                Sign in to your ModrateAI dashboard.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
                borderRadius: 12, padding: '12px 16px', marginBottom: 18,
                color: '#f87171', fontSize: 13.5,
              }}>{error}</div>
            )}

            {/* Google button */}
            <div className="fade-up-3">
              <button onClick={handleGoogleLogin} disabled={loading} className="google-btn">
                {loading ? <div className="spinner" /> : <GoogleIcon />}
                {loading ? 'Signing in…' : 'Continue with Google'}
              </button>
            </div>

            {/* Divider */}
            <div className="fade-up-4" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12, fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Email */}
            <div className="fade-up-5">
              <button disabled style={{
                width: '100%', padding: '14px 24px', borderRadius: 14,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.28)', fontSize: 14, fontWeight: 500,
                cursor: 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '-0.01em',
              }}>
                Continue with email
                <span style={{ fontSize: 12, opacity: 0.65 }}>(coming soon)</span>
              </button>
            </div>

            {/* Terms */}
            <div className="fade-up-6" style={{ marginTop: 28 }}>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.32)', lineHeight: 1.6 }}>
                By continuing, you agree to our{' '}
                <Link href="/terms" style={{ color: 'rgba(255,255,255,0.70)', textDecoration: 'underline' }}>Terms</Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.70)', textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}