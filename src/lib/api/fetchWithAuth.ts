import { auth } from '@/lib/firebase/config';

/**
 * Fetch wrapper that automatically includes Firebase ID token in Authorization header
 *
 * Usage:
 * const response = await fetchWithAuth('/api/chat', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  // Get fresh ID token
  const idToken = await currentUser.getIdToken();

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${idToken}`);
  headers.set('Content-Type', 'application/json');

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * POST request with authentication
 */
export async function postWithAuth<T>(
  url: string,
  data: unknown
): Promise<T> {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${response.status}`);
  }

  return response.json();
}
