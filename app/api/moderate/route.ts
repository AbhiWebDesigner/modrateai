import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a strict AI comment moderator for ModerateAI platform.

Analyze the comment and return ONLY a raw JSON object. No markdown, no backticks, no extra text.

CLASSIFICATION RULES:
- HIDDEN: severe abuse, death threats, extreme hate speech, sexual content, hacking/phishing attempts (in ANY language)
- TIMEOUT: mild abuse, insults, rude comments
- SPAM: links, URLs, http, www, phone numbers, promotional content, repeated text
- REPLIED: ANY positive, friendly, appreciative, supportive, greeting, or encouraging comment — including "hi", "hello", "great", "nice", "super", "bagundi", "good", "amazing", "thank you", "love this", etc.
- KEPT: neutral factual questions or very ambiguous short comments only

IMPORTANT RULES:
- When action is REPLIED, reply field MUST be a warm, friendly response string (never null)
- Greetings like "hi", "hello", "hii" → REPLIED with a friendly reply
- Positive words in ANY language → REPLIED
- Never return null for reply when action is REPLIED

Return ONLY this JSON format (no markdown, no explanation):
{"action":"REPLIED","reason":"positive comment","reply":"Thank you so much! Really appreciate your support! 🙏","language":"English","confidence":92}

action: HIDDEN | TIMEOUT | SPAM | REPLIED | KEPT
reply: string when REPLIED, null otherwise
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