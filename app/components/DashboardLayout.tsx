"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Shield, Star, LogOut, MoreHorizontal, X } from "lucide-react";
import { useState } from "react";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Overview", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { href: "/automation", label: "Automation", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )},
  { href: "/live-feed", label: "Live Feed", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><path d="M20.07 4.93a10 10 0 0 1 0 14.14"/><path d="M3.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  )},
  { href: "/analytics", label: "Analytics", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
  { href: "/alerts", label: "Alerts", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  )},
  { href: "/billing", label: "Billing", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  )},
  { href: "/settings", label: "Settings", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

// Bottom nav: only 5 main + More
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
{ href: "/analytics", label: "Analytics", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
];

const MORE_LINKS = [
  { href: "/billing", label: "Billing", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  )},
  { href: "/channels", label: "Channels", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
  )},
  { href: "/notifications", label: "Notifications", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
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
    <aside style={{
      width: 240,
      background: "rgba(9,9,11,0.85)",
      borderRight: "1px solid #27272A",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      height: "100vh",
      backdropFilter: "blur(20px)",
      zIndex: 20,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #27272A" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            background: "linear-gradient(135deg,#F59E0B,#7C3AED)",
            borderRadius: 10, width: 34, height: 34,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(245,158,11,0.30)",
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ color: "#FAFAFA", fontWeight: 800, fontSize: 17 }}>ModerateAI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
        {SIDEBAR_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 12,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                color: active ? "#FAFAFA" : "rgba(255,255,255,0.45)",
                background: active
                  ? "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(234,88,12,0.16))"
                  : "transparent",
                border: active
                  ? "1px solid rgba(245,158,11,0.28)"
                  : "1px solid transparent",
                boxShadow: active
                  ? "0 0 24px rgba(245,158,11,0.12), inset 0 0 16px rgba(245,158,11,0.06)"
                  : "none",
                transition: "all 0.18s ease",
              }}
            >
              {link.icon}
              {link.label}
              {active && (
                <span style={{
                  marginLeft: "auto",
                  background: "rgba(245,158,11,0.85)",
                  color: "#09090B",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                }}>live</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade + Logout */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #27272A", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Star size={14} color="#F59E0B" />
            <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>Upgrade to Pro</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
            Unlock unlimited hidden comments and Telegram alerts.
          </p>
          <Link href="/billing">
            <button style={{
              background: "linear-gradient(135deg,#F59E0B,#FBBF24)",
              color: "#09090B", fontWeight: 700,
              padding: "10px 16px", borderRadius: 10,
              border: "none", cursor: "pointer",
              fontSize: 13, width: "100%",
            }}>
              Upgrade — ₹349/mo
            </button>
          </Link>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10,
            fontSize: 14, fontWeight: 500,
            color: "rgba(255,255,255,0.4)",
            background: "none", border: "none",
            cursor: "pointer", width: "100%",
            transition: "all 0.2s",
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

export function DashboardBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = async () => { await signOut(auth); router.push("/"); };

  const isMoreActive = MORE_LINKS.some(l => pathname === l.href);

  return (
    <>
      {/* More Sheet Overlay */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 48,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* More Bottom Sheet */}
      <div style={{
        position: "fixed",
        bottom: showMore ? 65 : -300,
        left: 0, right: 0,
        zIndex: 49,
        background: "rgba(18,18,20,0.98)",
        borderTop: "1px solid #27272A",
        borderRadius: "20px 20px 0 0",
        padding: "16px 12px 12px",
        transition: "bottom 0.28s cubic-bezier(0.32,0.72,0,1)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 4px" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>More</span>
          <button onClick={() => setShowMore(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {MORE_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMore(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12,
                  textDecoration: "none",
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  color: active ? "#F59E0B" : "rgba(255,255,255,0.7)",
                  background: active ? "rgba(245,158,11,0.1)" : "transparent",
                  border: active ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 12,
              fontSize: 14, fontWeight: 500,
              color: "rgba(255,80,80,0.8)",
              background: "none", border: "1px solid transparent",
              cursor: "pointer", width: "100%",
              transition: "all 0.15s",
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 50,
        background: "rgba(9,9,11,0.97)",
        borderTop: "1px solid #27272A",
        backdropFilter: "blur(20px)",
        padding: "8px 0 env(safe-area-inset-bottom, 8px)",
        display: "flex",
      }}>
        {BOTTOM_NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, flex: 1, padding: "6px 2px",
                textDecoration: "none",
                color: active ? "#F59E0B" : "rgba(255,255,255,0.4)",
                fontSize: 9, fontWeight: active ? 600 : 500,
                transition: "all 0.2s",
                position: "relative",
              }}
            >
              {active && (
                <span style={{
                  position: "absolute",
                  top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 28, height: 2,
                  background: "linear-gradient(90deg,#F59E0B,#EA580C)",
                  borderRadius: "0 0 4px 4px",
                }} />
              )}
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMore(prev => !prev)}
          style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 3, flex: 1, padding: "6px 2px",
            background: "none", border: "none",
            cursor: "pointer",
            color: (showMore || isMoreActive) ? "#F59E0B" : "rgba(255,255,255,0.4)",
            fontSize: 9, fontWeight: (showMore || isMoreActive) ? 600 : 500,
            position: "relative",
          }}
        >
          {(showMore || isMoreActive) && (
            <span style={{
              position: "absolute",
              top: 0, left: "50%",
              transform: "translateX(-50%)",
              width: 28, height: 2,
              background: "linear-gradient(90deg,#F59E0B,#EA580C)",
              borderRadius: "0 0 4px 4px",
            }} />
          )}
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}