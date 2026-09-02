"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import { useState, useEffect } from "react";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Overview", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { href: "/live-feed", label: "Live Feed", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  )},
  { href: "/moderation", label: "Moderation", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  )},
  { href: "/automation", label: "Automation", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )},
  { href: "/alerts", label: "Alerts", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  )},
  { href: "/analytics", label: "Analytics", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
  { href: "/billing", label: "Billing", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  )},
  { href: "/settings", label: "Settings", icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

const BOTTOM_NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { href: "/live-feed", label: "Live Feed", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  )},
  { href: "/automation", label: "Automation", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )},
  { href: "/alerts", label: "Alerts", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  )},
];

const MORE_LINKS = [
  { href: "/billing", label: "Billing", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  )},
  { href: "/analytics", label: "Analytics", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
  { href: "/moderation", label: "Moderation", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  )},
  { href: "/settings", label: "Settings", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => { await signOut(auth); router.push("/"); };

  return (
    <>
      <style>{`
        @keyframes sidebarPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .snav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px; border-radius: 12px;
          text-decoration: none; font-size: 13px; font-weight: 500;
          color: rgba(220,195,165,0.52); border: 1px solid transparent;
          position: relative; transition: all 0.22s; cursor: pointer; overflow: hidden;
        }
        .snav-item:hover {
          background: rgba(245,158,11,0.055);
          color: rgba(240,220,190,0.88);
          transform: translateX(3px);
          border-color: rgba(245,158,11,0.08);
        }
        .snav-item.active {
          background: linear-gradient(135deg, rgba(245,158,11,0.32) 0%, rgba(245,158,11,0.18) 50%, rgba(245,158,11,0.10) 100%);
          color: #FBBF24; font-weight: 700;
          border-color: rgba(245,158,11,0.40);
          box-shadow: 0 0 0 1px rgba(245,158,11,0.18), 0 2px 24px rgba(245,158,11,0.22), 0 0 40px rgba(245,158,11,0.10), inset 0 1px 0 rgba(245,158,11,0.25), inset 0 0 32px rgba(245,158,11,0.10);
        }
        .snav-item.active::before {
          content: ''; position: absolute; left: 0; top: 50%;
          transform: translateY(-50%); width: 3px; height: 22px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #FBBF24, #F59E0B, #D97706);
          box-shadow: 0 0 10px rgba(245,158,11,0.8), 0 0 24px rgba(245,158,11,0.3);
        }
        .snav-live {
          display: inline-flex; align-items: center; gap: 5px;
          margin-left: auto; padding: 2px 8px; border-radius: 10px;
          font-size: 9px; font-weight: 700; color: #F9A825;
          background: rgba(255,159,26,.12); border: 1px solid rgba(255,159,26,.35);
        }
        .snav-live-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #F59E0B; animation: sidebarPulse 1.6s ease-in-out infinite;
        }
        .snav-logout:hover { color: rgba(255,100,100,0.75) !important; background: rgba(255,80,80,0.06) !important; }
      `}</style>

      <aside style={{
        width: 228,
        background: "radial-gradient(ellipse 80% 40% at -10% 0%, rgba(180,90,0,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 30% at -5% 30%, rgba(150,70,0,0.20) 0%, transparent 55%), #0c0a0e",
        borderRight: "1px solid rgba(245,158,11,0.12)",
        display: "flex", flexDirection: "column",
        position: "fixed", height: "100vh",
        backdropFilter: "blur(24px)",
        boxShadow: "4px 0 40px rgba(0,0,0,0.6), 8px 0 80px rgba(180,90,0,0.06)",
        zIndex: 20,
        padding: "0 10px 20px",
      }}>

        {/* Orange glow blobs */}
        <div style={{ position: "absolute", top: "-60px", left: "-80px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,90,0,0.55) 0%, rgba(160,65,0,0.28) 35%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(18px)" }} />
        <div style={{ position: "absolute", top: "160px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "radial-gradient(circle, rgba(180,75,0,0.30) 0%, rgba(130,55,0,0.12) 40%, transparent 70%)", pointerEvents: "none", zIndex: 0, filter: "blur(22px)" }} />

        {/* Logo */}
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", padding: "22px 8px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 14, position: "relative", zIndex: 1 }}>
          <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 40%, #7C3AED 100%)", borderRadius: 12, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 16px rgba(245,158,11,0.4), 0 0 0 1px rgba(245,158,11,0.2)", flexShrink: 0 }}>
            <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style={{ color: "#FAFAFA", fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.025em" }}>ModerateAI</div>
            <div style={{ color: "rgba(255,255,255,0.26)", fontSize: 10, fontWeight: 500, marginTop: 1 }}>YouTube AI Moderator</div>
          </div>
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, position: "relative", zIndex: 1 }}>
          {SIDEBAR_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`snav-item${active ? " active" : ""}`}>
                {link.icon}
                {link.label}
                {active && (
                  <span className="snav-live">
                    <span className="snav-live-dot" />live
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade + Logout */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ background: "rgba(124,58,237,.1)", border: "1px solid rgba(124,58,237,.22)", borderRadius: 14, padding: "14px", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA", marginBottom: 4 }}>Upgrade to Pro 🚀</div>
            {["25,000 comments / month", "Unlimited automation rules", "Priority support", "1,900 AI actions / month"].map(f => (
              <div key={f} style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4 }}>{f}</div>
            ))}
            <Link href="/billing">
              <button style={{ background: "linear-gradient(135deg,#F59E0B,#FBBF24)", borderRadius: 9, width: "100%", fontSize: 11.5, padding: "8px 0", fontWeight: 700, color: "#080808", border: "none", cursor: "pointer" }}>
                Upgrade — ₹349/mo
              </button>
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="snav-logout"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 12, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", width: "100%", transition: "all 0.2s" }}
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export function DashboardBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const handleLogout = async () => { await signOut(auth); router.push("/"); };
  const isMoreActive = MORE_LINKS.some(l => pathname === l.href);
  const [isMobile, setIsMobile] = useState(true);
  const [isDesktopSiteOn, setIsDesktopSiteOn] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches);
      setIsDesktopSiteOn(navigator.maxTouchPoints > 0 && window.innerWidth >= 600);
    };
    check();
    window.matchMedia("(pointer: coarse)").addEventListener("change", check);
    window.addEventListener("resize", check);
    return () => {
      window.matchMedia("(pointer: coarse)").removeEventListener("change", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  if (!isMobile) return null;

  const iconSize   = isDesktopSiteOn ? 28 : 20;
  const labelSize  = isDesktopSiteOn ? 16 : 9;
  const itemPad    = isDesktopSiteOn ? "14px 2px 18px" : "6px 2px";
  const iconBoxW   = isDesktopSiteOn ? 64 : 44;
  const iconBoxH   = isDesktopSiteOn ? 48 : 34;
  const drawerFont = isDesktopSiteOn ? 22 : 14;
  const drawerPad  = isDesktopSiteOn ? "18px 20px" : "12px 14px";
  const drawerIcon = isDesktopSiteOn ? 28 : 18;

  return (
    <>
      {showMore && (
        <div onClick={() => setShowMore(false)} style={{ position: "fixed", inset: 0, zIndex: 48, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      )}

      <div style={{
        position: "fixed",
        bottom: showMore ? 0 : -700,
        left: 0, right: 0, zIndex: 49,
        background: "rgba(20,8,45,0.75)",
        borderTop: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -12px 60px rgba(124,58,237,0.25), 0 -8px 40px rgba(0,0,0,0.7)",
        backdropFilter: "blur(28px)",
        animation: showMore ? "slideUp 0.22s ease" : "none",
      }}>
        <div style={{ width: 30, height: 3, background: "rgba(255,255,255,0.09)", borderRadius: 3, margin: "6px auto 12px" }} />

        {/* User Profile */}
        {auth.currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              {(auth.currentUser.displayName || auth.currentUser.email || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ color: "#FAFAFA", fontWeight: 700, fontSize: 14 }}>{auth.currentUser.displayName || "User"}</div>
              <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11 }}>{auth.currentUser.email}</div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div style={{ padding: "6px 8px" }}>
          {MORE_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} onClick={() => setShowMore(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: active ? 600 : 500, color: active ? "#F59E0B" : "rgba(255,255,255,0.7)", background: active ? "rgba(245,158,11,0.1)" : "transparent", border: active ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent", transition: "all 0.15s" }}>
                {link.icon}{link.label}
              </Link>
            );
          })}

          {/* Logout */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 6, paddingTop: 6, paddingBottom: 12 }}>
            <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "#f87171", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
              <LogOut size={18} color="#f87171" /> Logout
            </button>
          </div>
        </div>
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "rgba(9,9,11,0.97)", borderTop: "1px solid rgba(255,255,255,0.055)", backdropFilter: "blur(28px)", padding: "8px 0 env(safe-area-inset-bottom, 8px)", display: "flex" }}>
        {BOTTOM_NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, flex: 1, padding: itemPad, textDecoration: "none", color: active ? "#F59E0B" : "rgba(255,255,255,0.35)", fontSize: labelSize, fontWeight: active ? 600 : 500, transition: "all 0.2s", position: "relative" }}>
              {active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2, background: "linear-gradient(90deg,#F59E0B,#EA580C)", borderRadius: "0 0 4px 4px" }} />}
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: iconBoxW, height: iconBoxH, borderRadius: 10, background: active ? "rgba(245,158,11,0.15)" : "transparent", boxShadow: active ? "0 0 14px rgba(245,158,11,0.4)" : "none", transition: "all 0.2s" }}>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setShowMore(prev => !prev)} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, flex: 1, padding: itemPad, background: "none", border: "none", cursor: "pointer", color: (showMore || isMoreActive) ? "#F59E0B" : "rgba(255,255,255,0.35)", fontSize: labelSize, fontWeight: (showMore || isMoreActive) ? 600 : 500, position: "relative" }}>
          {(showMore || isMoreActive) && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2, background: "linear-gradient(90deg,#F59E0B,#EA580C)", borderRadius: "0 0 4px 4px" }} />}
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: iconBoxW, height: iconBoxH, borderRadius: 10, background: (showMore || isMoreActive) ? "rgba(245,158,11,0.15)" : "transparent", transition: "all 0.2s" }}><MoreHorizontal size={iconSize} /></span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}