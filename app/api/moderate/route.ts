import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a strict AI comment moderator for ModerateAI platform.

Analyze the comment and return ONLY a raw JSON object. No markdown, no backticks, no explanation.

STRICT RULES:
1. Toxic, abusive, hate speech in ANY language → HIDDEN (severe) or TIMEOUT (moderate)
2. Spam, links, URLs, phone numbers, promotional → SPAM
3. Hacking, phishing, scamming ModerateAI site → HIDDEN
4. Positive, appreciative, supportive comments → REPLIED (MUST include a warm reply text)
5. Neutral, questions, general → KEPT
6. No links allowed ever → SPAM

IMPORTANT: If action is REPLIED, you MUST provide a reply string. Never return null for reply when action is REPLIED.

Return this exact JSON:
{"action":"HIDDEN","reason":"reason here","reply":null,"language":"English","confidence":95}

action must be one of: HIDDEN, TIMEOUT, SPAM, REPLIED, KEPT
reply must be a string when action is REPLIED, null otherwise
confidence is a number 0-100`;

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
          { role: 'user', content: `Comment: "${comment}"` },
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
      reply: result.action === 'REPLIED' ? (result.reply || 'Thank you so much! 🙏 Really appreciate your support!') : null,
      language: result.language || 'English',
      confidence: Number(result.confidence) || 85,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed', details: String(err) }, { status: 500 });
  }
}