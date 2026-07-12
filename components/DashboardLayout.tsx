"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Shield, Star, LogOut, CreditCard } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { href: "/analytics", label: "Analytics", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
  { href: "/automation", label: "Automation", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )},
  { href: "/alerts", label: "Alerts", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  )},
  { href: "/settings", label: "Settings", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
  { href: "/billing", label: "Billing", icon: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  )},
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => { await signOut(auth); router.push("/"); };

  return (
    <aside style={{ width: 240, background: "rgba(9,9,11,0.8)", borderRight: "1px solid #27272A", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", backdropFilter: "blur(20px)", zIndex: 20 }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid #27272A" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg,#F59E0B,#7C3AED)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ color: "#FAFAFA", fontWeight: 800, fontSize: 17 }}>ModerateAI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 500, color: active ? "#F59E0B" : "rgba(255,255,255,0.5)", background: active ? "rgba(245,158,11,0.12)" : "transparent", borderLeft: active ? "2px solid #F59E0B" : "2px solid transparent", transition: "all 0.2s" }}>
              {link.icon} {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade + Logout */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid #27272A", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Star size={14} color="#F59E0B" />
            <span style={{ color: "#F59E0B", fontWeight: 700, fontSize: 13 }}>Upgrade to Pro</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>Unlock unlimited hidden comments and Telegram alerts.</p>
          <Link href="/billing">
            <button style={{ background: "linear-gradient(135deg,#F59E0B,#FBBF24)", color: "#09090B", fontWeight: 700, padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, width: "100%" }}>
              Upgrade — ₹349/mo
            </button>
          </Link>
        </div>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", width: "100%", transition: "all 0.2s" }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

export function DashboardBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => { await signOut(auth); router.push("/"); };

  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "rgba(9,9,11,0.95)", borderTop: "1px solid #27272A", backdropFilter: "blur(20px)", padding: "8px 0 env(safe-area-inset-bottom, 8px)", display: "flex" }}>
      {NAV_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, flex: 1, padding: "6px 4px", textDecoration: "none", color: active ? "#F59E0B" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: active ? 600 : 500, transition: "all 0.2s" }}>
            {link.icon}
            <span>{link.label}</span>
          </Link>
        );
      })}
      <button onClick={handleLogout} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, flex: 1, padding: "6px 4px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 500 }}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </nav>
  );
}