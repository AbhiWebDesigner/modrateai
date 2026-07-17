import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = getFirestore();

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

    // Save to Firebase
    await adminDb.collection('users').doc(uid).update({
      youtube_connected: true,
      youtube_access_token: tokens.access_token,
      youtube_refresh_token: tokens.refresh_token,
      youtube_channel_id: channel?.id || null,
      youtube_channel_name: channel?.snippet?.title || null,
      youtube_channel_handle: channel?.snippet?.customUrl || null,
    });

    return NextResponse.redirect('https://moderateai.site/dashboard?connected=true');
  } catch (err) {
    console.error(err);
    return NextResponse.redirect('https://moderateai.site/dashboard?error=auth_failed');
  }
}