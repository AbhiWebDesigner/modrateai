import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

  // ── 1. Fetch user doc from Firestore REST API ─────────────────────────────
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`;
  const docRes = await fetch(docUrl);
  if (!docRes.ok) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const docData = await docRes.json();
  const fields  = docData.fields || {};

  const refreshToken  = fields.youtube_refresh_token?.stringValue || '';
  const accessToken   = fields.youtube_access_token?.stringValue  || '';

  if (!refreshToken && !accessToken) {
    return NextResponse.json({ error: 'No YouTube tokens found' }, { status: 400 });
  }

  // ── 2. Get a valid access token (refresh if needed) ───────────────────────
  let validAccessToken = accessToken;

  if (refreshToken) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      validAccessToken = tokenData.access_token;
    }
  }

  // ── 3. Fetch fresh channel stats from YouTube API ─────────────────────────
  const ytRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&maxResults=1',
    { headers: { Authorization: `Bearer ${validAccessToken}`, Accept: 'application/json' } }
  );

  if (!ytRes.ok) {
    return NextResponse.json({ error: 'YouTube API error' }, { status: 502 });
  }

  const ytData  = await ytRes.json();
  const channel = ytData.items?.[0];

  if (!channel) {
    return NextResponse.json({ error: 'No channel found' }, { status: 404 });
  }

  const subscriberCount = channel.statistics?.subscriberCount || '0';
  const videoCount      = channel.statistics?.videoCount      || '0';
  const viewCount       = channel.statistics?.viewCount       || '0';

  // ── 4. Write fresh stats back to Firestore ────────────────────────────────
  const patchUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}` +
    `?key=${apiKey}` +
    '&updateMask.fieldPaths=youtube_subscriber_count' +
    '&updateMask.fieldPaths=youtube_video_count' +
    '&updateMask.fieldPaths=youtube_view_count' +
    '&updateMask.fieldPaths=youtube_access_token' +
    '&updateMask.fieldPaths=youtube_stats_refreshed_at';

  await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
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

  return NextResponse.json({ subscriberCount, videoCount, viewCount });
}