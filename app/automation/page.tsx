"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection, doc, addDoc, deleteDoc, updateDoc,
  onSnapshot, increment, query, orderBy, serverTimestamp,
  setDoc, getDoc,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

type YouTubeVideo = {
  id: string;
  title: string;
  publishedAt: string;
  viewCount: string;
  commentCount: string;
  duration: string;
  thumbnail: string;
  isLive: boolean;
};

type Rule = {
  id: string;
  name: string;
  video: YouTubeVideo;
  keywords: string[];
  replyMode: "random" | "ai";
  replies: string[];
  aiInstruction: string;
  publicReply: boolean;
  replyDelay: number;
  active: boolean;
  maxRepliesPerUser: number;
  cooldownMinutes: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  enableWeekends: boolean;
  minCommentLength: number;
  ignoreLinks: boolean;
  ignoreEmojisOnly: boolean;
  ignoreBots: boolean;
  languageFilter: string;
  createdAt?: unknown;
};

type AdvancedSettings = {
  maxRepliesPerUser: number;
  cooldownMinutes: number;
  workingHoursStart: number;
  workingHoursEnd: number;
  enableWeekends: boolean;
  minCommentLength: number;
  ignoreLinks: boolean;
  ignoreEmojisOnly: boolean;
  ignoreBots: boolean;
  languageFilter: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/dashboard",  label: "Overview",   icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>) },
  { href: "/live-feed",  label: "Live Feed",  icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>) },
  { href: "/automation", label: "Automation", icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>) },
  { href: "/alerts",     label: "Alerts",     icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>) },
];

const SIDEBAR_LINKS = [
  { href: "/dashboard",  label: "Overview",   icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>) },
  { href: "/live-feed",  label: "Live Feed",  icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>) },
  { href: "/moderation", label: "Moderation",icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>) },
  { href: "/automation", label: "Automation", icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>) },
  { href: "/alerts",     label: "Alerts",     icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>) },
  { href: "/analytics",  label: "Analytics",  icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>) },
  { href: "/billing",    label: "Billing",    icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>) },
  { href: "/settings",   label: "Settings",   icon: (<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>) },
];

const STEPS = ["Select Video", "Keywords", "Auto Reply", "Advanced"];

const RULE_TEMPLATES = [
  {
    id: "spam",
    label: "Spam Filter",
    icon: "🚫",
    keywords: ["spam", "scam", "fake", "bot", "click here", "free money", "earn online"],
    replies: ["Thanks for your comment! We've flagged it for review.", "Our team will look into this shortly.", "We appreciate your engagement!"],
    aiInstruction: "Politely inform the user their comment appears promotional and has been flagged.",
  },
  {
    id: "support",
    label: "Support",
    icon: "🎧",
    keywords: ["help", "issue", "problem", "not working", "error", "broken", "support"],
    replies: ["Hi {{username}}! Please reach out to our support team for assistance.", "We're sorry to hear that! DM us and we'll help you out.", "Thanks for letting us know! Our support team will be in touch."],
    aiInstruction: "Respond empathetically and direct the user to the support channel.",
  },
  {
    id: "giveaway",
    label: "Giveaway",
    icon: "🎁",
    keywords: ["giveaway", "contest", "win", "winner", "prize", "gift"],
    replies: ["Thanks for entering! Winners will be announced soon 🎉", "Stay tuned for the giveaway results!", "You're entered! Good luck {{username}} 🍀"],
    aiInstruction: "Excitedly confirm their giveaway entry and share when results will be announced.",
  },
  {
    id: "faq",
    label: "FAQ",
    icon: "❓",
    keywords: ["how", "what is", "where", "when", "why", "tutorial", "guide"],
    replies: ["Great question! Check the description for all the details 📝", "We have a full guide linked in the description!", "Good question {{username}}! The answer is in the pinned comment."],
    aiInstruction: "Answer common questions helpfully and direct users to relevant resources.",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: "✈️",
    keywords: ["telegram", "tg", "group", "channel", "community", "join"],
    replies: ["Join our Telegram community: [link in bio] 🚀", "Our Telegram group is linked in the description!", "Hey {{username}}! Check the description for our Telegram link."],
    aiInstruction: "Direct users to the Telegram community with enthusiasm.",
  },
  {
    id: "sales",
    label: "Sales",
    icon: "💰",
    keywords: ["buy", "purchase", "price", "cost", "how much", "order", "shop", "interested"],
    replies: ["Thanks for your interest! DM us for pricing details 💬", "Check the link in our bio for purchase options!", "Hey {{username}}! We'd love to help. DM us for details."],
    aiInstruction: "Respond warmly to purchase inquiries and guide them to the sales channel.",
  },
  {
    id: "product",
    label: "Product Launch",
    icon: "🚀",
    keywords: ["launch", "new", "release", "update", "available", "out now", "coming soon"],
    replies: ["It's live! Check the link in bio for all details 🎉", "The new release is here! Link in description.", "Thanks for the excitement {{username}}! It's out now 🚀"],
    aiInstruction: "Share excitement about the product launch and direct users to find more info.",
  },
  {
    id: "affiliate",
    label: "Affiliate",
    icon: "🔗",
    keywords: ["link", "affiliate", "discount", "code", "promo", "coupon", "referral"],
    replies: ["Use code [CODE] for a discount! Link in description 🔥", "Our promo link is in the description 👇", "Hey {{username}}! Check the pinned comment for the discount code."],
    aiInstruction: "Share the affiliate link or discount code and thank them for their interest.",
  },
];

const KEYWORD_SUGGESTIONS: Record<string, string[]> = {
  buy: ["purchase", "order", "price", "cost", "shop", "interested", "how much"],
  help: ["issue", "problem", "support", "not working", "error", "broken", "fix"],
  join: ["community", "group", "discord", "telegram", "channel", "subscribe"],
  link: ["url", "website", "site", "where", "find", "download", "get"],
  spam: ["scam", "fake", "bot", "phishing", "malicious", "report"],
  win: ["giveaway", "contest", "prize", "winner", "gift", "free"],
};

const LANGUAGES = [
  { code: "any", label: "Any Language" },
  { code: "en",  label: "English" },
  { code: "te",  label: "Telugu" },
  { code: "hi",  label: "Hindi" },
  { code: "ta",  label: "Tamil" },
  { code: "es",  label: "Spanish" },
  { code: "fr",  label: "French" },
  { code: "de",  label: "German" },
  { code: "pt",  label: "Portuguese" },
  { code: "ar",  label: "Arabic" },
];

const DEFAULT_ADVANCED: AdvancedSettings = {
  maxRepliesPerUser: 3,
  cooldownMinutes: 60,
  workingHoursStart: 9,
  workingHoursEnd: 21,
  enableWeekends: true,
  minCommentLength: 0,
  ignoreLinks: true,
  ignoreEmojisOnly: false,
  ignoreBots: true,
  languageFilter: "any",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatViews(n: string): string {
  const num = parseInt(n, 10);
  if (isNaN(num)) return n;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return n;
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function ensureParentDoc(uid: string) {
  const parentRef = doc(db, "automations", uid);
  await setDoc(parentRef, { totalRules: 0, activeRules: 0, totalRepliesSent: 0, moderationMode: "auto", notifications: true, schedule: { enabled: false } }, { merge: true });
}

async function fetchYouTubeVideos(uid: string): Promise<YouTubeVideo[]> {
  try {
    const tokenDoc = await getDoc(doc(db, "youtube_tokens", uid));
    if (!tokenDoc.exists()) return [];
    const { access_token } = tokenDoc.data() as { access_token: string };
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!channelRes.ok) return [];
    const channelData = await channelRes.json();
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return [];
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!playlistRes.ok) return [];
    const playlistData = await playlistRes.json();
    const videoIds: string[] = (playlistData.items ?? []).map(
      (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
    );
    if (!videoIds.length) return [];
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${videoIds.join(",")}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!statsRes.ok) return [];
    const statsData = await statsRes.json();
    return (statsData.items ?? []).map((v: {
      id: string;
      snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string }; default?: { url: string } }; liveBroadcastContent?: string };
      statistics: { viewCount?: string; commentCount?: string };
      contentDetails: { duration: string };
      liveStreamingDetails?: unknown;
    }): YouTubeVideo => ({
      id: v.id,
      title: v.snippet.title,
      publishedAt: v.snippet.publishedAt,
      viewCount: v.statistics.viewCount ?? "0",
      commentCount: v.statistics.commentCount ?? "0",
      duration: v.contentDetails.duration,
      thumbnail: v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? "",
      isLive: v.snippet.liveBroadcastContent === "live",
    }));
  } catch {
    return [];
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <>
      <style>{`
        @keyframes sidebarPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .snav-item { display: flex; align-items: center; gap: 10px; padding: 10px 13px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 500; color: rgba(220,195,165,0.52); border: 1px solid transparent; position: relative; transition: all 0.22s; cursor: pointer; overflow: hidden; }
        .snav-item:hover { background: rgba(245,158,11,0.055); color: rgba(240,220,190,0.88); transform: translateX(3px); border-color: rgba(245,158,11,0.08); }
        .snav-item.active { background: linear-gradient(135deg, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.10) 50%, rgba(245,158,11,0.06) 100%); color: #FBBF24; font-weight: 700; border-color: rgba(245,158,11,0.25); box-shadow: 0 0 0 1px rgba(245,158,11,0.12), 0 2px 20px rgba(245,158,11,0.10), inset 0 1px 0 rgba(245,158,11,0.18), inset 0 0 28px rgba(245,158,11,0.06); }
        .snav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 22px; border-radius: 0 3px 3px 0; background: linear-gradient(180deg, #FBBF24, #F59E0B, #D97706); box-shadow: 0 0 10px rgba(245,158,11,0.8), 0 0 24px rgba(245,158,11,0.3); }
        .snav-live { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; color: #F9A825; background: rgba(255,159,26,.12); border: 1px solid rgba(255,159,26,.35); }
        .snav-live-dot { width: 5px; height: 5px; border-radius: 50%; background: #F59E0B; animation: sidebarPulse 1.6s ease-in-out infinite; }
      `}</style>
      <div style={{ background: "radial-gradient(ellipse 80% 40% at -10% 0%, rgba(180,90,0,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 30% at -5% 30%, rgba(150,70,0,0.20) 0%, transparent 55%), #0c0a0e", backdropFilter: "blur(24px)", borderRight: "1px solid rgba(245,158,11,0.12)", boxShadow: "4px 0 40px rgba(0,0,0,0.6), 8px 0 80px rgba(180,90,0,0.06)", width: 228, minHeight: "100vh", display: "flex", flexDirection: "column", padding: "0 10px 20px", position: "fixed", left: 0, top: 0, zIndex: 20 }}>
        <div style={{ position: "absolute", top: "-60px", left: "-80px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,90,0,0.55) 0%, rgba(160,65,0,0.28) 35%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(18px)" }} />
        <div style={{ position: "absolute", top: "160px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(180,75,0,0.30) 0%, rgba(130,55,0,0.12) 40%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(22px)" }} />
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", padding: "22px 8px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 14 }}>
          <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 40%, #7C3AED 100%)", borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 16px rgba(245,158,11,0.4), 0 0 0 1px rgba(245,158,11,0.2)", flexShrink: 0 }}>
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style={{ color: "#FAFAFA", fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.025em" }}>ModerateAI</div>
            <div style={{ color: "rgba(255,255,255,0.26)", fontSize: 10, fontWeight: 500, marginTop: 1 }}>Enterprise · v2</div>
          </div>
        </Link>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {SIDEBAR_LINKS.map(link => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`snav-item${active ? " active" : ""}`}>
                {link.icon}{link.label}
                {active && <span className="snav-live"><span className="snav-live-dot" />live</span>}
              </Link>
            );
          })}
        </nav>
        <div style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.22)", borderRadius: 14, padding: "14px", marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA", marginBottom: 4 }}>Upgrade to Pro 🚀</div>
          {["25,000 comments / month","Unlimited automation rules","Priority support","1,900 AI actions / month"].map(f => (
            <div key={f} style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4 }}>{f}</div>
          ))}
          <button style={{ background: "linear-gradient(135deg,#F59E0B,#FBBF24)", borderRadius: 9, width: "100%", fontSize: 11.5, padding: "8px 0", fontWeight: 700, color: "#080808", border: "none", cursor: "pointer" }}>Upgrade — ₹349/mo</button>
        </div>
      </div>
    </>
  );
}

function BottomNav({ pathname, moreOpen, setMoreOpen }: { pathname: string; moreOpen: boolean; setMoreOpen: (v: (prev: boolean) => boolean) => void }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "rgba(9,9,11,.97)", borderTop: "1px solid rgba(255,255,255,.055)", display: "flex", backdropFilter: "blur(28px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {NAV_LINKS.map(link => {
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 2px 10px", textDecoration: "none", color: active ? "#F59E0B" : "rgba(255,255,255,.35)", transition: "color 0.18s", position: "relative" }}>
            {active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2, background: "linear-gradient(90deg,#F59E0B,#EA580C)", borderRadius: "0 0 4px 4px" }} />}
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 30, borderRadius: 10, background: active ? "rgba(245,158,11,0.15)" : "transparent", boxShadow: active ? "0 0 14px rgba(245,158,11,0.4)" : "none", transition: "all 0.2s" }}>{link.icon}</span>
            <span style={{ fontSize: 9, fontWeight: active ? 600 : 500, lineHeight: 1 }}>{link.label}</span>
          </Link>
        );
      })}
      <button onClick={() => setMoreOpen(v => !v)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 2px 10px", background: "none", border: "none", cursor: "pointer", color: moreOpen ? "#F59E0B" : "rgba(255,255,255,.35)", position: "relative" }}>
        {moreOpen && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2, background: "linear-gradient(90deg,#F59E0B,#EA580C)", borderRadius: "0 0 4px 4px" }} />}
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        <span style={{ fontSize: 9, fontWeight: moreOpen ? 600 : 500, lineHeight: 1 }}>More</span>
      </button>
    </div>
  );
}

function VideoSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
      <div style={{ width: 96, height: 54, borderRadius: 8, background: "rgba(255,255,255,0.06)", flexShrink: 0, animation: "shimmer 1.5s ease-in-out infinite" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 13, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.06)", animation: "shimmer 1.5s ease-in-out infinite" }} />
        <div style={{ height: 11, width: "45%", borderRadius: 6, background: "rgba(255,255,255,0.04)", animation: "shimmer 1.5s ease-in-out infinite 0.2s" }} />
      </div>
    </div>
  );
}

function VideoCard({ video, selected, onClick }: { video: YouTubeVideo; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.025)",
      border: `1px solid ${selected ? "rgba(245,158,11,0.40)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, display: "flex", alignItems: "center", gap: 14, padding: 14,
      textAlign: "left", cursor: "pointer", color: "white", width: "100%",
      boxShadow: selected ? "0 0 0 1px rgba(245,158,11,0.15), 0 4px 24px rgba(245,158,11,0.12)" : "none",
      transition: "all 0.2s",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} style={{ width: 96, height: 54, borderRadius: 8, objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: 96, height: 54, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎬</div>
        )}
        {video.isLive && (
          <span style={{ position: "absolute", top: 4, left: 4, background: "#ef4444", borderRadius: 4, fontSize: 9, fontWeight: 700, color: "white", padding: "2px 5px", letterSpacing: 0.5 }}>● LIVE</span>
        )}
        {video.duration && !video.isLive && (
          <span style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.75)", borderRadius: 4, fontSize: 9, fontWeight: 600, color: "white", padding: "2px 5px" }}>{formatDuration(video.duration)}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{video.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.40)", fontSize: 11, flexWrap: "wrap" }}>
          <span>👁 {formatViews(video.viewCount)}</span>
          <span>💬 {formatViews(video.commentCount)}</span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
      </div>
      {selected && <span style={{ color: "#F59E0B", fontSize: 18, flexShrink: 0 }}>✓</span>}
    </button>
  );
}

function RuleSummary({ ruleName, selectedVideo, keywords, replyMode, replyDelay, ruleActive }: {
  ruleName: string; selectedVideo: YouTubeVideo | null; keywords: string[]; replyMode: "random" | "ai"; replyDelay: number; ruleActive: boolean;
}) {
  return (
    <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.14)", borderRadius: 16, padding: "16px 18px", marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,158,11,0.7)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>Rule Summary</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Name",     value: ruleName || "—" },
          { label: "Video",    value: selectedVideo ? selectedVideo.title.slice(0, 32) + (selectedVideo.title.length > 32 ? "…" : "") : "Not selected" },
          { label: "Keywords", value: keywords.length > 0 ? `${keywords.length} keyword${keywords.length > 1 ? "s" : ""}` : "None" },
          { label: "Mode",     value: replyMode === "ai" ? "🤖 AI Generated" : "🎲 Random Template" },
          { label: "Delay",    value: `${replyDelay}s` },
          { label: "Status",   value: ruleActive ? "● Active" : "○ Inactive", color: ruleActive ? "#22c55e" : "rgba(255,255,255,0.35)" },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{row.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: row.color ?? "rgba(255,255,255,0.80)" }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LivePreview({ selectedVideo, keywords, replies, replyMode, aiInstruction, replyDelay }: {
  selectedVideo: YouTubeVideo | null; keywords: string[]; replies: string[]; replyMode: "random" | "ai"; aiInstruction: string; replyDelay: number;
}) {
  const exampleComment = keywords.length > 0 ? `Hey, I wanted to "${keywords[0]}" your product!` : "Loved this video, keep it up!";
  const matchedKeyword = keywords.length > 0 ? keywords[0] : null;
  const generatedReply = replyMode === "random" ? (replies.find(r => r.trim()) || "Auto reply will appear here...") : (aiInstruction ? "AI will generate a contextual reply based on your instruction." : "Enter AI instruction to preview reply.");

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>📱 Live Preview</div>
      <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
        <div style={{ position: "relative", background: "#111" }}>
          {selectedVideo?.thumbnail ? (
            <img src={selectedVideo.thumbnail} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block", opacity: 0.7 }} />
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎬</div>
          )}
          <div style={{ padding: "8px 12px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>{selectedVideo ? selectedVideo.title : "No video selected"}</div>
          </div>
        </div>
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>Comments</div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginBottom: 3 }}>👤 Viewer</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.70)", lineHeight: 1.4 }}>{exampleComment}</div>
          </div>
          {matchedKeyword && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", marginBottom: 4 }}>
                <div style={{ width: 1, height: 14, background: "rgba(245,158,11,0.3)", marginLeft: 14 }} />
                <span style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 6, fontSize: 9, fontWeight: 700, color: "#F59E0B", padding: "2px 7px" }}>KEYWORD: {matchedKeyword}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 8px", marginBottom: 4 }}>
                <div style={{ width: 1, height: 14, background: "rgba(245,158,11,0.3)", marginLeft: 14 }} />
                <span style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 6, fontSize: 9, fontWeight: 700, color: "#A78BFA", padding: "2px 7px" }}>AI DECISION: REPLY</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 8px", marginBottom: 6 }}>
                <div style={{ width: 1, height: 14, background: "rgba(245,158,11,0.3)", marginLeft: 14 }} />
                <span style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", borderRadius: 6, fontSize: 9, fontWeight: 700, color: "#22c55e", padding: "2px 7px" }}>DELAY: {replyDelay}s</span>
              </div>
              <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#F59E0B", marginBottom: 3 }}>🤖 ModerateAI</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{generatedReply}</div>
              </div>
            </>
          )}
          {!matchedKeyword && (
            <div style={{ padding: "8px 10px", color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center" }}>Add keywords to see preview</div>
          )}
        </div>
      </div>
      <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", fontWeight: 500 }}>Rule is ready to go live</span>
      </div>
    </div>
  );
}

// ─── Mobile Preview Bottom Sheet ──────────────────────────────────────────────

function MobilePreviewSheet({ open, onClose, selectedVideo, keywords, replies, replyMode, aiInstruction, replyDelay, ruleName, ruleActive }: {
  open: boolean; onClose: () => void;
  selectedVideo: YouTubeVideo | null; keywords: string[]; replies: string[]; replyMode: "random" | "ai"; aiInstruction: string; replyDelay: number; ruleName: string; ruleActive: boolean;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number>(0);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    currentYRef.current = delta;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (currentYRef.current > 80) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
    startYRef.current = null;
    currentYRef.current = 0;
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", animation: "fadeInBg 0.25s ease" }}
      />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 210,
          background: "linear-gradient(180deg, #110d1a 0%, #0d0a14 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderBottom: "none",
          borderRadius: "24px 24px 0 0",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          transition: "transform 0.15s ease",
          willChange: "transform",
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: "14px 24px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 4, margin: "0 auto 16px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Rule Preview</div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 16 }}
            >✕</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 16px 32px", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          <RuleSummary ruleName={ruleName} selectedVideo={selectedVideo} keywords={keywords} replyMode={replyMode} replyDelay={replyDelay} ruleActive={ruleActive} />
          <LivePreview selectedVideo={selectedVideo} keywords={keywords} replies={replies} replyMode={replyMode} aiInstruction={aiInstruction} replyDelay={replyDelay} />
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const pathname = usePathname();
  const router   = useRouter();

  const [user,        setUser]        = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [rules,        setRules]        = useState<Rule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState<string | null>(null);

  const [showBuilder,  setShowBuilder]  = useState(false);
  const [currentStep,  setCurrentStep]  = useState(0);

  const [videos,            setVideos]            = useState<YouTubeVideo[]>([]);
  const [videosLoading,     setVideosLoading]     = useState(false);
  const [videoSearch,       setVideoSearch]       = useState("");
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [selectedVideo,     setSelectedVideo]     = useState<YouTubeVideo | null>(null);
  const [ruleName,          setRuleName]          = useState("");

  const [keywords,     setKeywords]     = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [aiDetection,  setAiDetection]  = useState(false);
  const [suggestions,  setSuggestions]  = useState<string[]>([]);

  const [replyMode,     setReplyMode]     = useState<"random" | "ai">("random");
  const [replies,       setReplies]       = useState(["", "", ""]);
  const [aiInstruction, setAiInstruction] = useState("");

  const [advanced,   setAdvanced]   = useState<AdvancedSettings>(DEFAULT_ADVANCED);
  const [ruleActive, setRuleActive] = useState(true);
  const [replyDelay, setReplyDelay] = useState(20);

  const [moreOpen,         setMoreOpen]         = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

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

  useEffect(() => {
    if (!showVideoSelector || !user || videos.length > 0) return;
    setVideosLoading(true);
    fetchYouTubeVideos(user.uid).then(vids => {
      setVideos(vids);
      setVideosLoading(false);
    });
  }, [showVideoSelector, user, videos.length]);

  const updateSuggestions = useCallback((input: string) => {
    const lower = input.toLowerCase().trim();
    if (!lower) { setSuggestions([]); return; }
    const matches = Object.entries(KEYWORD_SUGGESTIONS).find(([key]) => lower.includes(key) || key.includes(lower));
    setSuggestions(matches ? matches[1].filter(s => !keywords.includes(s)) : []);
  }, [keywords]);

  useEffect(() => { updateSuggestions(keywordInput); }, [keywordInput, updateSuggestions]);

  const filteredVideos = useMemo(() => {
    if (!videoSearch.trim()) return videos;
    const q = videoSearch.toLowerCase();
    return videos.filter(v => v.title.toLowerCase().includes(q) || v.id.toLowerCase().includes(q));
  }, [videos, videoSearch]);

  const resetBuilder = () => {
    setCurrentStep(0); setRuleName(""); setSelectedVideo(null); setKeywords([]);
    setKeywordInput(""); setAiDetection(false); setReplyMode("random");
    setReplies(["", "", ""]); setAiInstruction(""); setReplyDelay(20);
    setRuleActive(true); setAdvanced(DEFAULT_ADVANCED); setShowBuilder(false);
    setSuggestions([]); setMobilePreviewOpen(false);
  };

  const addKeyword = (kw?: string) => {
    const trimmed = (kw ?? keywordInput).trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed]);
      if (!kw) setKeywordInput("");
    }
  };

  const applyTemplate = (template: typeof RULE_TEMPLATES[0]) => {
    setKeywords(template.keywords);
    setReplies(template.replies);
    setAiInstruction(template.aiInstruction);
    setReplyMode("random");
  };

  const goLive = async () => {
    if (!ruleName || !selectedVideo || !user) return;
    setSaving(true);
    try {
      await ensureParentDoc(user.uid);
      const rulesRef = collection(db, "automations", user.uid, "rules");
      await addDoc(rulesRef, {
        name: ruleName, video: selectedVideo, keywords, replyMode, replies, aiInstruction,
        publicReply: true, replyDelay, active: ruleActive, createdAt: serverTimestamp(),
        ...advanced,
      });
      const parentRef = doc(db, "automations", user.uid);
      await setDoc(parentRef, { totalRules: increment(1), activeRules: increment(ruleActive ? 1 : 0) }, { merge: true });
      resetBuilder();
    } catch (err) {
      console.error("Failed to save rule:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (ruleId: string, wasActive: boolean) => {
    if (!user) return;
    setDeleting(ruleId);
    try {
      await deleteDoc(doc(db, "automations", user.uid, "rules", ruleId));
      await ensureParentDoc(user.uid);
      const parentRef = doc(db, "automations", user.uid);
      await setDoc(parentRef, { totalRules: increment(-1), activeRules: increment(wasActive ? -1 : 0) }, { merge: true });
    } catch (err) {
      console.error("Failed to delete rule:", err);
    } finally {
      setDeleting(null);
    }
  };

  const toggleRule = async (rule: Rule) => {
    if (!user) return;
    const newActive = !rule.active;
    try {
      await updateDoc(doc(db, "automations", user.uid, "rules", rule.id), { active: newActive });
      await ensureParentDoc(user.uid);
      const parentRef = doc(db, "automations", user.uid);
      await setDoc(parentRef, { activeRules: increment(newActive ? 1 : -1) }, { merge: true });
    } catch {
      console.error("Failed to toggle rule");
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#07030F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "2px solid #F59E0B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.015em; box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07030F; color: white; }

        /* Layout */
        .desktop-sidebar { display: none !important; }
        .bottom-nav      { display: flex !important; }
        .main-content    { margin-left: 0 !important; padding: 20px 16px 160px !important; }

        @media (min-width: 1024px) {
          .desktop-sidebar   { display: flex !important; }
          .bottom-nav        { display: none !important; }
          .main-content      { margin-left: 228px !important; padding: 32px 40px 60px !important; }
          .preview-panel     { display: block !important; }
          .mobile-preview-fab { display: none !important; }
          .sticky-mobile-cta { display: none !important; }
        }

        /* Template scroll — mobile horizontal, desktop wrap */
        .template-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .template-scroll::-webkit-scrollbar { display: none; }
        @media (min-width: 1024px) {
          .template-scroll {
            flex-wrap: wrap;
            overflow-x: visible;
          }
        }
        .template-chip { flex-shrink: 0; }

        /* Video grid */
        .video-option-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .video-option-grid { grid-template-columns: 1fr 1fr; }
        }

        /* Inputs */
        input:focus, textarea:focus, select:focus { border-color: rgba(245,158,11,0.5) !important; outline: none; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #1a1a2e; color: white; }
        input, textarea, select { -webkit-appearance: none; }

        /* Animations */
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes fadeIn      { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp     { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeInBg    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer     { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        /* Hover states */
        .rule-card { animation: fadeIn 0.2s ease; }
        .rule-card:hover { border-color: rgba(245,158,11,0.18) !important; background: rgba(255,255,255,0.045) !important; }
        .template-btn:hover { border-color: rgba(245,158,11,0.30) !important; background: rgba(245,158,11,0.08) !important; color: #F59E0B !important; }
        .suggestion-chip:hover { background: rgba(245,158,11,0.18) !important; }

        /* Mobile-only elements */
        .mobile-preview-fab { display: flex; }
        .sticky-mobile-cta  { display: flex; }
        .preview-panel      { display: none; }

        /* Fix overflow */
        .keyword-chips { display: flex; flex-wrap: wrap; gap: 8px; min-height: 32px; }
        .step-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .step-scroll::-webkit-scrollbar { display: none; }

        /* Working hours responsive */
        .working-hours-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        .cooldown-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .delay-row { display: flex; gap: 8px; }
        .max-replies-row { display: flex; gap: 8px; flex-wrap: wrap; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse 55% 50% at 5% 15%, rgba(245,158,11,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 55% at 5% 95%, rgba(109,40,217,0.18) 0%, transparent 62%), #07030F" }} />

      <div className="desktop-sidebar" style={{ flexDirection: "column" }}>
        <Sidebar pathname={pathname} />
      </div>
      <div className="bottom-nav">
        <BottomNav pathname={pathname} moreOpen={moreOpen} setMoreOpen={setMoreOpen} />
      </div>

      <main className="main-content" style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>

        {/* ── Rules List ── */}
        {!showBuilder ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "#FAFAFA", marginBottom: 3 }}>Automation Rules</h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Rules run in order — higher rules have higher priority</p>
              </div>
              <button
                onClick={() => setShowBuilder(true)}
                style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(245,158,11,0.25)", whiteSpace: "nowrap" }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Create Rule
              </button>
            </div>

            {rulesLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                <div style={{ width: 32, height: 32, border: "2px solid #F59E0B", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : rules.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "56px 20px", textAlign: "center", animation: "fadeIn 0.3s ease" }}>
                <div style={{ width: 72, height: 72, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>⚡</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No automation rules yet</h2>
                <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24, maxWidth: 300, margin: "0 auto 24px", lineHeight: 1.5 }}>Create your first rule to automatically reply to YouTube comments when keywords are matched.</p>
                <button
                  onClick={() => setShowBuilder(true)}
                  style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, padding: "13px 28px", fontSize: 14, fontWeight: 700, color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 24px rgba(245,158,11,0.30)" }}
                >
                  ⚡ Create Your First Rule
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {rules.map(rule => (
                  <div key={rule.id} className="rule-card" style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                      <div style={{ background: "rgba(245,158,11,0.12)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⚡</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rule.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rule.video?.title?.slice(0, 36)}{(rule.video?.title?.length ?? 0) > 36 ? "…" : ""} · {rule.keywords?.length ?? 0} kw</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => toggleRule(rule)} style={{ background: rule.active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)", color: rule.active ? "#22c55e" : "rgba(255,255,255,0.35)", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                        {rule.active ? "● On" : "○ Off"}
                      </button>
                      <button onClick={() => deleteRule(rule.id, rule.active)} disabled={deleting === rule.id} style={{ color: "rgba(255,100,100,0.55)", background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: deleting === rule.id ? 0.4 : 1, padding: "4px" }}>
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
            {/* Left/Main column */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Builder header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <button onClick={resetBuilder} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>←</button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>Automation / New Rule</div>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ruleName || "Untitled Rule"}</div>
                  </div>
                </div>
                {/* Desktop-only Go Live in header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span className="preview-panel" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", borderRadius: 20, padding: "4px 10px", fontSize: 11, display: "none" }}>● Live</span>
                  <button
                    onClick={goLive}
                    disabled={saving || !ruleName || !selectedVideo}
                    className="preview-panel"
                    style={{ background: saving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", display: "none", alignItems: "center", gap: 6 }}
                  >
                    {saving ? (<><div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving…</>) : "🚀 Go Live"}
                  </button>
                </div>
              </div>

              {/* Step indicators */}
              <div className="step-scroll" style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20, paddingBottom: 4 }}>
                {STEPS.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => setCurrentStep(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, fontSize: 12, cursor: "pointer", border: "none", background: i === currentStep ? "rgba(245,158,11,0.12)" : "transparent", color: i === currentStep ? "#F59E0B" : i < currentStep ? "#22c55e" : "rgba(255,255,255,0.30)", fontWeight: i === currentStep ? 600 : 400, outline: i === currentStep ? "1px solid rgba(245,158,11,0.30)" : "none", whiteSpace: "nowrap" }}>
                      <span style={{ background: i === currentStep ? "#F59E0B" : i < currentStep ? "#22c55e" : "rgba(255,255,255,0.10)", color: i < currentStep ? "white" : i === currentStep ? "#07030F" : "rgba(255,255,255,0.4)", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        {i < currentStep ? "✓" : i + 1}
                      </span>
                      {step}
                    </button>
                    {i < STEPS.length - 1 && <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 11 }}>—</span>}
                  </div>
                ))}
              </div>

              {/* Step content card */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "20px 16px", animation: "fadeIn 0.18s ease" }}>

                {/* ── Step 0: Select Video ── */}
                {currentStep === 0 && (
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Select YouTube Video</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, marginBottom: 20 }}>Choose which video to monitor for comments</p>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", display: "block", marginBottom: 7 }}>Rule Name</label>
                      <input
                        value={ruleName}
                        onChange={e => setRuleName(e.target.value)}
                        placeholder="e.g. Spam Filter Rule"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "11px 14px", fontSize: 14 }}
                      />
                    </div>

                    <div className="video-option-grid">
                      <button onClick={() => setShowVideoSelector(true)} style={{ background: selectedVideo ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedVideo ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: 14, textAlign: "left", cursor: "pointer", color: "white", transition: "all 0.2s", minHeight: 90 }}>
                        {selectedVideo ? (
                          <>
                            {selectedVideo.thumbnail ? <img src={selectedVideo.thumbnail} alt="" style={{ width: "100%", height: 48, objectFit: "cover", borderRadius: 8, marginBottom: 7 }} /> : <div style={{ fontSize: 20, marginBottom: 7 }}>🎬</div>}
                            <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{selectedVideo.title}</div>
                            <div style={{ color: "#F59E0B", fontSize: 10, marginTop: 4, fontWeight: 600 }}>✓ Tap to change</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 22, marginBottom: 7 }}>🎬</div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>Specific Video</div>
                            <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginTop: 3 }}>Choose from your channel</div>
                          </>
                        )}
                      </button>
                      {[{ label: "Future Videos", icon: "🔮" }, { label: "Latest Video", icon: "🆕" }, { label: "All Videos", icon: "📺" }].map(opt => (
                        <div key={opt.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, opacity: 0.45, position: "relative", minHeight: 90 }}>
                          <div style={{ fontSize: 22, marginBottom: 7 }}>{opt.icon}</div>
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

                {/* ── Step 1: Keywords ── */}
                {currentStep === 1 && (
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Keyword Triggers</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, marginBottom: 18 }}>Comments matching these keywords will trigger auto-reply</p>

                    {/* Templates horizontal scroll on mobile */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.40)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>Quick Templates</div>
                      <div className="template-scroll">
                        {RULE_TEMPLATES.map(t => (
                          <button key={t.id} className="template-btn template-chip" onClick={() => applyTemplate(t)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", transition: "all 0.18s", whiteSpace: "nowrap" }}>
                            <span>{t.icon}</span>{t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI detection toggle */}
                    <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", marginBottom: 16, gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>AI Intent Detection</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginTop: 2 }}>Semantic matching — understands meaning</div>
                      </div>
                      <button onClick={() => setAiDetection(!aiDetection)} style={{ background: aiDetection ? "#F59E0B" : "rgba(255,255,255,0.10)", borderRadius: 20, width: 44, height: 24, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
                        <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: aiDetection ? 23 : 3, transition: "all 0.2s" }} />
                      </button>
                    </div>

                    {/* Keyword input */}
                    <div style={{ display: "flex", gap: 8, marginBottom: suggestions.length > 0 ? 10 : 14 }}>
                      <input
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addKeyword()}
                        placeholder="Type keyword and press Enter"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", flex: 1, padding: "11px 14px", fontSize: 14, minWidth: 0 }}
                      />
                      <button onClick={() => addKeyword()} style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#F59E0B", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>+ Add</button>
                    </div>

                    {suggestions.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>💡 Suggestions</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {suggestions.map(s => (
                            <button key={s} className="suggestion-chip" onClick={() => addKeyword(s)} style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 16, color: "rgba(255,200,100,0.80)", fontSize: 12, padding: "4px 11px", cursor: "pointer", transition: "all 0.15s" }}>+ {s}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="keyword-chips" style={{ marginBottom: 20 }}>
                      {keywords.map(kw => (
                        <span key={kw} style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, color: "#FBBF24", display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: 13 }}>
                          {kw}
                          <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.40)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                        </span>
                      ))}
                      {keywords.length === 0 && <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No keywords added yet</span>}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(0)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCurrentStep(2)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>Next →</button>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Auto Reply ── */}
                {currentStep === 2 && (
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Auto Reply Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, marginBottom: 20 }}>Configure how the bot replies to matched comments</p>

                    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                      {(["random", "ai"] as const).map(mode => (
                        <button key={mode} onClick={() => setReplyMode(mode)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: replyMode === mode ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", color: replyMode === mode ? "#F59E0B" : "rgba(255,255,255,0.45)", outline: replyMode === mode ? "1px solid rgba(245,158,11,0.30)" : "none" }}>
                          {mode === "random" ? "🎲 Random" : "🤖 AI"}
                        </button>
                      ))}
                    </div>

                    {replyMode === "random" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                        {replies.map((r, i) => (
                          <div key={i}>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", display: "block", marginBottom: 6 }}>Reply {i + 1}</label>
                            <input
                              value={r}
                              onChange={e => { const arr = [...replies]; arr[i] = e.target.value; setReplies(arr); }}
                              placeholder={`Template reply ${i + 1}...`}
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "11px 14px", fontSize: 14 }}
                            />
                          </div>
                        ))}
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Use {"{{username}}"} to mention the commenter</div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", display: "block", marginBottom: 6 }}>AI Instruction</label>
                        <textarea
                          value={aiInstruction}
                          onChange={e => setAiInstruction(e.target.value)}
                          placeholder="e.g. Reply politely in Telugu, thank them for watching..."
                          rows={4}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "11px 14px", fontSize: 14, resize: "vertical" }}
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCurrentStep(3)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>Next →</button>
                    </div>
                  </div>
                )}

                {/* ── Step 3: Advanced ── */}
                {currentStep === 3 && (
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Advanced Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, marginBottom: 20 }}>Fine-tune your automation rule</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>

                      {/* Rule status */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>Rule Status</div>
                          <div style={{ color: ruleActive ? "#22c55e" : "rgba(255,255,255,0.40)", fontSize: 12, marginTop: 2 }}>{ruleActive ? "● Active" : "○ Inactive"}</div>
                        </div>
                        <button onClick={() => setRuleActive(!ruleActive)} style={{ background: ruleActive ? "#22c55e" : "rgba(255,255,255,0.10)", borderRadius: 20, width: 44, height: 24, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
                          <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: ruleActive ? 23 : 3, transition: "all 0.2s" }} />
                        </button>
                      </div>

                      {/* Reply Delay */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Reply Delay</div>
                        <div className="delay-row">
                          {[20, 40, 60].map(d => (
                            <button key={d} onClick={() => setReplyDelay(d)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: replyDelay === d ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)", color: replyDelay === d ? "#F59E0B" : "rgba(255,255,255,0.45)", outline: replyDelay === d ? "1px solid rgba(245,158,11,0.30)" : "none" }}>{d}s</button>
                          ))}
                        </div>
                      </div>

                      {/* Max replies per user */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Max Replies per User</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginBottom: 10 }}>Limit replies to same user</div>
                        <div className="max-replies-row">
                          {[1, 2, 3, 5, 10].map(n => (
                            <button key={n} onClick={() => setAdvanced(a => ({ ...a, maxRepliesPerUser: n }))} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: advanced.maxRepliesPerUser === n ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)", color: advanced.maxRepliesPerUser === n ? "#F59E0B" : "rgba(255,255,255,0.45)", outline: advanced.maxRepliesPerUser === n ? "1px solid rgba(245,158,11,0.30)" : "none" }}>{n}</button>
                          ))}
                        </div>
                      </div>

                      {/* Cooldown */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Cooldown Period</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginBottom: 10 }}>Wait before replying to same user again</div>
                        <div className="cooldown-row">
                          {[15, 30, 60, 120, 1440].map(n => (
                            <button key={n} onClick={() => setAdvanced(a => ({ ...a, cooldownMinutes: n }))} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: advanced.cooldownMinutes === n ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)", color: advanced.cooldownMinutes === n ? "#F59E0B" : "rgba(255,255,255,0.45)", outline: advanced.cooldownMinutes === n ? "1px solid rgba(245,158,11,0.30)" : "none" }}>{n < 60 ? `${n}m` : n === 1440 ? "24h" : `${n / 60}h`}</button>
                          ))}
                        </div>
                      </div>

                      {/* Working hours */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>Working Hours</div>
                        <div className="working-hours-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", whiteSpace: "nowrap" }}>From</label>
                            <select value={advanced.workingHoursStart} onChange={e => setAdvanced(a => ({ ...a, workingHoursStart: parseInt(e.target.value) }))} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "white", padding: "7px 10px", fontSize: 13, cursor: "pointer" }}>
                              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>)}
                            </select>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", whiteSpace: "nowrap" }}>To</label>
                            <select value={advanced.workingHoursEnd} onChange={e => setAdvanced(a => ({ ...a, workingHoursEnd: parseInt(e.target.value) }))} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "white", padding: "7px 10px", fontSize: 13, cursor: "pointer" }}>
                              {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Min comment length */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Min Comment Length</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginBottom: 10 }}>Ignore very short comments</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {[0, 5, 10, 20, 50].map(n => (
                            <button key={n} onClick={() => setAdvanced(a => ({ ...a, minCommentLength: n }))} style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: advanced.minCommentLength === n ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)", color: advanced.minCommentLength === n ? "#F59E0B" : "rgba(255,255,255,0.45)", outline: advanced.minCommentLength === n ? "1px solid rgba(245,158,11,0.30)" : "none" }}>{n === 0 ? "Any" : `${n}+`}</button>
                          ))}
                        </div>
                      </div>

                      {/* Language filter */}
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>Language Filter</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginBottom: 10 }}>Only reply to comments in this language</div>
                        <select value={advanced.languageFilter} onChange={e => setAdvanced(a => ({ ...a, languageFilter: e.target.value }))} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "white", padding: "9px 12px", fontSize: 13, cursor: "pointer", width: "100%" }}>
                          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                      </div>

                      {/* Toggle options */}
                      {[
                        { key: "enableWeekends",   label: "Enable Weekends",         sub: "Reply on Saturdays and Sundays" },
                        { key: "ignoreLinks",      label: "Ignore Comments with Links", sub: "Skip comments containing URLs" },
                        { key: "ignoreEmojisOnly", label: "Ignore Emoji-only",        sub: "Skip emoji-only comments" },
                        { key: "ignoreBots",       label: "Ignore Bots",             sub: "Auto-detect and skip bot comments" },
                      ].map(item => (
                        <div key={item.key} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", gap: 12 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                            <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 11, marginTop: 2 }}>{item.sub}</div>
                          </div>
                          <button onClick={() => setAdvanced(a => ({ ...a, [item.key]: !a[item.key as keyof AdvancedSettings] }))} style={{ background: advanced[item.key as keyof AdvancedSettings] ? "#F59E0B" : "rgba(255,255,255,0.10)", borderRadius: 20, width: 44, height: 24, border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "all 0.2s" }}>
                            <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: advanced[item.key as keyof AdvancedSettings] ? 23 : 3, transition: "all 0.2s" }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(2)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      {/* Desktop go live inside step */}
                      <button
                        onClick={goLive}
                        disabled={saving || !ruleName || !selectedVideo}
                        className="preview-panel"
                        style={{ background: saving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: saving ? "not-allowed" : "pointer", display: "none", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        {saving ? (<><div style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving…</>) : "🚀 Go Live!"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Panel — Desktop only ── */}
            <div style={{ width: 280, flexShrink: 0, display: "none", position: "sticky", top: 24 }} className="preview-panel">
              <RuleSummary ruleName={ruleName} selectedVideo={selectedVideo} keywords={keywords} replyMode={replyMode} replyDelay={replyDelay} ruleActive={ruleActive} />
              <LivePreview selectedVideo={selectedVideo} keywords={keywords} replies={replies} replyMode={replyMode} aiInstruction={aiInstruction} replyDelay={replyDelay} />
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile: Floating Preview Button — only in builder ── */}
      {showBuilder && (
        <button
          className="mobile-preview-fab"
          onClick={() => setMobilePreviewOpen(true)}
          style={{
            position: "fixed",
            bottom: 88,
            right: 16,
            zIndex: 48,
            background: "rgba(14,10,24,0.96)",
            border: "1px solid rgba(245,158,11,0.35)",
            borderRadius: 20,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: "#F59E0B",
            cursor: "pointer",
            boxShadow: "0 4px 24px rgba(245,158,11,0.20), 0 2px 8px rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Preview
        </button>
      )}

      {/* ── Mobile: Sticky CTA — only in builder ── */}
      {showBuilder && (
        <div
          className="sticky-mobile-cta"
          style={{
            position: "fixed",
            bottom: 60,
            left: 0,
            right: 0,
            zIndex: 46,
            background: "linear-gradient(180deg, transparent 0%, rgba(7,3,15,0.95) 35%, rgba(7,3,15,1) 100%)",
            padding: "12px 16px 10px",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={goLive}
            disabled={saving || !ruleName || !selectedVideo}
            style={{
              background: saving || !ruleName || !selectedVideo
                ? "rgba(255,255,255,0.07)"
                : "linear-gradient(135deg, #F59E0B, #EA580C)",
              borderRadius: 14,
              flex: 1,
              padding: "14px",
              fontSize: 14,
              fontWeight: 700,
              color: saving || !ruleName || !selectedVideo ? "rgba(255,255,255,0.30)" : "white",
              border: "none",
              cursor: saving || !ruleName || !selectedVideo ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: (!saving && ruleName && selectedVideo) ? "0 4px 20px rgba(245,158,11,0.30)" : "none",
              transition: "all 0.2s",
            }}
          >
            {saving ? (
              <>
                <div style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Saving…
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {!ruleName ? "Enter rule name to save" : !selectedVideo ? "Select a video to save" : "Save Automation"}
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Mobile Preview Bottom Sheet ── */}
      <MobilePreviewSheet
        open={mobilePreviewOpen}
        onClose={() => setMobilePreviewOpen(false)}
        selectedVideo={selectedVideo}
        keywords={keywords}
        replies={replies}
        replyMode={replyMode}
        aiInstruction={aiInstruction}
        replyDelay={replyDelay}
        ruleName={ruleName}
        ruleActive={ruleActive}
      />

      {/* ── Video Selector Modal ── */}
      {showVideoSelector && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
          <div style={{ background: "#0D0A1A", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUpSheet 0.25s cubic-bezier(0.32, 0.72, 0, 1)" }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 4, margin: "0 auto 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>Select YouTube Video</h3>
                <button onClick={() => setShowVideoSelector(false)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={videoSearch} onChange={e => setVideoSearch(e.target.value)} placeholder="Search by title or video ID…" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "10px 14px 10px 36px", fontSize: 13 }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
              {videosLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1, 2, 3, 4].map(i => <VideoSkeleton key={i} />)}
                </div>
              ) : filteredVideos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{videos.length === 0 ? "📺" : "🔍"}</div>
                  <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 15 }}>{videos.length === 0 ? "No YouTube videos found" : "No results found"}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.4 }}>{videos.length === 0 ? "Connect your YouTube channel in Settings to load your videos." : "Try a different search term."}</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredVideos.map(v => (
                    <VideoCard key={v.id} video={v} selected={selectedVideo?.id === v.id} onClick={() => { setSelectedVideo(v); setShowVideoSelector(false); setVideoSearch(""); }} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "10px 16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, flexShrink: 0, paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}>
              <button onClick={() => { setShowVideoSelector(false); setVideoSearch(""); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { setShowVideoSelector(false); setVideoSearch(""); }} disabled={!selectedVideo} style={{ background: selectedVideo ? "linear-gradient(135deg, #F59E0B, #EA580C)" : "rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: selectedVideo ? "white" : "rgba(255,255,255,0.30)", border: "none", cursor: selectedVideo ? "pointer" : "not-allowed" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ── More Drawer ── */}
      {moreOpen && (
        <>
          <div onClick={() => setMoreOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }} />
          <div style={{ position: "fixed", bottom: 70, left: 12, right: 12, zIndex: 60, background: "rgba(14,14,20,0.98)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "8px 8px 12px", boxShadow: "0 -8px 48px rgba(0,0,0,0.7)", backdropFilter: "blur(28px)", animation: "slideUp 0.2s ease" }}>
            <div style={{ width: 34, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 4, margin: "6px auto 14px" }} />
            {[
              { icon: "💳", label: "Billing",    href: "/billing"    },
              { icon: "📊", label: "Analytics",  href: "/analytics"  },
              { icon: "🤖", label: "Moderation", href: "/moderation" },
              { icon: "⚙️", label: "Settings",   href: "/settings"   },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, textDecoration: "none", color: "rgba(255,255,255,0.75)", fontWeight: 600, fontSize: 14 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>{item.label}
              </Link>
            ))}
            <div style={{ margin: "8px 16px 0", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
              <button onClick={() => { setMoreOpen(false); router.push("/login"); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", background: "none", border: "none", cursor: "pointer", color: "#f87171", fontWeight: 600, fontSize: 14, width: "100%" }}>
                <span style={{ fontSize: 20 }}>🚪</span> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}