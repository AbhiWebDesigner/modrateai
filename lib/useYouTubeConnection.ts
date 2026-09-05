import { DocumentData } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Derives YouTube connection state from the user's Firestore document.
 * Single source of truth shared by Dashboard, Settings, and Live Feed.
 */
export function getYouTubeConnected(userData: DocumentData | null): boolean {
  return (userData?.youtube_connected as boolean) || false;
}

/**
 * Initiates the YouTube OAuth flow securely.
 *
 * SECURITY FIX: Token is sent in Authorization header via POST — never in URL.
 * Backend returns the Google OAuth URL as JSON, then we redirect the browser.
 * This prevents token leaking into browser history, server logs, or referrer headers.
 */
export async function connectYouTube(user: User | null): Promise<void> {
  if (!user) return;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    console.error('NEXT_PUBLIC_BACKEND_URL is not configured');
    return;
  }

  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    console.error('Failed to get Firebase ID token');
    return;
  }

  try {
    const res = await fetch(`${backendUrl}/api/auth/youtube/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to initiate YouTube OAuth:', res.status);
      return;
    }

    const data = await res.json() as { url?: string };

    if (!data.url) {
      console.error('No OAuth URL returned from backend');
      return;
    }

    // Redirect browser to Google OAuth — token never appears in URL
    window.location.href = data.url;
  } catch {
    console.error('YouTube OAuth initiation failed');
  }
}