import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const uid = searchParams.get('state');

  if (!code || !uid) {
    return NextResponse.redirect('https://moderateai.site/dashboard?error=auth_failed');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: 'https://moderateai.site/api/auth/youtube/callback',
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,id,statistics,brandingSettings&mine=true&maxResults=1',
      { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' } }
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    const channelName      = channel?.snippet?.title || 'My Channel';
    const channelHandle    = channel?.snippet?.customUrl || '';
    const channelId        = channel?.id || '';
    const channelThumbnail = channel?.snippet?.thumbnails?.high?.url
                          || channel?.snippet?.thumbnails?.medium?.url
                          || channel?.snippet?.thumbnails?.default?.url
                          || '';

    // YouTube hides subscriber count for small/new channels
    const hiddenSubs      = channel?.statistics?.hiddenSubscriberCount === true;
    const subscriberCount = hiddenSubs ? '0' : (channel?.statistics?.subscriberCount || '0');
    const videoCount      = channel?.statistics?.videoCount || '0';
    const viewCount       = channel?.statistics?.viewCount || '0';

    const firestoreUrl =
      `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}` +
      `?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}` +
      '&updateMask.fieldPaths=youtube_connected' +
      '&updateMask.fieldPaths=youtube_access_token' +
      '&updateMask.fieldPaths=youtube_refresh_token' +
      '&updateMask.fieldPaths=youtube_channel_id' +
      '&updateMask.fieldPaths=youtube_channel_name' +
      '&updateMask.fieldPaths=youtube_channel_handle' +
      '&updateMask.fieldPaths=youtube_channel_thumbnail' +
      '&updateMask.fieldPaths=youtube_subscriber_count' +
      '&updateMask.fieldPaths=youtube_video_count' +
      '&updateMask.fieldPaths=youtube_view_count';

    await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          youtube_connected:          { booleanValue: true },
          youtube_access_token:       { stringValue: tokens.access_token  || '' },
          youtube_refresh_token:      { stringValue: tokens.refresh_token || '' },
          youtube_channel_id:         { stringValue: channelId },
          youtube_channel_name:       { stringValue: channelName },
          youtube_channel_handle:     { stringValue: channelHandle },
          youtube_channel_thumbnail:  { stringValue: channelThumbnail },
          youtube_subscriber_count:   { stringValue: subscriberCount },
          youtube_video_count:        { stringValue: videoCount },
          youtube_view_count:         { stringValue: viewCount },
        },
      }),
    });

    return NextResponse.redirect('https://moderateai.site/dashboard?connected=true');
  } catch (err) {
    console.error(err);
    return NextResponse.redirect('https://moderateai.site/dashboard?error=auth_failed');
  }
}