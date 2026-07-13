'use client';
import { useState, useEffect } from 'react';
import { Bell, Send, LayoutDashboard, BarChart2, Zap, Settings, Star, MoreHorizontal, CreditCard, Layers, Bot, LogOut } from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/automation', icon: Zap, label: 'Automation' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const moreItems = [
  { href: '/billing',         icon: CreditCard, label: 'Billing',          color: '#F59E0B' },
  { href: '/channels',        icon: Layers,     label: 'Channels',         color: '#60a5fa' },
  { href: '/analytics',       icon: BarChart2,  label: 'Analytics',        color: '#34d399' },
  { href: '/human-ai-replys', icon: Bot,        label: 'Human-AI replys',  color: '#a78bfa' },
  { href: '/notifications',   icon: Bell,       label: 'Notifications',    color: '#60a5fa' },
  { href: '/settings',        icon: Settings,   label: 'Settings',         color: '#94a3b8' },
];

const notificationEvents = [
  { id: 'toxic_hidden',    label: 'Toxic comment hidden',    desc: 'Every time a comment is auto-hidden',       default: false },
  { id: 'auto_reply',      label: 'Auto-reply sent',         desc: 'When ModerateAI replies on your behalf',    default: false },
  { id: 'user_timeout',    label: 'User timeout / ban',      desc: 'When a user hits a timeout tier',           default: true  },
  { id: 'repeat_offender', label: 'Repeat offender detected',desc: '10+ toxic messages from same user',         default: true  },
  { id: 'daily_summary',   label: 'Daily summary',           desc: 'Once-a-day overview at 9 AM IST',           default: true  },
  { id: 'weekly_report',   label: 'Weekly analytics report', desc: 'Every Monday with trends and insights',     default: true  },
];

export default function AlertsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPlan, setUserPlan] = useState<string>('free');
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [emailConnected, setEmailConnected] = useState(true);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationEvents.map(e => [e.id, e.default]))
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setUserEmail(u.email || '');
      try {
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserPlan(data.plan || 'free');
        }
        const alertSnap = await getDoc(doc(db, 'users', u.uid, 'settings', 'alerts'));
        if (alertSnap.exists()) {
          const data = alertSnap.data();
          if (data.telegramConnected !== undefined) setTelegramConnected(data.telegramConnected);
          if (data.emailConnected !== undefined) setEmailConnected(data.emailConnected);
          if (data.telegramUsername) setTelegramUsername(data.telegramUsername);
          if (data.toggles) setToggles(data.toggles);
        }
      } catch {}
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'alerts'), {
        telegramConnected, emailConnected, telegramUsername, toggles, updatedAt: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  const handleLogout = async () => { await signOut(auth); router.push('/'); };

  const initials = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  const planLabel = userPlan === 'agency' ? 'Agency plan' : userPlan === 'pro' ? 'Pro plan' : 'Free plan';

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col fixed left-0 top-0 bottom-0 bg-[#111111] border-r border-white/10 z-30">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-sm">M</span>
            </div>
            <span className="font-black text-white text-base">ModerateAI</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-yellow-400/10 to-orange-400/10 border border-yellow-400/20">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">Upgrade to Pro</span>
          </div>
          <p className="text-xs text-gray-400 mb-2">Unlock unlimited hidden comments and Telegram alerts.</p>
          <button className="w-full bg-yellow-400 text-black text-xs font-black py-1.5 rounded-lg hover:bg-yellow-300 transition-colors">
            Upgrade
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-56 flex flex-col">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur border-b border-white/10 px-4 lg:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-black text-white">Alerts</h1>
              <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Get notified where you already are</p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input placeholder="Search comments, users..." className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-44" />
            </div>
            <button className="relative w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4 text-gray-300" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-yellow-400 rounded-full" />
            </button>
            <button className="hidden lg:flex items-center gap-2 bg-yellow-400 text-black text-sm font-black px-4 py-2 rounded-xl hover:bg-yellow-300 transition-colors">
              <span>▶</span> Connect YouTube
            </button>
            <Link href="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-black">
                {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-bold text-white">{user?.displayName || 'User'}</p>
                <p className="text-xs text-gray-400">{planLabel}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6 pb-28 lg:pb-6 max-w-4xl mx-auto w-full space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Telegram */}
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#229ED9]/20 rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5 text-[#229ED9]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Telegram</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">Agency</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Instant DMs when action is needed</p>
                  </div>
                </div>
                {userPlan === 'agency' ? (
                  telegramConnected
                    ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-lg font-medium">✓ Connected</span>
                    : <button onClick={() => setTelegramConnected(true)} className="text-xs border border-white/20 text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors font-medium">+ Connect</button>
                ) : (
                  <span className="text-xs bg-white/5 text-gray-500 px-3 py-1.5 rounded-lg font-medium cursor-not-allowed">Agency only</span>
                )}
              </div>
              {telegramConnected && userPlan === 'agency' && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Sending to <span className="text-white font-medium">@{telegramUsername || userEmail.split('@')[0]}</span></p>
                  <button onClick={() => setTelegramConnected(false)} className="text-xs text-gray-400 hover:text-white transition-colors">Manage</button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Email</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-medium">Free</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Daily digest of moderation activity</p>
                  </div>
                </div>
                {emailConnected
                  ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-lg font-medium">✓ Connected</span>
                  : <button onClick={() => setEmailConnected(true)} className="text-xs border border-white/20 text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors font-medium">+ Connect</button>
                }
              </div>
              {emailConnected && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Sending to <span className="text-white font-medium">{userEmail}</span></p>
                  <button className="text-xs text-gray-400 hover:text-white transition-colors">Manage</button>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-[#161616] border border-white/10 rounded-2xl p-5 lg:p-6">
            <h2 className="font-bold text-white mb-1">Notification Settings</h2>
            <p className="text-xs text-gray-400 mb-5">Choose which events trigger alerts</p>
            <div className="space-y-5">
              {notificationEvents.map(({ id, label, desc }) => (
                <div key={id} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => setToggles(prev => ({ ...prev, [id]: !prev[id] }))}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${toggles[id] ? 'bg-yellow-400' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${toggles[id] ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${saved ? 'bg-green-500 text-white' : 'bg-yellow-400 text-black hover:bg-yellow-300'} disabled:opacity-50`}>
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save preferences'}
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-white/10 z-30 px-2 py-2">
        <div className="flex justify-around">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-yellow-400' : 'text-gray-500'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${moreOpen ? 'text-yellow-400' : 'text-gray-500'}`}>
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Drawer */}
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />
          <div className="lg:hidden fixed bottom-16 left-3 right-3 z-50 bg-[#0e0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: 'slideUp 0.2s ease' }}>
            <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>
            <div className="w-8 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-3" />

            {/* User info */}
            <div className="flex items-center gap-3 px-4 pb-3 border-b border-white/06 mb-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-black flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user?.displayName || 'User'}</p>
                <p className="text-xs text-gray-400">{planLabel}</p>
              </div>
            </div>

            {/* Links */}
            {moreItems.map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} onClick={() => setMoreOpen(false)}
                className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors text-white/75 font-semibold text-sm">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                  <Icon size={15} color={color} />
                </div>
                {label}
              </Link>
            ))}

            {/* Logout */}
            <div className="mx-4 mt-1 mb-3 pt-2 border-t border-white/06">
              <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                className="flex items-center gap-4 w-full py-3 text-red-400 font-semibold text-sm">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-400/10 border border-red-400/20">
                  <LogOut size={15} color="#f87171" />
                </div>
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}