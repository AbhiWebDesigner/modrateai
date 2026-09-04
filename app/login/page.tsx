'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles } from 'lucide-react';
import {
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getTrialEndsAt(): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() + 19);
  return Timestamp.fromDate(d);
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 no-underline">
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 55%, #7C3AED 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.10) inset, 0 4px 16px rgba(245,158,11,0.30)',
        }}
      >
        <Shield size={size * 0.5} color="white" strokeWidth={2.25} />
      </div>
      <span className="text-[#FAFAFA] font-bold tracking-tight" style={{ fontSize: 17 }}>
        ModerateAI
      </span>
    </Link>
  );
}

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function FeatureRow({ label, delay }: { label: string; delay: string }) {
  return (
    <div className="feature-row flex items-center gap-3" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-center rounded-full shrink-0 w-[22px] h-[22px] border border-amber-400/45 bg-amber-400/15">
        <span className="text-amber-300 text-[11px] font-bold">✓</span>
      </div>
      <span className="text-white/80 text-[15px] tracking-tight">{label}</span>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  'Detects toxic comments in 100+ languages',
  'Progressive live-chat timeouts',
  'AI auto-replies with natural human delay',
  'Cancel anytime — 19-day free trial',
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Redirect already-authenticated users straight to dashboard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/dashboard');
    });
    return () => unsub();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserLocalPersistence);

      const result  = await signInWithPopup(auth, googleProvider);
      const user    = result.user;
      const userRef = doc(db, 'users', user.uid);

      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch {
        throw new Error('Failed to fetch user data. Please check your connection and try again.');
      }

      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            uid:   user.uid,
            email: user.email        ?? '',
            name:  user.displayName  ?? '',
            photo: user.photoURL     ?? '',

            plan:           'free',
            ai_credits:     250,
            comments_limit: 2000,
            comments_used:  0,

            comments_scanned: 0,
            comments_hidden:  0,
            ai_replies:       0,

            youtube_connected:         false,
            youtube_channel_id:        '',
            youtube_channel_name:      '',
            youtube_channel_handle:    '',
            youtube_channel_thumbnail: '',
            youtube_subscriber_count:  '0',
            youtube_video_count:       '0',
            youtube_view_count:        '0',

            trial_active:     true,
            trial_days:       19,
            trial_started_at: serverTimestamp(),
            trial_ends_at:    getTrialEndsAt(),

            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
        } catch {
          throw new Error('Failed to create your account. Please try again.');
        }
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -0.02em;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body { background: #0D0B0E; }

        @keyframes gradientShift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
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
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-up-1 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.00s both; }
        .fade-up-2 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.08s both; }
        .fade-up-3 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.16s both; }
        .fade-up-4 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.24s both; }
        .fade-up-5 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
        .fade-up-6 { animation: fadeSlideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.40s both; }
        .feature-row { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(245,158,11,0.20); }
          50%       { box-shadow: 0 0 0 1px rgba(245,158,11,0.40), 0 0 20px rgba(245,158,11,0.14); }
        }
        .badge-pulse { animation: glowPulse 3s ease-in-out infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.15);
          border-top-color: #0A0A0B;
          animation: spin 0.75s linear infinite;
        }

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

        .auth-left { display: none !important; }
        @media (min-width: 1024px) {
          .auth-left  { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
      `}</style>

      <main
        className="min-h-screen flex relative"
        style={{
          background: `
            radial-gradient(ellipse 60% 55% at 5% 15%, rgba(245,158,11,0.38) 0%, transparent 60%),
            radial-gradient(ellipse 65% 60% at 5% 95%, rgba(109,40,217,0.55) 0%, transparent 62%),
            radial-gradient(ellipse 45% 70% at 50% 50%, rgba(20,10,30,0.85) 0%, transparent 80%),
            #0D0B0E
          `,
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          className="auth-left flex-1 flex-col justify-start relative overflow-hidden"
          style={{ padding: '36px 52px' }}
        >
          {/* grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
              backgroundSize: '52px 52px',
              WebkitMaskImage: 'radial-gradient(75% 65% at 30% 30%, #000 0%, transparent 70%)',
              maskImage: 'radial-gradient(75% 65% at 30% 30%, #000 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 fade-up-1">
            <Logo />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center max-w-[700px] pt-5">
            <div className="fade-up-2">
              <h1 className="text-[#FAFAFA] font-black leading-[1.1] mb-4" style={{ fontSize: 50 }}>
                Sign in and start<br />
                moderating in{' '}
                <span className="animated-gradient-text">60 seconds.</span>
              </h1>
            </div>
            <div className="fade-up-3">
              <p className="text-white/55 text-base leading-[1.7] mb-8 max-w-[400px]">
                One-click Google login. We only ask for the YouTube permissions moderation actually needs.
              </p>
            </div>
            <div className="fade-up-4 flex flex-col gap-3">
              {FEATURES.map((feature, i) => (
                <FeatureRow key={feature} label={feature} delay={`${0.45 + i * 0.08}s`} />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{ padding: '48px 32px', background: 'rgba(10,8,14,0.80)' }}
        >
          <div className="w-full max-w-[420px]">

            <div className="mobile-logo fade-up-1 mb-8">
              <Logo size={34} />
            </div>

            <div className="fade-up-1 mb-7">
              <span
                className="badge-pulse inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-white/82 text-xs font-medium"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
                }}
              >
                <Sparkles size={12} color="#FBBF24" />
                New: Live-chat timeouts
              </span>
            </div>

            <div className="fade-up-2">
              <h2 className="text-[#FAFAFA] font-extrabold leading-[1.1] mb-2" style={{ fontSize: 40 }}>
                Welcome back
              </h2>
              <p className="text-white/45 text-[15px] mb-8">
                Sign in to your ModerateAI dashboard.
              </p>
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-[#f87171] text-[13.5px]"
                style={{
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.30)',
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="fade-up-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="google-btn"
                aria-label="Continue with Google"
              >
                {loading ? <div className="spinner" aria-hidden="true" /> : <GoogleIcon />}
                {loading ? 'Signing in…' : 'Continue with Google'}
              </button>
            </div>

            <div className="fade-up-4 flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-white/28 text-xs font-medium">OR</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            <div className="fade-up-5">
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-[14px] text-white/28 text-sm font-medium cursor-not-allowed"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                Continue with email
                <span className="text-xs opacity-65">(coming soon)</span>
              </button>
            </div>

            <div className="fade-up-6 mt-7">
              <p className="text-center text-xs text-white/32 leading-relaxed">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-white/70 underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-white/70 underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}