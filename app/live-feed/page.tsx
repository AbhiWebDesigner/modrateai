'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Shield, MessageSquare, Settings, LogOut, CreditCard,
  BarChart2, Bell, Zap, Search,
  LayoutDashboard, MoreHorizontal, Rss,
  Sun, Plus, Bot, AlertTriangle, CheckCircle,
  Clock, Filter, RefreshCw, EyeOff, Trash2,
  Activity, ChevronDown, Radio, Timer, Eye,
  Wifi, WifiOff,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  doc, onSnapshot, DocumentData, setDoc,
  collection, query, orderBy, limit, Timestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getYouTubeConnected, connectYouTube } from '@/lib/useYouTubeConnection';

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
  approved: { label: 'Approved',   color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.22)'  },
  hidden:   { label: 'Hidden',     color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.22)' },
  flagged:  { label: 'Flagged',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.22)'  },
  replied:  { label: 'AI Replied', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.22)'  },
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

// ─── Waiting State ────────────────────────────────────────────────────────────

function WaitingState({ lastScan }: { lastScan: string }) {
  return (
    <div style={{ padding: '0 0 8px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#a78bfa',
          boxShadow: '0 0 8px rgba(167,139,250,0.6)',
          animation: 'pulse 2s infinite',
          flexShrink: 0,
        }} />
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}>
          Waiting for new comments · Last scan: {lastScan}
        </span>
      </div>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <div style={{
        padding: '18px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <Radio size={11} color="rgba(255,255,255,0.15)" />
        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11 }}>
          AI is monitoring your YouTube channel. Waiting for new comments. Monitoring continues automatically.
        </span>
      </div>
    </div>
  );
}

// ─── Offline State ────────────────────────────────────────────────────────────

function OfflineCommentState({ onConnect }: { onConnect: () => void }) {
  return (
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <WifiOff size={18} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          No live comments available
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, lineHeight: 1.6, maxWidth: 280 }}>
          Connect your YouTube channel to start real-time moderation.
          Monitoring will begin automatically after connection.
        </div>
      </div>
      <button onClick={onConnect} style={{
        marginTop: 4,
        background: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
        color: '#fff', fontWeight: 700, fontSize: 12,
        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        boxShadow: '0 2px 10px rgba(124,58,237,0.25)',
      }}>
        Connect YouTube Channel
      </button>
    </div>
  );
}

// ─── Empty Filter State ───────────────────────────────────────────────────────

function EmptyFilter({ searchQuery, activeFilter }: { searchQuery: string; activeFilter: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px', gap: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Filter size={17} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>
          No matching comments
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, lineHeight: 1.5 }}>
          Try adjusting your filters or search query.
        </div>
      </div>
    </div>
  );
}

// ─── Live Metric Box ──────────────────────────────────────────────────────────

function LiveMetricBox({ label, value, sub, color = '#a78bfa', icon: Icon, pulse = false }: {
  label: string; value: string | number; sub?: string; color?: string;
  icon: React.ElementType; pulse?: boolean;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.055)',
      borderRadius: 11, padding: '12px 13px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {pulse && (
            <div style={{
              width: 5, height: 5, borderRadius: '50%', background: color,
              boxShadow: `0 0 6px ${color}80`,
              animation: 'pulse 1.8s infinite', flexShrink: 0,
            }} />
          )}
          <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: 7,
          background: `${color}10`, border: `1px solid ${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={11} color={color} strokeWidth={2} />
        </div>
      </div>
      <div>
        <div style={{
          color: '#FAFAFA', fontSize: 22, fontWeight: 900,
          letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>{value}</div>
        {sub && (
          <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9.5, marginTop: 4 }}>{sub}</div>
        )}
      </div>
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

  const timeAgo = useMemo(() => {
    const diff = Math.floor((Date.now() - comment.timestamp.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, [comment.timestamp]);

  return (
    <div
      style={{
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

function timeAgoFn(date: Date | null): string {
  if (!date) return '--';
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ src, initials, size }: { src: string | null; initials: string; size: number }) {
  if (src) {
    return (
      <Image
        src={src}
        width={size}
        height={size}
        alt="User avatar"
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,#7C3AED,#F59E0B)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 800, fontSize: Math.floor(size * 0.36),
    }}>
      {initials}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveFeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [localActions, setLocalActions] = useState<Record<string, AiDecision>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<Date | null>(null);

  const [liveQueueCount, setLiveQueueCount] = useState<number | null>(null);
  const [processingCount, setProcessingCount] = useState<number | null>(null);
  const [avgResponseMs, setAvgResponseMs] = useState<number | null>(null);

  const isPausedRef = useRef(false);
  const pendingRef = useRef<FeedComment[]>([]);
  const newIdTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const unsubRefs = useRef<Array<() => void>>([]);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Auth + Firestore ──────────────────────────────────────────────────────

  useEffect(() => {
    let initialSnapCount = 0;

    const onRequiredSnapReady = () => {
      initialSnapCount += 1;
      if (initialSnapCount === 2) setLoading(false);
    };

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) { router.push('/login'); return; }
      setUser(firebaseUser);

      unsubRefs.current.forEach(u => u());
      unsubRefs.current = [];
      initialSnapCount = 0;

      const unsubUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        if (initialSnapCount < 2) onRequiredSnapReady();
      });
      unsubRefs.current.push(unsubUser);

      const unsubAnalytics = onSnapshot(doc(db, 'analytics', firebaseUser.uid), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveQueueCount(typeof d.liveQueue === 'number' ? d.liveQueue : null);
          setProcessingCount(typeof d.processingNow === 'number' ? d.processingNow : null);
          setAvgResponseMs(typeof d.avgResponseMs === 'number' ? d.avgResponseMs : null);
          const rawTs = d.last_scan_at ?? d.lastScanAt ?? d.lastScan ?? null;
          if (rawTs) {
            const date = rawTs?.toDate ? rawTs.toDate() : new Date(rawTs);
            setLastScanTimestamp(date);
          }
        }
        if (initialSnapCount < 2) onRequiredSnapReady();
      });
      unsubRefs.current.push(unsubAnalytics);

      const commentsQuery = query(
        collection(db, 'users', firebaseUser.uid, 'comments'),
        orderBy('timestamp', 'desc'),
        limit(100),
      );

      const unsubComments = onSnapshot(commentsQuery, (snap) => {
        const incoming: FeedComment[] = snap.docs.map(d =>
          firestoreCommentToFeed(d.id, d.data()),
        );

        if (isPausedRef.current) {
          pendingRef.current = incoming;
        } else {
          setComments(prev => {
            const prevIds = new Set(prev.map(c => c.id));
            return incoming.map(c => ({ ...c, isNew: !prevIds.has(c.id) }));
          });
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
  }, [router]);

  // ── Resume ───────────────────────────────────────────────────────────────

  const resumeFeed = useCallback(() => {
    setIsPaused(false);
    if (pendingRef.current.length > 0) {
      const flushed = pendingRef.current;
      pendingRef.current = [];
      setComments(prev => {
        const prevIds = new Set(prev.map(c => c.id));
        return flushed.map(c => ({ ...c, isNew: !prevIds.has(c.id) }));
      });
    }
  }, []);

  // ── Moderation actions ───────────────────────────────────────────────────

  const moderateComment = useCallback(async (id: string, decision: AiDecision) => {
    if (!user) return;
    setLocalActions(prev => ({ ...prev, [id]: decision }));
    try {
      await setDoc(doc(db, 'users', user.uid, 'comments', id), { aiDecision: decision }, { merge: true });
      setLocalActions(prev => { const next = { ...prev }; delete next[id]; return next; });
    } catch (err) {
      console.error('Failed to moderate comment:', err);
      setLocalActions(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  }, [user]);

  const handleHide    = useCallback((id: string) => moderateComment(id, 'hidden'),   [moderateComment]);
  const handleApprove = useCallback((id: string) => moderateComment(id, 'approved'), [moderateComment]);

  const handleDelete = useCallback(async (id: string) => {
    if (!user) return;
    setComments(prev => prev.filter(c => c.id !== id));
    try {
      await setDoc(doc(db, 'users', user.uid, 'comments', id), { deleted: true }, { merge: true });
      setLocalActions(prev => { const next = { ...prev }; delete next[id]; return next; });
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    router.push('/');
  }, [router]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.75s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Loading…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Derived ───────────────────────────────────────────────────────────────

  const plan      = (userData?.plan as string) || 'free';
  const planLabel = plan === 'pro' ? 'Pro Plan' : plan === 'agency' ? 'Agency' : 'Free Trial';
  void planLabel;

  const firstName = user?.displayName?.split(' ')[0] || 'there';
  const initials  = (user?.displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const userPhoto = user?.photoURL ?? (userData?.photo as string) ?? null;

  const lastScanTime = timeAgoFn(lastScanTimestamp);

  const isYouTubeConnected = getYouTubeConnected(userData);
  const handleYouTubeConnect = () => connectYouTube(user?.uid);

  const channelsCount: number = isYouTubeConnected
    ? ((userData?.channels_count as number) ?? 1)
    : 0;

  const resolvedComments = comments.map(c =>
    localActions[c.id] ? { ...c, aiDecision: localActions[c.id] } : c,
  );

  const counts = {
    all:      resolvedComments.length,
    approved: resolvedComments.filter(c => c.aiDecision === 'approved').length,
    hidden:   resolvedComments.filter(c => c.aiDecision === 'hidden').length,
    flagged:  resolvedComments.filter(c => c.aiDecision === 'flagged').length,
    replied:  resolvedComments.filter(c => c.aiDecision === 'replied').length,
  };

  const displayComments = resolvedComments.filter(c => {
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

  const liveQueue: number | null = liveQueueCount !== null
    ? liveQueueCount
    : isYouTubeConnected
      ? counts.flagged
      : null;

  const currentPath = '/live-feed';

  const displayProcessing  = processingCount !== null ? processingCount : (isYouTubeConnected ? 0 : null);
  const displayAvgResponse = avgResponseMs   !== null ? `${Math.round(avgResponseMs)}ms` : '--';
  const displayMonitoring  = isYouTubeConnected
    ? `${channelsCount} ${channelsCount === 1 ? 'Channel' : 'Channels'}`
    : '0 Channels';

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

        .r-bg{min-height:100vh;background:#0d0520;position:relative;width:100%;overflow-x:hidden;}
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

        .r-main{margin-left:216px;min-height:100vh;display:flex;flex-direction:column;position:relative;z-index:1;width:calc(100% - 216px);overflow:visible;}

        .r-topbar{position:sticky;top:0;z-index:30;background:rgba(10,10,15,0.92);backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(255,255,255,0.05);padding:0 22px 0 16px;height:56px;
          display:flex;align-items:center;gap:8px;box-shadow:0 4px 24px rgba(0,0,0,0.25);overflow:visible;}
        .r-search{flex:1;max-width:380px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          border-radius:8px;padding:0 10px 0 32px;height:33px;color:#FAFAFA;font-size:12px;outline:none;transition:all 0.2s;}
        .r-search:focus{border-color:rgba(124,58,237,0.3);background:rgba(255,255,255,0.05);}
        .r-search::placeholder{color:rgba(255,255,255,0.16);}
        .r-icon-btn{width:33px;height:33px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);
          display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.18s;position:relative;flex-shrink:0;}
        .r-icon-btn:hover{background:rgba(255,255,255,0.07);}

        /* ── FIX: avatar button — never shrinks, never clips ── */
        .r-avatar-btn{
          display:flex;
          align-items:center;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:9px;
          padding:3px 9px 3px 3px;
          cursor:pointer;
          transition:border-color 0.18s;
          gap:6px;
          flex-shrink:0;
          overflow:visible;
          min-width:0;
        }
        .r-avatar-btn:hover{border-color:rgba(255,255,255,0.18);}

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

        .lf-status-bar{display:flex;align-items:center;gap:0;padding:0;overflow-x:auto;-ms-overflow-style:none;scrollbar-width:none;border-radius:12px;background:rgba(13,12,20,0.99);border:1px solid rgba(255,255,255,0.07);}
        .lf-status-bar::-webkit-scrollbar{display:none;}
        .lf-status-item{display:flex;align-items:center;gap:7px;padding:11px 16px;border-right:1px solid rgba(255,255,255,0.05);flex-shrink:0;}
        .lf-status-item:last-child{border-right:none;}

        .lf-metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
        .lf-filter-bar{display:flex;gap:6px;padding:12px 16px;overflow-x:auto;-ms-overflow-style:none;scrollbar-width:none;}
        .lf-filter-bar::-webkit-scrollbar{display:none;}
        .lf-feed-scroll{max-height:520px;overflow-y:auto;}

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
          .lf-metrics-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
        @media(max-width:767px){
          .r-sidebar{display:none!important;}
          .r-main{margin-left:0!important;width:100%!important;padding-bottom:80px;}
          .r-bottom-nav{display:flex!important;}
          .r-topbar{display:none!important;}
          .r-mobile-topbar{display:flex!important;}
          .r-content{padding:10px 10px 16px;}
          .lf-metrics-grid{grid-template-columns:repeat(2,1fr)!important;}
          .lf-feed-scroll{max-height:400px;}
          .lf-status-bar{border-radius:10px;}
          .lf-status-item{padding:9px 12px;}
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
              <UserAvatar src={userPhoto} initials={initials} size={26} />
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
            {/* Search — capped width, takes available space but doesn't push right items */}
            <div style={{ position: 'relative', flex: '1 1 0', maxWidth: 360, minWidth: 0 }}>
              <Search size={11} color="rgba(255,255,255,0.16)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                className="r-search"
                style={{ width: '100%' }}
                placeholder="Search comments, authors, videos…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status badges */}
            {isYouTubeConnected ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.13)', fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                  AI Online
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.14)', fontSize: 10.5, fontWeight: 600, color: '#a78bfa', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Shield size={9} strokeWidth={2} /> Protection Active
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 18, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.14)', fontSize: 10.5, fontWeight: 600, color: '#f87171', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <WifiOff size={9} strokeWidth={2} /> Offline
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: '1 1 0' }} />

            {/* Icon buttons */}
            <button className="r-icon-btn" style={{ flexShrink: 0 }}>
              <Bell size={12} color="rgba(255,255,255,0.4)" strokeWidth={1.8} />
            </button>
            <button className="r-icon-btn" style={{ flexShrink: 0 }}>
              <Sun size={12} color="rgba(255,255,255,0.38)" strokeWidth={1.8} />
            </button>

            {/* ── Avatar button: flex-shrink:0 inline + overflow:visible via CSS class ── */}
            <button
              className="r-avatar-btn"
              style={{ flexShrink: 0 }}
              onClick={() => router.push('/settings')}
            >
              <UserAvatar src={userPhoto} initials={initials} size={25} />
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
              <UserAvatar src={userPhoto} initials={initials} size={22} />
            </button>
          </header>

          {/* ── CONTENT ───────────────────────────────────────────────────── */}
          <div className="r-content">

            {/* PAGE HEADER */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio size={15} color="#a78bfa" strokeWidth={2} />
                  </div>
                  <div>
                    <h1 style={{ color: '#FAFAFA', fontSize: 19, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>Live Feed</h1>
                    <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginTop: 3 }}>Real-time moderation center</p>
                  </div>
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
            </div>

            {/* ── LIVE STATUS BAR ─────────────────────────────────────────── */}
            <div className="lf-status-bar" style={{ marginBottom: 12 }}>
              <div className="lf-status-item">
                {isYouTubeConnected ? (
                  <>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 7px rgba(34,197,94,0.7)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#22c55e', fontSize: 10.5, fontWeight: 700 }}>AI Online</div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>Engine running</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#f87171', fontSize: 10.5, fontWeight: 700 }}>Offline</div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>Not started</div>
                    </div>
                  </>
                )}
              </div>

              <div className="lf-status-item">
                <Shield size={12} color={isYouTubeConnected ? '#a78bfa' : 'rgba(255,255,255,0.2)'} strokeWidth={2} />
                <div>
                  <div style={{ color: isYouTubeConnected ? '#a78bfa' : 'rgba(255,255,255,0.3)', fontSize: 10.5, fontWeight: 700 }}>
                    {isYouTubeConnected ? 'Protected' : 'Inactive'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
                    {isYouTubeConnected ? 'Filters active' : 'No channel'}
                  </div>
                </div>
              </div>

              <div className="lf-status-item">
                <Eye size={12} color={isYouTubeConnected ? '#60a5fa' : 'rgba(255,255,255,0.2)'} strokeWidth={2} />
                <div>
                  <div style={{ color: isYouTubeConnected ? '#60a5fa' : 'rgba(255,255,255,0.3)', fontSize: 10.5, fontWeight: 700 }}>
                    {isYouTubeConnected
                      ? `Watching ${channelsCount} ${channelsCount === 1 ? 'Channel' : 'Channels'}`
                      : '0 Connected'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
                    {isYouTubeConnected ? 'Monitoring now' : 'Not monitoring'}
                  </div>
                </div>
              </div>

              <div className="lf-status-item">
                <RefreshCw size={11} color="rgba(255,255,255,0.35)" strokeWidth={2} />
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontWeight: 700 }}>
                    {isYouTubeConnected ? lastScanTime : 'N/A'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>Last scan</div>
                </div>
              </div>

              <div className="lf-status-item" style={{ marginLeft: 'auto', borderRight: 'none' }}>
                {!isYouTubeConnected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 7, padding: '4px 10px' }}>
                    <WifiOff size={10} color="#f87171" />
                    <span style={{ color: '#f87171', fontSize: 9.5, fontWeight: 800 }}>OFFLINE</span>
                  </div>
                ) : isPaused ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, padding: '4px 10px' }}>
                    <WifiOff size={10} color="#F59E0B" />
                    <span style={{ color: '#F59E0B', fontSize: 9.5, fontWeight: 800 }}>PAUSED</span>
                    {pendingRef.current.length > 0 && (
                      <span style={{ color: '#F59E0B', fontSize: 9, fontWeight: 600 }}>· {pendingRef.current.length} buffered</span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.16)', borderRadius: 7, padding: '4px 10px' }}>
                    <Wifi size={10} color="#22c55e" />
                    <span style={{ color: '#22c55e', fontSize: 9.5, fontWeight: 800 }}>LIVE</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── LIVE OPERATIONAL METRICS ─────────────────────────────────── */}
            <div className="lf-metrics-grid" style={{ marginBottom: 12 }}>
              <LiveMetricBox
                label="Live Queue"
                value={liveQueue !== null ? liveQueue : '--'}
                sub="awaiting review"
                color="#F59E0B"
                icon={Bell}
                pulse={liveQueue !== null && liveQueue > 0}
              />
              <LiveMetricBox
                label="Processing Now"
                value={displayProcessing !== null ? displayProcessing : '--'}
                sub="comments being analyzed"
                color="#a78bfa"
                icon={Zap}
                pulse={displayProcessing !== null && displayProcessing > 0}
              />
              <LiveMetricBox
                label="Avg Response"
                value={isYouTubeConnected ? displayAvgResponse : '--'}
                sub="AI decision latency"
                color="#34d399"
                icon={Timer}
              />
              <LiveMetricBox
                label="Monitoring"
                value={displayMonitoring}
                sub={isYouTubeConnected ? `${counts.all} comments loaded` : 'Connect YouTube to start'}
                color="#60a5fa"
                icon={Eye}
              />
            </div>

            {/* ── COMMENT STREAM ───────────────────────────────────────────── */}
            <div className="r-card" style={{ marginBottom: 12 }}>
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Comment Stream</div>
                  <div className="r-card-sub">
                    {!isYouTubeConnected
                      ? 'Connect your YouTube channel to begin'
                      : feedLoading
                        ? 'Connecting to stream…'
                        : isPaused
                          ? `Feed paused · ${pendingRef.current.length} buffered`
                          : 'Updating in real time'}
                  </div>
                </div>
              </div>

              {/* Filter bar */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center' }}>
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
              </div>

              {/* Feed rows */}
              <div className="lf-feed-scroll">
                {!isYouTubeConnected ? (
                  <OfflineCommentState onConnect={handleYouTubeConnect} />
                ) : feedLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : comments.length === 0 ? (
                  <WaitingState lastScan={lastScanTime} />
                ) : displayComments.length === 0 ? (
                  <EmptyFilter searchQuery={searchQuery} activeFilter={activeFilter} />
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

            {/* ── RECENT ACTIVITY ──────────────────────────────────────────── */}
            <div className="r-card">
              <div className="r-card-top">
                <div>
                  <div className="r-card-title">Recent Activity</div>
                  <div className="r-card-sub">Latest AI moderation actions</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 7, padding: '3px 8px' }}>
                  <Bot size={9} color="#a78bfa" />
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
                ) : !isYouTubeConnected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <WifiOff size={16} color="rgba(255,255,255,0.18)" strokeWidth={1.5} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11.5, textAlign: 'center', lineHeight: 1.6, maxWidth: 240 }}>
                      Connect your YouTube channel to see moderation activity here.
                    </span>
                    <button onClick={handleYouTubeConnect} style={{
                      background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.24)',
                      borderRadius: 8, padding: '6px 14px', color: '#a78bfa',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                    }}>
                      Connect YouTube
                    </button>
                  </div>
                ) : resolvedComments.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={16} color="rgba(255,255,255,0.18)" strokeWidth={1.5} />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11.5, textAlign: 'center', lineHeight: 1.5 }}>No recent activity yet.</span>
                  </div>
                ) : (
                  resolvedComments.slice(0, 6).map(comment => {
                    const cfg = AI_DECISION_CONFIG[comment.aiDecision];
                    const IconComp = comment.aiDecision === 'approved'
                      ? CheckCircle
                      : comment.aiDecision === 'hidden'
                        ? EyeOff
                        : comment.aiDecision === 'replied'
                          ? Bot
                          : AlertTriangle;
                    const diff = Math.floor((Date.now() - comment.timestamp.getTime()) / 1000);
                    const ago = diff < 60 ? `${diff}s ago` : diff < 3600 ? `${Math.floor(diff / 60)}m ago` : `${Math.floor(diff / 3600)}h ago`;
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
                          <IconComp size={12} color={cfg.color} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cfg.label} · <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{comment.author}</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                            {comment.text}
                          </div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0 }}>{ago}</span>
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
            <span className="r-bnav-icon"><LayoutDashboard size={24} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 11 }}>Overview</span>
          </Link>
          <Link href="/live-feed" className={`r-bnav-item${currentPath === '/live-feed' ? ' active' : ''}`}>
            <span className="r-bnav-icon"><Rss size={24} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 11 }}>Live Feed</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <button className="r-bnav-fab" onClick={() => router.push('/automation')}>
              <Plus size={24} color="white" strokeWidth={2.5} />
            </button>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>Automation</span>
          </div>
          <Link href="/alerts" className="r-bnav-item">
            <span className="r-bnav-icon"><Bell size={24} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 11 }}>Alerts</span>
          </Link>
          <button className={`r-bnav-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(v => !v)}>
            <span className="r-bnav-icon"><MoreHorizontal size={24} strokeWidth={1.7} /></span>
            <span style={{ fontSize: 11 }}>More</span>
          </button>
        </nav>

        {/* ── MORE DRAWER ─────────────────────────────────────────────────── */}
        {moreOpen && (
          <><div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 55, background: 'transparent' }} />
           <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
            background: 'rgba(8,5,20,0.3)',
            borderTop: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '20px 20px 0 0',
            padding: '0 0 env(safe-area-inset-bottom,16px)',
            boxShadow: '0 -12px 60px rgba(124,58,237,0.2), 0 -8px 40px rgba(0,0,0,0.7)',
            animation: 'slideUp 0.22s ease',
          }}>
              {/* Handle */}
              <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 4, margin: '12px auto 8px' }} />

              {/* User Profile */}
              <div style={{ padding: '0 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <UserAvatar src={userPhoto} initials={initials} size={38} />
                  <div>
                    <div style={{ color: '#FAFAFA', fontWeight: 700, fontSize: 14 }}>{firstName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              {[
                { icon: CreditCard, label: 'Billing',    href: '/billing',    color: '#F59E0B' },
                { icon: BarChart2,  label: 'Analytics',  href: '/analytics',  color: '#34d399' },
                { icon: Shield,     label: 'Moderation', href: '/moderation', color: '#60a5fa' },
                { icon: Settings,   label: 'Settings',   href: '/settings',   color: '#a78bfa' },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', textDecoration: 'none', color: '#ffffff', fontWeight: 500, fontSize: 15, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <item.icon size={20} color={item.color} strokeWidth={1.8} />
                  {item.label}
                </Link>
              ))}

              {/* Logout */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
                <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontWeight: 500, fontSize: 15, width: '100%' }}>
                  <LogOut size={20} color="#f87171" strokeWidth={1.8} />
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