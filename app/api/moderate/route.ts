import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a precise AI comment moderator for ModerateAI. Analyze comments in ANY language and return ONLY raw JSON.

CLASSIFICATION RULES:

HIDDEN — severe abuse only:
- Explicit sexual words, extreme slurs, death threats, extreme hate speech
- Telugu examples: lanajakodaka, denganu, errypuka, puku, modda, nee amma denganu
- Hindi examples: madarchod, behenchod, bhosdi, chutiya, teri maa ki
- English examples: motherfucker, cunt, nigger, kys, kill yourself
- Arabic: شرموطة, كس, زب  | Russian: блядь, хуй, пиздец | Spanish: hijo de puta, coño

TIMEOUT — mild rude words only:
- Light insults, mild offensive slang — actual bad words, NOT normal sentences
- Telugu examples: entra (as insult), nakka, lavada, erri
- Hindi: saala, haramzada, gaandu | English: bitch, asshole, bastard, idiot, stupid

SPAM — promotional/link content:
- URLs, www, http, phone numbers, "click here", "free gift", "subscribe to my channel", "check bio"

REPLIED — greetings and positive comments:
- Greetings: hi, hello, hey, namaste, vanakkam, salam, bonjour, hola, konnichiwa
- Positive: good, great, amazing, bagundi, superb, شكرا, отлично, gracias, 很好
- MUST include a warm reply string

KEPT — everything else that is NOT abusive:
- Normal questions in any language: "nee name enti" = "what is your name" = KEPT
- Neutral statements: "arthm kaledu" = "no meaning" = KEPT
- Factual comments, opinions, observations
- Short neutral words: ok, hmm, nice, interesting
- ANY normal sentence that does not contain actual abusive words

IMPORTANT — DO NOT over-moderate:
- Normal Telugu/Hindi/Tamil sentences are NOT toxic
- Questions about anything = KEPT
- Statements of fact or opinion = KEPT
- Only ACTUAL abusive/sexual/slur words = HIDDEN or TIMEOUT
- "nee name enti" = question = KEPT (NOT timeout)
- "arthm kaledu" = neutral = KEPT (NOT timeout)
- "video bagundi" = positive = REPLIED
- "entra" alone as insult = TIMEOUT
- "lanajakodaka" = HIDDEN

REPLY RULES:
- REPLIED action: reply field MUST be warm and friendly (never null)
- Greeting reply: "Hey! Thanks for stopping by 😊 Stay connected!"
- Positive reply: vary between "Thank you so much! 🙏", "Glad you enjoyed it! More coming soon 🔥", "Your support means everything! 🙌", "Thanks! Drop a like ❤️"

Return ONLY this JSON (no markdown, no backticks, no explanation):
{"action":"KEPT","reason":"neutral question","reply":null,"language":"Telugu","confidence":88}

action: HIDDEN | TIMEOUT | SPAM | REPLIED | KEPT
reply: string when REPLIED, null otherwise
confidence: 0-100`;

export async function POST(req: NextRequest) {
  try {
    const { comment } = await req.json();

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Empty comment' }, { status: 400 });
    }

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 250,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this comment and return ONLY JSON: "${comment}"` },
        ],
      }),
    });

    if (!groqRes.ok) throw new Error(`Groq error: ${groqRes.status}`);

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    const validActions = ['HIDDEN', 'TIMEOUT', 'SPAM', 'REPLIED', 'KEPT'];
    if (!validActions.includes(result.action)) result.action = 'KEPT';

    return NextResponse.json({
      action: result.action,
      reason: result.reason || 'AI analyzed',
      reply: result.action === 'REPLIED'
        ? (result.reply && result.reply !== 'null' ? result.reply : 'Thank you so much! 🙏 Really appreciate your support!')
        : null,
      language: result.language || 'Unknown',
      confidence: Number(result.confidence) || 85,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed', details: String(err) }, { status: 500 });
  }
}