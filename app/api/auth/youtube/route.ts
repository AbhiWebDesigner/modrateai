import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const REDIRECT_BASE  = 'https://moderateai.site';
const CALLBACK_PATH  = '/api/auth/youtube/callback';
const GOOGLE_AUTH    = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES         = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
].join(' ');

const UID_REGEX      = /^[\w-]{1,128}$/;
const MAX_UID_LEN    = 128;

// ── Firebase UID validator ────────────────────────────────────────────────────

function isValidFirebaseUid(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= MAX_UID_LEN && UID_REGEX.test(v);
}

// ── Environment variable guard ────────────────────────────────────────────────

function requireEnv(name: string): string | null {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

// ── URL-safe Base64 encoder ───────────────────────────────────────────────────

function toUrlSafeBase64(input: string): string {
  return btoa(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── Validate uid ───────────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!isValidFirebaseUid(uid)) {
    return NextResponse.json(
      { error: 'Missing or invalid uid' },
      { status: 400 }
    );
  }

  // ── Validate required environment variables ────────────────────────────────
  const clientId = requireEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID');
  if (!clientId) {
    console.error('[youtube/auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // ── Generate cryptographically secure CSRF token ───────────────────────────
  const csrfBytes = new Uint8Array(32);
  crypto.getRandomValues(csrfBytes);
  const csrfToken = toUrlSafeBase64(String.fromCharCode(...csrfBytes));

  // ── Build URL-safe Base64 state payload ───────────────────────────────────
  // uid is validated above; csrf is generated server-side
  let state: string;
  try {
    state = toUrlSafeBase64(JSON.stringify({ uid, csrf: csrfToken }));
  } catch {
    console.error('[youtube/auth] failed to encode state payload');
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }

  // ── Build Google OAuth URL ─────────────────────────────────────────────────
  const redirectUri = `${REDIRECT_BASE}${CALLBACK_PATH}`;

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state,
  });

  const googleAuthUrl = `${GOOGLE_AUTH}?${params.toString()}`;

  // ── Sanity-check the generated URL before redirecting ────────────────────
  let parsedAuthUrl: URL;
  try {
    parsedAuthUrl = new URL(googleAuthUrl);
  } catch {
    console.error('[youtube/auth] generated invalid Google auth URL');
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }

  if (parsedAuthUrl.hostname !== 'accounts.google.com') {
    console.error('[youtube/auth] auth URL hostname mismatch');
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }

  // ── Issue redirect with secure CSRF cookie ────────────────────────────────
  const response = NextResponse.redirect(googleAuthUrl, { status: 302 });

  response.cookies.set('yt_oauth_csrf', csrfToken, {
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   600,
  });

  return response;
}