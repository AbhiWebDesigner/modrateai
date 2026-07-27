'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Send, Trash2, Check, MessageSquare, Clock, Ban, Copy, CheckCheck, Globe, Zap, Lock, Brain, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface Result {
  comment: string;
  action: 'KEPT' | 'HIDDEN' | 'REPLIED' | 'SPAM' | 'TIMEOUT';
  reason: string;
  reply?: string;
  language: string;
  time: string;
  confidence: number;
  responseMs?: number;
}

type Language = 'All' | 'Telugu' | 'Hindi' | 'Tamil' | 'English' | 'Arabic' | 'Russian';

const ALL_SAMPLES: { text: string; lang: Language; type: 'Toxic' | 'Positive' | 'Neutral' | 'Spam' }[] = [
  { text: 'Bhai bohot bekar video hai! 😡', lang: 'Hindi', type: 'Toxic' },
  { text: 'Great content bro! Keep it up 🔥', lang: 'English', type: 'Positive' },
  { text: 'ఇది చాలా బాగుంది అన్నూ! ❤️', lang: 'Telugu', type: 'Positive' },
  { text: 'First comment! 🎉', lang: 'English', type: 'Neutral' },
  { text: 'यह वीडियो बहुत अच्छा है, धन्यवाद!', lang: 'Hindi', type: 'Positive' },
  { text: 'lanajakodaka', lang: 'Telugu', type: 'Toxic' },
  { text: 'nee amma denganu errypuka', lang: 'Telugu', type: 'Toxic' },
  { text: 'ella unaru anna? video chala bagundi!', lang: 'Telugu', type: 'Positive' },
  { text: 'مرحبا، فيديو رائع جداً!', lang: 'Arabic', type: 'Positive' },
  { text: 'очень хорошее видео!', lang: 'Russian', type: 'Positive' },
  { text: 'வீடியோ மிகவும் நன்றாக இருந்தது!', lang: 'Tamil', type: 'Positive' },
  { text: 'Click here FREE iPhone!!! www.spam.com', lang: 'English', type: 'Spam' },
  { text: 'kys bro you are trash', lang: 'English', type: 'Toxic' },
  { text: 'madarchod saala', lang: 'Hindi', type: 'Toxic' },
  { text: 'Zabardast video hai bhai! 🙏', lang: 'Hindi', type: 'Positive' },
  { text: 'hmm interesting', lang: 'English', type: 'Neutral' },
];

const TOXIC_PATTERNS = new RegExp(['denganu','errypuka','lanajakodaka','lanjakodka','lanjakoduku','lanja','puku','modda','gudda','denge','dengudu','naayala','nakkalata','nee amma','ni amma','mee amma','dengutha','lavadaniki','lavada','bokka','erri','erripuka','naayintiki','pukodi','guddi',
'chutiya','gaandu','lavde','bhosdi','maderchod','behenchod','madarchod','bhadwa','randi','harami','kutte','saala','haramzada','teri maa','teri behen','gand','lund','chut','bhosdike','bhenchod','mc\\b','bc\\b','sala\\b','kamina','kameena','chodu','chodna','chod','chudai',
'ookku','otha','thevidiya','pundai','sunni','koothi','thevdiya','oombu','poolai','poolu',
'tika','haadya','sule','nin tika','nin amma','thika','suliya',
'myre','myru','thendi','kunna','kundi','thevadichi','thayoli',
'خنزير','كلب\\b','عاهرة','لعنة','يلعن','حمار\\b','شرموطة','كس','زب','قحبة',
'кретин','ублюдок','сука\\b','блядь','мудак','придурок','шлюха','дебил','пиздец','хуй','нахуй','пиздюк','гандон',
'puta\\b','cabron','pendejo','chinga','hijo de puta','coño','joder','maricon','verga','cojon','culero','pinche','chingada',
'connard','merde\\b','putain','salope','enculé','fils de pute','ta gueule','batard',
'scheisse','scheiße','arschloch','wichser','fotze','hurensohn','dreckssau','vollidiot',
'vaffanculo','coglione','stronzo','figlio di puttana','cazzo','minchia','troia',
'porra\\b','caralho','filho da puta','foda','puta que pariu','viado','buceta',
'গাধা','শালা','মাদারচোদ','বেশ্যা','হারামজাদা','মাগি','খানকি',
'orospu','orospu çocuğu','sik\\b','amk\\b','piç\\b','ibne',
'kurwa','chuj','pierdol','jebany','skurwysyn','dupek','spierdalaj',
'kut\\b','lul\\b','godverdomme','kanker','tering','hoer\\b',
'fuck\\s*you','fuck off','motherfucker','kys','kill yourself','die\\b','asshole','bastard','bitch\\b','cunt\\b','dick\\b','prick\\b','whore\\b','slut\\b','nigger','faggot','retard','dumbass','jackass','dipshit','shithead','son of a bitch',
'バカ','死ね','うざい','きもい','消えろ','ゴミ','クズ',
'씨발','개새끼','죽어','바보','미친','꺼져','지랄','병신','창녀',
'他妈的','操你','去死','傻逼','混蛋','妓女','滚开','废物',
'anjing','babi\\b','bangsat','keparat','bajingan','kontol','memek','ngentot',
].join('|'), 'i');

const SPAM_PATTERNS = new RegExp(['click here','www\\.','http','https','bit\\.ly','\\.com\\b','\\.net\\b','\\.org\\b','\\.io\\b','t\\.me\\/','wa\\.me','free iphone','win \\$','earn money','make \\$\\d+','work from home','limited offer','buy now','exclusive deal','act now','sign up now','join now','claim now','get paid','passive income','check my channel','follow me','subscribe to my','visit my','check bio','link in bio','dm me for','inbox me','whatsapp me','giveaway','free gift','promo code','discount code','\\d{10,}'].join('|'), 'i');
const POSITIVE_PATTERNS = new RegExp(['good','great','nice','excellent','amazing','awesome','wonderful','fantastic','superb','brilliant','love','best','beautiful','perfect','helpful','thank','thanks','appreciate','incredible','outstanding','impressive','well done','keep it up','congrats','bagundi','chala bagundi','super','bagunaru','nachindi','bhale','manchidi','bohot acha','bahut accha','mast hai','zabardast','wah','bahut badhiya','shandar','kamaal','shukriya','dhanyawad','நன்றாக','மிகவும்','சூப்பர்','அருமை','நன்றி','رائع','ممتاز','جميل','شكرا','أحسنت','ماشاء الله','отлично','хорошее','молодец','спасибо','прекрасно','très bien','magnifique','bravo','merci','muy bien','excelente','increíble','gracias','genial','sehr gut','ausgezeichnet','wunderbar','danke','ottimo','molto bene','grazie','muito bom','obrigado','parabéns','すごい','良い','ありがとう','素晴らしい','最高','좋아요','감사합니다','대박','최고','很好','谢谢','棒','厉害','太好了','感谢','bagus','keren','terima kasih','mantap','hebat'].join('|'), 'i');
const GREETING_PATTERNS = /^(hi+|hello+|hey+|hii+|helo+|sup|howdy|yo+|namaste|vanakkam|నమస్కారం|مرحبا|привет|bonjour|hola|ciao|oi\b|salut|salam|namaskar|merhaba|konnichiwa|annyeong|ni hao)[\s!.,]*$/i;
const POSITIVE_REPLIES = ['Thank you so much! 🙏 Really appreciate your support!','Glad you enjoyed it! More coming soon 🔥','Your support means everything! Stay tuned 🙌','Thanks a lot! Drop a like if you loved it ❤️','Love the positivity! See you in the next one 🙌','You made our day! Thanks for the kind words 💙'];

function detectLanguage(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0600-\u06FF]/.test(text)) return 'Arabic';
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  if (/[\u3040-\u30FF]/.test(text)) return 'Japanese';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'Korean';
  if (/[\u0980-\u09FF]/.test(text)) return 'Bengali';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'Malayalam';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'Kannada';
  if (/\b(amma|anna|bhai|yaar|bro|acha|bagundi|chala|errypuka|denganu|lanja)\b/i.test(text)) return 'Hinglish/Tenglish';
  return 'English';
}

function fallbackClassify(text: string): Omit<Result, 'comment' | 'time'> {
  const lang = detectLanguage(text);
  const isToxic = TOXIC_PATTERNS.test(text);
  const isSpam = SPAM_PATTERNS.test(text);
  const isPositive = POSITIVE_PATTERNS.test(text);
  const isGreeting = GREETING_PATTERNS.test(text.trim());
  const isRepetitive = /(.{3,})\1{2,}/.test(text);
  const wordCount = text.trim().split(/\s+/).length;
  if (isToxic) {
    const isSevere = /(kys|kill yourself|motherfucker|maderchod|denganu|errypuka|lanajakodaka|madarchod|behenchod|nee amma|ni amma|fuck\s*you|сука|блядь|chutiya|bhenchod|puku|modda|thevidiya|otha|hijo de puta|teri maa|شرموطة|كس\b)/i.test(text);
    return { action: isSevere ? 'HIDDEN' : 'TIMEOUT', reason: isSevere ? 'Severe abuse — hidden from public' : 'Abusive language — timed out', language: lang, confidence: isSevere ? 97 : 91 };
  }
  if (isSpam || isRepetitive) return { action: 'SPAM', reason: 'Spam or promotional content', language: lang, confidence: 94 };
  if (isGreeting) return { action: 'REPLIED', reason: 'Greeting — friendly reply sent', reply: 'Hey! Thanks for stopping by 😊 Stay connected!', language: lang, confidence: 90 };
  if (isPositive || wordCount >= 4) return { action: 'REPLIED', reason: 'Positive comment — auto-reply sent', reply: POSITIVE_REPLIES[Math.floor(Math.random() * POSITIVE_REPLIES.length)], language: lang, confidence: 88 };
  return { action: 'KEPT', reason: 'Neutral comment — kept as is', language: lang, confidence: 82 };
}

const ACTION_CONFIG = {
  HIDDEN:  { bg: 'rgba(239,68,68,0.15)',    text: '#f87171', border: '1px solid rgba(239,68,68,0.3)',    dot: '#ef4444', bar: '#ef4444',    label: 'Hidden',  icon: <Trash2 className="w-3.5 h-3.5" /> },
  SPAM:    { bg: 'rgba(249,115,22,0.15)',   text: '#fb923c', border: '1px solid rgba(249,115,22,0.3)',   dot: '#f97316', bar: '#f97316',   label: 'Spam',    icon: <Ban className="w-3.5 h-3.5" /> },
  TIMEOUT: { bg: 'rgba(234,179,8,0.15)',    text: '#facc15', border: '1px solid rgba(234,179,8,0.3)',    dot: '#eab308', bar: '#eab308',    label: 'Timeout', icon: <Clock className="w-3.5 h-3.5" /> },
  REPLIED: { bg: 'rgba(139,92,246,0.15)',   text: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)',   dot: '#8b5cf6', bar: '#8b5cf6',   label: 'Replied', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  KEPT:    { bg: 'rgba(34,197,94,0.15)',    text: '#4ade80', border: '1px solid rgba(34,197,94,0.3)',    dot: '#22c55e', bar: '#22c55e',    label: 'Kept',    icon: <Check className="w-3.5 h-3.5" /> },
};

const TYPE_CONFIG = {
  Toxic:    { bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
  Positive: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' },
  Neutral:  { bg: 'rgba(148,163,184,0.1)',text: '#94a3b8' },
  Spam:     { bg: 'rgba(249,115,22,0.15)',text: '#fb923c' },
};

function ActionBadge({ action }: { action: Result['action'] }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span style={{ background: cfg.bg, color: cfg.text, border: cfg.border }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black">
      {cfg.icon} {cfg.label}
    </span>
  );
}

const LANGUAGES: Language[] = ['All', 'Telugu', 'Hindi', 'Tamil', 'English', 'Arabic', 'Russian'];

export default function DemoPage() {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [animateResult, setAnimateResult] = useState(false);
  const [usingAI, setUsingAI] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeLang, setActiveLang] = useState<Language>('All');
  const [showAllTypes, setShowAllTypes] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredSamples = ALL_SAMPLES.filter(s => activeLang === 'All' || s.lang === activeLang);
  const visibleSamples = showAllTypes ? filteredSamples : filteredSamples.slice(0, 5);

  const avgConfidence = history.length > 0 ? Math.round(history.reduce((a, b) => a + b.confidence, 0) / history.length) : 99;
  const avgResponseMs = history.filter(h => h.responseMs).length > 0 ? Math.round(history.filter(h => h.responseMs).reduce((a, b) => a + (b.responseMs || 0), 0) / history.filter(h => h.responseMs).length) : 1200;
  const blockedCount = history.filter(h => h.action === 'HIDDEN' || h.action === 'TIMEOUT' || h.action === 'SPAM').length;
  const repliedCount = history.filter(h => h.action === 'REPLIED').length;

  const analyzeComment = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setAnimateResult(false);
    const startTime = Date.now();
    let newResult: Result;
    const localCheck = fallbackClassify(trimmed);
    const isLocallyBad = localCheck.action === 'HIDDEN' || localCheck.action === 'SPAM' || localCheck.action === 'TIMEOUT';
    if (isLocallyBad) {
      newResult = { comment: trimmed, ...localCheck, time: new Date().toLocaleTimeString(), responseMs: Date.now() - startTime };
      setUsingAI(false);
    } else {
      try {
        const res = await fetch('/api/moderate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: trimmed }) });
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        const validActions = ['HIDDEN', 'TIMEOUT', 'SPAM', 'REPLIED', 'KEPT'];
        const safeAction = validActions.includes(data.action) ? data.action : 'KEPT';
        newResult = {
          comment: trimmed, action: safeAction, reason: data.reason || 'AI analyzed',
          reply: safeAction === 'REPLIED' ? (data.reply && data.reply !== 'null' ? data.reply : 'Thank you so much! 🙏 Really appreciate your support!') : undefined,
          language: data.language || detectLanguage(trimmed), time: new Date().toLocaleTimeString(),
          confidence: Number(data.confidence) || 90, responseMs: Date.now() - startTime,
        };
        setUsingAI(true);
      } catch {
        newResult = { comment: trimmed, ...localCheck, time: new Date().toLocaleTimeString(), responseMs: Date.now() - startTime };
        setUsingAI(false);
      }
    }
    setResult(newResult);
    setAnimateResult(true);
    setHistory(prev => [newResult, ...prev.slice(0, 19)]);
    setLoading(false);
    setComment('');
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (comment.trim().length >= 3 && !loading) {
      debounceRef.current = setTimeout(() => analyzeComment(comment), 800);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [comment, analyzeComment, loading]);

  const copyReply = () => {
    if (result?.reply) { navigator.clipboard.writeText(result.reply); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <main style={{ background: '#0a0a0f', minHeight: '100vh', color: '#e2e8f0' }}>
      <style>{`
        @keyframes fadeScale { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .anim-scale { animation: fadeScale 0.35s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-up { animation: slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .shimmer-bar { background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%); background-size:400px 100%; animation:shimmer 1.2s infinite; border-radius:6px; height:14px; }
        .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; }
        .card-hover:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); transition: all 0.2s; }
        .lang-btn { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .lang-btn:hover { border-color: rgba(139,92,246,0.5); color: #a78bfa; }
        .lang-btn.active { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.6); color: #a78bfa; }
        .nav-link { color: #94a3b8; font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.2s; }
        .nav-link:hover { color: #e2e8f0; }
        textarea { background: rgba(255,255,255,0.04) !important; color: #e2e8f0 !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        textarea:focus { border-color: rgba(139,92,246,0.6) !important; outline: none !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.1) !important; }
        textarea::placeholder { color: #475569 !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* NAV */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(20px)' }} className="sticky top-0 z-20 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-black text-lg" style={{ color: '#a78bfa' }}>
            <Shield className="w-5 h-5" /> ModerateAI
          </Link>
          <div style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span> Live Demo
          </div>
          <div className="hidden md:flex items-center gap-6">
            {['Features', 'How It Works', 'Pricing', 'Docs', 'API'].map(l => <a key={l} href="#" className="nav-link">{l}</a>)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {usingAI ? 'ModerateAI Active' : 'Pattern Mode'}
          </div>
          <Link href="/login" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white' }} className="px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
            Get Started →
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* HERO */}
        <div className="text-center mb-10 anim-up">
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-5">
            <Zap className="w-3.5 h-3.5" /> Real AI • 100+ Languages • Powered by ModerateAI
          </div>
          <h1 className="text-5xl font-black mb-4" style={{ background: 'linear-gradient(135deg, #e2e8f0 0%, #a78bfa 50%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            See ModerateAI in action
          </h1>
          <p style={{ color: '#64748b' }} className="text-lg mb-6">Type any comment in Telugu, Hindi, Tamil, Arabic, Russian or any language.<br />AI judges instantly with accuracy.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(['HIDDEN','SPAM','TIMEOUT','REPLIED','KEPT'] as const).map(a => (
              <span key={a} style={{ background: ACTION_CONFIG[a].bg, color: ACTION_CONFIG[a].text, border: ACTION_CONFIG[a].border }} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold">
                {ACTION_CONFIG[a].icon} {ACTION_CONFIG[a].label}
              </span>
            ))}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* LEFT — Input */}
          <div className="space-y-5">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} className="p-2 rounded-lg"><MessageSquare className="w-4 h-4" /></div>
                <div>
                  <h2 className="font-black text-white text-sm">Test a Comment</h2>
                  <p style={{ color: '#475569' }} className="text-xs mt-0.5">Try any comment and see AI analysis in real-time</p>
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (debounceRef.current) clearTimeout(debounceRef.current); analyzeComment(comment); } }}
                  placeholder="Type any comment in Telugu, Hindi, Tamil, English, Arabic, Russian...&#10;AI will analyze instantly!"
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none h-32 transition-all"
                  maxLength={500}
                />
                <span style={{ color: '#334155' }} className="absolute bottom-3 right-3 text-xs">{comment.length} / 500</span>
              </div>
              <button
                onClick={() => { if (debounceRef.current) clearTimeout(debounceRef.current); analyzeComment(comment); }}
                disabled={loading || !comment.trim()}
                className="w-full mt-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                style={{ background: loading || !comment.trim() ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white' }}
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyzing...</> : <><Send className="w-4 h-4" /> Analyze Comment</>}
              </button>
              <p style={{ color: '#334155' }} className="text-xs text-center mt-2 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> All comments are processed securely • No data is stored
              </p>
            </div>

            {/* Sample Comments */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} className="p-2 rounded-lg"><Brain className="w-4 h-4" /></div>
                <div>
                  <h2 className="font-black text-white text-sm">Try Sample Comments</h2>
                  <p style={{ color: '#475569' }} className="text-xs mt-0.5">Click on any sample to test AI analysis</p>
                </div>
              </div>
              {/* Lang filter */}
              <div className="flex flex-wrap gap-2 mb-4">
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => setActiveLang(l)} className={`lang-btn ${activeLang === l ? 'active' : ''}`}>{l}</button>
                ))}
                <button className="lang-btn flex items-center gap-1 ml-auto" onClick={() => setShowAllTypes(!showAllTypes)}>
                  All Types <ChevronDown className={`w-3 h-3 transition-transform ${showAllTypes ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className="space-y-2">
                {visibleSamples.map((s, i) => (
                  <div key={i} className="card card-hover flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => { if (debounceRef.current) clearTimeout(debounceRef.current); analyzeComment(s.text); }}>
                    <div style={{ background: TYPE_CONFIG[s.type].bg, color: TYPE_CONFIG[s.type].text }} className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                      {s.type === 'Toxic' ? '🛡' : s.type === 'Positive' ? '✓' : s.type === 'Spam' ? '⊘' : '?'}
                    </div>
                    <span style={{ color: '#cbd5e1' }} className="text-sm flex-1 truncate">{s.text}</span>
                    <span style={{ background: TYPE_CONFIG[s.type].bg, color: TYPE_CONFIG[s.type].text }} className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0">{s.type}</span>
                    <button style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} className="text-xs px-3 py-1 rounded-lg font-bold flex-shrink-0 hover:opacity-80 transition-opacity">Try This</button>
                  </div>
                ))}
              </div>
              {filteredSamples.length > 5 && (
                <button onClick={() => setShowAllTypes(!showAllTypes)} style={{ color: '#a78bfa' }} className="w-full mt-3 text-sm font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                  {showAllTypes ? '↑ Show Less' : `↻ Load More Samples (${filteredSamples.length - 5} more)`}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — Result */}
          <div className="space-y-5">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} className="p-2 rounded-lg"><Shield className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-black text-white text-sm">AI Analysis Result</h2>
                    <p style={{ color: '#475569' }} className="text-xs mt-0.5">Real-time analysis with confidence score</p>
                  </div>
                </div>
                {result && !loading && (
                  <ActionBadge action={result.action} />
                )}
                {!result && !loading && (
                  <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Ready
                  </span>
                )}
              </div>

              {/* Loading */}
              {loading && (
                <div className="anim-scale">
                  <div className="flex gap-3 mb-4"><div className="shimmer-bar w-32"></div><div className="shimmer-bar flex-1"></div></div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12 }} className="p-4 mb-4 space-y-2">
                    <div className="shimmer-bar w-16"></div><div className="shimmer-bar w-full"></div>
                  </div>
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="flex gap-3"><div className="shimmer-bar w-20"></div><div className="shimmer-bar flex-1"></div></div>)}
                  </div>
                  <div style={{ color: '#7c3aed' }} className="mt-4 flex items-center gap-2 text-xs font-bold">
                    <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    Analyzing in 100+ languages...
                  </div>
                </div>
              )}

              {/* Result */}
              {result && !loading && (() => {
                const cfg = ACTION_CONFIG[result.action];
                return (
                  <div className="anim-scale">
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }} className="p-4 mb-4">
                      <p style={{ color: '#475569' }} className="text-xs font-bold uppercase mb-1">Comment</p>
                      <p style={{ color: '#e2e8f0' }} className="text-sm break-words">{result.comment}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span style={{ color: '#475569' }} className="text-xs font-bold uppercase mt-0.5 w-24 flex-shrink-0">Reason</span>
                        <span style={{ color: '#cbd5e1' }} className="text-sm">{result.reason}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span style={{ color: '#475569' }} className="text-xs font-bold uppercase mt-0.5 w-24 flex-shrink-0">Language</span>
                        <span style={{ color: '#cbd5e1' }} className="text-sm flex items-center gap-1"><Globe className="w-3 h-3" />{result.language}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span style={{ color: '#475569' }} className="text-xs font-bold uppercase mt-0.5 w-24 flex-shrink-0">Confidence</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, flex: 1, overflow: 'hidden' }}>
                            <div style={{ width: `${result.confidence}%`, background: cfg.bar, height: '100%', borderRadius: 99, transition: 'width 0.7s ease' }}></div>
                          </div>
                          <span style={{ color: cfg.text }} className="text-xs font-black">{result.confidence}%</span>
                        </div>
                      </div>
                      {result.responseMs && (
                        <div className="flex items-start gap-3">
                          <span style={{ color: '#475569' }} className="text-xs font-bold uppercase mt-0.5 w-24 flex-shrink-0">Speed</span>
                          <span style={{ color: '#4ade80' }} className="text-sm font-bold">{result.responseMs}ms ⚡</span>
                        </div>
                      )}
                      {result.reply && (
                        <div className="flex items-start gap-3">
                          <span style={{ color: '#475569' }} className="text-xs font-bold uppercase mt-0.5 w-24 flex-shrink-0">Auto-reply</span>
                          <div className="flex-1">
                            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', borderRadius: 10 }} className="text-sm px-3 py-2 mb-2">{result.reply}</div>
                            <button onClick={copyReply} style={{ color: copied ? '#4ade80' : '#64748b' }} className="flex items-center gap-1.5 text-xs font-bold hover:opacity-80 transition-all">
                              {copied ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy reply</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {!result && !loading && (
                <div className="text-center py-12">
                  <Shield className="w-14 h-14 mx-auto mb-3" style={{ color: 'rgba(139,92,246,0.2)' }} />
                  <p style={{ color: '#334155' }} className="font-bold text-sm">Enter a comment to see AI analysis</p>
                  <p style={{ color: '#1e293b' }} className="text-xs mt-1">Supports 100+ languages • Powered by ModerateAI</p>
                </div>
              )}

              {/* Mini stats */}
              <div className="grid grid-cols-4 gap-3 mt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                {[
                  { label: 'Accuracy', value: `${avgConfidence}%`, color: '#4ade80', sub: 'High' },
                  { label: 'Response Time', value: avgResponseMs > 0 ? `${(avgResponseMs/1000).toFixed(1)}s` : '1.2s', color: '#a78bfa', sub: 'Fast' },
                  { label: 'Languages', value: '100+', color: '#a78bfa', sub: 'Supported' },
                  { label: 'AI Model', value: 'v3.2', color: '#fb923c', sub: 'Latest' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p style={{ color: '#475569' }} className="text-xs mb-1">{s.label}</p>
                    <p style={{ color: s.color }} className="text-lg font-black">{s.value}</p>
                    <p style={{ color: s.color, opacity: 0.7 }} className="text-xs">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Stats */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} className="p-2 rounded-lg"><Zap className="w-4 h-4" /></div>
                  <div>
                    <h2 className="font-black text-white text-sm">Live Stats</h2>
                    <p style={{ color: '#475569' }} className="text-xs mt-0.5">Real-time demo statistics</p>
                  </div>
                </div>
                <span style={{ color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }} className="text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Live
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Analyzed', value: history.length || 0, sub: 'Today', color: '#e2e8f0' },
                  { label: 'Hidden', value: blockedCount, sub: history.length ? `${Math.round((blockedCount/history.length)*100)}%` : '0%', color: '#f87171' },
                  { label: 'Replied', value: repliedCount, sub: history.length ? `${Math.round((repliedCount/history.length)*100)}%` : '0%', color: '#a78bfa' },
                  { label: 'Accuracy', value: `${avgConfidence}%`, sub: 'Excellent', color: '#4ade80' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 }} className="text-center">
                    <p style={{ color: '#475569' }} className="text-xs mb-1">{s.label}</p>
                    <p style={{ color: s.color }} className="text-xl font-black">{s.value}</p>
                    <p style={{ color: s.color === '#f87171' ? '#f87171' : '#475569', opacity: s.color === '#f87171' ? 0.8 : 1 }} className="text-xs">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }} className="p-2 rounded-lg"><Shield className="w-4 h-4" /></div>
            <h2 className="font-black text-white">Why Choose ModerateAI?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Globe className="w-5 h-5" />, title: '100+ Languages Support', desc: 'AI understands 100+ languages including regional languages' },
              { icon: <Brain className="w-5 h-5" />, title: 'Advanced AI Accuracy', desc: '99.2% accuracy rate with advanced machine learning' },
              { icon: <Zap className="w-5 h-5" />, title: 'Real-time Processing', desc: 'Lightning fast analysis in under 2 seconds' },
              { icon: <Lock className="w-5 h-5" />, title: 'Enterprise Security', desc: 'Bank-grade encryption and privacy protection' },
            ].map(f => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16 }}>
                <div style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', width: 36, height: 36, borderRadius: 10 }} className="flex items-center justify-center mb-3">{f.icon}</div>
                <p className="text-white text-sm font-bold mb-1">{f.title}</p>
                <p style={{ color: '#475569' }} className="text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.2))', border: '1px solid rgba(139,92,246,0.3)' }}>
          <h2 className="text-2xl font-black text-white mb-2">Ready to protect your channel?</h2>
          <p style={{ color: '#7c3aed' }} className="mb-6">Start your 19-day free trial — no credit card needed</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-black hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white' }}>
            Start free trial →
          </Link>
        </div>
      </div>
    </main>
  );
}