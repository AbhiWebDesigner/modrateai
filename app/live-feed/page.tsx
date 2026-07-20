'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, MessageSquare, Settings, LogOut, CreditCard,
  BarChart2, Bell, Zap, Search,
  LayoutDashboard, MoreHorizontal, Rss,
  Sun, Plus, Bot, AlertTriangle, CheckCircle,
  Clock, Filter, RefreshCw, EyeOff, Trash2,
  TrendingUp, Users, Activity, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  doc, onSnapshot, DocumentData, setDoc,
  collection, query, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

type AiDecision = 'approved' | 'hidden' | 'flagged' | 'replied';

interface FeedComment {
  id: string;
  author: string;
  authorInitials: string;
  text: string;
  videoTitle: string;
  timestamp: Date;
  aiDecision: AiDecision;
  category: string | null;
  confidence: number;
  isNew?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const FEED_FILTERS = [
  { label: 'All',      key: 'all',      color: '#FAFAFA'  },
  { label: 'Approved', key: 'approved', color: '#34d399'  },
  { label: 'Hidden',   key: 'hidden',   color: '#f87171'  },
  { label: 'Flagged',  key: 'flagged',  color: '#F59E0B'  },
  { label: 'Replied',  key: 'replied',  color: '#60a5fa'  },
];

const AI_DECISION_CONFIG: Record<AiDecision, { label: string; color: string; bg: string; border: string }> = {
  approved: { label: 'Approved',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.22)'  },
  hidden:   { label: 'Hidden',    color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.22)' },
  flagged:  { label: 'Flagged',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.22)'  },
  replied:  { label: 'AI Replied',color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.22)'  },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      animation: 'pulse 1.6s ease-in-out infinite',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 80, height: 9, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ width: 50, height: 9, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div style={{ width: '85%', height: 9, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ width: '60%', height: 9, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div style={{ width: 56, height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyFeed({ searchQuery, activeFilter }: { searchQuery: string; activeFilter: string }) {
  const isFiltered = activeFilter !== 'all' || searchQuery.length > 0;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '52px 24px', gap: 10,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Rss size={20} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          {isFiltered ? 'No matching comments' : 'No comments yet'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11.5, lineHeight: 1.5 }}>
          {isFiltered
            ? 'Try adjusting your filters or search query.'
            : 'Comments will appear here in real time as they arrive.'}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

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
      <div style={{
        color, fontSize: 18, fontWeight: 900,
        letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>{value}</div>
    </div>
  );
}

// ─── Feed Comment Row ─────────────────────────────────────────────────────────

function CommentRow({
  comment, onHide, onApprove, onDelete,
}: {
  comment: FeedComment;
  onHide: (id: string) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const cfg = AI_DECISION_CONFIG[comment.aiDecision];

  const timeAgo = (() => {
    const diff = Math.floor((Date.now() - comment.timestamp.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  })();

  return (
    <div style={{
      padding: '13px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      transition: 'background 0.18s',
      background: comment.isNew ? 'rgba(124,58,237,0.04)' : 'transparent',
      animation: comment.isNew ? 'slideInRow 0.3s ease' : 'none',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
      onMouseLeave={e => (e.currentTarget.style.background = comment.isNew ? 'rgba(124,58,237,0.04)' : 'transparent')}
    >
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>

        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,rgba(124,58,237,0.6),rgba(245,158,11,0.4))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 800,
        }}>
          {comment.authorInitials}
        </div>

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{ color: '#FAFAFA', fontSize: 12, fontWeight: 700 }}>{comment.author}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{timeAgo}</span>
            {comment.category && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>·</span>
                <span style={{
                  background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.16)',
                  borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700, color: '#f87171',
                }}>{comment.category}</span>
              </>
            )}
            {comment.isNew && (
              <span style={{
                background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 800, color: '#a78bfa',
              }}>NEW</span>
            )}
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5,
            marginBottom: 5, wordBreak: 'break-word',
          }}>{comment.text}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MessageSquare size={9} color="rgba(255,255,255,0.2)" />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {comment.videoTitle}
            </span>
          </div>
        </div>

        {/* Right: badge + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
          <span style={{
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: 6, padding: '2px 7px', fontSize: 9.5, fontWeight: 700, color: cfg.color,
            whiteSpace: 'nowrap',
          }}>{cfg.label}</span>

          {/* Confidence bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 40, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${comment.confidence}%`, background: cfg.color, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9 }}>{comment.confidence}%</span>
          </div>

          {/* Quick actions */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActionsOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 6, padding: '3px 7px', cursor: 'pointer', transition: 'all 0.15s',
                color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 600,
              }}
            >
              Actions <ChevronDown size={9} />
            </button>
            {actionsOpen && (
              <>
                <div onClick={() => setActionsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                <div style={{
                  position: 'absolute', right: 0, top: '110%', zIndex: 101,
                  background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10, padding: '5px', minWidth: 130,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)',
                  animation: 'slideUp 0.14s ease',
                }}>
                  {comment.aiDecision !== 'approved' && (
                    <button
                      onClick={() => { onApprove(comment.id); setActionsOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#34d399',
                        fontSize: 11.5, fontWeight: 600, padding: '7px 9px', borderRadius: 7, textAlign: 'left',
                      }}
                    >
                      <CheckCircle size={12} color="#34d399" /> Approve
                    </button>
                  )}
                  {comment.aiDecision !== 'hidden' && (
                    <button
                      onClick={() => { onHide(comment.id); setActionsOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer', color: '#F59E0B',
                        fontSize: 11.5, fontWeight: 600, padding: '7px 9px', borderRadius: 7, textAlign: 'left',
                      }}
                    >
                      <EyeOff size={12} color="#F59E0B" /> Hide
                    </button>
                  )}
                  <button
                    onClick={() => { onDelete(comment.id); setActionsOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#f87171',
                      fontSize: 11.5, fontWeight: 600, padding: '7px 9px', borderRadius: 7, textAlign: 'left',
                    }}
                  >
                    <Trash2 size={12} color="#f87171" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firestoreCommentToFeed(id: string, data: DocumentData): FeedComment {
  const name = (data.author as string) || 'Anonymous';
  const words = name.trim().split(/\s+/);
  const initials = words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const ts = data.timestamp instanceof Timestamp
    ? data.timestamp.toDate()
    : data.timestamp instanceof Date
      ? data.timestamp
      : new Date();
  return {
    id,
    author: name,
    authorInitials: initials,
    text: (data.text as string) || '',
    videoTitle: (data.videoTitle as string) || 'Unknown video',
    timestamp: ts,
    aiDecision: (data.aiDecision as AiDecision) || 'approved',
    category: (data.category as string) || null,
    confidence: typeof data.confidence === 'number' ? data.confidence : 100,
    isNew: false,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveFeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [localActions, setLocalActions] = useState<Record<string, AiDecision>>({});
  const [isPaused, setIsPaused] = useState(false);

  const initialSnapCount = useRef(0);
  const unsubRefs = useRef<Array<() => void>>([]);
  const newIdTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingRef = useRef<FeedComment[]>([]);

  // ── Auth + core listeners ────────────────────────────────────────────────

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);
      initialSnapCount.current = 0;
      unsubRefs.current.forEach(u => u());
      unsubRefs.current = [];

      const onRequiredSnapReady = () => {
        initialSnapCount.current += 1;
        if (initialSnapCount.current === 2) setLoading(false);
      };

      const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        if (initialSnapCount.current < 2) onRequiredSnapReady();
      });
      unsubRefs.current.push(unsubUser);

      const unsubAnalytics = onSnapshot(doc(db, 'analytics', firebaseUser.uid), (snap) => {
        if (snap.exists()) setAnalyticsData(snap.data());
        if (initialSnapCount.current < 2) onRequiredSnapReady();
      });
      unsubRefs.current.push(unsubAnalytics);

      // Live feed comments listener
      const commentsQuery = query(
        collection(db, 'users', firebaseUser.uid, 'comments'),
        orderBy('timestamp', 'desc'),
        limit(100),
      );

      const unsubComments = onSnapshot(commentsQuery, (snap) => {
        const incoming: FeedComment[] = snap.docs.map(d =>
          firestoreCommentToFeed(d.id, d.data()),
        );

        if (isPaused) {
          // Buffer new comments while paused
          pendingRef.current = incoming;
        } else {
          setComments(prev => {
            const prevIds = new Set(prev.map(c => c.id));
            return incoming.map(c => ({
              ...c,
              isNew: !prevIds.has(c.id),
            }));
          });

          // Clear isNew flag after 3s
          incoming.forEach(c => {
            if (newIdTimerRef.current[c.id]) return;
            newIdTimerRef.current[c.id] = setTimeout(() => {
              setComments(prev => prev.map(p => p.id === c.id ? { ...p, isNew: false } : p));
              delete newIdTimerRef.current[c.id];
            }, 3000);
          });
        }
        setFeedLoading(false);
      });
      unsubRefs.current.push(unsubComments);
    });

    return () => {
      unsubAuth();
      unsubRefs.current.forEach(u => u());
      Object.values(newIdTimerRef.current).forEach(t => clearTimeout(t));
    };
  }, [router, isPaused]);

  // ── Resume feed ──────────────────────────────────────────────────────────

  const resumeFeed = useCallback(() => {
    setIsPaused(false);
    if (pendingRef.current.length > 0) {
      setComments(pendingRef.current);
      pendingRef.current = [];
    }
  }, []);

  // ── Moderation actions ───────────────────────────────────────────────────

  const moderateComment = useCallback(async (id: string, decision: AiDecision) => {
    if (!user) return;
    setLocalActions(prev => ({ ...prev, [id]: decision }));
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'comments', id),
        { aiDecision: decision },
        { merge: true },
      );
    } catch (err) {
      console.error('Failed to moderate comment:', err);
      setLocalActions(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [user]);

  const handleHide    = useCallback((id: string) => moderateComment(id, 'hidden'),   [moderateComment]);
  const handleApprove = useCallback((id: string) => moderateComment(id, 'approved'), [moderateComment]);
  const handleDelete  = useCallback(async (id: string) => {
    if (!user) return;
    setComments(prev => prev.filter(c => c.id !== id));
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'comments', id),
        { deleted: true },
        { merge: true },
      );
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }, [user]);

  // ── Logout ───────────────────────────────────────────────────────────────

  const handleLogout = async () => { await signOut(auth); router.push('/'); };

  // ── Loading screen ───────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Derived values ───────────────────────────────────────────────────────

  const plan       = (userData?.plan as string) || 'free';
  const planColor  = plan === 'agency' ? '#a78bfa' : plan === 'pro' ? '#34d399' : '#F59E0B';
  const planLabel  = plan === 'pro' ? 'Pro Plan' : plan === 'agency' ? 'Agency' : 'Free Trial';

  const firstName  = user?.displayName?.split(' ')[0] || 'there';
  const initials   = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const userPhoto  = user?.photoURL || (userData?.photo as string) || null;

  const totalScanned  = (analyticsData?.totalScanned  as number) ?? 0;
  const totalHidden   = (analyticsData?.totalHidden   as number) ?? 0;
  const totalReplies  = (analyticsData?.totalReplies  as number) ?? 0;
  const commentsUsed  = (userData?.comments_used      as number) || 0;
  const commentsLimit = userData?.comments_limit ?? (plan === 'agency' ? 150000 : plan === 'pro' ? 25000 : 2000);

  // Apply local optimistic overrides then filter
  const displayComments = comments
    .map(c => localActions[c.id] ? { ...c, aiDecision: localActions[c.id] } : c)
    .filter(c => {
      if (activeFilter !== 'all' && c.aiDecision !== activeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.text.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          c.videoTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const counts = {
    all:      comments.length,
    approved: comments.filter(c => (localActions[c.id] ?? c.aiDecision) === 'approved').length,
    hidden:   comments.filter(c => (localActions[c.id] ?? c.aiDecision) === 'hidden').length,
    flagged:  comments.filter(c => (localActions[c.id] ?? c.aiDecision) === 'flagged').length,
    replied:  comments.filter(c => (localActions[c.id] ?? c.aiDecision) === 'replied').length,
  };

  const currentPath = '/live-feed';

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
        @keyframes slideInRow{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
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

        .lf-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .lf-filter-bar{display:flex;gap:6px;padding:12px 16px;overflow-x:auto;-ms-overflow-style:none;scrollbar-width:none;}
        .lf-filter-bar::-webkit-scrollbar{display:none;}
        .lf-feed-scroll{max-height:540px;overflow-y:auto;}

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
          .lf-stats-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
        @media(max-width:767px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;padding-bottom:80px;}
          .r-bottom-nav{display:flex!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-content{padding:10px 10px 16px;}
          .lf-stats-grid{grid-template-columns:repeat(2,1fr)!important;}
          .lf-feed-scroll{max-height:420px;}
        }
      `}</style>

      <div className="r-bg" style={{ display: 'flex' }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
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

        {/* ── MAIN ────────────────────────────────────────────────────────── */}
        <div className="r-main">

          {/* DESKTOP TOPBAR */}
          <header className="r-topbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
              <Search size={11} color="rgba(255,255,255,0.16)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="r-search"
                placeholder="Search comments, authors, videos…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.13)', fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              AI Online
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.14)', fontSize: 10.5, fontWeight: 600, color: '#a78bfa', whiteSpace: 'nowrap' }}>
              <Shield size={9} strokeWidth={2} /> Protection Active
            </div>
            <div style={{ flex: 1 }} />
            <button className="r-icon-btn">
              <Bell size={12} color="rgba(255,255,255,0.4)" strokeWidth={1.8} />
            </button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={12} color="white" strokeWidth={2.2} />
              </div>
              <span style={{ color: '#FAFAFA', fontWeight: 800, fontSize: 13 }}>ModerateAI</span>
            </div>
            <div style={{ flex: 1 }} />
            <button className="r-avatar-btn" style={{ padding: '2px 6px 2px 2px' }} onClick={() => router.push('/settings')}>
              {userPhoto
                ? <img src={userPhoto} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} alt="av" />
                : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 8 }}>{initials}</div>
              }
            </button>
          </header>

          {/* ── CONTENT ───────────────────────────────────────────────────── */}
          <div className="r-content">

            {/* PAGE HEADER */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rss size={15} color="#a78bfa" strokeWidth={2} />
                  </div>
                  <h1 style={{ color: '#FAFAFA', fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em' }}>Live Feed</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isPaused ? (
                    <button onClick={resumeFeed} className="r-btn-primary" style={{ fontSize: 11 }}>
                      <RefreshCw size={11} /> Resume Feed
                    </button>
                  ) : (
                    <button onClick={() => setIsPaused(true)} className="r-btn-ghost" style={{ fontSize: 11 }}>
                      <Clock size={11} /> Pause
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 42 }}>
                Real-time view of all incoming comments and AI decisions.
              </p>
            </div>

            {/* PLAN USAGE BAR */}
            <div className="r-card" style={{ marginBottom: 12 }}>
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Monthly Usage</div>
                  <div className="r-card-sub">Comments scanned against plan limit</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${planColor}10`, border: `1px solid ${planColor}22`, borderRadius: 7, padding: '3px 8px' }}>
                  <Shield size={9} color={planColor} />
                  <span style={{ color: planColor, fontSize: 9, fontWeight: 800 }}>{planLabel.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#FAFAFA', fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{commentsUsed.toLocaleString()}</span>
                  <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12 }}>/ {commentsLimit.toLocaleString()}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%', borderRadius: 5,
                    background: `linear-gradient(90deg,${planColor},#7C3AED)`,
                    width: `${Math.min(100, commentsLimit > 0 ? (commentsUsed / commentsLimit) * 100 : 0)}%`,
                    transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'rgba(255,255,255,0.26)' }}>
                  <span>{commentsLimit > 0 ? ((commentsUsed / commentsLimit) * 100).toFixed(1) : '0.0'}% used</span>
                  {plan === 'free'
                    ? <Link href="/billing" style={{ color: planColor, fontWeight: 700, textDecoration: 'none' }}>Upgrade for more →</Link>
                    : <span style={{ color: '#34d399', fontWeight: 600 }}>{(commentsLimit - commentsUsed).toLocaleString()} remaining</span>
                  }
                </div>
              </div>
            </div>

            {/* LIVE STATS */}
            <div style={{ marginBottom: 12 }}>
              <div className="lf-stats-grid">
                <StatBox label="Total Scanned"    value={totalScanned.toLocaleString()} color="#a78bfa" icon={Activity}    iconColor="#a78bfa" />
                <StatBox label="Hidden Today"     value={totalHidden.toLocaleString()}  color="#f87171" icon={EyeOff}      iconColor="#f87171" />
                <StatBox label="AI Replies Sent"  value={totalReplies.toLocaleString()} color="#60a5fa" icon={Bot}         iconColor="#60a5fa" />
                <StatBox label="Comments in Feed" value={counts.all}                    color="#34d399" icon={TrendingUp}  iconColor="#34d399" />
              </div>
            </div>

            {/* LIVE FEED CARD */}
            <div className="r-card">
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Comment Stream</div>
                  <div className="r-card-sub">
                    {isPaused
                      ? `Feed paused · ${pendingRef.current.length} buffered`
                      : 'Updating in real time'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isPaused ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 6, padding: '2px 7px' }}>
                      <Clock size={9} color="#F59E0B" />
                      <span style={{ color: '#F59E0B', fontSize: 8.5, fontWeight: 800 }}>PAUSED</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.16)', borderRadius: 6, padding: '2px 7px' }}>
                      <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                      <span style={{ color: '#22c55e', fontSize: 8.5, fontWeight: 800 }}>LIVE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter bar */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 0 }}>
                <div className="lf-filter-bar" style={{ flex: 1 }}>
                  {FEED_FILTERS.map(f => {
                    const isActive = activeFilter === f.key;
                    const count = counts[f.key as keyof typeof counts] ?? 0;
                    return (
                      <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                          background: isActive ? `${f.color}14` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isActive ? f.color + '30' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                          color: isActive ? f.color : 'rgba(255,255,255,0.35)',
                          fontSize: 11.5, fontWeight: 600, transition: 'all 0.18s',
                        }}
                      >
                        {f.label}
                        <span style={{
                          background: isActive ? `${f.color}20` : 'rgba(255,255,255,0.05)',
                          borderRadius: 4, padding: '0px 5px', fontSize: 9, fontWeight: 800,
                          color: isActive ? f.color : 'rgba(255,255,255,0.25)',
                        }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Inline search for mobile */}
                <div style={{ padding: '0 12px', flexShrink: 0, position: 'relative' }}>
                  <Filter size={12} color="rgba(255,255,255,0.22)" />
                </div>
              </div>

              {/* Feed rows */}
              <div className="lf-feed-scroll">
                {feedLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : displayComments.length === 0 ? (
                  <EmptyFeed searchQuery={searchQuery} activeFilter={activeFilter} />
                ) : (
                  displayComments.map(comment => (
                    <CommentRow
                      key={comment.id}
                      comment={comment}
                      onHide={handleHide}
                      onApprove={handleApprove}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="r-card" style={{ marginTop: 12 }}>
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Recent Activity</div>
                  <div className="r-card-sub">Latest AI moderation actions</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 7, padding: '3px 8px' }}>
                  <Users size={9} color="#a78bfa" />
                  <span style={{ color: '#a78bfa', fontSize: 9, fontWeight: 800 }}>AUTO</span>
                </div>
              </div>
              <div>
                {feedLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : comments.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={16} color="rgba(255,255,255,0.18)" strokeWidth={1.5} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11.5, textAlign: 'center', lineHeight: 1.5 }}>No recent activity yet.</span>
                  </div>
                ) : (
                  comments.slice(0, 6).map(comment => {
                    const decision = localActions[comment.id] ?? comment.aiDecision;
                    const cfg = AI_DECISION_CONFIG[decision];
                    const icon = decision === 'approved'
                      ? CheckCircle
                      : decision === 'hidden'
                        ? EyeOff
                        : decision === 'replied'
                          ? Bot
                          : AlertTriangle;
                    const timeAgo = (() => {
                      const diff = Math.floor((Date.now() - comment.timestamp.getTime()) / 1000);
                      if (diff < 60) return `${diff}s ago`;
                      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                      return `${Math.floor(diff / 3600)}h ago`;
                    })();
                    return (
                      <div key={comment.id} style={{
                        display: 'flex', alignItems: 'center', gap: 11,
                        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s',
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: cfg.bg, border: `1px solid ${cfg.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {(() => { const I = icon; return <I size={12} color={cfg.color} strokeWidth={2} />; })()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cfg.label} · <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{comment.author}</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                            {comment.text}
                          </div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0 }}>{timeAgo}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
        <nav className="r-bottom-nav">
          <Link href="/dashboard" className="r-bnav-item">
            <span className="r-bnav-icon"><LayoutDashboard size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Overview</span>
          </Link>
          <Link href="/live-feed" className={`r-bnav-item${currentPath === '/live-feed' ? ' active' : ''}`}>
            <span className="r-bnav-icon"><Rss size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Live Feed</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <button className="r-bnav-fab" onClick={() => router.push('/automation')}>
              <Plus size={22} color="white" strokeWidth={2.5} />
            </button>
            <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>Automation</span>
          </div>
          <Link href="/alerts" className="r-bnav-item">
            <span className="r-bnav-icon"><Bell size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>Alerts</span>
          </Link>
          <button className={`r-bnav-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)}>
            <span className="r-bnav-icon"><MoreHorizontal size={19} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 9 }}>More</span>
          </button>
        </nav>

        {/* ── MORE DRAWER ─────────────────────────────────────────────────── */}
        {moreOpen && (
          <>
            <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }} />
            <div style={{ position: 'fixed', bottom: 68, left: 10, right: 10, zIndex: 60, background: 'rgba(13,12,20,0.99)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '6px 6px 10px', boxShadow: '0 -8px 40px rgba(0,0,0,0.65)', backdropFilter: 'blur(28px)', animation: 'slideUp 0.18s ease' }}>
              <div style={{ width: 30, height: 3, background: 'rgba(255,255,255,0.09)', borderRadius: 3, margin: '6px auto 12px' }} />
              {[
                { icon: CreditCard, label: 'Billing',    href: '/billing',    color: '#F59E0B' },
                { icon: BarChart2,  label: 'Analytics',  href: '/analytics',  color: '#34d399' },
                { icon: Zap,        label: 'Automation', href: '/automation', color: '#a78bfa' },
                { icon: Shield,     label: 'Moderation', href: '/moderation', color: '#60a5fa' },
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