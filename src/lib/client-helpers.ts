

import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

/**
 * A client-side helper to make authenticated requests to our Vercel API routes.
 * It automatically includes the Firebase auth token in the headers.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error('User is not authenticated. Cannot make authenticated request.');
  }

  const token = await user.getIdToken();

  const headers = new Headers(options.headers || {});
  headers.append('Authorization', `Bearer ${token}`);
  
  if (!(options.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const error: any = new Error(`API request failed with status ${response.status}`);
    try {
        error.response = await response.json();
        Object.assign(error, error.response);
    } catch(e) {
        error.response = { error: response.statusText };
    }
    throw error;
  }
  
  return response;
}
