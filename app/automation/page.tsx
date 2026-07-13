"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection, doc, addDoc, deleteDoc, updateDoc,
  onSnapshot, increment, query, orderBy, serverTimestamp,
  setDoc,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

type Video = {
  id: string;
  title: string;
  date: string;
  views: string;
  comments: number;
  thumb: string;
};

type Rule = {
  id: string;
  name: string;
  video: Video;
  keywords: string[];
  replyMode: "random" | "ai";
  replies: string[];
  aiInstruction: string;
  publicReply: boolean;
  replyDelay: number;
  active: boolean;
  createdAt?: any;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/dashboard",  label: "Home",       icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>) },
  { href: "/analytics",  label: "Analytics",  icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>) },
  { href: "/automation", label: "Automation", icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>) },
  { href: "/alerts",     label: "Alerts",     icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>) },
  { href: "/settings",   label: "Settings",   icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>) },
];

const STEPS = ["Select Video", "Keywords", "Auto Reply", "Advanced"];

const SAMPLE_VIDEOS: Video[] = [
  { id: "1", title: "My Latest YouTube Video",  date: "Jul 1, 2026",  views: "12.4K", comments: 234, thumb: "🎬" },
  { id: "2", title: "How I Built ModrateAI",    date: "Jun 25, 2026", views: "8.1K",  comments: 156, thumb: "🎥" },
  { id: "3", title: "Telugu Tech Tips #42",      date: "Jun 18, 2026", views: "22.7K", comments: 489, thumb: "📹" },
];

// ─── Helper — ensures automations/{uid} parent doc exists ─────────────────────
// Uses setDoc with merge:true so existing fields are never overwritten.
async function ensureParentDoc(uid: string) {
  const parentRef = doc(db, "automations", uid);
  await setDoc(
    parentRef,
    {
      // Only set defaults if fields are missing (merge:true handles this)
      totalRules:       0,
      activeRules:      0,
      totalRepliesSent: 0,
      moderationMode:   "auto",
      notifications:    true,
      schedule:         { enabled: false },
    },
    { merge: true }
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <>
      <style>{`
        @keyframes sidebarPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes activeGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,159,26,.55), 0 0 18px rgba(255,159,26,.28), 0 0 40px rgba(255,159,26,.14), 0 0 70px rgba(255,159,26,.07); }
          50%       { box-shadow: 0 0 0 1px rgba(255,159,26,.75), 0 0 24px rgba(255,159,26,.42), 0 0 52px rgba(255,159,26,.22), 0 0 88px rgba(255,159,26,.10); }
        }

        .snav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 13px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.38);
          border: 1px solid transparent;
          position: relative;
          transition: background 0.22s, color 0.22s, border-color 0.22s, transform 0.22s, box-shadow 0.22s;
          letter-spacing: -0.01em;
          cursor: pointer;
        }
        .snav-item:hover {
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75);
          transform: translateX(2px);
          border-color: rgba(255,255,255,0.05);
        }

        /* ── PREMIUM ACTIVE ITEM ── */
        .snav-item.active {
          background: linear-gradient(90deg, rgba(255,159,26,.18) 0%, rgba(255,159,26,.08) 100%);
          color: #F9A825;
          font-weight: 650;
          border-color: rgba(255,159,26,.32);
          border-radius: 14px;
          animation: activeGlow 3s ease-in-out infinite;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transform: none;
        }

        /* Large radial glow behind active item */
        .snav-item.active::before {
          content: '';
          position: absolute;
          inset: -16px -20px;
          background: radial-gradient(circle, rgba(255,159,26,.35) 0%, rgba(255,159,26,.15) 40%, transparent 75%);
          filter: blur(32px);
          border-radius: 50%;
          pointer-events: none;
          z-index: -1;
        }

        /* Gradient left edge indicator */
        .snav-item.active::after {
          content: '';
          position: absolute;
          left: -10px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 22px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #F59E0B, #EC4899, #7C3AED);
          box-shadow: 0 0 10px rgba(245,158,11,.7), 0 0 24px rgba(236,72,153,.35);
        }

        /* LIVE badge */
        .snav-live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .05em;
          color: #F9A825;
          background: rgba(255,159,26,.12);
          border: 1px solid rgba(255,159,26,.35);
          box-shadow: 0 0 8px rgba(255,159,26,.25), inset 0 0 6px rgba(255,159,26,.08);
          backdrop-filter: blur(8px);
        }
        .snav-live-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #F59E0B;
          box-shadow: 0 0 6px rgba(245,158,11,.9);
          animation: sidebarPulse 1.6s ease-in-out infinite;
        }
      `}</style>

      <div style={{
        background: "rgba(10,10,14,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.055)",
        width: 228,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "22px 10px 20px",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 20,
        boxShadow: "4px 0 40px rgba(0,0,0,0.45), inset -1px 0 0 rgba(255,255,255,0.03)",
      }}>
        {/* Ambient left edge glow */}
        <div style={{
          position: "absolute", left: 0, top: "18%", bottom: "18%",
          width: 2, borderRadius: 2,
          background: "linear-gradient(180deg, transparent, rgba(245,158,11,.55), rgba(220,80,130,.65), rgba(124,58,237,.45), transparent)",
          boxShadow: "0 0 12px rgba(245,158,11,.4), 0 0 28px rgba(245,158,11,.12)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 28, paddingLeft: 4 }}>
          <div style={{
            background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 55%, #7C3AED 100%)",
            borderRadius: 10, width: 34, height: 34,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(245,158,11,.28)", flexShrink: 0,
          }}>
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ color: "#FAFAFA", fontWeight: 800, fontSize: 15, letterSpacing: "-0.025em" }}>ModrateAI</span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`snav-item${active ? " active" : ""}`}>
                {link.icon}
                {link.label}
                {active && (
                  <span className="snav-live">
                    <span className="snav-live-dot" />
                    live
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade card */}
        <div style={{
          background: "rgba(124,58,237,.1)",
          border: "1px solid rgba(124,58,237,.22)",
          borderRadius: 14, padding: "14px 14px", marginTop: 12,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA", marginBottom: 4 }}>Upgrade to Pro 🚀</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.42)", marginBottom: 10 }}>5,000 comments + live chat</div>
          <button style={{
            background: "linear-gradient(135deg,#F59E0B,#FBBF24)",
            borderRadius: 9, width: "100%", fontSize: 11.5,
            padding: "8px 0", fontWeight: 700, color: "#080808",
            border: "none", cursor: "pointer",
            boxShadow: "0 2px 12px rgba(245,158,11,.22)",
          }}>
            Upgrade — ₹349/mo
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(9,9,11,.96)",
      borderTop: "1px solid rgba(255,255,255,.06)",
      display: "flex",
      backdropFilter: "blur(24px)",
    }}>
      {NAV_LINKS.map(link => {
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", padding: "10px 0 12px",
            textDecoration: "none", gap: 3,
            color: active ? "#F59E0B" : "rgba(255,255,255,.32)",
            fontSize: 10, fontWeight: active ? 600 : 400,
          }}>
            {link.icon}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const pathname = usePathname();
  const router   = useRouter();

  // Auth
  const [user,        setUser]        = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Rules
  const [rules,        setRules]        = useState<Rule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState<string | null>(null);

  // Builder
  const [showBuilder,       setShowBuilder]       = useState(false);
  const [currentStep,       setCurrentStep]       = useState(0);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [selectedVideo,     setSelectedVideo]     = useState<Video | null>(null);
  const [ruleName,          setRuleName]          = useState("");
  const [keywords,          setKeywords]          = useState<string[]>([]);
  const [keywordInput,      setKeywordInput]      = useState("");
  const [aiDetection,       setAiDetection]       = useState(false);
  const [replyMode,         setReplyMode]         = useState<"random" | "ai">("random");
  const [replies,           setReplies]           = useState(["", "", ""]);
  const [aiInstruction,     setAiInstruction]     = useState("");
  const [publicReply,       setPublicReply]       = useState(true);
  const [replyDelay,        setReplyDelay]        = useState(20);
  const [ruleActive,        setRuleActive]        = useState(true);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  // ── Load rules (real-time) ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const rulesRef = collection(db, "automations", user.uid, "rules");
    const q        = query(rulesRef, orderBy("createdAt", "desc"));
    const unsub    = onSnapshot(q, (snap) => {
      setRules(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Rule, "id">) })));
      setRulesLoading(false);
    });
    return () => unsub();
  }, [user]);

  // ── Reset builder ───────────────────────────────────────────────────────────
  const resetBuilder = () => {
    setCurrentStep(0);
    setRuleName("");
    setSelectedVideo(null);
    setKeywords([]);
    setKeywordInput("");
    setAiDetection(false);
    setReplyMode("random");
    setReplies(["", "", ""]);
    setAiInstruction("");
    setPublicReply(true);
    setReplyDelay(20);
    setRuleActive(true);
    setShowBuilder(false);
  };

  // ── Add keyword ─────────────────────────────────────────────────────────────
  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed]);
      setKeywordInput("");
    }
  };

  // ── Save rule ──────────────────────────────────────────────────────────────
  // Ensures parent doc exists (setDoc merge) before incrementing counters.
  const goLive = async () => {
    if (!ruleName || !selectedVideo || !user) return;
    setSaving(true);
    try {
      // 1. Guarantee parent doc exists with all required fields
      await ensureParentDoc(user.uid);

      // 2. Add the rule into the sub-collection
      const rulesRef = collection(db, "automations", user.uid, "rules");
      await addDoc(rulesRef, {
        name:          ruleName,
        video:         selectedVideo,
        keywords,
        replyMode,
        replies,
        aiInstruction,
        publicReply,
        replyDelay,
        active:        ruleActive,
        createdAt:     serverTimestamp(),
      });

      // 3. Increment counters on the now-guaranteed parent doc
      const parentRef = doc(db, "automations", user.uid);
      await setDoc(
        parentRef,
        {
          totalRules:  increment(1),
          activeRules: increment(ruleActive ? 1 : 0),
        },
        { merge: true }
      );

      resetBuilder();
    } catch (err) {
      console.error("Failed to save rule:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete rule ─────────────────────────────────────────────────────────────
  const deleteRule = async (ruleId: string, wasActive: boolean) => {
    if (!user) return;
    setDeleting(ruleId);
    try {
      await deleteDoc(doc(db, "automations", user.uid, "rules", ruleId));

      // ensureParentDoc guards against the doc not existing (edge case)
      await ensureParentDoc(user.uid);
      const parentRef = doc(db, "automations", user.uid);
      await setDoc(
        parentRef,
        {
          totalRules:  increment(-1),
          activeRules: increment(wasActive ? -1 : 0),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to delete rule:", err);
    } finally {
      setDeleting(null);
    }
  };

  // ── Toggle rule active ──────────────────────────────────────────────────────
  const toggleRule = async (rule: Rule) => {
    if (!user) return;
    const newActive = !rule.active;
    try {
      // Update the rule itself
      await updateDoc(
        doc(db, "automations", user.uid, "rules", rule.id),
        { active: newActive }
      );

      // Safely update parent counter
      await ensureParentDoc(user.uid);
      const parentRef = doc(db, "automations", user.uid);
      await setDoc(
        parentRef,
        { activeRules: increment(newActive ? 1 : -1) },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#07030F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid #F59E0B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after {
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -0.015em;
          box-sizing: border-box; margin: 0; padding: 0;
        }
        html, body { background: #07030F; color: white; }
        .desktop-sidebar { display: none; }
        .bottom-nav      { display: flex; }
        .main-content    { margin-left: 0; padding: 20px 16px 90px; }
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; }
          .bottom-nav      { display: none !important; }
          .main-content    { margin-left: 228px; padding: 32px 40px; }
        }
        input:focus, textarea:focus { border-color: rgba(245,158,11,0.5) !important; outline: none; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .rule-card { animation: fadeIn 0.2s ease; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: `radial-gradient(ellipse 55% 50% at 5% 15%, rgba(245,158,11,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 55% at 5% 95%, rgba(109,40,217,0.18) 0%, transparent 62%), #07030F` }} />

      <div className="desktop-sidebar" style={{ flexDirection: "column" }}>
        <Sidebar pathname={pathname} />
      </div>

      <div className="bottom-nav">
        <BottomNav pathname={pathname} />
      </div>

      <main className="main-content" style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>

        {!showBuilder ? (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FAFAFA", marginBottom: 4 }}>Automation Rules</h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Rules run in order — higher rules have higher priority</p>
              </div>
              <button onClick={() => setShowBuilder(true)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(245,158,11,0.25)" }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Create Rule
              </button>
            </div>

            {/* Rules list */}
            {rulesLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <div style={{ width: 32, height: 32, border: "2px solid #F59E0B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : rules.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "64px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No automation rules yet</h2>
                <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>Create your first rule to auto-reply to YouTube comments</p>
                <button onClick={() => setShowBuilder(true)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(245,158,11,0.25)" }}>
                  ⚡ Create Your First Rule
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rules.map(rule => (
                  <div key={rule.id} className="rule-card" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ background: "rgba(245,158,11,0.12)", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{rule.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, marginTop: 2 }}>
                          {rule.video?.title} • {rule.keywords?.length ?? 0} keywords
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => toggleRule(rule)} style={{ background: rule.active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)", color: rule.active ? "#22c55e" : "rgba(255,255,255,0.35)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer" }}>
                        {rule.active ? "● Active" : "○ Inactive"}
                      </button>
                      <button onClick={() => deleteRule(rule.id, rule.active)} disabled={deleting === rule.id} style={{ color: "rgba(255,100,100,0.55)", background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: deleting === rule.id ? 0.4 : 1 }}>
                        {deleting === rule.id ? "⏳" : "🗑️"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ── Builder ── */
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Builder header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={resetBuilder} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", fontSize: 14 }}>←</button>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Automation / New Rule</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{ruleName || "Untitled Rule"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", borderRadius: 20, padding: "4px 12px", fontSize: 11 }}>● Live Preview</span>
                  <button onClick={goLive} disabled={saving || !ruleName || !selectedVideo} style={{ background: saving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    {saving
                      ? (<><div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving…</>)
                      : "🚀 Go Live"}
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
                {STEPS.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setCurrentStep(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer", border: "none", background: i === currentStep ? "rgba(245,158,11,0.12)" : "transparent", color: i === currentStep ? "#F59E0B" : i < currentStep ? "#22c55e" : "rgba(255,255,255,0.30)", fontWeight: i === currentStep ? 600 : 400, outline: i === currentStep ? "1px solid rgba(245,158,11,0.30)" : "none" }}>
                      <span style={{ background: i === currentStep ? "#F59E0B" : i < currentStep ? "#22c55e" : "rgba(255,255,255,0.10)", color: i <= currentStep ? (i < currentStep ? "white" : "#07030F") : "rgba(255,255,255,0.4)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {i < currentStep ? "✓" : i + 1}
                      </span>
                      {step}
                    </button>
                    {i < STEPS.length - 1 && <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12 }}>—</span>}
                  </div>
                ))}
              </div>

              {/* Step card */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px" }}>

                {/* Step 1 — Select Video */}
                {currentStep === 0 && (
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Select YouTube Video</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>Choose which video to monitor for comments</p>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", display: "block", marginBottom: 8 }}>Rule Name</label>
                      <input value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="e.g. Spam Filter Rule"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "10px 14px", fontSize: 14 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                      <button onClick={() => setShowVideoSelector(true)} style={{ background: selectedVideo ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedVideo ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: 16, textAlign: "left", cursor: "pointer", color: "white" }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>🎬</div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Specific Video</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginTop: 4 }}>{selectedVideo ? selectedVideo.title : "Choose a video"}</div>
                      </button>
                      {[{ label: "Future Videos", icon: "🔮" }, { label: "Latest Video", icon: "🆕" }, { label: "All Videos", icon: "📺" }].map(opt => (
                        <div key={opt.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, opacity: 0.45, position: "relative" }}>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                          <span style={{ background: "rgba(234,179,8,0.18)", color: "#eab308", borderRadius: 6, fontSize: 9, padding: "2px 6px", fontWeight: 700, position: "absolute", top: 12, right: 12 }}>PRO</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setCurrentStep(1)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, color: "white", border: "none", cursor: "pointer", width: "100%" }}>
                      Next — Set Keywords →
                    </button>
                  </div>
                )}

                {/* Step 2 — Keywords */}
                {currentStep === 1 && (
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Keyword Triggers</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>Comments matching these keywords will trigger auto-reply</p>
                    <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>AI Intent Detection</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginTop: 2 }}>Semantic matching — understands meaning, not just words</div>
                      </div>
                      <button onClick={() => setAiDetection(!aiDetection)} style={{ background: aiDetection ? "#F59E0B" : "rgba(255,255,255,0.10)", borderRadius: 20, width: 44, height: 24, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
                        <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: aiDetection ? 23 : 3, transition: "all 0.2s" }} />
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword()} placeholder="Type keyword and press Enter"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", flex: 1, padding: "10px 14px", fontSize: 14 }} />
                      <button onClick={addKeyword} style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#F59E0B", cursor: "pointer" }}>+ Add</button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, minHeight: 32 }}>
                      {keywords.map(kw => (
                        <span key={kw} style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, color: "#FBBF24", display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", fontSize: 13 }}>
                          {kw}
                          <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.40)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                      {keywords.length === 0 && <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No keywords added yet</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(0)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCurrentStep(2)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>Next — Auto Reply →</button>
                    </div>
                  </div>
                )}

                {/* Step 3 — Auto Reply */}
                {currentStep === 2 && (
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Auto Reply Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>Configure how the bot replies to matched comments</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      {(["random", "ai"] as const).map(mode => (
                        <button key={mode} onClick={() => setReplyMode(mode)} style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: replyMode === mode ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", color: replyMode === mode ? "#F59E0B" : "rgba(255,255,255,0.45)", outline: replyMode === mode ? "1px solid rgba(245,158,11,0.30)" : "none" }}>
                          {mode === "random" ? "🎲 Random Templates" : "🤖 AI Generated"}
                        </button>
                      ))}
                    </div>
                    {replyMode === "random" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                        {replies.map((r, i) => (
                          <div key={i}>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", display: "block", marginBottom: 6 }}>Reply {i + 1}</label>
                            <input value={r} onChange={e => { const arr = [...replies]; arr[i] = e.target.value; setReplies(arr); }} placeholder={`Template reply ${i + 1}...`}
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "10px 14px", fontSize: 14 }} />
                          </div>
                        ))}
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Use {"{{username}}"} to mention the commenter</div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", display: "block", marginBottom: 6 }}>AI Instruction</label>
                        <textarea value={aiInstruction} onChange={e => setAiInstruction(e.target.value)} placeholder="e.g. Reply politely in Telugu, thank them for watching and invite them to subscribe..." rows={4}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "10px 14px", fontSize: 14, resize: "none" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCurrentStep(3)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>Next — Advanced →</button>
                    </div>
                  </div>
                )}

                {/* Step 4 — Advanced */}
                {currentStep === 3 && (
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Advanced Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>Fine-tune your automation rule</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                      {[
                        { label: "Public Reply", sub: "Reply visible to everyone on the video", val: publicReply, set: setPublicReply, green: false },
                        { label: "Rule Status",  sub: ruleActive ? "● Active" : "○ Inactive",   val: ruleActive,  set: setRuleActive,  green: true  },
                      ].map(item => (
                        <div key={item.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                            <div style={{ color: item.green && item.val ? "#22c55e" : "rgba(255,255,255,0.40)", fontSize: 12, marginTop: 2 }}>{item.sub}</div>
                          </div>
                          <button onClick={() => item.set(!item.val)} style={{ background: item.val ? (item.green ? "#22c55e" : "#F59E0B") : "rgba(255,255,255,0.10)", borderRadius: 20, width: 44, height: 24, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
                            <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: item.val ? 23 : 3, transition: "all 0.2s" }} />
                          </button>
                        </div>
                      ))}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Reply Delay</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {[20, 40, 60].map(d => (
                            <button key={d} onClick={() => setReplyDelay(d)} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: replyDelay === d ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)", color: replyDelay === d ? "#F59E0B" : "rgba(255,255,255,0.45)", outline: replyDelay === d ? "1px solid rgba(245,158,11,0.30)" : "none" }}>{d}s</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(2)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      <button onClick={goLive} disabled={saving || !ruleName || !selectedVideo} style={{ background: saving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {saving
                          ? (<><div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving…</>)
                          : "🚀 Go Live!"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview panel — desktop only */}
            <div style={{ width: 260, flexShrink: 0, display: "none" }} className="preview-panel">
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 20, position: "sticky", top: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>📱 Live Preview</div>
                <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ background: "#111", padding: "40px 16px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{selectedVideo ? selectedVideo.thumb : "🎬"}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{selectedVideo ? selectedVideo.title : "No video selected"}</div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.40)", marginBottom: 10 }}>Comments</div>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>👤 User</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{keywords.length > 0 ? `"${keywords[0]}"` : "Example comment..."}</div>
                    </div>
                    {keywords.length > 0 && (
                      <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#F59E0B", marginBottom: 4 }}>🤖 ModrateAI</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{replies[0] || "Auto reply will appear here..."}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Video Selector Modal */}
      {showVideoSelector && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#0D0A1A", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "auto", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 17 }}>Select YouTube Video</h3>
              <button onClick={() => setShowVideoSelector(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.40)", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SAMPLE_VIDEOS.map(v => (
                <button key={v.id} onClick={() => { setSelectedVideo(v); setShowVideoSelector(false); }} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selectedVideo?.id === v.id ? "rgba(245,158,11,0.40)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, display: "flex", alignItems: "center", gap: 14, padding: 14, textAlign: "left", cursor: "pointer", color: "white" }}>
                  <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{v.thumb}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{v.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 12 }}>{v.date} • 👁 {v.views} • 💬 {v.comments}</div>
                  </div>
                  {selectedVideo?.id === v.id && <span style={{ color: "#F59E0B" }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowVideoSelector(false)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 12, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setShowVideoSelector(false)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 12, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>Confirm Selection</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) { .preview-panel { display: block !important; } }
      `}</style>
    </>
  );
}