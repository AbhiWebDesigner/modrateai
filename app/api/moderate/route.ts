import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a strict comment moderation AI for a YouTube/Instagram channel.

Analyze the given comment and respond with ONLY a valid JSON object. No explanation, no markdown, no extra text.

Rules:
- Detect toxic, abusive, hate speech in ANY language (Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Arabic, Russian, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, English, and all others)
- Detect spam, promotional links, phone numbers, URLs
- Detect threats, self-harm encouragement, illegal content
- If comment is about hacking, phishing, scamming the site/service → STRICT block
- No links allowed in comments → SPAM
- Good, positive, supportive comments → REPLIED with a warm reply
- Neutral short comments → KEPT

Respond ONLY with this JSON:
{
  "action": "HIDDEN" | "TIMEOUT" | "SPAM" | "REPLIED" | "KEPT",
  "reason": "short reason in English",
  "reply": "auto reply text if action is REPLIED, else null",
  "language": "detected language name",
  "confidence": 85
}

Action rules:
- HIDDEN: severe abuse, death threats, extreme hate, hacking attempts, sexual content
- TIMEOUT: moderate abuse, mild toxic, insults
- SPAM: links, URLs, phone numbers, promotional content, repeated characters
- REPLIED: positive, supportive, appreciative comments
- KEPT: neutral, question, general comment`;

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
        max_tokens: 200,
        temperature: 0.1,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Comment: "${comment}"` },
        ],
      }),
    });

    if (!groqRes.ok) {
      throw new Error(`Groq API error: ${groqRes.status}`);
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content || '';

    // Parse JSON safely
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    // Validate action
    const validActions = ['HIDDEN', 'TIMEOUT', 'SPAM', 'REPLIED', 'KEPT'];
    if (!validActions.includes(result.action)) {
      result.action = 'KEPT';
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Moderate API error:', err);
    return NextResponse.json(
      { error: 'Moderation failed', details: String(err) },
      { status: 500 }
    );
  }
}