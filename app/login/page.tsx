'use client';
import { Shield } from 'lucide-react';
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
    <main className="min-h-screen flex" style={{
      background: `
        radial-gradient(circle at 0% 0%, #F59E0B30 0%, transparent 40%),
        radial-gradient(circle at 50% 100%, #7C3AED25 0%, transparent 45%),
        #09090B
      `
    }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12" style={{
        background: `
          radial-gradient(circle at left top, rgba(245,158,11,0.25) 0%, transparent 45%),
          radial-gradient(circle at center bottom, rgba(124,58,237,0.22) 0%, transparent 55%),
          #09090B
        `
      }}>
        <Link href="/" className="flex items-center gap-2">
          <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 10 }} className="w-9 h-9 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-black text-xl">ModrateAI</span>
        </Link>

        <div>
          <h1 className="text-5xl font-black text-white leading-tight mb-6">
            Sign in and start<br />
            moderating in{' '}
            <span style={{ color: '#f59e0b' }}>60 seconds.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10">
            One-click Google login. We only ask for the YouTube<br />
            permissions moderation actually needs.
          </p>
          <div className="flex flex-col gap-4">
            {[
              'Detects toxic comments in 100+ languages',
              'Progressive live-chat timeouts',
              'AI auto-replies with natural human delay',
              'Cancel anytime — 19-day free trial',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '50%' }}
                  className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  <span style={{ color: '#f59e0b' }} className="text-xs">✓</span>
                </div>
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ opacity: 0 }} className="h-8" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: 10 }} className="w-9 h-9 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-xl">ModrateAI</span>
          </div>

          {/* Badge */}
          <div className="mb-6">
            <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, color: '#f59e0b' }}
              className="text-xs px-3 py-1.5 font-semibold">
              ✨ New: Live-chat timeouts
            </span>
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to your ModrateAI dashboard.</p>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              className="text-red-400 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          {/* Google Button */}
          <button onClick={handleGoogleLogin} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-all mb-4 disabled:opacity-60">
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div style={{ background: 'rgba(255,255,255,0.1)' }} className="flex-1 h-px"></div>
            <span className="text-gray-500 text-xs">OR</span>
            <div style={{ background: 'rgba(255,255,255,0.1)' }} className="flex-1 h-px"></div>
          </div>

          {/* Email Coming Soon */}
          <button disabled
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
            className="w-full py-3.5 text-gray-500 text-sm font-medium mb-6">
            Continue with email <span className="text-xs opacity-60">(coming soon)</span>
          </button>

          {/* Terms */}
          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-gray-300 hover:text-white underline">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-gray-300 hover:text-white underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}