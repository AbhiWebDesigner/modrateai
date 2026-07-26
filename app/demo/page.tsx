'use client';
import { useState } from 'react';
import { Shield, Send, Trash2, Check, MessageSquare, ArrowLeft, Clock, Ban } from 'lucide-react';
import Link from 'next/link';

interface Result {
  comment: string;
  action: 'KEPT' | 'HIDDEN' | 'REPLIED' | 'SPAM' | 'TIMEOUT';
  reason: string;
  reply?: string;
  language: string;
  time: string;
  confidence: number;
}

const sampleComments = [
  // Good (REPLIED)
  'Bhai bohot acha video tha! 🙌',
  'ella unaru anna? video chala bagundi!',
  'Great content keep it up! 🔥',
  'Super video bro 👍',
  'مرحبا، فيديو رائع جداً!',
  'очень хорошее видео!',
  'வீடியோ மிகவும் நன்றாக இருந்தது!',
  'Zabardast video hai bhai! 🙏',
  // Toxic / Bad (HIDDEN or TIMEOUT)
  'lanajakodaka',
  'nee amma denganu errypuka',
  'kys bro you are trash',
  'madarchod saala',
  // Spam (SPAM)
  'Click here to win FREE iPhone!!!',
  'Subscribe to my channel for free gifts! www.spam.com',
  // Neutral (KEPT)
  'ok',
  'hmm interesting',
];

// Fallback regex patterns (if API fails)
const TOXIC_PATTERNS = /denganu|errypuka|lanajakodaka|lanjakodka|puku|modda|gudda|denge|dengudu|naayala|nakkalata|lanja|lanjakoduku|nee amma|ni amma|mee amma|chutiya|gaandu|lavde|bhosdi|maderchod|behenchod|madarchod|bhadwa|randi|harami|kutte|saala|haramzada|teri maa|teri behen|tere baap|bhad mein|gand|lund|fuck\s*you|fuck off|motherfucker|sisterfucker|kys|kill yourself|die\b|asshole|bastard|bitch\b|cunt\b|dick\b|prick\b|whore\b|slut\b|nigger|faggot|retard|idiot|stupid|trash|bc\b|mc\b|sala\b|кретин|ублюдок|сука\b|блядь|мудак|придурок|шлюха|дебил|خنزير|كلب\b|عاهرة|لعنة|يلعن|حمار\b|connard|merde\b|putain|salope|puta\b|cabron|pendejo|chinga|hijo de puta|coño|joder|scheisse|scheiße|arschloch|wichser|fotze|hurensohn|vaffanculo|coglione|stronzo|porra\b|caralho|filho da puta|গাধা|শালা|মাদারচোদ|বেশ্যা|haraamzada|kamina|kameena/i;
const SPAM_PATTERNS = /click here|free iphone|win \$|earn money|make \$\d+|work from home|limited offer|buy now|check my channel|follow me|subscribe to my|visit my|www\.|http|\.com\b|\.net\b|giveaway|free gift|promo code|discount code|check bio|link in bio|dm me for|inbox me|whatsapp me|call me at|\d{10}|t\.me\/|join now|sign up now|exclusive deal|act now/i;
const POSITIVE_PATTERNS = /good|great|nice|excellent|amazing|awesome|wonderful|fantastic|superb|brilliant|love|best|beautiful|perfect|helpful|thank|thanks|appreciated|incredible|outstanding|impressive|well done|keep it up|bagundi|chala bagundi|super|bohot acha|bahut accha|mast hai|zabardast|wah|bahut badhiya|shandar|kamaal|நன்றாக|மிகவும்|சூப்பர்|அருமை|رائع|ممتاز|جميل|شكرا|отлично|хорошее|молодец|спасибо|très bien|magnifique|bravo|merci|muy bien|excelente|increíble|gracias|sehr gut|ausgezeichnet|wunderbar|danke|ottimo|molto bene|grazie|muito bom|obrigado|すごい|良い|ありがとう|좋아요|감사합니다|대박|很好|谢谢|棒|厉害/i;

function detectLanguage(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi / Devanagari';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian / Cyrillic';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u3040-\u30FF]/.test(text)) return 'Japanese';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean';
  if (/[\u0980-\u09FF]/.test(text)) return 'Bengali';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';
  if (/\b(amma|anna|bhai|yaar|bro|acha|bagundi|chala|errypuka|denganu)\b/i.test(text)) return 'Indian (Tenglish/Hinglish)';
  return 'English / Latin';
}

function fallbackClassify(text: string): Omit<Result, 'comment' | 'time'> {
  const isToxic = TOXIC_PATTERNS.test(text);
  const isSpam = SPAM_PATTERNS.test(text);
  const isPositive = POSITIVE_PATTERNS.test(text);
  const isRepetitive = /(.{3,})\1{2,}/.test(text);
  const wordCount = text.trim().split(/\s+/).length;

  if (isToxic) {
    const isSevere = /(kys|kill yourself|die\b|motherfucker|maderchod|denganu|errypuka|lanajakodaka|madarchod|behenchod|nee amma|ni amma|fuck\s*you|сука|блядь)/i.test(text);
    return {
      action: isSevere ? 'HIDDEN' : 'TIMEOUT',
      reason: isSevere ? 'Severe abuse detected — hidden from public' : 'Abusive language — comment timed out',
      language: detectLanguage(text),
      confidence: isSevere ? 97 : 91,
    };
  }
  if (isSpam || isRepetitive) {
    return { action: 'SPAM', reason: 'Spam or promotional content detected', language: detectLanguage(text), confidence: 93 };
  }
  if (isPositive || wordCount >= 3) {
    const replies = [
      'Thank you so much! 🙏 Really appreciate your support!',
      'Glad you enjoyed it! More coming soon 🔥',
      'Your support means everything! Stay tuned 🙌',
      'Thanks a lot! Drop a like if you loved it ❤️',
    ];
    return {
      action: 'REPLIED',
      reason: 'Positive comment — AI auto-reply sent',
      reply: replies[Math.floor(Math.random() * replies.length)],
      language: detectLanguage(text),
      confidence: 88,
    };
  }
  return { action: 'KEPT', reason: 'Neutral comment — kept as is', language: detectLanguage(text), confidence: 82 };
}

const ACTION_CONFIG = {
  HIDDEN:  { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    glow: 'shadow-red-100',    dot: 'bg-red-500',    icon: <Trash2 className="w-4 h-4" /> },
  SPAM:    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', glow: 'shadow-orange-100', dot: 'bg-orange-500', icon: <Ban className="w-4 h-4" /> },
  TIMEOUT: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', glow: 'shadow-yellow-100', dot: 'bg-yellow-500', icon: <Clock className="w-4 h-4" /> },
  REPLIED: { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   glow: 'shadow-blue-100',  dot: 'bg-blue-500',  icon: <MessageSquare className="w-4 h-4" /> },
  KEPT:    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  glow: 'shadow-green-100', dot: 'bg-green-500', icon: <Check className="w-4 h-4" /> },
};

function ActionBadge({ action }: { action: Result['action'] }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${cfg.bg} ${cfg.text}`}>
      {cfg.icon} {action}
    </span>
  );
}

export default function DemoPage() {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [animateResult, setAnimateResult] = useState(false);
  const [usingAI, setUsingAI] = useState(true);

  const analyzeComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setAnimateResult(false);
    setComment('');

    let newResult: Result;

    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: trimmed }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();

      const validActions = ['HIDDEN', 'TIMEOUT', 'SPAM', 'REPLIED', 'KEPT'];
      const safeAction = validActions.includes(data.action) ? data.action : 'KEPT';
      newResult = {
        comment: trimmed,
        action: safeAction,
        reason: data.reason || 'AI analyzed',
        reply: (data.reply && data.reply !== 'null' && data.reply !== null) ? data.reply : undefined,
        language: data.language || detectLanguage(text),
        time: new Date().toLocaleTimeString(),
        confidence: Number(data.confidence) || 90,
      };
      setUsingAI(true);
    } catch {
      // Fallback to regex
      const fallback = fallbackClassify(trimmed);
      newResult = {
        comment: trimmed,
        ...fallback,
        time: new Date().toLocaleTimeString(),
      };
      setUsingAI(false);
    }

    setResult(newResult);
    setAnimateResult(true);
    setHistory(prev => [newResult, ...prev.slice(0, 9)]);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes slideInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeScale { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes slideInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseRing { 0% { box-shadow:0 0 0 0 rgba(59,130,246,0.4); } 70% { box-shadow:0 0 0 10px rgba(59,130,246,0); } 100% { box-shadow:0 0 0 0 rgba(59,130,246,0); } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        .anim-down  { animation: slideInDown 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-scale { animation: fadeScale 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-up    { animation: slideInUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-ring  { animation: pulseRing 0.8s ease both; }
        .shimmer-bar { background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%); background-size:400px 100%; animation:shimmer 1.2s infinite; border-radius:6px; height:14px; }
      `}</style>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-2 font-black text-lg text-blue-600">
            <Shield className="w-5 h-5" /> ModerateAI
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-bold">Live Demo</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${usingAI ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${usingAI ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {usingAI ? 'ModerateAI Active' : 'Offline Mode'}
          </div>
          <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            Get Started →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">

        {/* HERO */}
        <div className="text-center mb-10 anim-down">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-2 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Real AI · 100+ languages · Powered by ModerateAI
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">See ModerateAI in action</h1>
          <p className="text-gray-500 text-lg">Type any comment in Telugu, Hindi, Tamil, Arabic, Russian or any language. AI judges instantly.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {(['HIDDEN','SPAM','TIMEOUT','REPLIED','KEPT'] as const).map(a => (
              <span key={a} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${ACTION_CONFIG[a].bg} ${ACTION_CONFIG[a].text}`}>
                {ACTION_CONFIG[a].icon} {a}
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-black text-gray-900 mb-4">Test a comment</h2>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyzeComment(comment); } }}
                placeholder="Type any comment in Telugu, Hindi, Tamil, English, Arabic, Russian... AI will analyze instantly!"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none h-28 transition-colors"
              />
              <button
                onClick={() => analyzeComment(comment)}
                disabled={loading || !comment.trim()}
                className="w-full mt-3 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> AI Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Analyze Comment</>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-black text-gray-900 mb-4">Try sample comments</h2>
              <div className="space-y-2">
                {sampleComments.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => analyzeComment(s)}
                    disabled={loading}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-600 transition-all border border-gray-100 hover:border-blue-200 active:scale-95 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* LOADING SKELETON */}
            {loading && (
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 anim-scale shadow-lg shadow-blue-50">
                <div className="flex items-center justify-between mb-5">
                  <div className="shimmer-bar w-28"></div>
                  <div className="shimmer-bar w-20 h-7 rounded-full"></div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                  <div className="shimmer-bar w-16"></div>
                  <div className="shimmer-bar w-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3"><div className="shimmer-bar w-20"></div><div className="shimmer-bar flex-1"></div></div>
                  <div className="flex gap-3"><div className="shimmer-bar w-20"></div><div className="shimmer-bar flex-1"></div></div>
                  <div className="flex gap-3"><div className="shimmer-bar w-20"></div><div className="shimmer-bar flex-1"></div></div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-bold">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  ModerateAI analyzing in 100+ languages...
                </div>
              </div>
            )}

            {/* RESULT */}
            {result && !loading && (() => {
              const cfg = ACTION_CONFIG[result.action];
              return (
                <div className={`bg-white rounded-2xl border-2 ${cfg.border} p-6 shadow-lg ${cfg.glow} ${animateResult ? 'anim-scale anim-ring' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-black text-gray-900">AI Decision</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{usingAI ? '⚡ Powered by ModerateAI' : '📡 Offline regex mode'}</p>
                    </div>
                    <ActionBadge action={result.action} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Comment</p>
                    <p className="text-gray-800 text-sm">{result.comment}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 uppercase mt-0.5 w-24 flex-shrink-0">Reason</span>
                      <span className="text-sm text-gray-700">{result.reason}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 uppercase mt-0.5 w-24 flex-shrink-0">Language</span>
                      <span className="text-sm text-gray-700">{result.language}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 uppercase mt-0.5 w-24 flex-shrink-0">Confidence</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full transition-all duration-700 ${cfg.dot}`} style={{ width: `${result.confidence}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-gray-600">{result.confidence}%</span>
                      </div>
                    </div>
                    {result.reply && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase mt-0.5 w-24 flex-shrink-0">Auto-reply</span>
                        <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{result.reply}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center anim-up shadow-sm">
                <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">Enter a comment to see AI analysis</p>
                <p className="text-gray-300 text-sm mt-1">Supports 100+ languages · Powered by ModerateAI</p>
              </div>
            )}

            {/* LIVE FEED */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-black text-gray-900">Live Activity Feed</h2>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">{history.length} analyzed</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {history.map((item, i) => (
                    <div key={i} className={`px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${i === 0 ? 'anim-up' : ''}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ACTION_CONFIG[item.action].dot}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{item.comment}</p>
                        <p className="text-xs text-gray-400">{item.time} · {item.language}</p>
                      </div>
                      <ActionBadge action={item.action} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="mt-10 grid grid-cols-5 gap-3">
          {[
            { label: 'Analyzed', value: history.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Hidden', value: history.filter(h => h.action === 'HIDDEN').length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            { label: 'Spam', value: history.filter(h => h.action === 'SPAM').length, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
            { label: 'Timeout', value: history.filter(h => h.action === 'TIMEOUT').length, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
            { label: 'Replied', value: history.filter(h => h.action === 'REPLIED').length, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center transition-all hover:scale-105`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-black mb-2">Ready to protect your channel?</h2>
          <p className="text-blue-200 mb-6">Start your 19-day free trial — no credit card needed</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-black hover:bg-blue-50 transition-colors active:scale-95">
            Start free trial →
          </Link>
        </div>
      </div>
    </main>
  );
}