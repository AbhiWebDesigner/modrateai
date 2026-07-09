'use client';
import { Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; letter-spacing: -0.02em; }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animated-gradient-text {
          background: linear-gradient(90deg, #F59E0B, #FBBF24, #D97706, #F59E0B);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease infinite;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-up-1 { animation: fadeSlideUp 0.6s ease forwards; opacity: 0; }
        .fade-up-2 { animation: fadeSlideUp 0.6s ease 0.10s forwards; opacity: 0; }
        .fade-up-3 { animation: fadeSlideUp 0.6s ease 0.20s forwards; opacity: 0; }
        .fade-up-4 { animation: fadeSlideUp 0.6s ease 0.30s forwards; opacity: 0; }
        .fade-up-5 { animation: fadeSlideUp 0.6s ease 0.40s forwards; opacity: 0; }
        .fade-up-6 { animation: fadeSlideUp 0.6s ease 0.50s forwards; opacity: 0; }

        .google-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          background: #FAFAFA; color: #09090B;
          padding: 14px 24px; border-radius: 14px;
          font-size: 15px; font-weight: 600;
          border: none; cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .google-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 20px 60px rgba(0,0,0,0.45), 0 0 60px rgba(245,158,11,0.18);
        }
        .google-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.99);
        }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider-line {
          position: absolute; top: 0; bottom: 0; left: 50%;
          width: 1px;
          background: linear-gradient(to bottom,
            transparent 0%,
            rgba(255,255,255,0.07) 20%,
            rgba(255,255,255,0.07) 80%,
            transparent 100%
          );
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Premium Background from globals.css */}
      <div className="premium-bg" />

      <main style={{ minHeight: '100vh', display: 'flex', position: 'relative', zIndex: 10 }}>

        {/* LEFT PANEL */}
        <div
          className="hidden lg:flex"
          style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 56px',
            position: 'relative',
          }}
        >
          {/* Logo */}
          <div className="fade-up-1">
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #7C3AED 100%)',
                borderRadius: 12, width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(245,158,11,0.35)',
              }}>
                <Shield size={20} color="white" />
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 20 }}>ModerateAI</span>
            </Link>
          </div>

          {/* Headline + Features */}
          <div>
            <div className="fade-up-2">
              <h1 style={{
                fontSize: 50, fontWeight: 900, color: '#FAFAFA',
                lineHeight: 1.1, marginBottom: 20,
              }}>
                Sign in and start<br />
                moderating in<br />
                <span className="animated-gradient-text">60 seconds.</span>
              </h1>
            </div>

            <div className="fade-up-3">
              <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 15, lineHeight: 1.65, marginBottom: 36 }}>
                One-click Google login. We only ask for the YouTube<br />
                permissions moderation actually needs.
              </p>
            </div>

            <div className="fade-up-4" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Detects toxic comments in 100+ languages',
                'Progressive live-chat timeouts',
                'AI auto-replies with natural human delay',
                'Cancel anytime — 19-day free trial',
              ].map((feature) => (
                <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.40)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700 }}>✓</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14 }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 40 }} />
        </div>

        {/* MIDDLE DIVIDER */}
        <div className="hidden lg:block" style={{ position: 'relative', width: 1 }}>
          <div className="divider-line" />
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 32px',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* Mobile Logo */}
            <div className="flex lg:hidden fade-up-1" style={{ alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <div style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #7C3AED 100%)',
                borderRadius: 12, width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={20} color="white" />
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 20 }}>ModerateAI</span>
            </div>

            {/* Badge */}
            <div className="fade-up-1" style={{ marginBottom: 24 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 100, padding: '6px 14px',
                color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500,
              }}>
                <Sparkles size={12} color="#F59E0B" />
                New: Live-chat timeouts
              </span>
            </div>

            {/* Heading */}
            <div className="fade-up-2">
              <h2 style={{ fontSize: 42, fontWeight: 800, color: '#FAFAFA', marginBottom: 8, lineHeight: 1.1 }}>
                Welcome back
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, marginBottom: 32 }}>
                Sign in to your ModerateAI dashboard.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                color: '#f87171', fontSize: 14,
              }}>{error}</div>
            )}

            {/* Google Button */}
            <div className="fade-up-3">
              <button onClick={handleGoogleLogin} disabled={loading} className="google-btn">
                {loading ? (
                  <div style={{
                    width: 20, height: 20, border: '2px solid #ccc',
                    borderTop: '2px solid #333', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>

            {/* Divider */}
            <div className="fade-up-4" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Email Button */}
            <div className="fade-up-5">
              <button disabled style={{
                width: '100%', padding: '14px 24px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.30)', fontSize: 14, fontWeight: 500,
                cursor: 'not-allowed', marginBottom: 24,
              }}>
                Continue with email{' '}
                <span style={{ fontSize: 12, opacity: 0.6 }}>(coming soon)</span>
              </button>
            </div>

            {/* Terms */}
            <div className="fade-up-6">
              <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>
                By continuing, you agree to our{' '}
                <Link href="/terms" style={{ color: 'rgba(255,255,255,0.80)', textDecoration: 'underline' }}>Terms</Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.80)', textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
            </div>

          </div>
        </div>

      </main>
    </>
  );
}