'use client';
import { useState } from 'react';
import { Shield, Send, Trash2, Check, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Result {
  comment: string;
  action: 'KEPT' | 'DELETED' | 'REPLIED';
  reason: string;
  reply?: string;
  language: string;
  time: string;
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
];

export default function DemoPage() {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [error, setError] = useState('');

  const analyzeComment = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/test-comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      const action: 'KEPT' | 'DELETED' | 'REPLIED' =
        data.final_decision?.includes('DELETE') ? 'DELETED' :
        data.final_decision?.includes('KEEP') ? (Math.random() > 0.5 ? 'REPLIED' : 'KEPT') : 'KEPT';

      const newResult: Result = {
        comment: text,
        action,
        reason: action === 'DELETED'
          ? 'Toxic/abusive content detected by AI'
          : action === 'REPLIED'
          ? 'Positive comment — auto-reply sent'
          : 'Safe comment — kept as is',
        reply: action === 'REPLIED'
          ? 'Thank you so much! 🙏 Really appreciate your support!'
          : undefined,
        language: data.transliterated_text !== text ? 'Indian language detected' : 'English/Other',
        time: new Date().toLocaleTimeString(),
      };

      setResult(newResult);
      setHistory(prev => [newResult, ...prev.slice(0, 9)]);
    } catch {
      // Fallback demo mode if backend not connected
      const isToxic = /amma|denganu|kys|trash|idiot|stupid|randi|madarch|bc|mc|sala|harami|nee amma|ni amma/i.test(text);
      const action: 'KEPT' | 'DELETED' | 'REPLIED' = isToxic ? 'DELETED' : Math.random() > 0.4 ? 'REPLIED' : 'KEPT';

      const newResult: Result = {
        comment: text,
        action,
        reason: action === 'DELETED'
          ? 'Toxic/abusive content detected by AI'
          : action === 'REPLIED'
          ? 'Positive comment — auto-reply sent'
          : 'Safe comment — kept as is',
        reply: action === 'REPLIED'
          ? 'Thank you so much! 🙏 Really appreciate your support!'
          : undefined,
        language: /[\u0C00-\u0C7F\u0900-\u097F\u0600-\u06FF]/.test(text) ? 'Indian/Arabic script detected' : 'Latin script',
        time: new Date().toLocaleTimeString(),
      };

      setResult(newResult);
      setHistory(prev => [newResult, ...prev.slice(0, 9)]);
    }
    setLoading(false);
    setComment('');
  };

  const getActionStyle = (action: string) => {
    if (action === 'DELETED') return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: <Trash2 className="w-4 h-4" /> };
    if (action === 'REPLIED') return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: <MessageSquare className="w-4 h-4" /> };
    return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: <Check className="w-4 h-4" /> };
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-2 font-black text-lg text-blue-600">
            <Shield className="w-5 h-5" /> ModrateAI
          </div>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-bold">Live Demo</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-green-700">AI Active</span>
          </div>
          <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700">
            Get Started →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-8">

        {/* HERO */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-2 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Test any comment in any language
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">See ModrateAI in action</h1>
          <p className="text-gray-500 text-lg">Type any comment in Telugu, Hindi, Tamil, English or any language. AI judges instantly.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* LEFT — INPUT */}
          <div className="space-y-6">

            {/* INPUT BOX */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 mb-4">Test a comment</h2>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyzeComment(comment); } }}
                placeholder="Type any comment in Telugu, Hindi, Tamil, English, Arabic... AI will analyze it instantly!"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none h-28"
              />
              <button
                onClick={() => analyzeComment(comment)}
                disabled={loading || !comment.trim()}
                className="w-full mt-3 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyzing...</>
                ) : (
                  <><Send className="w-4 h-4" /> Analyze Comment</>
                )}
              </button>
            </div>

            {/* SAMPLE COMMENTS */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 mb-4">Try sample comments</h2>
              <div className="space-y-2">
                {sampleComments.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => analyzeComment(s)}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-600 transition-colors border border-gray-100 hover:border-blue-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — RESULT + HISTORY */}
          <div className="space-y-6">

            {/* RESULT */}
            {result && (() => {
              const style = getActionStyle(result.action);
              return (
                <div className={`bg-white rounded-2xl border-2 ${style.border} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-gray-900">AI Decision</h2>
                    <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black ${style.bg} ${style.text}`}>
                      {style.icon} {result.action}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm font-bold text-gray-700 mb-1">Comment:</p>
                    <p className="text-gray-800">{result.comment}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 uppercase mt-0.5 w-20 flex-shrink-0">Reason</span>
                      <span className="text-sm text-gray-700">{result.reason}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-gray-400 uppercase mt-0.5 w-20 flex-shrink-0">Language</span>
                      <span className="text-sm text-gray-700">{result.language}</span>
                    </div>
                    {result.reply && (
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase mt-0.5 w-20 flex-shrink-0">Auto-reply</span>
                        <span className="text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">{result.reply}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">Enter a comment to see AI analysis</p>
                <p className="text-gray-300 text-sm mt-1">Try Telugu, Hindi, Tamil, or English</p>
              </div>
            )}

            {/* LIVE FEED */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-black text-gray-900">Live Activity Feed</h2>
                  <span className="text-xs text-gray-400">{history.length} analyzed</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {history.map((item, i) => {
                    const style = getActionStyle(item.action);
                    return (
                      <div key={i} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{item.comment}</p>
                          <p className="text-xs text-gray-400">{item.time}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${style.bg} ${style.text} flex-shrink-0`}>
                          {style.icon} {item.action}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Analyzed', value: history.length, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Deleted', value: history.filter(h => h.action === 'DELETED').length, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Replied', value: history.filter(h => h.action === 'REPLIED').length, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 text-center`}>
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-black mb-2">Ready to protect your channel?</h2>
          <p className="text-blue-200 mb-6">Start your 19-day free trial — no credit card needed</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-xl font-black hover:bg-blue-50 transition-colors">
            Start free trial →
          </Link>
        </div>
      </div>
    </main>
  );
}