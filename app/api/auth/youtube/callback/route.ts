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
    // Exchange code for tokens
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

    // Get YouTube channel info
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const channelData = await channelRes.json();
    const channel = channelData.items?.[0];

    // Save to Firestore via REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;

    await fetch(firestoreUrl + '?updateMask.fieldPaths=youtube_connected&updateMask.fieldPaths=youtube_access_token&updateMask.fieldPaths=youtube_refresh_token&updateMask.fieldPaths=youtube_channel_id&updateMask.fieldPaths=youtube_channel_name&updateMask.fieldPaths=youtube_channel_handle', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({
        fields: {
          youtube_connected: { booleanValue: true },
          youtube_access_token: { stringValue: tokens.access_token || '' },
          youtube_refresh_token: { stringValue: tokens.refresh_token || '' },
          youtube_channel_id: { stringValue: channel?.id || '' },
          youtube_channel_name: { stringValue: channel?.snippet?.title || '' },
          youtube_channel_handle: { stringValue: channel?.snippet?.customUrl || '' },
        }
      }),
    });

    return NextResponse.redirect('https://moderateai.site/dashboard?connected=true');
  } catch (err) {
    console.error(err);
    return NextResponse.redirect('https://moderateai.site/dashboard?error=auth_failed');
  }
}