"use client";
import { useState } from "react";
import Link from "next/link";

const SIDEBAR_LINKS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/automation", label: "Automation", icon: "⚡" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

const STEPS = ["Select Video", "Keywords", "Auto Reply", "Advanced"];

const SAMPLE_VIDEOS = [
  { id: "1", title: "My Latest YouTube Video", date: "Jul 1, 2026", views: "12.4K", comments: 234, thumb: "🎬" },
  { id: "2", title: "How I Built ModrateAI", date: "Jun 25, 2026", views: "8.1K", comments: 156, thumb: "🎥" },
  { id: "3", title: "Telugu Tech Tips #42", date: "Jun 18, 2026", views: "22.7K", comments: 489, thumb: "📹" },
];

type Video = {
  id: string;
  title: string;
  date: string;
  views: string;
  comments: number;
  thumb: string;
};

type Rule = {
  id: number;
  name: string;
  video: Video;
  keywords: string[];
  replyMode: "random" | "ai";
  active: boolean;
};

export default function AutomationPage() {
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

  const bgStyle = {
    background: `
      radial-gradient(circle at bottom right, rgba(255,120,40,.12), transparent 30%),
      radial-gradient(circle at top left, rgba(130,70,255,.08), transparent 35%),
      #07030F
    `,
    minHeight: "100vh",
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const goLive = () => {
    if (!ruleName || !selectedVideo) return;
    setRules([...rules, {
      id: Date.now(),
      name: ruleName,
      video: selectedVideo,
      keywords,
      replyMode,
      active: ruleActive,
    }]);
    setShowBuilder(false);
    setCurrentStep(0);
    setRuleName("");
    setSelectedVideo(null);
    setKeywords([]);
  };

  return (
    <div style={bgStyle} className="flex text-white">
      {/* Sidebar */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.08)" }}
        className="w-56 min-h-screen flex flex-col p-4 fixed left-0 top-0 z-10">
        <div className="flex items-center gap-2 mb-8 mt-2">
          <span style={{ color: "#818cf8" }} className="text-xl font-bold">⚡ ModrateAI</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {SIDEBAR_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={link.href === "/automation"
                ? { background: "rgba(129,140,248,0.15)", color: "#818cf8", fontWeight: 600 }
                : { color: "rgba(255,255,255,0.5)" }}>
              <span>{link.icon}</span>{link.label}
            </Link>
          ))}
        </nav>
        <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12 }} className="p-3 mt-4">
          <div className="text-xs font-bold mb-1">Upgrade to Pro 🚀</div>
          <div className="text-xs opacity-70 mb-2">5,000 comments + live chat</div>
          <button style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8 }} className="w-full text-xs py-1.5 font-semibold">
            Upgrade — ₹299/mo
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-56 flex-1 p-8">
        {!showBuilder ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-1">Automation Rules</h1>
                <p style={{ color: "rgba(255,255,255,0.5)" }} className="text-sm">
                  Rules run in order — higher rules have higher priority
                </p>
              </div>
              <button onClick={() => setShowBuilder(true)}
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all">
                ⚡ Create Rule
              </button>
            </div>

            {/* Rules List or Empty State */}
            {rules.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}
                className="flex flex-col items-center justify-center py-24">
                <div className="text-6xl mb-4">⚡</div>
                <h2 className="text-xl font-bold mb-2">No automation rules yet</h2>
                <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm mb-6">
                  Create your first rule to auto-reply to YouTube comments
                </p>
                <button onClick={() => setShowBuilder(true)}
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                  className="px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                  ⚡ Create Your First Rule
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {rules.map((rule) => (
                  <div key={rule.id}
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 }}
                    className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div style={{ background: "rgba(129,140,248,0.15)", borderRadius: 10 }} className="w-10 h-10 flex items-center justify-center text-lg">
                        ⚡
                      </div>
                      <div>
                        <div className="font-bold">{rule.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }} className="text-xs mt-0.5">
                          {rule.video.title} • {rule.keywords.length} keywords
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ background: rule.active ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)", color: rule.active ? "#22c55e" : "rgba(255,255,255,0.4)", borderRadius: 20 }}
                        className="text-xs px-3 py-1 font-semibold">
                        {rule.active ? "● Active" : "○ Inactive"}
                      </span>
                      <button style={{ color: "rgba(255,255,255,0.3)" }} className="text-sm hover:text-white transition-all">✏️</button>
                      <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                        style={{ color: "rgba(255,100,100,0.5)" }} className="text-sm hover:text-red-400 transition-all">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Flow Builder */
          <div className="flex gap-6">
            <div className="flex-1">
              {/* Builder Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowBuilder(false)}
                    style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10 }}
                    className="w-9 h-9 flex items-center justify-center text-sm hover:opacity-80">
                    ←
                  </button>
                  <div>
                    <div style={{ color: "rgba(255,255,255,0.4)" }} className="text-xs">Automation / New Rule</div>
                    <div className="font-bold">{ruleName || "Untitled Rule"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", borderRadius: 20 }}
                    className="text-xs px-3 py-1">● Live Preview</span>
                  <button onClick={goLive}
                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                    className="px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                    🚀 Go Live
                  </button>
                </div>
              </div>

              {/* Steps Progress */}
              <div className="flex items-center gap-2 mb-8">
                {STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button onClick={() => setCurrentStep(i)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                      style={i === currentStep
                        ? { background: "rgba(129,140,248,0.2)", color: "#818cf8", fontWeight: 600, border: "1px solid rgba(129,140,248,0.3)" }
                        : i < currentStep
                          ? { color: "#22c55e" }
                          : { color: "rgba(255,255,255,0.3)" }}>
                      <span style={{ background: i <= currentStep ? (i === currentStep ? "#818cf8" : "#22c55e") : "rgba(255,255,255,0.1)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                        {i < currentStep ? "✓" : i + 1}
                      </span>
                      {step}
                    </button>
                    {i < STEPS.length - 1 && <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20 }} className="p-6">

                {/* Step 1 — Select Video */}
                {currentStep === 0 && (
                  <div>
                    <h2 className="text-lg font-bold mb-1">Select YouTube Video</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm mb-6">Choose which video to monitor for comments</p>

                    <div className="mb-5">
                      <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.6)" }}>Rule Name</label>
                      <input value={ruleName} onChange={e => setRuleName(e.target.value)}
                        placeholder="e.g. Spam Filter Rule"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white" }}
                        className="w-full px-4 py-2.5 text-sm outline-none focus:border-purple-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <button onClick={() => setShowVideoSelector(true)}
                        style={{ background: selectedVideo ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${selectedVideo ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 14 }}
                        className="p-4 text-left hover:opacity-90 transition-all">
                        <div className="text-2xl mb-2">🎬</div>
                        <div className="font-semibold text-sm">Specific Video</div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }} className="text-xs mt-1">
                          {selectedVideo ? selectedVideo.title : "Choose a video"}
                        </div>
                      </button>
                      {[
                        { label: "Future Videos", icon: "🔮" },
                        { label: "Latest Video", icon: "🆕" },
                        { label: "All Videos", icon: "📺" },
                      ].map(opt => (
                        <div key={opt.label}
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, opacity: 0.5 }}
                          className="p-4 relative">
                          <div className="text-2xl mb-2">{opt.icon}</div>
                          <div className="font-semibold text-sm">{opt.label}</div>
                          <span style={{ background: "rgba(234,179,8,0.2)", color: "#eab308", borderRadius: 6, fontSize: 10 }}
                            className="absolute top-3 right-3 px-2 py-0.5 font-bold">PRO</span>
                        </div>
                      ))}
                    </div>

                    <button onClick={() => setCurrentStep(1)}
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                      className="w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                      Next — Set Keywords →
                    </button>
                  </div>
                )}

                {/* Step 2 — Keywords */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-lg font-bold mb-1">Keyword Triggers</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm mb-6">Comments matching these keywords will trigger auto-reply</p>

                    <div style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 12 }}
                      className="flex items-center justify-between p-4 mb-5">
                      <div>
                        <div className="font-semibold text-sm">AI Intent Detection</div>
                        <div style={{ color: "rgba(255,255,255,0.4)" }} className="text-xs">Semantic matching — understands meaning, not just words</div>
                      </div>
                      <button onClick={() => setAiDetection(!aiDetection)}
                        style={{ background: aiDetection ? "#7c3aed" : "rgba(255,255,255,0.1)", borderRadius: 20, width: 44, height: 24, transition: "all 0.2s" }}
                        className="relative flex-shrink-0">
                        <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: aiDetection ? 23 : 3, transition: "all 0.2s" }} />
                      </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addKeyword()}
                        placeholder="Type keyword and press Enter"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white" }}
                        className="flex-1 px-4 py-2.5 text-sm outline-none" />
                      <button onClick={addKeyword}
                        style={{ background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 10 }}
                        className="px-4 py-2.5 text-sm font-semibold text-purple-300">+ Add</button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {keywords.map(kw => (
                        <span key={kw}
                          style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)", borderRadius: 20, color: "#a5b4fc" }}
                          className="flex items-center gap-1.5 px-3 py-1 text-sm">
                          {kw}
                          <button onClick={() => setKeywords(keywords.filter(k => k !== kw))} className="opacity-50 hover:opacity-100 ml-1">×</button>
                        </span>
                      ))}
                      {keywords.length === 0 && (
                        <span style={{ color: "rgba(255,255,255,0.3)" }} className="text-sm">No keywords added yet</span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(0)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                        className="flex-1 py-3 text-sm font-semibold">← Back</button>
                      <button onClick={() => setCurrentStep(2)}
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12 }}
                        className="flex-1 py-3 text-sm font-bold">Next — Auto Reply →</button>
                    </div>
                  </div>
                )}

                {/* Step 3 — Auto Reply */}
                {currentStep === 2 && (
                  <div>
                    <h2 className="text-lg font-bold mb-1">Auto Reply Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm mb-6">Configure how the bot replies to matched comments</p>

                    <div className="flex gap-2 mb-5">
                      {(["random", "ai"] as const).map(mode => (
                        <button key={mode} onClick={() => setReplyMode(mode)}
                          style={replyMode === mode
                            ? { background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.4)", color: "#818cf8", borderRadius: 10 }
                            : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}
                          className="px-5 py-2 text-sm font-semibold capitalize">
                          {mode === "random" ? "🎲 Random Templates" : "🤖 AI Generated"}
                        </button>
                      ))}
                    </div>

                    {replyMode === "random" ? (
                      <div className="flex flex-col gap-3 mb-6">
                        {replies.map((r, i) => (
                          <div key={i}>
                            <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Reply {i + 1}</label>
                            <input value={r} onChange={e => { const arr = [...replies]; arr[i] = e.target.value; setReplies(arr); }}
                              placeholder={`Template reply ${i + 1}...`}
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white" }}
                              className="w-full px-4 py-2.5 text-sm outline-none" />
                          </div>
                        ))}
                        <div style={{ color: "rgba(255,255,255,0.3)" }} className="text-xs">
                          Use {"{{username}}"} to mention the commenter
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>AI Instruction</label>
                        <textarea value={aiInstruction} onChange={e => setAiInstruction(e.target.value)}
                          placeholder="e.g. Reply politely in Telugu, thank them for watching and invite them to subscribe..."
                          rows={4}
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", resize: "none" }}
                          className="w-full px-4 py-2.5 text-sm outline-none" />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(1)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                        className="flex-1 py-3 text-sm font-semibold">← Back</button>
                      <button onClick={() => setCurrentStep(3)}
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12 }}
                        className="flex-1 py-3 text-sm font-bold">Next — Advanced →</button>
                    </div>
                  </div>
                )}

                {/* Step 4 — Advanced Settings */}
                {currentStep === 3 && (
                  <div>
                    <h2 className="text-lg font-bold mb-1">Advanced Settings</h2>
                    <p style={{ color: "rgba(255,255,255,0.4)" }} className="text-sm mb-6">Fine-tune your automation rule</p>

                    <div className="flex flex-col gap-4 mb-6">
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                        className="flex items-center justify-between p-4">
                        <div>
                          <div className="font-semibold text-sm">Public Reply</div>
                          <div style={{ color: "rgba(255,255,255,0.4)" }} className="text-xs">Reply visible to everyone on the video</div>
                        </div>
                        <button onClick={() => setPublicReply(!publicReply)}
                          style={{ background: publicReply ? "#7c3aed" : "rgba(255,255,255,0.1)", borderRadius: 20, width: 44, height: 24, transition: "all 0.2s" }}
                          className="relative flex-shrink-0">
                          <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: publicReply ? 23 : 3, transition: "all 0.2s" }} />
                        </button>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} className="p-4">
                        <div className="font-semibold text-sm mb-3">Reply Delay</div>
                        <div className="flex gap-2">
                          {[20, 40, 60].map(d => (
                            <button key={d} onClick={() => setReplyDelay(d)}
                              style={replyDelay === d
                                ? { background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.4)", color: "#818cf8", borderRadius: 8 }
                                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                              className="px-4 py-2 text-sm font-semibold">
                              {d}s
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                        className="flex items-center justify-between p-4">
                        <div>
                          <div className="font-semibold text-sm">Rule Status</div>
                          <div style={{ color: ruleActive ? "#22c55e" : "rgba(255,255,255,0.4)" }} className="text-xs">
                            {ruleActive ? "● Active" : "○ Inactive"}
                          </div>
                        </div>
                        <button onClick={() => setRuleActive(!ruleActive)}
                          style={{ background: ruleActive ? "#22c55e" : "rgba(255,255,255,0.1)", borderRadius: 20, width: 44, height: 24, transition: "all 0.2s" }}
                          className="relative flex-shrink-0">
                          <div style={{ background: "white", borderRadius: "50%", width: 18, height: 18, position: "absolute", top: 3, left: ruleActive ? 23 : 3, transition: "all 0.2s" }} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setCurrentStep(2)}
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                        className="flex-1 py-3 text-sm font-semibold">← Back</button>
                      <button onClick={goLive}
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12 }}
                        className="flex-1 py-3 text-sm font-bold">🚀 Go Live!</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Panel */}
            <div style={{ width: 280 }} className="flex-shrink-0">
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, position: "sticky", top: 24 }} className="p-5">
                <div className="text-sm font-bold mb-4">📱 Live Preview</div>
                <div style={{ background: "#000", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ background: "#111", padding: "60px 16px 16px", textAlign: "center" }}>
                    <div className="text-4xl mb-2">{selectedVideo ? selectedVideo.thumb : "🎬"}</div>
                    <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {selectedVideo ? selectedVideo.title : "No video selected"}
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div className="text-xs font-bold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Comments</div>
                    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 10px" }} className="mb-2">
                      <div className="text-xs font-semibold mb-1">👤 User</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {keywords.length > 0 ? `"${keywords[0]}"` : "Example comment..."}
                      </div>
                    </div>
                    {keywords.length > 0 && (
                      <div style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: 10, padding: "8px 10px" }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: "#818cf8" }}>🤖 ModrateAI Bot</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {replies[0] || "Auto reply will appear here..."}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Selector Popup */}
      {showVideoSelector && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#0f0a1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 500, maxHeight: "80vh", overflow: "auto" }} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Select YouTube Video</h3>
              <button onClick={() => setShowVideoSelector(false)} style={{ color: "rgba(255,255,255,0.4)" }}>✕</button>
            </div>
            <div className="flex flex-col gap-3">
              {SAMPLE_VIDEOS.map(v => (
                <button key={v.id} onClick={() => { setSelectedVideo(v); setShowVideoSelector(false); }}
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${selectedVideo?.id === v.id ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14 }}
                  className="flex items-center gap-4 p-4 text-left hover:opacity-90 transition-all">
                  <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }} className="text-3xl flex-shrink-0">
                    {v.thumb}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm mb-1">{v.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)" }} className="text-xs">{v.date} • 👁 {v.views} • 💬 {v.comments}</div>
                  </div>
                  {selectedVideo?.id === v.id && <span style={{ color: "#818cf8" }}>✓</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowVideoSelector(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                className="flex-1 py-2.5 text-sm font-semibold">Cancel</button>
              <button onClick={() => setShowVideoSelector(false)}
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12 }}
                className="flex-1 py-2.5 text-sm font-bold">Confirm Selection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}