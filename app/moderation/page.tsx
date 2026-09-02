'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, MessageSquare, Settings, LogOut, CreditCard,
  BarChart2, Bell, Zap, Search,
  LayoutDashboard, MoreHorizontal, Rss,
  Eye as EyeIcon, Sun,
  Plus, Bot, AlertTriangle, CheckCircle,
  Clock, Filter, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const DEFAULT_FILTERS = ['spam', 'scam', 'hate', 'harassment', 'links', 'adult'];

// SECURITY FIX 1: Allowlist for automation fields — prevents arbitrary field injection
const ALLOWED_AUTOMATION_FIELDS = new Set([
  'hideSpam', 'hideToxic', 'autoHide',
  'aiReplies', 'liveChat', 'liveTimeout',
]);

// SECURITY FIX 2: Validate photoURL domain — prevents XSS via malicious image URLs
const ALLOWED_PHOTO_DOMAINS = [
  'googleusercontent.com',
  'lh3.googleusercontent.com',
  'firebasestorage.googleapis.com',
  'avatars.githubusercontent.com',
];

function isSafePhotoUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_PHOTO_DOMAINS.some(domain => parsed.hostname.endsWith(domain))
    );
  } catch {
    return false;
  }
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color="rgba(255,255,255,0.18)" strokeWidth={1.5} />
      </div>
      <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11.5, textAlign: 'center', lineHeight: 1.5 }}>{message}</span>
    </div>
  );
}

function StatusToggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!active)}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
        background: active ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.09)'}`,
        position: 'relative', transition: 'all 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: active ? 17 : 3,
        width: 12, height: 12, borderRadius: '50%',
        background: active ? '#34d399' : 'rgba(255,255,255,0.28)',
        transition: 'left 0.2s',
        boxShadow: active ? '0 0 6px rgba(52,211,153,0.6)' : 'none',
      }} />
    </div>
  );
}

function StatusCard({
  icon: Icon, iconColor, title, description, active, onToggle, badge
}: {
  icon: any; iconColor: string; title: string; description: string;
  active: boolean; onToggle: (v: boolean) => void; badge?: string;
}) {
  return (
    <div style={{
      background: 'rgba(13,12,20,0.99)', border: `1px solid ${active ? iconColor + '22' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, padding: '14px 16px', transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: active ? `${iconColor}14` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${active ? iconColor + '25' : 'rgba(255,255,255,0.07)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={14} color={active ? iconColor : 'rgba(255,255,255,0.3)'} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: '#FAFAFA', fontSize: 12.5, fontWeight: 700 }}>{title}</span>
              {badge && (
                <span style={{
                  background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)',
                  borderRadius: 5, padding: '1px 6px', fontSize: 9, fontWeight: 800, color: '#a78bfa',
                }}>{badge}</span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>{description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ color: active ? '#34d399' : 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: 700 }}>
            {active ? 'Enabled' : 'Disabled'}
          </span>
          <StatusToggle active={active} onChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = '#FAFAFA', icon: Icon, iconColor }: {
  label: string; value: string | number; color?: string; icon: any; iconColor: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 10, padding: '11px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          background: `${iconColor}12`, border: `1px solid ${iconColor}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={10} color={iconColor} strokeWidth={2} />
        </div>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9.5, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ color, fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

const SIDEBAR_NAV = [
  { label: 'Overview',   icon: LayoutDashboard, href: '/dashboard'  },
  { label: 'Live Feed',  icon: Rss,             href: '/live-feed'  },
  { label: 'Moderation', icon: Shield,          href: '/moderation' },
  { label: 'Automation', icon: Zap,             href: '/automation' },
  { label: 'Analytics',  icon: BarChart2,       href: '/analytics'  },
  { label: 'Alerts',     icon: Bell,            href: '/alerts'     },
  { label: 'Billing',    icon: CreditCard,      href: '/billing'    },
  { label: 'Settings',   icon: Settings,        href: '/settings'   },
];

const FILTER_CHIPS = [
  { label: 'Spam',                key: 'spam',       color: '#f87171' },
  { label: 'Scam',                key: 'scam',       color: '#fb923c' },
  { label: 'Hate Speech',         key: 'hate',       color: '#f43f5e' },
  { label: 'Harassment',          key: 'harassment', color: '#a78bfa' },
  { label: 'Links',               key: 'links',      color: '#60a5fa' },
  { label: 'Adult Content',       key: 'adult',      color: '#f59e0b' },
  { label: 'Custom Keywords',     key: 'custom',     color: '#34d399' },
  { label: 'Repetitive Comments', key: 'repetitive', color: '#94a3b8' },
];

export default function ModerationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<DocumentData | null>(null);
  const [automationData, setAutomationData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isDesktopSiteOn, setIsDesktopSiteOn] = useState(false);

  useEffect(() => {
    const check = () => {
      const touch = navigator.maxTouchPoints > 0;
      const wide  = window.innerWidth >= 600;
      setIsDesktopSiteOn(touch && wide);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [activeFilters, setActiveFilters] = useState<string[]>(DEFAULT_FILTERS);
  const filtersInitialized = useRef(false);
  const initialSnapCount = useRef(0);
  const unsubRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      filtersInitialized.current = false;
      initialSnapCount.current = 0;
      unsubRefs.current.forEach(u => u());
      unsubRefs.current = [];

      const onRequiredSnapReady = () => {
        initialSnapCount.current += 1;
        if (initialSnapCount.current >= 2) {
          setLoading(false);
        }
      };

      const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        onRequiredSnapReady();
      });
      unsubRefs.current.push(unsubUser);

      const unsubAnalytics = onSnapshot(doc(db, 'analytics', firebaseUser.uid), (snap) => {
        if (snap.exists()) setAnalyticsData(snap.data());
      });
      unsubRefs.current.push(unsubAnalytics);

      const unsubAutomation = onSnapshot(doc(db, 'automations', firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAutomationData(data);
          if (!filtersInitialized.current) {
            filtersInitialized.current = true;
            if (Array.isArray(data.activeFilters)) {
              setActiveFilters(data.activeFilters as string[]);
            }
          }
        }
        onRequiredSnapReady();
      });
      unsubRefs.current.push(unsubAutomation);

      // SAFETY: Force loading=false after 4s if Firestore is slow
      const timeout = setTimeout(() => setLoading(false), 4000);
      unsubRefs.current.push(() => clearTimeout(timeout));
    });
    return () => { unsubAuth(); unsubRefs.current.forEach(u => u()); };
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/'); };

  // SECURITY FIX 1: Allowlist validation — no arbitrary field injection
  const toggleAutomation = async (field: string, value: boolean) => {
    if (!user) return;
    if (!ALLOWED_AUTOMATION_FIELDS.has(field)) {
      console.error('Invalid automation field blocked:', field);
      return;
    }
    try {
      await setDoc(doc(db, 'automations', user.uid), { [field]: value }, { merge: true });
    } catch (error) {
      console.error('Failed to update automation:', error);
    }
  };

  const toggleFilter = async (key: string) => {
    if (!user) return;
    const previous = activeFilters;
    const updated = previous.includes(key)
      ? previous.filter(k => k !== key)
      : [...previous, key];
    setActiveFilters(updated);
    try {
      await setDoc(doc(db, 'automations', user.uid), { activeFilters: updated }, { merge: true });
    } catch (error) {
      setActiveFilters(previous);
      console.error('Failed to persist filters:', error);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const plan          = (userData?.plan as string) || 'free';
  const youtubeConnected = (userData?.youtube_connected as boolean) === true || (userData?.youtubeConnected as boolean) === true || (typeof userData?.youtube?.channelId === 'string' && userData.youtube.channelId.trim() !== '');
  const commentsUsed  = (userData?.comments_used as number) || 0;
  const commentsLimit = userData?.comments_limit ?? (plan === 'agency' ? 150000 : plan === 'pro' ? 25000 : 2000);
  const usagePct      = commentsLimit > 0 ? Math.min(100, (commentsUsed / commentsLimit) * 100) : 0;
  const planColor     = plan === 'agency' ? '#a78bfa' : plan === 'pro' ? '#34d399' : '#F59E0B';
  const planLabel     = plan === 'pro' ? 'Pro Plan' : plan === 'agency' ? 'Agency' : 'Free Trial';

  const firstName  = user?.displayName?.split(' ')[0] || 'there';
  const initials   = (user?.displayName || 'U')[0].toUpperCase();

  // SECURITY FIX 2: Validate photo URL domain before rendering
  const rawPhoto   = user?.photoURL || (userData?.photo as string) || null;
  const userPhoto  = isSafePhotoUrl(rawPhoto) ? rawPhoto : null;

  const autoHideToxic   = (automationData?.hideToxic   as boolean) ?? false;
  const autoHideSpam    = (automationData?.hideSpam    as boolean) ?? false;
  const autoAiReplies   = (automationData?.aiReplies   as boolean) ?? false;
  const autoLiveChat    = (automationData?.liveChat    as boolean) ?? false;
  const autoLiveTimeout = (automationData?.liveTimeout as boolean) ?? false;
  const autoHide        = (automationData?.autoHide    as boolean) ?? false;

  const activeRules = [
    autoHideSpam, autoHideToxic, autoHide,
    autoAiReplies, autoLiveChat, autoLiveTimeout,
  ].filter(Boolean).length;

  const totalScanned  = (analyticsData?.totalScanned        as number) ?? 0;
  const totalHidden   = (analyticsData?.totalHidden         as number) ?? 0;
  const totalReplies  = (analyticsData?.totalReplies        as number) ?? 0;
  const moderationAcc = (analyticsData?.moderationAccuracy  as number) ?? 0;
  const pendingReview = (analyticsData?.pendingReview       as number) ?? 0;

  const lastScanAt = userData?.last_scan_at?.toDate?.() as Date | undefined;
  const lastScanLabel = lastScanAt
    ? (() => {
        const diff = Math.floor((Date.now() - lastScanAt.getTime()) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
      })()
    : '—';

  const currentPath = '/moderation';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',-apple-system,sans-serif;}
        html,body{background:#0a0a0f;width:100%;overflow-x:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:3px}

        .r-bg{min-height:100vh;background:#0a0a0f;position:relative;width:100%;overflow-x:hidden;}
        .r-bg::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background:radial-gradient(ellipse 55% 45% at -5% -5%,rgba(124,58,237,0.09) 0%,transparent 55%),
            radial-gradient(ellipse 45% 35% at 108% 108%,rgba(245,158,11,0.06) 0%,transparent 55%);}
        .r-bg::after{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px);
          background-size:44px 44px;}

        .r-sidebar{width:216px;min-width:216px;background:#0c0a0e;border-right:1px solid rgba(245,158,11,0.12);
          display:flex;flex-direction:column;position:fixed;height:100vh;left:0;top:0;z-index:40;overflow:hidden;
          background:radial-gradient(ellipse 80% 40% at -10% 0%, rgba(180,90,0,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 30% at -5% 30%, rgba(150,70,0,0.20) 0%, transparent 55%), #0c0a0e;}
        .r-sidebar::after{content:'';position:absolute;right:0;top:0;bottom:0;width:1px;
          background:linear-gradient(180deg,transparent,rgba(245,158,11,0.15) 30%,rgba(245,158,11,0.22) 50%,rgba(245,158,11,0.15) 70%,transparent);pointer-events:none;}
        .r-logo{padding:18px 14px 14px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .r-logo-mark{width:34px;height:34px;border-radius:10px;
          background:linear-gradient(135deg,#F59E0B 0%,#D97706 40%,#7C3AED 100%);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 14px rgba(124,58,237,0.38),inset 0 1px 0 rgba(255,255,255,0.14);}
        .r-nav{flex:1;padding:10px 7px;display:flex;flex-direction:column;gap:1px;overflow-y:auto;}
        .r-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:10px;
          font-size:12.5px;font-weight:500;text-decoration:none;color:rgba(255,255,255,0.36);
          transition:all 0.18s;border:1px solid transparent;position:relative;overflow:hidden;}
        .r-nav-item:hover{background:rgba(124,58,237,0.06);color:rgba(255,255,255,0.7);}
        .r-nav-item.active{background:linear-gradient(135deg,rgba(245,158,11,0.20) 0%,rgba(245,158,11,0.10) 50%,rgba(245,158,11,0.06) 100%);
          color:#FBBF24;border-color:rgba(245,158,11,0.25);font-weight:700;
          box-shadow:0 0 0 1px rgba(245,158,11,0.12),0 2px 20px rgba(245,158,11,0.10),inset 0 1px 0 rgba(245,158,11,0.18),inset 0 0 28px rgba(245,158,11,0.06);}
        .r-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:18px;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,#FBBF24,#F59E0B,#D97706);box-shadow:0 0 10px rgba(245,158,11,0.8),0 0 24px rgba(245,158,11,0.3);}
        .r-upgrade{margin:0 7px 7px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.14);border-radius:13px;padding:13px;}
        .r-sidebar-bottom{padding:7px 7px 18px;border-top:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:2px;}
        .r-btn-logout{display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:9px;font-size:12px;font-weight:500;
          color:rgba(255,255,255,0.28);background:none;border:none;cursor:pointer;width:100%;transition:all 0.18s;}
        .r-btn-logout:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);}
        .r-btn-upgrade{width:100%;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;font-weight:700;font-size:11.5px;
          padding:8px;border-radius:8px;border:none;cursor:pointer;transition:all 0.2s;text-align:center;text-decoration:none;display:block;}

        .r-main{margin-left:216px;min-height:100vh;display:flex;flex-direction:column;position:relative;z-index:1;width:calc(100% - 216px);}

        .r-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.92);backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.05);padding:0 22px;height:56px;
          display:flex;align-items:center;gap:10px;box-shadow:0 4px 24px rgba(0,0,0,0.25);}
        .r-search{flex:1;max-width:380px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:8px;padding:0 10px 0 32px;height:33px;color:#FAFAFA;font-size:12px;outline:none;transition:all 0.2s;}
        .r-search:focus{border-color:rgba(124,58,237,0.3);background:rgba(255,255,255,0.05);}
        .r-search::placeholder{color:rgba(255,255,255,0.16);}
        .r-icon-btn{width:33px;height:33px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.18s;position:relative;flex-shrink:0;}
        .r-icon-btn:hover{background:rgba(255,255,255,0.07);}
        .r-avatar-btn{display:flex;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:9px;padding:3px 9px 3px 3px;cursor:pointer;transition:all 0.18s;gap:6px;}
        .r-avatar-btn:hover{border-color:rgba(255,255,255,0.11);}

        .r-mobile-topbar{display:none;position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.96);
          backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.05);
          padding:0 12px;height:52px;align-items:center;gap:5px;box-shadow:0 2px 16px rgba(0,0,0,0.3);}

        .r-content{padding:20px 22px 24px;flex:1;animation:fadeIn 0.3s ease;width:100%;box-sizing:border-box;}

        .r-card{background:rgba(13,12,20,0.99);border:1px solid rgba(255,255,255,0.07);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;}
        .r-card:hover{border-color:rgba(255,255,255,0.09);}
        .r-card-top{display:flex;align-items:flex-start;justify-content:space-between;padding:14px 16px 11px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .r-card-title{color:#FAFAFA;font-size:13px;font-weight:700;}
        .r-card-sub{color:rgba(255,255,255,0.24);font-size:10.5px;margin-top:2px;}

        .r-btn-primary{background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-weight:700;font-size:12px;
          padding:8px 14px;border-radius:8px;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:5px;
          transition:all 0.18s;text-decoration:none;white-space:nowrap;box-shadow:0 2px 10px rgba(124,58,237,0.25);}
        .r-btn-primary:hover{box-shadow:0 4px 20px rgba(124,58,237,0.4);transform:translateY(-1px);}
        .r-btn-ghost{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);font-weight:600;font-size:12px;
          padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;
          display:inline-flex;align-items:center;justify-content:center;gap:5px;transition:all 0.18s;text-decoration:none;white-space:nowrap;}
        .r-btn-ghost:hover{background:rgba(255,255,255,0.07);color:#FAFAFA;}

        .r-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;
          background:rgba(10,10,15,0.97);border-top:1px solid rgba(255,255,255,0.06);
          backdrop-filter:blur(24px);padding:6px 4px env(safe-area-inset-bottom,6px);}
        .r-bnav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;
          flex:1;padding:5px 4px;text-decoration:none;color:rgba(255,255,255,0.32);
          border:none;background:none;cursor:pointer;transition:color 0.18s;-webkit-tap-highlight-color:transparent;}
        .r-bnav-item.active{color:#a78bfa;}
        .r-bnav-icon{width:38px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:9px;transition:background 0.18s;}
        .r-bnav-item.active .r-bnav-icon{background:rgba(124,58,237,0.13);}
        .r-bnav-fab{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#6D28D9);
          display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;
          box-shadow:0 4px 16px rgba(124,58,237,0.45);margin-bottom:2px;transition:transform 0.18s;}
        .r-bnav-fab:active{transform:scale(0.93);}

        /* ══ DSO — touch + wide viewport ══ */
        @media (pointer: coarse) and (min-width: 600px) {
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;padding-bottom:120px!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-bottom-nav{display:flex!important;}
          .r-bnav-item{padding:14px 4px 18px!important;gap:6px!important;}
          .r-bnav-icon{width:64px!important;height:48px!important;border-radius:14px!important;}
          .r-bnav-icon svg{width:28px!important;height:28px!important;}
          .r-bnav-item > span:last-child{font-size:16px!important;}
          .r-bnav-fab{width:64px!important;height:64px!important;}
          .r-bnav-fab svg{width:30px!important;height:30px!important;}
          .r-card{padding:24px 20px!important;border-radius:18px!important;}
          .r-card-title{font-size:20px!important;}
          .r-card-sub{font-size:16px!important;}
        }

        .mod-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .mod-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
        .mod-filter-wrap{display:flex;flex-wrap:wrap;gap:7px;padding:12px 14px;}

        @media(min-width:1024px){
          .r-bottom-nav{display:none!important;}
          .r-mobile-topbar{display:none!important;}
        }
        @media(min-width:768px) and (max-width:1023px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;padding-bottom:76px;}
          .r-bottom-nav{display:flex!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-content{padding:14px 16px 16px;}
          .mod-grid{grid-template-columns:1fr;}
          .mod-stats-grid{grid-template-columns:repeat(2,1fr);}
        }
        @media(max-width:767px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;padding-bottom:80px;}
          .r-bottom-nav{display:flex!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-content{padding:10px 10px 16px;}
          .mod-grid{grid-template-columns:1fr!important;}
          .mod-stats-grid{grid-template-columns:1fr 1fr!important;}
        }
      `}</style>

      <div className="r-bg" style={{ display: 'flex' }}>

        {/* SIDEBAR */}
        <aside className="r-sidebar">
          <div style={{ position: "absolute", top: "-60px", left: "-80px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,90,0,0.55) 0%, rgba(160,65,0,0.28) 35%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(18px)" }} />
          <div style={{ position: "absolute", top: "160px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(180,75,0,0.30) 0%, rgba(130,55,0,0.12) 40%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(22px)" }} />
          <div className="r-logo">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div className="r-logo-mark"><Shield size={16} color="white" strokeWidth={2.2} /></div>
              <div>
                <div style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 14.5, letterSpacing: '-0.02em' }}>ModerateAI</div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 500, marginTop: 1 }}>YouTube AI Moderator</div>
              </div>
            </div>
          </div>
          <nav className="r-nav">
            {SIDEBAR_NAV.map(item => {
              const isActive = currentPath === item.href;
              return (
                <Link key={item.href} href={item.href} className={`r-nav-item${isActive ? ' active' : ''}`}>
                  <item.icon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {plan === 'free' && (
            <div className="r-upgrade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Zap size={10} color="#a78bfa" />
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 11 }}>Upgrade to Pro</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 9 }}>
                {['25,000 comments / month', 'Unlimited automation rules', 'Priority support', '1,900 AI actions / month'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.32)', fontSize: 10 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#a78bfa', flexShrink: 0 }} />{f}
                  </div>
                ))}
              </div>
              <Link href="/billing" className="r-btn-upgrade">Upgrade Now</Link>
            </div>
          )}
          <div className="r-sidebar-bottom">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', marginBottom: 3 }}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="av" />
                : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{initials}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 700, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: 9.5 }}>{user?.email?.slice(0, 22)}{(user?.email?.length || 0) > 22 ? '…' : ''}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="r-btn-logout">
              <LogOut size={12} strokeWidth={1.8} /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="r-main">

          {/* DESKTOP TOPBAR */}
          <header className="r-topbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search size={11} color="rgba(255,255,255,0.16)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="r-search" placeholder="Search comments, users, keywords…" />
            </div>
        {youtubeConnected && (
         <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.13)', fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
     <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
     AI Online
   </div>
    )}
       {youtubeConnected && ( 
  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.14)', fontSize: 10.5, fontWeight: 600, color: '#a78bfa', whiteSpace: 'nowrap' }}>
    <Shield size={9} strokeWidth={2} /> Protection Active
  </div>
      )}
          <div style={{ flex: 1 }} />
            <button onClick={() => router.push('/settings')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: '4px 11px 4px 4px', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{initials}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12.5, lineHeight: 1.2 }}>{user?.displayName || 'User'}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{planLabel}</div>
              </div>
            </button>
          </header>

          {/* MOBILE TOPBAR */}
          <header className="r-mobile-topbar" style={{ height: isDesktopSiteOn ? 72 : 52 }}>
            {/* Left — title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <h1 style={{ fontSize: isDesktopSiteOn ? 24 : 16, fontWeight: 900, color: '#FAFAFA', letterSpacing: '-0.02em' }}>Moderation</h1>
            </div>
            {/* Right — avatar + name + plan */}
            <button onClick={() => router.push('/settings')} style={{ display: 'flex', alignItems: 'center', gap: isDesktopSiteOn ? 12 : 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, padding: isDesktopSiteOn ? '8px 16px 8px 8px' : '4px 10px 4px 4px', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ width: isDesktopSiteOn ? 44 : 26, height: isDesktopSiteOn ? 44 : 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: isDesktopSiteOn ? 16 : 10, flexShrink: 0 }}>{initials}</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: isDesktopSiteOn ? 20 : 12, lineHeight: 1.2 }}>{user?.displayName || 'User'}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: isDesktopSiteOn ? 15 : 10 }}>{planLabel}</div>
              </div>
            </button>
          </header>

          {/* CONTENT */}
          <div className="r-content">
{!youtubeConnected && (
  <div style={{ background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 14, padding: '24px 20px', marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(248,113,113,0.09)', border: '1px solid rgba(248,113,113,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Shield size={22} color="#f87171" strokeWidth={1.8} />
    </div>
    <h2 style={{ color: '#FAFAFA', fontSize: 15, fontWeight: 800 }}>Connect your YouTube channel</h2>
    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.6, maxWidth: 340 }}>
      Connect your YouTube channel to enable AI moderation, spam detection, and real-time protection.
    </p>
    <button onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/youtube?uid=${user?.uid}`; }}
      style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
      Connect YouTube
    </button>
  </div>
)}

            {/* PAGE HEADER */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={15} color="#a78bfa" strokeWidth={2} />
                </div>
                <h1 style={{ color: '#FAFAFA', fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>Moderation</h1>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 42 }}>Manage AI protection rules and review flagged content.</p>
            </div>

            {/* COMMENTS SCANNED THIS MONTH */}
            <div className="r-card" style={{ marginBottom: 12 }}>
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Comments Scanned This Month</div>
                  <div className="r-card-sub">Monthly usage against your plan limit</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${planColor}10`, border: `1px solid ${planColor}22`, borderRadius: 7, padding: '3px 8px' }}>
                  <Shield size={9} color={planColor} />
                  <span style={{ color: planColor, fontSize: 9, fontWeight: 800 }}>{planLabel.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                  <span style={{ color: '#FAFAFA', fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{commentsUsed.toLocaleString()}</span>
                  <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 14 }}>/ {commentsLimit.toLocaleString()} comments</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', borderRadius: 6, background: `linear-gradient(90deg,${planColor},#7C3AED)`, width: `${usagePct}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,0.26)' }}>
                  <span>{usagePct.toFixed(1)}% used</span>
                  {plan === 'free'
                    ? <Link href="/billing" style={{ color: planColor, fontWeight: 700, textDecoration: 'none' }}>Upgrade for more →</Link>
                    : <span style={{ color: '#34d399', fontWeight: 600 }}>{(commentsLimit - commentsUsed).toLocaleString()} remaining</span>
                  }
                </div>
              </div>
            </div>

            {/* PROTECTION CARDS GRID */}
            <div className="mod-grid" style={{ marginBottom: 12 }}>
              <StatusCard
                icon={AlertTriangle} iconColor="#f87171"
                title="AI Spam Detection"
                description="Automatically identifies and removes spam comments using AI pattern recognition."
                active={autoHideSpam}
                onToggle={(v) => toggleAutomation('hideSpam', v)}
              />
              <StatusCard
                icon={Shield} iconColor="#a78bfa"
                title="Toxic Comment Protection"
                description="Detects and hides toxic, abusive, and harmful comments in real time."
                active={autoHideToxic}
                onToggle={(v) => toggleAutomation('hideToxic', v)}
              />
              <StatusCard
                icon={EyeIcon} iconColor="#60a5fa"
                title="Auto Hide"
                description="Instantly hides flagged comments without manual review until approved."
                active={autoHide}
                onToggle={(v) => toggleAutomation('autoHide', v)}
              />
              <StatusCard
                icon={Bot} iconColor="#F59E0B"
                title="AI Auto Reply"
                description="Sends intelligent, context-aware replies to comments automatically."
                active={autoAiReplies}
                onToggle={(v) => toggleAutomation('aiReplies', v)}
                badge="AI"
              />
              <StatusCard
                icon={MessageSquare} iconColor="#34d399"
                title="Live Chat Moderation"
                description="Monitors and moderates live stream chat in real time."
                active={autoLiveChat}
                onToggle={(v) => toggleAutomation('liveChat', v)}
              />
              <StatusCard
                icon={Clock} iconColor="#fb923c"
                title="Progressive Live Chat Timeouts"
                description="Automatically applies escalating timeouts to repeat offenders in live chat."
                active={autoLiveTimeout}
                onToggle={(v) => toggleAutomation('liveTimeout', v)}
              />
            </div>

            {/* REVIEW QUEUE */}
            <div className="r-card" style={{ marginBottom: 12 }}>
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Review Queue</div>
                  <div className="r-card-sub">Comments flagged for manual review</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, padding: '3px 8px' }}>
                  <Clock size={9} color="#F59E0B" />
                  <span style={{ color: '#F59E0B', fontSize: 9, fontWeight: 800 }}>{pendingReview} PENDING</span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {pendingReview > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span style={{ color: '#FAFAFA', fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums' }}>{pendingReview}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 8 }}>comments need your attention</span>
                    </div>
                    <Link href="/comments" className="r-btn-primary">
                      <EyeIcon size={12} /> Review Now
                    </Link>
                  </div>
                ) : (
                  <EmptyState icon={CheckCircle} message="No comments pending review. Your queue is clear." />
                )}
              </div>
            </div>

            {/* COMMENT FILTER */}
            <div className="r-card" style={{ marginBottom: 12 }}>
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Comment Filter</div>
                  <div className="r-card-sub">Select categories to automatically filter</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 7, padding: '3px 8px' }}>
                  <Filter size={9} color="#a78bfa" />
                  <span style={{ color: '#a78bfa', fontSize: 9, fontWeight: 800 }}>{activeFilters.length} ACTIVE</span>
                </div>
              </div>
              <div className="mod-filter-wrap">
                {FILTER_CHIPS.map(chip => {
                  const isActive = activeFilters.includes(chip.key);
                  return (
                    <button
                      key={chip.key}
                      onClick={() => toggleFilter(chip.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: isActive ? `${chip.color}14` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? chip.color + '30' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                        color: isActive ? chip.color : 'rgba(255,255,255,0.35)',
                        fontSize: 11.5, fontWeight: 600, transition: 'all 0.18s',
                      }}
                    >
                      {isActive && <CheckCircle size={10} color={chip.color} />}
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MODERATION STATISTICS */}
            <div className="r-card">
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Moderation Statistics</div>
                  <div className="r-card-sub">Overall performance metrics</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.16)', borderRadius: 6, padding: '2px 7px' }}>
                  <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                  <span style={{ color: '#22c55e', fontSize: 8.5, fontWeight: 800 }}>LIVE</span>
                </div>
              </div>
              <div style={{ padding: '12px 14px 14px' }}>
                <div className="mod-stats-grid">
                  <StatBox label="Comments Scanned"   value={totalScanned.toLocaleString()}                               color="#a78bfa" icon={MessageSquare} iconColor="#a78bfa" />
                  <StatBox label="Hidden Comments"    value={totalHidden.toLocaleString()}                                color="#f87171" icon={EyeIcon}       iconColor="#f87171" />
                  <StatBox label="AI Replies"         value={totalReplies.toLocaleString()}                               color="#F59E0B" icon={Bot}           iconColor="#F59E0B" />
                  <StatBox label="Detection Accuracy" value={totalScanned === 0 ? '—' : `${moderationAcc.toFixed(1)}%`}  color="#34d399" icon={CheckCircle}   iconColor="#34d399" />
                  <StatBox label="Last Scan"          value={lastScanLabel}                                               color="#60a5fa" icon={RefreshCw}     iconColor="#60a5fa" />
                  <StatBox label="Active Rules"       value={activeRules}                                                 color="#FAFAFA" icon={Zap}           iconColor="#a78bfa" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM NAV */}
        <nav className="r-bottom-nav">
          <Link href="/dashboard" className="r-bnav-item">
            <span className="r-bnav-icon"><LayoutDashboard size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Overview</span>
          </Link>
          <Link href="/live-feed" className="r-bnav-item">
            <span className="r-bnav-icon"><Rss size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Live Feed</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <button className="r-bnav-fab" onClick={() => router.push('/automation')}>
              <Plus size={22} color="white" strokeWidth={2.5} />
            </button>
            <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>Automation</span>
          </div>
          <Link href="/alerts" className={"r-bnav-item"}>
                      <span className="r-bnav-icon"><Bell size={24} strokeWidth={1.7} /></span>
                      <span style={{ fontSize: 11 }}>Alerts</span>
                    </Link> 
          <button className={`r-bnav-item active`} onClick={() => setMoreOpen(v => !v)}>
            <span className="r-bnav-icon"><MoreHorizontal size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>More</span>
          </button>
        </nav>

        {/* MORE DRAWER */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, background: 'rgba(20,8,45,0.75)', borderTop: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px 20px 0 0', padding: `0 0 env(safe-area-inset-bottom,${isDesktopSiteOn ? '20px' : '16px'})`, boxShadow: '0 -12px 60px rgba(124,58,237,0.25)', backdropFilter: 'blur(28px)', animation: 'slideUp 0.18s ease' }}>
              <div style={{ width: isDesktopSiteOn ? 56 : 30, height: isDesktopSiteOn ? 6 : 3, background: 'rgba(255,255,255,0.09)', borderRadius: 3, margin: isDesktopSiteOn ? '18px auto 12px' : '6px auto 12px' }} />
              {/* User Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: isDesktopSiteOn ? 18 : 10, padding: isDesktopSiteOn ? '14px 24px 20px' : '10px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: isDesktopSiteOn ? 60 : 38, height: isDesktopSiteOn ? 60 : 38, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: isDesktopSiteOn ? 22 : 13, flexShrink: 0 }}>{initials}</div>
                <div>
                  <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: isDesktopSiteOn ? 26 : 14 }}>{user?.displayName || 'User'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: isDesktopSiteOn ? 20 : 11 }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ padding: isDesktopSiteOn ? '10px 14px' : '6px 8px' }}>
                {[
                  { icon: CreditCard, label: 'Billing',    href: '/billing',    color: '#F59E0B' },
                  { icon: BarChart2,  label: 'Analytics',  href: '/analytics',  color: '#34d399' },
                  { icon: Shield,     label: 'Moderation', href: '/moderation', color: '#60a5fa' },
                  { icon: Settings,   label: 'Settings',   href: '/settings',   color: '#a78bfa' },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: isDesktopSiteOn ? 20 : 12, padding: isDesktopSiteOn ? '18px 14px' : '10px 12px', borderRadius: isDesktopSiteOn ? 16 : 10, textDecoration: 'none', color: 'rgba(255,255,255,0.72)', fontWeight: 600, fontSize: isDesktopSiteOn ? 24 : 13 }}>
                    <div style={{ width: isDesktopSiteOn ? 54 : 30, height: isDesktopSiteOn ? 54 : 30, borderRadius: isDesktopSiteOn ? 15 : 9, background: `${item.color}12`, border: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={isDesktopSiteOn ? 26 : 14} color={item.color} strokeWidth={1.8} />
                    </div>
                    {item.label}
                  </Link>
                ))}
                <div style={{ margin: isDesktopSiteOn ? '6px 14px 0' : '6px 12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                  <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: isDesktopSiteOn ? 20 : 12, padding: isDesktopSiteOn ? '18px 0' : '10px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 600, fontSize: isDesktopSiteOn ? 24 : 13, width: '100%' }}>
                    <div style={{ width: isDesktopSiteOn ? 54 : 30, height: isDesktopSiteOn ? 54 : 30, borderRadius: isDesktopSiteOn ? 15 : 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LogOut size={isDesktopSiteOn ? 26 : 14} color="#f87171" strokeWidth={1.8} />
                    </div>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}