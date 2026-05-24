'use client';
import { useState, useEffect } from 'react';
import { Shield, Bell, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AlertsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [telegramId, setTelegramId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/login'); return; }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex items-center gap-2 font-black text-lg text-blue-600"><Shield className="w-5 h-5" /> ModrateAI</div>
        <h1 className="text-xl font-black text-gray-900 ml-4">Alerts</h1>
      </header>
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-black text-gray-900">Email Alerts</h2>
                <p className="text-xs text-gray-400">Get notified via email</p>
              </div>
            </div>
            <button onClick={() => setEmailEnabled(!emailEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${emailEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${emailEnabled ? 'left-6' : 'left-0.5'}`}></div>
            </button>
          </div>
          {emailEnabled && (
            <div className="space-y-3">
              {['Bad comment hidden for review', 'Live chat timeout applied', 'Spam detected', 'Weekly summary report'].map((item) => (
                <label key={item} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
                  <span className="text-sm text-gray-600">{item}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.509c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.663l-2.947-.924c-.64-.203-.653-.64.136-.948l11.527-4.447c.533-.194 1 .131.366.904z"/>
                </svg>
              </div>
              <div>
                <h2 className="font-black text-gray-900">Telegram Alerts</h2>
                <p className="text-xs text-gray-400">Pro plan required</p>
              </div>
            </div>
            <button onClick={() => setTelegramEnabled(!telegramEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${telegramEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${telegramEnabled ? 'left-6' : 'left-0.5'}`}></div>
            </button>
          </div>
          {telegramEnabled && (
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Your Telegram Chat ID</label>
              <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Enter your Telegram Chat ID"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400" />
              <p className="text-xs text-gray-400 mt-2">Send /start to @ModrateAI_bot on Telegram to get your Chat ID</p>
            </div>
          )}
        </div>

        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {saved ? <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Saved!</span> : 'Save Alert Settings'}
        </button>
      </div>
    </main>
  );
}