import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const REDIRECT_BASE  = 'https://moderateai.site';
const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const FIREBASE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const YOUTUBE_API    =
  'https://www.googleapis.com/youtube/v3/channels?part=snippet,id,statistics,brandingSettings&mine=true&maxResults=1';

const MAX_TOKEN_LEN = 4096;
const MAX_STATE_LEN = 512;
const SA_JWT_TTL    = 3300;

// ── Allowed redirect paths ────────────────────────────────────────────────────

const ALLOWED_PATHS = new Set([
  '/dashboard?error=auth_failed',
  '/dashboard?error=invalid_state',
  '/dashboard?error=csrf_mismatch',
  '/dashboard?error=token_exchange_failed',
  '/dashboard?error=token_missing',
  '/dashboard?error=channel_fetch_failed',
  '/dashboard?error=db_write_failed',
  '/dashboard?error=server_config_error',
  '/dashboard?connected=true',
]);

function safeRedirect(path: string): NextResponse {
  const target = ALLOWED_PATHS.has(path) ? path : '/dashboard?error=auth_failed';
  return NextResponse.redirect(`${REDIRECT_BASE}${target}`, { status: 302 });
}

function withClearedCsrf(response: NextResponse): NextResponse {
  response.cookies.set('yt_oauth_csrf', '', {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  });
  return response;
}

// ── Safe helpers ──────────────────────────────────────────────────────────────

function safeAtob(input: string): string | null {
  try { return atob(input); } catch { return null; }
}

function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(input);
    return v !== null && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : null;
  } catch { return null; }
}

function isValidFirebaseUid(v: unknown): v is string {
  return typeof v === 'string' && /^[\w-]{1,128}$/.test(v);
}

function safeStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

// ── Timing-safe comparison ────────────────────────────────────────────────────

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  try {
    const enc  = new TextEncoder();
    const aB   = enc.encode(a);
    const bB   = enc.encode(b);
    if (aB.length !== bB.length) return false;

    const nonce = crypto.getRandomValues(new Uint8Array(32));

    const [aKey, bKey] = await Promise.all([
      crypto.subtle.importKey(
        'raw', aB.buffer as ArrayBuffer,
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      ),
      crypto.subtle.importKey(
        'raw', bB.buffer as ArrayBuffer,
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      ),
    ]);

    const [aSig, bSig] = await Promise.all([
      crypto.subtle.sign('HMAC', aKey, nonce.buffer as ArrayBuffer),
      crypto.subtle.sign('HMAC', bKey, nonce.buffer as ArrayBuffer),
    ]);

    const aA = new Uint8Array(aSig);
    const bA = new Uint8Array(bSig);
    let diff = 0;
    for (let i = 0; i < aA.length; i++) diff |= aA[i] ^ bA[i];
    return diff === 0;
  } catch { return false; }
}

// ── Service-account token cache ───────────────────────────────────────────────

let cachedSaToken:  string = '';
let cachedSaExpiry: number = 0;

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
    iss:   clientEmail,
    sub:   clientEmail,
    aud:   TOKEN_ENDPOINT,
    iat:   now,
    exp:   now + 3600,
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
  } catch {
    throw new Error('server_config_error');
  }

  // Use .buffer cast to ArrayBuffer to satisfy BufferSource constraint
  const derBuffer: ArrayBuffer = derBytes.buffer as ArrayBuffer;

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      derBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
  } catch {
    throw new Error('server_config_error');
  }

  const msgBytes: ArrayBuffer = new TextEncoder().encode(unsigned).buffer as ArrayBuffer;

  const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, msgBytes);

  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const assertion = `${unsigned}.${sig}`;

  let tokenRes: Response;
  try {
    tokenRes = await fetch(TOKEN_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
  } catch {
    throw new Error('service_account_network_error');
  }

  if (!tokenRes.ok) {
    await tokenRes.body?.cancel().catch(() => undefined);
    throw new Error(`service_account_token_failed:${tokenRes.status}`);
  }

  let tokenData: Record<string, unknown>;
  try {
    tokenData = await tokenRes.json() as Record<string, unknown>;
  } catch {
    throw new Error('service_account_token_parse_error');
  }

  if (typeof tokenData.access_token !== 'string' || !tokenData.access_token) {
    throw new Error('service_account_token_missing');
  }

  cachedSaToken  = tokenData.access_token;
  cachedSaExpiry = now + SA_JWT_TTL;

  return cachedSaToken;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code       = searchParams.get('code');
  const stateParam = searchParams.get('state');

  if (
    !code        || typeof code       !== 'string' || code.length       > MAX_TOKEN_LEN ||
    !stateParam  || typeof stateParam !== 'string' || stateParam.length > MAX_STATE_LEN
  ) {
    return safeRedirect('/dashboard?error=auth_failed');
  }

  // ── Decode and validate state ─────────────────────────────────────────────
  const stateRaw = safeAtob(stateParam);
  if (!stateRaw) return safeRedirect('/dashboard?error=invalid_state');

  const stateObj = safeJsonParse(stateRaw);
  if (!stateObj) return safeRedirect('/dashboard?error=invalid_state');

  if (!isValidFirebaseUid(stateObj.uid)) return safeRedirect('/dashboard?error=invalid_state');

  if (
    typeof stateObj.csrf !== 'string' ||
    stateObj.csrf.length < 32 ||
    stateObj.csrf.length > 256
  ) return safeRedirect('/dashboard?error=invalid_state');

  const uid:       string = stateObj.uid;
  const csrfToken: string = stateObj.csrf;

  // ── CSRF validation — read and immediately schedule cookie clear ──────────
  const storedCsrf = request.cookies.get('yt_oauth_csrf')?.value;

  if (
    !storedCsrf ||
    typeof storedCsrf !== 'string' ||
    storedCsrf.length < 32 ||
    storedCsrf.length > 256
  ) {
    return withClearedCsrf(safeRedirect('/dashboard?error=csrf_mismatch'));
  }

  const csrfValid = await timingSafeEqual(storedCsrf, csrfToken);
  if (!csrfValid) {
    return withClearedCsrf(safeRedirect('/dashboard?error=csrf_mismatch'));
  }

  // ── All exits below must call withClearedCsrf ─────────────────────────────
  try {
    // ── Token exchange ────────────────────────────────────────────────────────
    let tokenRes: Response;
    try {
      tokenRes = await fetch(TOKEN_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams({
          code,
          client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID  ?? '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET          ?? '',
          redirect_uri:  `${REDIRECT_BASE}/api/auth/youtube/callback`,
          grant_type:    'authorization_code',
        }),
      });
    } catch {
      console.error('[youtube/callback] token exchange network error');
      return withClearedCsrf(safeRedirect('/dashboard?error=token_exchange_failed'));
    }

    if (!tokenRes.ok) {
      console.error('[youtube/callback] token exchange HTTP error:', tokenRes.status);
      await tokenRes.body?.cancel().catch(() => undefined);
      return withClearedCsrf(safeRedirect('/dashboard?error=token_exchange_failed'));
    }

    let tokens: Record<string, unknown>;
    try {
      tokens = await tokenRes.json() as Record<string, unknown>;
    } catch {
      console.error('[youtube/callback] token response parse error');
      return withClearedCsrf(safeRedirect('/dashboard?error=token_exchange_failed'));
    }

    const accessToken = (
      typeof tokens.access_token === 'string' &&
      tokens.access_token.length > 0 &&
      tokens.access_token.length <= MAX_TOKEN_LEN
    ) ? tokens.access_token : null;

    const refreshToken = (
      typeof tokens.refresh_token === 'string' &&
      tokens.refresh_token.length > 0 &&
      tokens.refresh_token.length <= MAX_TOKEN_LEN
    ) ? tokens.refresh_token : null;

    if (!accessToken) {
      console.error('[youtube/callback] access_token absent or invalid in token response');
      return withClearedCsrf(safeRedirect('/dashboard?error=token_missing'));
    }

    // ── YouTube channel fetch ─────────────────────────────────────────────────
    let channelRes: Response;
    try {
      channelRes = await fetch(YOUTUBE_API, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept:        'application/json',
        },
      });
    } catch {
      console.error('[youtube/callback] YouTube API network error');
      return withClearedCsrf(safeRedirect('/dashboard?error=channel_fetch_failed'));
    }

    if (!channelRes.ok) {
      console.error('[youtube/callback] YouTube API HTTP error:', channelRes.status);
      await channelRes.body?.cancel().catch(() => undefined);
      return withClearedCsrf(safeRedirect('/dashboard?error=channel_fetch_failed'));
    }

    let channelData: { items?: unknown[] };
    try {
      channelData = await channelRes.json() as { items?: unknown[] };
    } catch {
      console.error('[youtube/callback] YouTube API response parse error');
      return withClearedCsrf(safeRedirect('/dashboard?error=channel_fetch_failed'));
    }

    const items   = Array.isArray(channelData.items) ? channelData.items : [];
    const channel = (items[0] !== null && typeof items[0] === 'object')
      ? (items[0] as Record<string, unknown>)
      : null;

    const snippet = (channel?.snippet !== null && typeof channel?.snippet === 'object')
      ? (channel.snippet as Record<string, unknown>)
      : {};

    const stats = (channel?.statistics !== null && typeof channel?.statistics === 'object')
      ? (channel.statistics as Record<string, unknown>)
      : {};

    const thumbs = (snippet.thumbnails !== null && typeof snippet.thumbnails === 'object')
      ? (snippet.thumbnails as Record<string, { url?: unknown }>)
      : {};

    const channelName      = safeStr(snippet.title, 'My Channel');
    const channelHandle    = safeStr(snippet.customUrl);
    const channelId        = safeStr(channel?.id);
    const channelThumbnail =
      safeStr(thumbs.high?.url)   ||
      safeStr(thumbs.medium?.url) ||
      safeStr(thumbs.default?.url);
    const subscriberCount  = safeStr(stats.subscriberCount, '0');
    const videoCount       = safeStr(stats.videoCount,      '0');
    const viewCount        = safeStr(stats.viewCount,       '0');

    // ── Service account token ─────────────────────────────────────────────────
    let saToken: string;
    try {
      saToken = await getServiceAccountToken();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      console.error('[youtube/callback] service account error:', msg);
      return withClearedCsrf(safeRedirect('/dashboard?error=server_config_error'));
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId || typeof projectId !== 'string' || projectId.length === 0) {
      console.error('[youtube/callback] missing NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      return withClearedCsrf(safeRedirect('/dashboard?error=server_config_error'));
    }

    // ── Firestore PATCH ───────────────────────────────────────────────────────
    const firestoreUrl =
      `${FIRESTORE_BASE}/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(uid)}` +
      '?updateMask.fieldPaths=youtube_connected' +
      '&updateMask.fieldPaths=youtube_access_token' +
      '&updateMask.fieldPaths=youtube_refresh_token' +
      '&updateMask.fieldPaths=youtube_channel_id' +
      '&updateMask.fieldPaths=youtube_channel_name' +
      '&updateMask.fieldPaths=youtube_channel_handle' +
      '&updateMask.fieldPaths=youtube_channel_thumbnail' +
      '&updateMask.fieldPaths=youtube_subscriber_count' +
      '&updateMask.fieldPaths=youtube_video_count' +
      '&updateMask.fieldPaths=youtube_view_count';

    let patchRes: Response;
    try {
      patchRes = await fetch(firestoreUrl, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${saToken}`,
        },
        body: JSON.stringify({
          fields: {
            youtube_connected:         { booleanValue: true },
            youtube_access_token:      { stringValue: accessToken },
            youtube_refresh_token:     { stringValue: refreshToken ?? '' },
            youtube_channel_id:        { stringValue: channelId },
            youtube_channel_name:      { stringValue: channelName },
            youtube_channel_handle:    { stringValue: channelHandle },
            youtube_channel_thumbnail: { stringValue: channelThumbnail },
            youtube_subscriber_count:  { stringValue: subscriberCount },
            youtube_video_count:       { stringValue: videoCount },
            youtube_view_count:        { stringValue: viewCount },
          },
        }),
      });
    } catch {
      console.error('[youtube/callback] Firestore PATCH network error');
      return withClearedCsrf(safeRedirect('/dashboard?error=db_write_failed'));
    }

    if (!patchRes.ok) {
      console.error('[youtube/callback] Firestore PATCH HTTP error:', patchRes.status);
      await patchRes.body?.cancel().catch(() => undefined);
      return withClearedCsrf(safeRedirect('/dashboard?error=db_write_failed'));
    }

    await patchRes.body?.cancel().catch(() => undefined);

    return withClearedCsrf(safeRedirect('/dashboard?connected=true'));

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[youtube/callback] unhandled error:', msg);
    return withClearedCsrf(safeRedirect('/dashboard?error=auth_failed'));
  }
}