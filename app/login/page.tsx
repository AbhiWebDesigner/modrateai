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
    } catch (err: any) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-blue-600 mb-10">
            <Shield className="w-6 h-6" />
            ModrateAI
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Get Started</h1>
          <p className="text-gray-500 mb-8">Create your account in seconds — no credit card needed</p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm mb-6 disabled:opacity-60"
          >
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
            {loading ? 'Signing in...' : 'Sign up with Google'}
          </button>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mb-6">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-blue-900">Official YouTube API only</div>
              <div className="text-xs text-blue-600 mt-0.5">Your account is secure. We only request comment moderation permission.</div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400">
            By continuing, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms</a> & <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <button onClick={handleGoogleLogin} className="text-blue-600 font-bold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-blue-600 items-center justify-center p-12">
        <div className="text-white text-center max-w-sm">
          <div className="text-6xl font-black mb-6">Join 1000+<br />Creators 🚀</div>
          <p className="text-blue-200 text-lg mb-10">Indian YouTubers protecting their channels with ModrateAI</p>
          <div className="space-y-4">
            {[{ stat: '1,500', label: 'Free comments/month' }, { stat: '19 days', label: 'Free trial' }, { stat: '10+', label: 'Indian languages' }].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-6 py-4 flex justify-between items-center">
                <span className="text-blue-200">{s.label}</span>
                <span className="font-black text-xl">{s.stat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}