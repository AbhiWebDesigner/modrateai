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

  // ── 1. Read tokens from users/{uid} ──────────────────────────────────────
  const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`;
  const docRes = await fetch(docUrl);
  if (!docRes.ok) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const docData = await docRes.json();
  const fields  = docData.fields || {};

  let accessToken        = fields.youtube_access_token?.stringValue  || '';
  const refreshToken     = fields.youtube_refresh_token?.stringValue || '';

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ error: 'No YouTube tokens' }, { status: 400 });
  }

  // ── 2. Refresh access token ───────────────────────────────────────────────
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
      accessToken = tokenData.access_token;
    }
  }

  // ── 3. Get uploads playlist ID ────────────────────────────────────────────
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!channelRes.ok) return NextResponse.json({ error: 'Channel fetch failed' }, { status: 502 });

  const channelData = await channelRes.json();
  const uploadsId   = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return NextResponse.json({ error: 'No uploads playlist' }, { status: 404 });

  // ── 4. Fetch playlist items ───────────────────────────────────────────────
  const playlistRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!playlistRes.ok) return NextResponse.json({ error: 'Playlist fetch failed' }, { status: 502 });

  const playlistData = await playlistRes.json();
  const videoIds: string[] = (playlistData.items ?? []).map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  );
  if (!videoIds.length) return NextResponse.json({ videos: [] });

  // ── 5. Fetch video details ────────────────────────────────────────────────
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${videoIds.join(',')}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!statsRes.ok) return NextResponse.json({ error: 'Video fetch failed' }, { status: 502 });

  const statsData = await statsRes.json();

  const videos = (statsData.items ?? []).map((v: {
    id: string;
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails?: { medium?: { url: string }; default?: { url: string } };
      liveBroadcastContent?: string;
    };
    statistics: { viewCount?: string; commentCount?: string };
    contentDetails: { duration: string };
  }) => ({
    id:           v.id,
    title:        v.snippet.title,
    publishedAt:  v.snippet.publishedAt,
    viewCount:    v.statistics.viewCount    ?? '0',
    commentCount: v.statistics.commentCount ?? '0',
    duration:     v.contentDetails.duration,
    thumbnail:    v.snippet.thumbnails?.medium?.url ?? v.snippet.thumbnails?.default?.url ?? '',
    isLive:       v.snippet.liveBroadcastContent === 'live',
  }));

  return NextResponse.json({ videos });
}