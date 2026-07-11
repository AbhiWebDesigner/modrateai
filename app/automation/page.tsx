"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { href: "/analytics", label: "Analytics", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  )},
  { href: "/automation", label: "Automation", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )},
  { href: "/alerts", label: "Alerts", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  )},
  { href: "/settings", label: "Settings", icon: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
];

const STEPS = ["Select Video", "Keywords", "Auto Reply", "Advanced"];

const SAMPLE_VIDEOS = [
  { id: "1", title: "My Latest YouTube Video", date: "Jul 1, 2026", views: "12.4K", comments: 234, thumb: "🎬" },
  { id: "2", title: "How I Built ModrateAI", date: "Jun 25, 2026", views: "8.1K", comments: 156, thumb: "🎥" },
  { id: "3", title: "Telugu Tech Tips #42", date: "Jun 18, 2026", views: "22.7K", comments: 489, thumb: "📹" },
];

type Video = { id: string; title: string; date: string; views: string; comments: number; thumb: string; };
type Rule = { id: number; name: string; video: Video; keywords: string[]; replyMode: "random" | "ai"; active: boolean; };

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      width: 220, minHeight: "100vh",
      display: "flex", flexDirection: "column",
      padding: "24px 12px",
      position: "fixed", left: 0, top: 0, zIndex: 20,
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginBottom: 32, paddingLeft: 8 }}>
        <div style={{
          background: "linear-gradient(135deg, #F59E0B 0%, #EA580C 55%, #7C3AED 100%)",
          borderRadius: "50%", width: 30, height: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px rgba(245,158,11,0.25)",
        }}>
          <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span style={{ color: "#FAFAFA", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>ModrateAI</span>
      </Link>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV_LINKS.map(link => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, textDecoration: "none",
              fontSize: 14, fontWeight: active ? 600 : 400,
              color: active ? "#F59E0B" : "rgba(255,255,255,0.45)",
              background: active ? "rgba(245,158,11,0.08)" : "transparent",
              transition: "all 0.15s",
            }}>
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.20))",
        border: "1px solid rgba(124,58,237,0.30)",
        borderRadius: 14, padding: "14px 12px", marginTop: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#FAFAFA", marginBottom: 4 }}>Upgrade to Pro 🚀</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", marginBottom: 10 }}>5,000 comments + live chat</div>
        <button style={{
          background: "rgba(255,255,255,0.12)", borderRadius: 8,
          width: "100%", fontSize: 11, padding: "7px 0",
          fontWeight: 600, color: "#FAFAFA", border: "none", cursor: "pointer",
        }}>Upgrade — ₹299/mo</button>
      </div>
    </div>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(9,9,11,0.95)",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      display: "flex", backdropFilter: "blur(20px)",
    }}>
      {NAV_LINKS.map(link => {
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "10px 0 12px", textDecoration: "none", gap: 4,
            color: active ? "#F59E0B" : "rgba(255,255,255,0.35)",
            fontSize: 10, fontWeight: active ? 600 : 400,
          }}>
            {link.icon}
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function AutomationPage() {
  const pathname = usePathname();
  const [showBuilder, setShowBuilder] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [aiDetection, setAiDetection] = useState(false);
  const [replyMode, setReplyMode] = useState<"random" | "ai">("random");
  const [replies, setReplies] = useState(["", "", ""]);
  const [aiInstruction, setAiInstruction] = useState("");
  const [publicReply, setPublicReply] = useState(true);
  const [replyDelay, setReplyDelay] = useState(20);
  const [ruleActive, setRuleActive] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const goLive = () => {
    if (!ruleName || !selectedVideo) return;
    setRules([...rules, { id: Date.now(), name: ruleName, video: selectedVideo, keywords, replyMode, active: ruleActive }]);
    setShowBuilder(false); setCurrentStep(0); setRuleName(""); setSelectedVideo(null); setKeywords([]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07030F; color: white; }
        .desktop-sidebar { display: none; }
        .bottom-nav { display: flex; }
        .main-content { margin-left: 0; padding: 20px 16px 90px; }
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; }
          .bottom-nav { display: none !important; }
          .main-content { margin-left: 220px; padding: 32px 40px; }
        }
        input:focus, textarea:focus { border-color: rgba(245,158,11,0.5) !important; outline: none; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* Background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 55% 50% at 5% 15%, rgba(245,158,11,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 55% at 5% 95%, rgba(109,40,217,0.20) 0%, transparent 62%),
          #07030F
        `,
      }} />

      {/* Desktop Sidebar */}
      <div className="desktop-sidebar" style={{ flexDirection: "column" }}>
        <Sidebar pathname={pathname} />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="bottom-nav">
        <BottomNav pathname={pathname} />
      </div>

      {/* Main */}
      <main className="main-content" style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>

        {!showBuilder ? (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#FAFAFA", marginBottom: 4 }}>Automation Rules</h1>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Rules run in order — higher rules have higher priority</p>
              </div>
              <button onClick={() => setShowBuilder(true)} style={{
                background: "linear-gradient(135deg, #F59E0B, #EA580C)",
                borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                color: "white", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Create Rule
              </button>
            </div>

            {/* Rules list or empty */}
            {rules.length === 0 ? (
              <div style={{
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "64px 24px", textAlign: "center",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No automation rules yet</h2>
                <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>
                  Create your first rule to auto-reply to YouTube comments
                </p>
                <button onClick={() => setShowBuilder(true)} style={{
                  background: "linear-gradient(135deg, #F59E0B, #EA580C)",
                  borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700,
                  color: "white", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
                }}>
                  ⚡ Create Your First Rule
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rules.map(rule => (
                  <div key={rule.id} style={{
                    background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16, padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ background: "rgba(245,158,11,0.12)", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{rule.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.40)", fontSize: 12, marginTop: 2 }}>{rule.video.title} • {rule.keywords.length} keywords</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        background: rule.active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                        color: rule.active ? "#22c55e" : "rgba(255,255,255,0.35)",
                        borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600,
                      }}>{rule.active ? "● Active" : "○ Inactive"}</span>
                      <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                        style={{ color: "rgba(255,100,100,0.45)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Builder */
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Builder header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setShowBuilder(false)} style={{
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", cursor: "pointer", fontSize: 14,
                  }}>←</button>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Automation / New Rule</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{ruleName || "Untitled Rule"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", borderRadius: 20, padding: "4px 12px", fontSize: 11 }}>● Live Preview</span>
                  <button onClick={goLive} style={{
                    background: "linear-gradient(135deg, #F59E0B, #EA580C)",
                    borderRadius: 12, padding: "9px 20px", fontSize: 13, fontWeight: 700,
                    color: "white", border: "none", cursor: "pointer",
                  }}>🚀 Go Live</button>
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
                {STEPS.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setCurrentStep(i)} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer", border: "none",
                      background: i === currentStep ? "rgba(245,158,11,0.12)" : "transparent",
                      color: i === currentStep ? "#F59E0B" : i < currentStep ? "#22c55e" : "rgba(255,255,255,0.30)",
                      fontWeight: i === currentStep ? 600 : 400,
                      outline: i === currentStep ? "1px solid rgba(245,158,11,0.30)" : "none",
                    }}>
                      <span style={{
                        background: i === currentStep ? "#F59E0B" : i < currentStep ? "#22c55e" : "rgba(255,255,255,0.10)",
                        color: i <= currentStep ? (i < currentStep ? "white" : "#07030F") : "rgba(255,255,255,0.4)",
                        borderRadius: "50%", width: 20, height: 20,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>
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

                {/* Step 1 */}
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
                      <button onClick={() => setShowVideoSelector(true)} style={{
                        background: selectedVideo ? "rgba(245,158,11,0.10)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selectedVideo ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 14, padding: 16, textAlign: "left", cursor: "pointer", color: "white",
                      }}>
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

                {/* Step 2 */}
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
                      <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword()}
                        placeholder="Type keyword and press Enter"
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

                {/* Step 3 */}
                {currentStep === 2 && (
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Auto Reply Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>Configure how the bot replies to matched comments</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      {(["random", "ai"] as const).map(mode => (
                        <button key={mode} onClick={() => setReplyMode(mode)} style={{
                          padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                          background: replyMode === mode ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
                          color: replyMode === mode ? "#F59E0B" : "rgba(255,255,255,0.45)",
                          outline: replyMode === mode ? "1px solid rgba(245,158,11,0.30)" : "none",
                        }}>
                          {mode === "random" ? "🎲 Random Templates" : "🤖 AI Generated"}
                        </button>
                      ))}
                    </div>
                    {replyMode === "random" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                        {replies.map((r, i) => (
                          <div key={i}>
                            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", display: "block", marginBottom: 6 }}>Reply {i + 1}</label>
                            <input value={r} onChange={e => { const arr = [...replies]; arr[i] = e.target.value; setReplies(arr); }}
                              placeholder={`Template reply ${i + 1}...`}
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "10px 14px", fontSize: 14 }} />
                          </div>
                        ))}
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Use {"{"}{"{"} username {"}"}{"}"}  to mention the commenter</div>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 24 }}>
                        <label style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", display: "block", marginBottom: 6 }}>AI Instruction</label>
                        <textarea value={aiInstruction} onChange={e => setAiInstruction(e.target.value)}
                          placeholder="e.g. Reply politely in Telugu, thank them for watching and invite them to subscribe..." rows={4}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "white", width: "100%", padding: "10px 14px", fontSize: 14, resize: "none" }} />
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => setCurrentStep(3)} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>Next — Advanced →</button>
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {currentStep === 3 && (
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Advanced Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginBottom: 24 }}>Fine-tune your automation rule</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                      {[
                        { label: "Public Reply", sub: "Reply visible to everyone on the video", val: publicReply, set: setPublicReply },
                        { label: "Rule Status", sub: ruleActive ? "● Active" : "○ Inactive", val: ruleActive, set: setRuleActive, green: true },
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
                            <button key={d} onClick={() => setReplyDelay(d)} style={{
                              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                              background: replyDelay === d ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)",
                              color: replyDelay === d ? "#F59E0B" : "rgba(255,255,255,0.45)",
                              outline: replyDelay === d ? "1px solid rgba(245,158,11,0.30)" : "none",
                            }}>{d}s</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setCurrentStep(2)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>← Back</button>
                      <button onClick={goLive} style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderRadius: 12, flex: 1, padding: 13, fontSize: 13, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}>🚀 Go Live!</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview — desktop only */}
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
                <button key={v.id} onClick={() => { setSelectedVideo(v); setShowVideoSelector(false); }} style={{
                  background: "rgba(255,255,255,0.03)", border: `1px solid ${selectedVideo?.id === v.id ? "rgba(245,158,11,0.40)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 14, display: "flex", alignItems: "center", gap: 14, padding: 14, textAlign: "left", cursor: "pointer", color: "white",
                }}>
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
        @media (min-width: 1024px) {
          .preview-panel { display: block !important; }
        }
      `}</style>
    </>
  );
}