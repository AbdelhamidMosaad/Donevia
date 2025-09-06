

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
    } catch(e) {
        error.response = { error: response.statusText };
    }
    throw error;
  }
  
  return response;
}



/**
 * Saves a new revision from the client.
 * NOTE: This is now less used, as the /api/pages/save endpoint handles conflict revisions automatically.
 */
export async function saveRevisionClient(pageId: string, title: string, content: any) {
  const response = await fetchWithAuth('/api/revisions/save', {
    method: 'POST',
    body: JSON.stringify({ pageId, title, content }),
  });
  return response.json();
}

/**
 * Uploads a file attachment from the client.
 * This version uses the Vercel serverless function to handle the upload and thumbnailing.
 */
export async function uploadAttachmentClient(pageId: string, file: File, onProgress: (progress: number) => void) {
  const auth = getAuth();
  const user = auth.currentUser;
   if (!user) {
    throw new Error('User is not authenticated.');
  }
  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append('pageId', pageId);
  formData.append('idToken', token);
  formData.append('file', file, file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/attachments/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.response));
      } else {
        try {
            const errorData = JSON.parse(xhr.response);
            reject(new Error(errorData.error || 'Failed to upload file.'));
        } catch (e) {
            reject(new Error(`Server error: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload.'));
    };

    xhr.send(formData);
  });
}
