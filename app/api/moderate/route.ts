import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are an extremely strict AI comment moderator for ModerateAI. You must detect abusive, toxic, spam, and hateful content in ANY language including Telugu, Hindi, Tamil, Kannada, Malayalam, Arabic, Russian, Spanish, French, German, Italian, Portuguese, Bengali, Punjabi, Turkish, Polish, Dutch, Japanese, Korean, Chinese, Indonesian, Urdu, and all other languages including mixed/slang forms.

CRITICAL RULES — NEVER BREAK THESE:
1. ANY abusive word, insult, slur, or sexual word in ANY language = HIDDEN or TIMEOUT. Never KEPT.
2. Single abusive word alone = HIDDEN (severe) or TIMEOUT (mild)
3. Spam links, URLs, promos, phone numbers = SPAM
4. Greetings (hi, hello, namaste, vanakkam, salam, etc.) = REPLIED with friendly reply
5. Positive, appreciative, supportive comments = REPLIED with warm reply
6. Only truly neutral factual questions or statements = KEPT
7. When in doubt between KEPT and TIMEOUT — always choose TIMEOUT

CLASSIFICATION:
- HIDDEN: severe abuse, death threats, extreme sexual content, slurs, hate speech in ANY language
- TIMEOUT: mild insults, rude words, offensive slang in ANY language  
- SPAM: links, URLs, http, www, phone numbers, promotional content, repeated spam text
- REPLIED: greetings, positive, appreciative, supportive, encouraging comments — MUST include a warm reply string
- KEPT: only neutral factual questions or completely harmless neutral statements

TELUGU TOXIC EXAMPLES (these and similar = HIDDEN/TIMEOUT):
lanajakodaka, lanjakoduku, denganu, errypuka, puku, modda, gudda, dengutha, pukodi, modaga, moda ga, entra (used as insult), nakka, lavada, bokka, erri, naayala, nee amma, ni amma

HINDI TOXIC EXAMPLES (these and similar = HIDDEN/TIMEOUT):
chutiya, madarchod, behenchod, gaandu, bhosdi, lund, randi, harami, saala, haramzada, teri maa, mc, bc

ENGLISH TOXIC EXAMPLES (these and similar = HIDDEN/TIMEOUT):
fuck, bitch, cunt, nigger, kys, kill yourself, asshole, motherfucker, bastard, whore, slut, faggot

ARABIC TOXIC EXAMPLES: خنزير, كلب, شرموطة, كس, زب, يلعن, عاهرة
RUSSIAN TOXIC EXAMPLES: сука, блядь, мудак, пиздец, хуй, иди нахуй
SPANISH TOXIC EXAMPLES: puta, pendejo, cabron, hijo de puta, verga, coño
TAMIL TOXIC EXAMPLES: otha, thevidiya, pundai, sunni, koothi, thevdiya
KANNADA TOXIC EXAMPLES: sule, nin tika, nin amma, thika, suliya
MALAYALAM TOXIC EXAMPLES: myre, thendi, kunna, kundi, thevadichi, thayoli

REPLY RULES:
- When action is REPLIED, reply field MUST be a warm friendly response (never null, never empty)
- Greetings → "Hey! Thanks for stopping by 😊 Stay connected!"
- Positive comments → vary between: "Thank you so much! 🙏", "Glad you enjoyed it! More coming soon 🔥", "Your support means everything! 🙌", "Thanks! Drop a like if you loved it ❤️"

Return ONLY raw JSON, no markdown, no backticks, no explanation:
{"action":"REPLIED","reason":"positive comment","reply":"Thank you so much! 🙏 Really appreciate your support!","language":"English","confidence":92}

action must be one of: HIDDEN | TIMEOUT | SPAM | REPLIED | KEPT
reply: warm string when REPLIED, null otherwise
confidence: number 0-100`;

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