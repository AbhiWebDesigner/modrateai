'use client';
import { useState, useEffect } from 'react';
import {
  Check, Lock, Key, Smartphone,
  User as UserIcon, ExternalLink, Pencil,
  Bell, LayoutDashboard, BarChart2, Zap, Settings, CreditCard,
  Monitor, Globe, LogOut, Shield, Rss, Bot,
  MessageSquare, AlertTriangle, Plus, MoreHorizontal,
  ChevronRight, Hash, Search, Sun,
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type TabId = 'profile' | 'security' | '2fa' | 'encryption';

const TABS: { id: TabId; label: string; icon: typeof UserIcon }[] = [
  { id: 'profile',    label: 'Profile',    icon: UserIcon   },
  { id: 'security',   label: 'Security',   icon: Lock       },
  { id: '2fa',        label: '2FA',        icon: Smartphone },
  { id: 'encryption', label: 'Encryption', icon: Key        },
];

const API_ACCESS_TAB = { label: 'API Access', icon: ExternalLink, href: '/dashboard/settings/api-access' };

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

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser]                           = useState<User | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [activeTab, setActiveTab]                 = useState<TabId>('profile');
  const [userPlan, setUserPlan]                   = useState('free');
  const [fullName, setFullName]                   = useState('');
  const [youtubeChannel, setYoutubeChannel]       = useState('');
  const [youtubeConnected, setYoutubeConnected]   = useState(false);
  const [profileSaved, setProfileSaved]           = useState(false);
  const [disconnecting, setDisconnecting]         = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [memberSince, setMemberSince]             = useState('');
  const [moreOpen, setMoreOpen]                   = useState(false);
  const [notifOpen, setNotifOpen]                 = useState(false);

  const currentPath = '/settings';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      setFullName(firebaseUser.displayName || '');
      if (firebaseUser.metadata.creationTime) {
        const date = new Date(firebaseUser.metadata.creationTime);
        setMemberSince(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
      }
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setUserPlan(data.plan || 'free');
          const isConnected = data.youtube_connected === true;
          const channelName = data.youtube_channel_name || data.youtube_channel_handle || '';
          setYoutubeConnected(isConnected);
          if (isConnected && channelName) setYoutubeChannel(channelName);
        }
      } catch {}
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try { await setDoc(doc(db, 'users', user.uid), { displayName: fullName }, { merge: true }); } catch {}
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleDisconnectYouTube = async () => {
    if (!user) return;
    setDisconnecting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        youtube_connected: false, youtube_access_token: '', youtube_refresh_token: '',
        youtube_channel_id: '', youtube_channel_name: '', youtube_channel_handle: '',
        youtube_channel_thumbnail: '', youtube_subscriber_count: '0',
        youtube_video_count: '0', youtube_view_count: '0',
      });
      setYoutubeConnected(false); setYoutubeChannel('');
    } catch {}
    setDisconnecting(false);
  };

  const handleConnectYouTube = () => { window.location.href = `/api/auth/youtube?uid=${user?.uid}`; };
  const handleLogout = async () => { await signOut(auth); router.push('/'); };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const initial   = user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const initials  = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const userPhoto = user?.photoURL || null;
  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const planLabel = userPlan === 'agency' ? 'Agency' : userPlan === 'pro' ? 'Pro Plan' : 'Free Trial';
  const planColor = userPlan === 'agency' ? '#a78bfa' : userPlan === 'pro' ? '#34d399' : '#F59E0B';
  const showUpgradeCard = userPlan === 'free';

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

        .r-bg{
          background:#0a0a0f;
          position:relative;
          width:100%;
          overflow-x:hidden;
        }
        .r-bg::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background:radial-gradient(ellipse 55% 45% at -5% -5%,rgba(124,58,237,0.09) 0%,transparent 55%),
            radial-gradient(ellipse 45% 35% at 108% 108%,rgba(245,158,11,0.06) 0%,transparent 55%);}
        .r-bg::after{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.011) 1px,transparent 1px);
          background-size:44px 44px;}

        /* SIDEBAR */
        .r-sidebar{width:216px;min-width:216px;background:#0c0c14;border-right:1px solid rgba(124,58,237,0.11);
          display:flex;flex-direction:column;position:fixed;height:100vh;left:0;top:0;z-index:40;overflow:hidden;}
        .r-sidebar::after{content:'';position:absolute;right:0;top:0;bottom:0;width:1px;
          background:linear-gradient(180deg,transparent,rgba(124,58,237,0.2) 30%,rgba(124,58,237,0.3) 50%,rgba(124,58,237,0.2) 70%,transparent);pointer-events:none;}
        .r-logo{padding:18px 14px 14px;border-bottom:1px solid rgba(255,255,255,0.04);}
        .r-logo-mark{width:34px;height:34px;border-radius:10px;
          background:linear-gradient(135deg,#7C3AED 0%,#5B21B6 60%,#4C1D95 100%);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 14px rgba(124,58,237,0.38),inset 0 1px 0 rgba(255,255,255,0.14);}
        .r-nav{flex:1;padding:10px 7px;display:flex;flex-direction:column;gap:1px;overflow-y:auto;}
        .r-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:10px;
          font-size:12.5px;font-weight:500;text-decoration:none;color:rgba(255,255,255,0.36);
          transition:all 0.18s;border:1px solid transparent;position:relative;overflow:hidden;}
        .r-nav-item:hover{background:rgba(124,58,237,0.06);color:rgba(255,255,255,0.7);}
        .r-nav-item.active{background:linear-gradient(135deg,rgba(124,58,237,0.2) 0%,rgba(124,58,237,0.09) 100%);
          color:#a78bfa;border-color:rgba(124,58,237,0.2);font-weight:700;}
        .r-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);
          width:3px;height:18px;border-radius:0 3px 3px 0;
          background:linear-gradient(180deg,#a78bfa,#7C3AED);box-shadow:0 0 7px rgba(124,58,237,0.65);}
        .r-upgrade{margin:0 7px 7px;background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.14);border-radius:13px;padding:13px;}
        .r-sidebar-bottom{padding:7px 7px 18px;border-top:1px solid rgba(255,255,255,0.04);display:flex;flex-direction:column;gap:2px;}
        .r-btn-logout{display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:9px;font-size:12px;font-weight:500;
          color:rgba(255,255,255,0.28);background:none;border:none;cursor:pointer;width:100%;transition:all 0.18s;}
        .r-btn-logout:hover{background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);}
        .r-btn-upgrade{width:100%;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;font-weight:700;font-size:11.5px;
          padding:8px;border-radius:8px;border:none;cursor:pointer;transition:all 0.2s;text-align:center;text-decoration:none;display:block;}

        /* MAIN */
        .r-main{min-height:0;display:flex;flex-direction:column;position:relative;z-index:1;}

        /* DESKTOP TOPBAR */
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

        /* MOBILE TOPBAR */
        .r-mobile-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.96);
          backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,0.05);
          padding:0 12px;height:52px;display:flex;align-items:center;gap:5px;box-shadow:0 2px 16px rgba(0,0,0,0.3);}

        /* CONTENT */
        .r-content{padding:24px 24px 32px;flex:1;animation:fadeIn 0.3s ease;width:100%;box-sizing:border-box;}

        /* TABS */
        .tabs-row{
          display:flex;
          gap:6px;
          margin-bottom:24px;
          overflow-x:auto;
          -webkit-overflow-scrolling:touch;
          scrollbar-width:none;
          -ms-overflow-style:none;
          width:100%;
        }
        .tabs-row::-webkit-scrollbar{display:none;}
        .tab-btn{
          display:flex;
          align-items:center;
          gap:7px;
          padding:8px 16px;
          border-radius:10px;
          font-size:12.5px;
          font-weight:600;
          cursor:pointer;
          white-space:nowrap;
          flex-shrink:0;
          background:transparent;
          color:rgba(255,255,255,0.38);
          border:1px solid transparent;
          transition:background 240ms ease,border-color 240ms ease,color 240ms ease,box-shadow 240ms ease,transform 200ms ease;
          position:relative;
          text-decoration:none;
        }
        .tab-btn:hover{background:rgba(255,255,255,0.045);border-color:rgba(255,255,255,0.08);color:rgba(255,255,255,0.72);transform:translateY(-1px);}
        .tab-btn.active{
          background:linear-gradient(160deg,rgba(124,58,237,0.18) 0%,rgba(109,40,217,0.11) 100%);
          color:#c4b5fd;
          border-color:rgba(139,92,246,0.32);
          box-shadow:0 0 0 1px rgba(139,92,246,0.12),0 2px 8px rgba(124,58,237,0.15),inset 0 1px 0 rgba(255,255,255,0.05);
        }

        /* CARDS */
        .cards-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .card-full{grid-column:1 / -1;}
        .s-card{background:rgba(13,12,20,0.99);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:20px;}
        .card-title{color:#FAFAFA;font-weight:700;font-size:14px;margin-bottom:3px;}
        .card-sub{color:rgba(255,255,255,0.3);font-size:11.5px;margin-bottom:16px;}

        /* FORM */
        .field-label{display:block;color:rgba(255,255,255,0.38);font-size:10.5px;font-weight:700;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.06em;}
        .field-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:9px;
          padding:10px 13px;font-size:13px;color:#FAFAFA;transition:border-color 0.2s,background 0.2s;outline:none;}
        .field-input::placeholder{color:rgba(255,255,255,0.2);}
        .field-input:focus{border-color:rgba(124,58,237,0.4);background:rgba(255,255,255,0.045);}
        .field-input:disabled{color:rgba(255,255,255,0.28);cursor:not-allowed;}

        /* BUTTONS */
        .btn-primary{width:100%;padding:11px 18px;border-radius:9px;font-size:13px;font-weight:700;border:none;cursor:pointer;
          background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;display:flex;align-items:center;justify-content:center;gap:7px;
          transition:all 0.18s;box-shadow:0 2px 10px rgba(124,58,237,0.25);}
        .btn-primary:hover{box-shadow:0 4px 20px rgba(124,58,237,0.4);transform:translateY(-1px);}
        .btn-primary.saved{background:linear-gradient(135deg,#10B981,#059669);}
        .btn-ghost{width:100%;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:600;
          border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.6);
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all 0.18s;text-decoration:none;}
        .btn-ghost:hover{background:rgba(255,255,255,0.07);color:#FAFAFA;}
        .btn-danger{width:100%;padding:10px 18px;border-radius:9px;font-size:13px;font-weight:700;
          border:1px solid rgba(248,113,113,0.22);background:rgba(248,113,113,0.07);color:#f87171;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all 0.2s;}
        .btn-danger:hover{background:rgba(248,113,113,0.13);border-color:rgba(248,113,113,0.38);}
        .btn-danger:disabled{opacity:0.45;cursor:not-allowed;}

        /* INFO ROW */
        .info-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);}
        .info-row:last-of-type{border-bottom:none;}
        .info-label{color:rgba(255,255,255,0.38);font-size:12.5px;display:flex;align-items:center;gap:7px;}
        .info-value{color:#FAFAFA;font-size:12.5px;font-weight:600;}

        /* BADGES */
        .badge-green{background:rgba(52,211,153,0.1);color:#34D399;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:700;border:1px solid rgba(52,211,153,0.2);}
        .badge-gray{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:700;}
        .badge-yellow{background:rgba(245,158,11,0.1);color:#FBBF24;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:700;border:1px solid rgba(245,158,11,0.2);}
        .badge-red{background:rgba(248,113,113,0.1);color:#f87171;padding:3px 9px;border-radius:20px;font-size:10.5px;font-weight:700;border:1px solid rgba(248,113,113,0.2);}

        /* TOGGLE */
        .toggle{width:42px;height:23px;border-radius:100px;border:none;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;}
        .toggle-thumb{position:absolute;top:2px;width:19px;height:19px;border-radius:50%;background:white;transition:left 0.2s;}

        /* SESSION CARD */
        .session-card{display:flex;align-items:center;gap:11px;padding:13px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:11px;}

        /* WARN BOX */
        .warn-box{padding:13px 15px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.16);border-radius:11px;display:flex;align-items:flex-start;gap:9px;}

        /* BOTTOM NAV — untouched */
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

        /* ══════════════════════════════════════════════════════
           MOBILE — Chrome Desktop Site OFF  (≤ 767px)
           Tabs పెద్దగా + API Access కనిపించేలా
        ══════════════════════════════════════════════════════ */
        @media (pointer: coarse) and (max-width: 767px) {
          .r-sidebar{display:none!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-bottom-nav{display:flex!important;}

          .r-bg{display:block!important;overflow-x:hidden!important;}
          .r-main{
            margin-left:0!important;
            width:100%!important;
            display:block!important;
            padding-bottom:76px!important;
          }

          .r-content{
            padding:16px 10px 20px!important;
            min-height:calc(100vh - 52px - 76px)!important;
            box-sizing:border-box!important;
          }

          .cards-grid{grid-template-columns:1fr!important;}
          .card-full{grid-column:1!important;}
          .s-card{padding:16px!important;}

          .tabs-row{
            gap:6px!important;
            flex-wrap:nowrap!important;
            overflow-x:auto!important;
            margin-bottom:20px!important;
            padding-right:10px!important;
          }
          /* ↓ Bigger tabs so all 5 tabs (incl. API Access) are reachable */
          .tab-btn{
            padding:11px 18px!important;
            font-size:14.5px!important;
            gap:7px!important;
            min-width:max-content!important;
            border-radius:11px!important;
          }
          .tab-btn svg{width:15px!important;height:15px!important;}
        }

        /* ══════════════════════════════════════════════════════
           MOBILE — Chrome Desktop Site ON  (≥ 768px, coarse)
           Empty space తీసేసి, content అంతా పెద్దగా
        ══════════════════════════════════════════════════════ */
        @media (pointer: coarse) and (min-width: 768px) {
          .r-sidebar{display:none!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-bottom-nav{display:flex!important;}

          html{height:100%!important;}
          body{height:100%!important;overflow-y:auto!important;}

          .r-bg{
            display:block!important;
            width:100vw!important;
            max-width:100vw!important;
            overflow-x:hidden!important;
            height:auto!important;
            min-height:100%!important;
          }
          .r-main{
            margin-left:0!important;
            width:100vw!important;
            max-width:100vw!important;
            display:block!important;
            padding-bottom:76px!important;
            overflow-x:hidden!important;
          }

          /* Tight padding — no empty space */
          .r-content{
            padding:16px 14px 20px!important;
            box-sizing:border-box!important;
          }

          /* Single column, no wasted horizontal space */
          .cards-grid{grid-template-columns:1fr!important;}
          .card-full{grid-column:1!important;}
          .s-card{padding:20px!important;border-radius:14px!important;}

          /* Headings */
          .r-content h1{font-size:26px!important;}
          .r-content p{font-size:14px!important;}

          /* Tabs — big and scrollable */
          .tabs-row{
            gap:8px!important;
            flex-wrap:nowrap!important;
            overflow-x:auto!important;
            margin-bottom:20px!important;
            padding-right:8px!important;
          }
          .tab-btn{
            padding:14px 22px!important;
            font-size:16px!important;
            gap:9px!important;
            min-width:max-content!important;
            border-radius:12px!important;
          }
          .tab-btn svg{width:17px!important;height:17px!important;}

          /* Card text */
          .card-title{font-size:18px!important;}
          .card-sub{font-size:14px!important;margin-bottom:18px!important;}

          /* Inputs */
          .field-label{font-size:13px!important;margin-bottom:8px!important;}
          .field-input{padding:14px 16px!important;font-size:17px!important;border-radius:11px!important;}

          /* Buttons */
          .btn-primary{padding:16px 20px!important;font-size:17px!important;border-radius:11px!important;}
          .btn-ghost{padding:15px 20px!important;font-size:16px!important;border-radius:11px!important;}
          .btn-danger{padding:15px 20px!important;font-size:16px!important;border-radius:11px!important;}

          /* Badges & info rows */
          .badge-green,.badge-gray,.badge-yellow,.badge-red{font-size:13px!important;padding:5px 12px!important;}
          .info-label{font-size:15px!important;}
          .info-value{font-size:15px!important;}
        }

        /* ══════════════════════════════════════════════════════
           DESKTOP / LAPTOP  ≥ 1024px  AND  fine pointer (mouse)
        ══════════════════════════════════════════════════════ */
        @media (min-width: 1024px) and (pointer: fine) {
          .r-bg{display:flex!important;}
          .r-sidebar{display:flex!important;}
          .r-topbar{display:flex!important;}
          .r-mobile-topbar{display:none!important;}
          .r-bottom-nav{display:none!important;}
          .r-main{
            margin-left:216px!important;
            width:calc(100% - 216px)!important;
            padding-bottom:0!important;
            display:flex!important;
            flex-direction:column!important;
          }
          .cards-grid{grid-template-columns:1fr 1fr!important;}
          .card-full{grid-column:1 / -1!important;}
          .r-content{padding:24px 24px 32px!important;}
          .tabs-row{gap:6px!important;}
          .tab-btn{
            padding:8px 16px!important;
            font-size:12.5px!important;
          }
          .tab-btn svg{width:13px!important;height:13px!important;}
        }
      `}</style>

      <div className="r-bg">

        {/* ── SIDEBAR ── */}
        <aside className="r-sidebar">
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

          {showUpgradeCard && (
            <div className="r-upgrade">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <Zap size={10} color="#a78bfa" />
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 11 }}>Upgrade to Pro</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 9 }}>
                {['25,000 comments scanned / month', 'Unlimited automation rules', 'Priority support', '1,900 AI actions / month'].map(f => (
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

        {/* ── MAIN ── */}
        <div className="r-main">

          {/* DESKTOP TOPBAR */}
          <header className="r-topbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search size={11} color="rgba(255,255,255,0.16)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input className="r-search" placeholder="Search comments, users, keywords…" />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '1.5px 4px', fontSize: 9, color: 'rgba(255,255,255,0.16)', fontWeight: 600 }}>⌘K</span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button className="r-icon-btn" onClick={() => setNotifOpen(v => !v)}>
                <Bell size={12} color={notifOpen ? '#a78bfa' : 'rgba(255,255,255,0.4)'} strokeWidth={1.8} />
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60, width: 290, background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, boxShadow: '0 8px 36px rgba(0,0,0,0.55)', backdropFilter: 'blur(24px)', animation: 'fadeIn 0.16s ease', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 12 }}>Notifications</span>
                    </div>
                    {[
                      { icon: Shield, color: '#34d399', title: 'Moderation active',   sub: 'AI moderator protecting your channel', time: 'Now' },
                      { icon: Bell,   color: '#60a5fa', title: 'System operational',  sub: 'All services running normally',        time: '2m'  },
                      { icon: Zap,    color: '#a78bfa', title: 'Upgrade available',   sub: 'Unlock unlimited scans with Pro',      time: '1h'  },
                    ].map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: 9, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${n.color}12`, border: `1px solid ${n.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <n.icon size={12} color={n.color} strokeWidth={1.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 11.5, fontWeight: 600, marginBottom: 1 }}>{n.title}</div>
                          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10.5 }}>{n.sub}</div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 9.5, flexShrink: 0 }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button className="r-icon-btn"><Sun size={12} color="rgba(255,255,255,0.38)" strokeWidth={1.8} /></button>
            <button className="r-avatar-btn" onClick={() => router.push('/settings')}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 25, height: 25, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 9 }}>{initials}</div>
              }
            </button>
          </header>

          {/* MOBILE TOPBAR */}
          <header className="r-mobile-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={12} color="white" strokeWidth={2.2} />
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 13, letterSpacing: '-0.02em' }}>ModerateAI</span>
            </div>
            <div style={{ flex: 1 }} />
            <button className="r-icon-btn" style={{ width: 28, height: 28 }} onClick={() => setNotifOpen(v => !v)}>
              <Bell size={11} color="rgba(255,255,255,0.4)" strokeWidth={1.8} />
            </button>
            <button className="r-avatar-btn" style={{ padding: '2px 6px 2px 2px' }} onClick={() => router.push('/settings')}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 8 }}>{initials}</div>
              }
            </button>
          </header>

          {/* CONTENT */}
          <div className="r-content">
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>Settings</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12.5, marginTop: 3 }}>Manage your account preferences</p>
            </div>

            {/* TABS */}
            <div className="tabs-row">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`tab-btn${activeTab === id ? ' active' : ''}`}>
                  <Icon size={13} />
                  {label}
                </button>
              ))}
              <Link href={API_ACCESS_TAB.href} className="tab-btn" style={{ textDecoration: 'none' }}>
                <API_ACCESS_TAB.icon size={13} />
                {API_ACCESS_TAB.label}
              </Link>
            </div>

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <div className="cards-grid">
                <div className="s-card">
                  <p className="card-title">Personal information</p>
                  <p className="card-sub">Update your profile details</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    {userPhoto
                      ? <img src={userPhoto} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.25)' }} />
                      : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>{initial}</div>
                    }
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '7px 13px', color: 'rgba(255,255,255,0.6)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                      <Pencil size={11} /> Change
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div>
                      <label className="field-label">Full name</label>
                      <input className="field-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div>
                      <label className="field-label">Email</label>
                      <input className="field-input" type="email" value={user?.email || ''} disabled />
                    </div>
                    <button onClick={handleSaveProfile} className={`btn-primary${profileSaved ? ' saved' : ''}`}>
                      {profileSaved ? <><Check size={13} /> Saved</> : 'Save changes'}
                    </button>
                  </div>
                </div>

                <div className="s-card">
                  <p className="card-title">YouTube channel</p>
                  <p className="card-sub">Connect your YouTube channel</p>
                  {youtubeConnected && youtubeChannel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.16)', borderRadius: 9, marginBottom: 13 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.6.6 9.4.6 9.4.6s7.8 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="#f87171"/><path d="M9.8 15.6V8.4l6.2 3.6-6.2 3.6z" fill="white"/></svg>
                      <span style={{ color: '#FAFAFA', fontSize: 12.5, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{youtubeChannel}</span>
                      <span className="badge-green">Connected</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label"><Globe size={12} /> Status</span>
                    <span className={youtubeConnected ? 'badge-green' : 'badge-red'}>{youtubeConnected ? 'Connected' : 'Not connected'}</span>
                  </div>
                  <div className="info-row" style={{ marginBottom: 14 }}>
                    <span className="info-label">Plan</span>
                    <span className="badge-yellow">{planLabel}</span>
                  </div>
                  {youtubeConnected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <button onClick={handleConnectYouTube} className="btn-ghost">
                        <svg width="13" height="13" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.6.6 9.4.6 9.4.6s7.8 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="#f87171"/><path d="M9.8 15.6V8.4l6.2 3.6-6.2 3.6z" fill="white"/></svg>
                        Reconnect YouTube
                      </button>
                      <button onClick={handleDisconnectYouTube} className="btn-danger" disabled={disconnecting}>
                        {disconnecting ? 'Disconnecting…' : 'Disconnect YouTube'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleConnectYouTube} className="btn-primary">
                      <svg width="13" height="13" viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.8 3.5 12 3.5 12 3.5s-7.8 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.6.6 9.4.6 9.4.6s7.8 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8z" fill="white"/><path d="M9.8 15.6V8.4l6.2 3.6-6.2 3.6z" fill="white"/></svg>
                      Connect YouTube
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <div className="cards-grid">
                <div className="s-card">
                  <p className="card-title">Login method</p>
                  <p className="card-sub">How you sign in to ModerateAI</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: 'rgba(66,133,244,0.07)', border: '1px solid rgba(66,133,244,0.16)', borderRadius: 11, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, background: 'rgba(66,133,244,0.13)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 13.5 }}>Google OAuth</p>
                      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11.5 }}>Official Google sign-in</p>
                    </div>
                    <span className="badge-green">✓ Active</span>
                  </div>
                  <div className="info-row"><span className="info-label">📧 Email</span><span className="info-value" style={{ fontSize: 11.5 }}>{user?.email}</span></div>
                  <div className="info-row"><span className="info-label">📅 Member since</span><span className="info-value">{memberSince || 'Recently'}</span></div>
                  <div className="info-row"><span className="info-label">🔗 Auth provider</span><span className="info-value">Google OAuth 2.0</span></div>
                  <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ marginTop: 14 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Manage Google account →
                  </a>
                </div>
                <div className="s-card">
                  <p className="card-title">Password</p>
                  <p className="card-sub">Managed by your Google account</p>
                  <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11, marginBottom: 14 }}>
                    <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13.5, marginBottom: 5 }}>Managed by Google</p>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12.5, lineHeight: 1.6 }}>Your password is controlled by your Google account. ModerateAI never stores or manages passwords directly.</p>
                  </div>
                  <span className="badge-gray" style={{ marginBottom: 14, display: 'inline-block' }}>Read only</span>
                  <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Change password via Google →
                  </a>
                </div>
              </div>
            )}

            {/* ── 2FA TAB ── */}
            {activeTab === '2fa' && (
              <div className="cards-grid">
                <div className="s-card">
                  <p className="card-title">Two-step verification</p>
                  <p className="card-sub">Managed via your Google account</p>
                  <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11, marginBottom: 11 }}>
                    <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 13.5, marginBottom: 5 }}>Managed by Google</p>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12.5, lineHeight: 1.6 }}>ModerateAI uses Google OAuth and cannot access your Google security settings. Manage 2FA directly from Google.</p>
                  </div>
                  <div className="warn-box" style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 15 }}>⚠️</span>
                    <p style={{ color: '#FBBF24', fontSize: 12.5, lineHeight: 1.6 }}>We strongly recommend enabling 2-step verification on your Google account for maximum security.</p>
                  </div>
                  <a href="https://myaccount.google.com/signinoptions/two-step-verification" target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Manage 2-Step Verification →
                  </a>
                </div>
                <div className="s-card">
                  <p className="card-title">Active sessions</p>
                  <p className="card-sub">Devices currently signed in</p>
                  <div className="session-card">
                    <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Monitor size={15} color="rgba(255,255,255,0.55)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 12.5 }}>Current browser</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11.5 }}>Signed in · {memberSince || 'Recently'}</p>
                    </div>
                    <span className="badge-green">This device</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── ENCRYPTION TAB ── */}
            {activeTab === 'encryption' && (
              <div className="cards-grid">
                <div className="s-card card-full">
                  <p className="card-title">Data encryption</p>
                  <p className="card-sub">Your data security settings</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {[
                      { title: 'End-to-end encryption',    desc: 'All data encrypted in transit and at rest', locked: true  },
                      { title: 'YouTube token encryption', desc: 'Access tokens encrypted with AES-256',       locked: true  },
                      { title: 'Comment data encryption',  desc: 'Hidden comments stored with encryption',     locked: false },
                    ].map((item) => (
                      <div key={item.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(52,211,153,0.09)', border: '1px solid rgba(52,211,153,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Key size={14} color="#34D399" />
                          </div>
                          <div>
                            <p style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 12.5 }}>{item.title}</p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11.5 }}>{item.desc}</p>
                          </div>
                        </div>
                        {item.locked
                          ? <span className="badge-green">Always on</span>
                          : <button onClick={() => setEncryptionEnabled(!encryptionEnabled)} className="toggle" style={{ background: encryptionEnabled ? '#34D399' : 'rgba(255,255,255,0.1)' }}>
                              <div className="toggle-thumb" style={{ left: encryptionEnabled ? 21 : 2 }} />
                            </button>
                        }
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: '13px 15px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 11 }}>
                    <p style={{ color: '#34D399', fontWeight: 700, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={12} /> Your data is secure
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
                      ModerateAI uses AES-256 encryption. YouTube credentials are never stored in plain text.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE BOTTOM NAV — untouched ── */}
        <nav className="r-bottom-nav">
          <Link href="/dashboard" className="r-bnav-item">
            <span className="r-bnav-icon"><LayoutDashboard size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9, fontWeight: 500 }}>Overview</span>
          </Link>
          <Link href="/live-feed" className="r-bnav-item">
            <span className="r-bnav-icon"><Rss size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9, fontWeight: 500 }}>Live Feed</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <button className="r-bnav-fab" onClick={() => router.push('/automation')}>
              <Plus size={22} color="white" strokeWidth={2.5} />
            </button>
            <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>Automation</span>
          </div>
          <Link href="/alerts" className="r-bnav-item">
            <span className="r-bnav-icon"><Bell size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9, fontWeight: 500 }}>Alerts</span>
          </Link>
          <button className={`r-bnav-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)}>
            <span className="r-bnav-icon"><MoreHorizontal size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>More</span>
          </button>
        </nav>

        {/* ── MORE DRAWER ── */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'fixed', bottom: 68, left: 10, right: 10, zIndex: 60, background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '6px 6px 10px', boxShadow: '0 -8px 40px rgba(0,0,0,0.65)', backdropFilter: 'blur(28px)', animation: 'slideUp 0.18s ease' }}>
              <div style={{ width: 30, height: 3, background: 'rgba(255,255,255,0.09)', borderRadius: 3, margin: '6px auto 12px' }} />
              {[
                { icon: CreditCard, label: 'Billing',    href: '/billing',    color: '#F59E0B' },
                { icon: BarChart2,  label: 'Analytics',  href: '/analytics',  color: '#34d399' },
                { icon: Hash,       label: 'Moderation', href: '/moderation', color: '#60a5fa' },
                { icon: Settings,   label: 'Settings',   href: '/settings',   color: '#94a3b8' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: 'rgba(255,255,255,0.72)', fontWeight: 600, fontSize: 13 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${item.color}12`, border: `1px solid ${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={14} color={item.color} strokeWidth={1.8} />
                  </div>
                  {item.label}
                </Link>
              ))}
              <div style={{ margin: '6px 12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 600, fontSize: 13, width: '100%' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={14} color="#f87171" strokeWidth={1.8} />
                  </div>
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}