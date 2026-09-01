import { DocumentData } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Derives YouTube connection state from the user's Firestore document.
 * Single source of truth shared by Dashboard, Settings, and Live Feed.
 *
 * Field: userData.youtube_connected (boolean)
 */
export function getYouTubeConnected(userData: DocumentData | null): boolean {
  return (userData?.youtube_connected as boolean) || false;
}

/**
 * Initiates the YouTube OAuth flow.
 * Fetches a fresh Firebase ID token and passes it as a query param
 * because browser redirects cannot send Authorization headers.
 */
export async function connectYouTube(user: User | null): Promise<void> {
  if (!user) return;

  try {
    const token = await user.getIdToken();
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/youtube?token=${token}`;
  } catch {
    console.error('Failed to get auth token for YouTube connect');
  }
}