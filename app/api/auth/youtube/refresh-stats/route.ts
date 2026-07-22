import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const TOKEN_ENDPOINT  = 'https://oauth2.googleapis.com/token';
const FIRESTORE_BASE  = 'https://firestore.googleapis.com/v1/projects';
const FIREBASE_SCOPE  = 'https://www.googleapis.com/auth/datastore';
const SA_JWT_TTL      = 3300;

// ── Service Account Token ─────────────────────────────────────────────────────

let cachedSaToken:  string = '';
let cachedSaExpiry: number = 0;

function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(input);
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>) : null;
  } catch { return null; }
}

async function getServiceAccountToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedSaToken && now < cachedSaExpiry) return cachedSaToken;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('server_config_error');

  const parsed = safeJsonParse(raw);
  if (
    !parsed ||
    typeof parsed.client_email !== 'string' || !parsed.client_email ||
    typeof parsed.private_key  !== 'string' || !parsed.private_key
  ) throw new Error('server_config_error');

  const clientEmail: string = parsed.client_email;
  const privateKey:  string = parsed.private_key;

  const claim = {
    iss: clientEmail, sub: clientEmail,
    aud: TOKEN_ENDPOINT, iat: now, exp: now + 3600,
    scope: FIREBASE_SCOPE,
  };

  const header   = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=+$/, '');
  const payload  = btoa(JSON.stringify(claim)).replace(/=+$/, '');
  const unsigned = `${header}.${payload}`;

  const pemBody = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  let derBytes: Uint8Array;
  try {
    derBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  } catch { throw new Error('server_config_error'); }

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'pkcs8', derBytes.buffer as ArrayBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );
  } catch { throw new Error('server_config_error'); }

  const sigBuf = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(unsigned).buffer as ArrayBuffer
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const assertion = `${unsigned}.${sig}`;

  let tokenRes: Response;
  try {
    tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
  } catch { throw new Error('service_account_network_error'); }

  if (!tokenRes.ok) throw new Error(`service_account_token_failed:${tokenRes.status}`);

  let tokenData: Record<string, unknown>;
  try { tokenData = await tokenRes.json() as Record<string, unknown>; }
  catch { throw new Error('service_account_token_parse_error'); }

  if (typeof tokenData.access_token !== 'string' || !tokenData.access_token)
    throw new Error('service_account_token_missing');

  cachedSaToken  = tokenData.access_token;
  cachedSaExpiry = now + SA_JWT_TTL;

  return cachedSaToken;
}

// ── UID validator ─────────────────────────────────────────────────────────────

function isValidFirebaseUid(v: unknown): v is string {
  return typeof v === 'string' && /^[\w-]{1,128}$/.test(v);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!isValidFirebaseUid(uid)) {
    return NextResponse.json({ error: 'Missing or invalid uid' }, { status: 400 });
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  let saToken: string;
  try {
    saToken = await getServiceAccountToken();
  } catch {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const authHeader = { 'Authorization': `Bearer ${saToken}` };

  // ── 1. Fetch user doc via Service Account ─────────────────────────────────
  const docUrl = `${FIRESTORE_BASE}/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

  let docRes: Response;
  try {
    docRes = await fetch(docUrl, { headers: authHeader });
  } catch {
    return NextResponse.json({ error: 'Firestore fetch failed' }, { status: 502 });
  }

  if (!docRes.ok) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let docData: Record<string, unknown>;
  try { docData = await docRes.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Firestore parse error' }, { status: 502 }); }

  const fields        = (docData.fields as Record<string, { stringValue?: string }>) || {};
  const refreshToken  = fields.youtube_refresh_token?.stringValue || '';
  const accessToken   = fields.youtube_access_token?.stringValue  || '';

  if (!refreshToken && !accessToken) {
    return NextResponse.json({ error: 'No YouTube tokens found' }, { status: 400 });
  }

  // ── 2. Refresh access token ───────────────────────────────────────────────
  let validAccessToken = accessToken;

  if (refreshToken) {
    try {
      const tokenRes = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID  ?? '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET          ?? '',
          refresh_token: refreshToken,
          grant_type:    'refresh_token',
        }),
      });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json() as Record<string, unknown>;
        if (typeof tokenData.access_token === 'string' && tokenData.access_token) {
          validAccessToken = tokenData.access_token;
        }
      }
    } catch {
      // use existing accessToken as fallback
    }
  }

  // ── 3. Fetch fresh YouTube stats ──────────────────────────────────────────
  let ytRes: Response;
  try {
    ytRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&maxResults=1',
      { headers: { Authorization: `Bearer ${validAccessToken}`, Accept: 'application/json' } }
    );
  } catch {
    return NextResponse.json({ error: 'YouTube API network error' }, { status: 502 });
  }

  if (!ytRes.ok) {
    return NextResponse.json({ error: 'YouTube API error' }, { status: 502 });
  }

  let ytData: { items?: unknown[] };
  try { ytData = await ytRes.json() as { items?: unknown[] }; }
  catch { return NextResponse.json({ error: 'YouTube API parse error' }, { status: 502 }); }

  const channel = (Array.isArray(ytData.items) && ytData.items[0] !== null && typeof ytData.items[0] === 'object')
    ? (ytData.items[0] as Record<string, unknown>) : null;

  if (!channel) {
    return NextResponse.json({ error: 'No channel found' }, { status: 404 });
  }

  const stats           = (channel.statistics as Record<string, unknown>) ?? {};
  const subscriberCount = typeof stats.subscriberCount === 'string' ? stats.subscriberCount : '0';
  const videoCount      = typeof stats.videoCount      === 'string' ? stats.videoCount      : '0';
  const viewCount       = typeof stats.viewCount       === 'string' ? stats.viewCount       : '0';

  // ── 4. Write fresh stats back via Service Account ─────────────────────────
  const patchUrl =
    `${FIRESTORE_BASE}/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}` +
    '?updateMask.fieldPaths=youtube_subscriber_count' +
    '&updateMask.fieldPaths=youtube_video_count' +
    '&updateMask.fieldPaths=youtube_view_count' +
    '&updateMask.fieldPaths=youtube_access_token' +
    '&updateMask.fieldPaths=youtube_stats_refreshed_at';

  try {
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          youtube_subscriber_count:   { stringValue: subscriberCount },
          youtube_video_count:        { stringValue: videoCount },
          youtube_view_count:         { stringValue: viewCount },
          youtube_access_token:       { stringValue: validAccessToken },
          youtube_stats_refreshed_at: { stringValue: new Date().toISOString() },
        },
      }),
    });
    if (!patchRes.ok) {
      console.error('[refresh-stats] Firestore PATCH failed:', patchRes.status);
    }
    await patchRes.body?.cancel().catch(() => undefined);
  } catch {
    console.error('[refresh-stats] Firestore PATCH network error');
  }

  return NextResponse.json({ subscriberCount, videoCount, viewCount });
}