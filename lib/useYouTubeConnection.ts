import { DocumentData } from 'firebase/firestore';

/**
 * Derives YouTube connection state from the user's Firestore document.
 * This is the single source of truth shared by Dashboard and Live Feed.
 *
 * Field: userData.youtube_connected (boolean)
 * Same field read by Dashboard — do NOT change this without updating Dashboard too.
 */
export function getYouTubeConnected(userData: DocumentData | null): boolean {
  return (userData?.youtube_connected as boolean) || false;
}

/**
 * Initiates the YouTube OAuth flow.
 * Identical to handleYouTubeConnect in Dashboard — do NOT duplicate this elsewhere.
 */
export function connectYouTube(uid: string | undefined): void {
  if (!uid) return;
  window.location.href = `/api/auth/youtube?uid=${uid}`;
}