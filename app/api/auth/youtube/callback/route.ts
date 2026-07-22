import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const REDIRECT_BASE   = 'https://moderateai.site';
const FIRESTORE_BASE  = 'https://firestore.googleapis.com/v1/projects';
const TOKEN_ENDPOINT  = 'https://oauth2.googleapis.com/token';
const FIREBASE_SCOPE  = 'https://www.googleapis.com/auth/datastore';

// ── Service-account JWT for Firestore (Edge-compatible) ───────────────────────

async function getServiceAccountToken(): Promise<string> {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);

  const now   = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
    scope: FIREBASE_SCOPE,
  };

  const header  = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=+$/, '');
  const payload = btoa(JSON.stringify(claim)).replace(/=+$/, '');
  const unsigned = `${header}.${payload}`;

  // Import the PEM private key via Web Crypto
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const derBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    derBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${unsigned}.${signature}`;

  // Exchange self-signed JWT for a Google access token
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text().catch(() => 'unknown');
    throw new Error(`[youtube/callback] service account token failed: ${tokenRes.status} ${errText}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) throw new Error('[youtube/callback] service account token missing');

  return tokenData.access_token;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code       = searchParams.get('code');
  const stateParam = searchParams.get('state');

  if (!code || !stateParam) {
    return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=auth_failed`);
  }

  // ── CSRF: decode and validate state ────────────────────────────────────────
  let uid: string;
  let csrfToken: string;

  try {
    const decoded = JSON.parse(atob(stateParam));
    uid       = decoded.uid;
    csrfToken = decoded.csrf;
    if (!uid || !csrfToken) throw new Error('missing fields');
  } catch {
    return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=invalid_state`);
  }

  const storedCsrf = request.cookies.get('yt_oauth_csrf')?.value;
  if (!storedCsrf || storedCsrf !== csrfToken) {
    return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=csrf_mismatch`);
  }

  try {
    // ── Exchange code for tokens ──────────────────────────────────────────────
    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri:  `${REDIRECT_BASE}/api/auth/youtube/callback`,
        grant_type:    'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => 'unknown');
      console.error('[youtube/callback] token exchange failed:', tokenRes.status, errText);
      return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=token_exchange_failed`);
    }

    const tokens = (await tokenRes.json()) as Record<string, unknown>;
    const accessToken  = typeof tokens.access_token  === 'string' ? tokens.access_token  : null;
    const refreshToken = typeof tokens.refresh_token === 'string' ? tokens.refresh_token : null;

    if (!accessToken) {
      console.error('[youtube/callback] missing access_token in token response');
      return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=token_missing`);
    }

    // ── Fetch YouTube channel info ────────────────────────────────────────────
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,id,statistics,brandingSettings&mine=true&maxResults=1',
      { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
    );

    if (!channelRes.ok) {
      const errText = await channelRes.text().catch(() => 'unknown');
      console.error('[youtube/callback] channel fetch failed:', channelRes.status, errText);
      return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=channel_fetch_failed`);
    }

    const channelData = (await channelRes.json()) as { items?: Record<string, unknown>[] };
    const channel     = channelData.items?.[0] ?? null;
    const snippet     = (channel?.snippet   as Record<string, unknown> | undefined) ?? {};
    const stats       = (channel?.statistics as Record<string, unknown> | undefined) ?? {};
    const thumbs      = (snippet.thumbnails  as Record<string, { url?: string }> | undefined) ?? {};

    const channelName      = typeof snippet.title     === 'string' ? snippet.title     : 'My Channel';
    const channelHandle    = typeof snippet.customUrl === 'string' ? snippet.customUrl : '';
    const channelId        = typeof channel?.id       === 'string' ? channel.id        : '';
    const channelThumbnail = thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? '';
    const subscriberCount  = typeof stats.subscriberCount === 'string' ? stats.subscriberCount : '0';
    const videoCount       = typeof stats.videoCount      === 'string' ? stats.videoCount      : '0';
    const viewCount        = typeof stats.viewCount       === 'string' ? stats.viewCount       : '0';

    // ── Authenticated Firestore PATCH (service account) ───────────────────────
    const saToken = await getServiceAccountToken();

    const firestoreUrl =
      `${FIRESTORE_BASE}/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}` +
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

    const patchRes = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${saToken}`,   // ← authenticated; no API key in URL
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

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => 'unknown');
      console.error('[youtube/callback] Firestore PATCH failed:', patchRes.status, errText);
      return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=db_write_failed`);
    }

    // ── Clear CSRF cookie and redirect ────────────────────────────────────────
    const response = NextResponse.redirect(`${REDIRECT_BASE}/dashboard?connected=true`);
    response.cookies.set('yt_oauth_csrf', '', { maxAge: 0, path: '/' });
    return response;

  } catch (err) {
    console.error('[youtube/callback] unexpected error:', err);
    return NextResponse.redirect(`${REDIRECT_BASE}/dashboard?error=auth_failed`);
  }
}