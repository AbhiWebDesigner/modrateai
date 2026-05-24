'use client';
import { useState, useEffect } from 'react';
import { Shield, Eye, Trash2, MessageSquare, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-xl font-black text-gray-900 ml-4">Analytics</h1>
      </header>
      <div className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Eye, label: 'Total Scanned', value: '0', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Trash2, label: 'Hidden for Review', value: '0', color: 'text-red-500', bg: 'bg-red-50' },
            { icon: MessageSquare, label: 'Auto-Replies', value: '0', color: 'text-green-600', bg: 'bg-green-50' },
            { icon: TrendingUp, label: 'Protection Rate', value: '99%', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="font-black text-gray-900 mb-6">Weekly Overview</h2>
          <div className="flex items-end gap-2 h-32">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-100 rounded-t-lg" style={{ height: `${[30,50,20,70,40,60,25][i]}px` }}></div>
                <span className="text-xs text-gray-400">{day}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">Connect YouTube to see real analytics data</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-gray-900 mb-4">Timeout History</h2>
          <div className="space-y-3">
            {[
              { range: '1st – 2nd offense', timeout: '10 seconds', color: 'text-green-600', bg: 'bg-green-50' },
              { range: '3rd – 14th offense', timeout: '30 minutes', color: 'text-amber-600', bg: 'bg-amber-50' },
              { range: '15th – 20th+ offense', timeout: '24 hours', color: 'text-red-600', bg: 'bg-red-50' },
              { range: 'Spam (10+ bad words)', timeout: 'Auto hide + 24hr', color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((t) => (
              <div key={t.range} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm font-bold text-gray-800">{t.range}</div>
                  <div className={`text-xs font-bold ${t.color}`}>{t.timeout}</div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${t.bg} ${t.color} font-bold`}>0 applied</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}