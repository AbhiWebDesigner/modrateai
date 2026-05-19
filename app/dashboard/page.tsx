'use client';
import { useState, useEffect } from 'react';
import { Shield, Trash2, MessageSquare, Eye, Settings, LogOut, Home, BarChart3, Bell, ChevronRight, Youtube, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setUserData(userSnap.data());
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };
  const handleYouTubeConnect = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth?uid=${user?.uid}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );

  const plan = userData?.plan || 'free';
  const commentsUsed = userData?.comments_used || 0;
  const commentsLimit = userData?.comments_limit || 1500;
  const youtubeConnected = userData?.youtube_connected || false;

  return (
    <main className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 font-black text-lg text-blue-600">
            <Shield className="w-5 h-5" /> ModrateAI
          </div>
        </div>
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            {user?.photoURL ? (
              <img src={user.photoURL} className="w-9 h-9 rounded-full" alt="avatar" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 truncate">{user?.displayName || 'User'}</div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${youtubeConnected ? 'bg-green-500' : 'bg-orange-400'}`}></span>
                <span className="text-xs text-gray-500 capitalize">{plan} Plan</span>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'alerts', icon: Bell, label: 'Alerts' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-4 space-y-2">
          {plan === 'free' && (
            <div className="bg-blue-600 rounded-xl p-4 text-white">
              <div className="font-bold text-sm mb-1">Upgrade to Pro 🚀</div>
              <div className="text-xs text-blue-200 mb-3">5,000 comments + live chat</div>
              <Link href="/pricing" className="block bg-white text-blue-600 text-center text-xs font-bold py-2 rounded-lg">Upgrade — ₹299/mo</Link>
            </div>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-60">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-black text-gray-900">Welcome back, {user?.displayName?.split(' ')[0]} 👋</h1>
            <p className="text-sm text-gray-400">{youtubeConnected ? 'Your channel is protected' : 'Connect YouTube to start'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${youtubeConnected ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${youtubeConnected ? 'bg-green-500' : 'bg-orange-400'}`}></span>
              <span className={`text-sm font-medium ${youtubeConnected ? 'text-green-700' : 'text-orange-600'}`}>
                {youtubeConnected ? 'Bot Active' : 'Not Connected'}
              </span>
            </div>
          </div>
        </header>

        <div className="p-8">
          {!youtubeConnected && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 mb-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Youtube className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-lg">Connect your YouTube channel</div>
                  <div className="text-red-100 text-sm">Connect once to start protecting your comments automatically</div>
                </div>
              </div>
              <button onClick={handleYouTubeConnect} className="bg-white text-red-600 font-bold px-6 py-2.5 rounded-xl hover:bg-red-50 flex items-center gap-2">
                Connect YouTube <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Eye, label: 'Comments Scanned', value: commentsUsed.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Trash2, label: 'Bad Comments Deleted', value: '0', color: 'text-red-500', bg: 'bg-red-50' },
              { icon: MessageSquare, label: 'Auto-Replies Sent', value: '0', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Shield, label: 'Protection Status', value: youtubeConnected ? 'ACTIVE' : 'INACTIVE', color: youtubeConnected ? 'text-green-600' : 'text-orange-500', bg: youtubeConnected ? 'bg-green-50' : 'bg-orange-50' },
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

          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-black text-gray-900">Monthly Usage</h2>
                <p className="text-sm text-gray-400 capitalize">{plan} plan — {commentsLimit.toLocaleString()} comments/month</p>
              </div>
              {plan === 'free' && (
                <Link href="/pricing" className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
                  Upgrade <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Comments used</span>
              <span className="font-bold text-gray-900">{commentsUsed} / {commentsLimit.toLocaleString()}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (commentsUsed / commentsLimit) * 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-gray-900">Recent Activity</h2>
              <span className="text-xs text-gray-400">{youtubeConnected ? 'Live' : 'Connect YouTube to see activity'}</span>
            </div>
            {!youtubeConnected ? (
              <div className="px-6 py-12 text-center">
                <Youtube className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Connect your YouTube channel to see comment activity</p>
                <button onClick={handleYouTubeConnect} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
                  Connect YouTube →
                </button>
              </div>
            ) : (
              <div className="px-6 py-4 text-center text-gray-400 text-sm">No activity yet</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}