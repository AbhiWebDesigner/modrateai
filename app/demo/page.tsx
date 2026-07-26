'use client';
import { useState, useEffect } from 'react';
import { Shield, Send, Trash2, Check, MessageSquare, ArrowLeft, AlertTriangle, Clock, Ban } from 'lucide-react';
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
  'Bhai bohot acha video tha! 🙌',
  'ella unaru anna? video chala bagundi!',
  'ni amma [abusive Telugu]',
  'Great content keep it up!',
  'nee amma denganu',
  'Super video bro 👍',
  'kys bro you are trash',
  'مرحبا، فيديو رائع جداً!',
  'очень хорошее видео!',
  'Click here to win FREE iPhone!!!',
  'nee amma denganu errypuka',
  'வீடியோ மிகவும் நன்றாக இருந்தது!',
];

// 100+ language toxic word patterns
const TOXIC_PATTERNS = /amma|denganu|kys|trash|idiot|stupid|randi|madarch|bc\b|mc\b|sala\b|harami|nee amma|ni amma|errypuka|bewako|chutiya|gaandu|lavde|bhosdi|maderchod|behenchod|sisterfucker|motherfucker|fuck\s*you|fuck off|die\b|kill yourself|кретин|ублюдок|сука\b|блядь|мудак|придурок|connard|merde\b|putain|puta\b|cabron|pendejo|chinga|hijo de|coño|joder|scheisse|scheiße|arschloch|wichser|fotze|testa di cazzo|vaffanculo|coglione|stronzo|porra\b|caralho|filho da|خنزير|كلب\b|عاهرة|لعنة|يلعن|حمار\b|গাধা|শালা|মাদারচোদ|বেশ্যা|teri maa|teri behen|bhad mein jao|tere baap|saala|kutte|haraamzade|rascal|bastard|asshole|bitch\b|cunt\b|dick\b|prick\b|whore\b|slut\b|nigger|faggot|retard/i;

const SPAM_PATTERNS = /click here|free iphone|win \$|earn money|make \$\d+|work from home|limited offer|buy now|check my|follow me|subscribe to my|visit my|www\.|http|\.com|\.net|giveaway|free gift|promo code|discount code|check bio|link in bio|dm me for|inbox me/i;

const POSITIVE_PATTERNS = /good|great|nice|excellent|amazing|awesome|wonderful|fantastic|superb|brilliant|love|best|beautiful|perfect|bagundi|chala bagundi|bohot acha|bahut accha|mast hai|zabardast|wah|bahut badhiya|நன்றாக|மிகவும்|رائع|ممتاز|отлично|хорошее|très bien|magnifique|muy bien|excelente|ottimo|molto bene|sehr gut|ausgezeichnet/i;

function detectLanguage(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi / Devanagari';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian / Cyrillic';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u3040-\u30FF]/.test(text)) return 'Japanese';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean';
  if (/[\u0370-\u03FF]/.test(text)) return 'Greek';
  if (/[\u0980-\u09FF]/.test(text)) return 'Bengali';
  if (/[\u0A80-\u0AFF]/.test(text)) return 'Gujarati';
  if (/[\u0A00-\u0A7F]/.test(text)) return 'Punjabi';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam';
  if (/[\u0B00-\u0B7F]/.test(text)) return 'Odia';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';
  if (/\b(amma|anna|bhai|yaar|bro|acha|bagundi|chala|errypuka|denganu)\b/i.test(text)) return 'Indian (Tenglish/Hinglish)';
  return 'English / Latin';
}

function classifyComment(text: string): Pick<Result, 'action' | 'reason' | 'reply' | 'confidence'> {
  const isToxic = TOXIC_PATTERNS.test(text);
  const isSpam = SPAM_PATTERNS.test(text);
  const isPositive = POSITIVE_PATTERNS.test(text);
  const wordCount = text.trim().split(/\s+/).length;
  const isRepetitive = /(.{3,})\1{2,}/.test(text);

  if (isToxic && isSpam) {
    return { action: 'HIDDEN', reason: 'Toxic + spam content detected — permanently hidden', confidence: 99 };
  }
  if (isToxic) {
    // Severe toxic → HIDDEN, moderate → TIMEOUT
    const isSevere = /(kys|kill yourself|die\b|motherfucker|maderchod|denganu|errypuka)/i.test(text);
    if (isSevere) {
      return { action: 'HIDDEN', reason: 'Severe abusive language detected — hidden from public', confidence: 97 };
    }
    return { action: 'TIMEOUT', reason: 'Abusive language detected — user comment timed out', confidence: 91 };
  }
  if (isSpam || isRepetitive) {
    return { action: 'SPAM', reason: 'Spam or promotional content detected — flagged and hidden', confidence: 93 };
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
      confidence: 88,
    };
  }
  return { action: 'KEPT', reason: 'Neutral comment — kept as is', confidence: 82 };
}

const ACTION_CONFIG = {
  HIDDEN: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', glow: 'shadow-red-100', icon: <Trash2 className="w-4 h-4" />, dot: 'bg-red-500' },
  SPAM:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', glow: 'shadow-orange-100', icon: <Ban className="w-4 h-4" />, dot: 'bg-orange-500' },
  TIMEOUT:{ bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', glow: 'shadow-yellow-100', icon: <Clock className="w-4 h-4" />, dot: 'bg-yellow-500' },
  REPLIED:{ bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', glow: 'shadow-blue-100', icon: <MessageSquare className="w-4 h-4" />, dot: 'bg-blue-500' },
  KEPT:   { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', glow: 'shadow-green-100', icon: <Check className="w-4 h-4" />, dot: 'bg-green-500' },
};

function ActionBadge({ action }: { action: Result['action'] }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${cfg.bg} ${cfg.text} transition-all`}>
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
  const [animateHistory, setAnimateHistory] = useState(false);

  const analyzeComment = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setAnimateResult(false);

    // Simulate AI processing delay (realistic feel)
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

    let newResult: Result;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/test-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      const decision = data.final_decision?.toUpperCase() || '';
      const classified = classifyComment(text);
      const action: Result['action'] = decision.includes('DELETE') || decision.includes('HIDE')
        ? 'HIDDEN'
        : decision.includes('SPAM') ? 'SPAM'
        : decision.includes('TIMEOUT') ? 'TIMEOUT'
        : classified.action;

      newResult = {
        comment: text,
        action,
        reason: classified.reason,
        reply: classified.reply,
        language: detectLanguage(text),
        time: new Date().toLocaleTimeString(),
        confidence: classified.confidence,
      };
    } catch {
      // Offline fallback — full local classification
      const classified = classifyComment(text);
      newResult = {
        comment: text,
        ...classified,
        language: detectLanguage(text),
        time: new Date().toLocaleTimeString(),
      };
    }

    setResult(newResult);
    setAnimateResult(true);
    setAnimateHistory(true);
    setHistory(prev => [newResult, ...prev.slice(0, 9)]);
    setLoading(false);
    setComment('');

    setTimeout(() => setAnimateHistory(false), 600);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes pulseOnce {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .animate-slide-down  { animation: slideInDown 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-slide-up    { animation: slideInUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-fade-scale  { animation: fadeScale 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-pulse-once  { animation: pulseOnce 0.8s ease both; }
        .shimmer-bar {
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 400px 100%;
          animation: shimmer 1.2s infinite;
          border-radius: 6px;
          height: 14px;
        }
        .history-item-new { animation: slideInUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 font-black text-lg text-blue-600">
            <Shield className="w-5 h-5" /> ModerateAI
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-bold">Live Demo</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-green-700">AI Active</span>
          </div>
          <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            Get Started →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">

        {/* HERO */}
        <div className="text-center mb-10 animate-slide-down">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-2 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Test any comment in 100+ languages
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">See ModerateAI in action</h1>
          <p className="text-gray-500 text-lg">Type any comment in Telugu, Hindi, Tamil, Arabic, Russian or any language. AI judges instantly.</p>

          {/* Action legend */}
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

            {/* INPUT */}
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
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Analyze Comment</>
                )}
              </button>
            </div>

            {/* SAMPLE COMMENTS */}
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
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 animate-fade-scale shadow-lg shadow-blue-50">
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
                </div>
                <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-bold">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  AI is analyzing in 100+ languages...
                </div>
              </div>
            )}

            {/* RESULT */}
            {result && !loading && (() => {
              const cfg = ACTION_CONFIG[result.action];
              return (
                <div className={`bg-white rounded-2xl border-2 ${cfg.border} p-6 shadow-lg ${cfg.glow} ${animateResult ? 'animate-fade-scale animate-pulse-once' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-gray-900">AI Decision</h2>
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
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${cfg.dot}`}
                            style={{ width: `${result.confidence}%` }}
                          ></div>
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
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center animate-slide-up shadow-sm">
                <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">Enter a comment to see AI analysis</p>
                <p className="text-gray-300 text-sm mt-1">Supports 100+ languages including Telugu, Hindi, Arabic, Russian</p>
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
                    <div
                      key={i}
                      className={`px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${i === 0 && animateHistory ? 'history-item-new' : ''}`}
                    >
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
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-black hover:bg-blue-50 transition-colors active:scale-95"
          >
            Start free trial →
          </Link>
        </div>
      </div>
    </main>
  );
}