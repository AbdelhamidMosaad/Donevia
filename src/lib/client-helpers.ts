import { getAuth } from 'firebase/auth';

/**
 * A client-side helper to make authenticated requests to our Vercel API routes.
 * It automatically includes the Firebase auth token in the headers.
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
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

  return fetch(url, {
    ...options,
    headers,
  });
}


/**
 * Example: Saving a new revision from the client
 */
export async function saveRevisionClient(pageId: string, title: string, content: any) {
  const response = await fetchWithAuth('/api/revisions/save', {
    method: 'POST',
    body: JSON.stringify({ pageId, title, content }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save revision.');
  }

  return response.json();
}

/**
 * Example: Updating the search index for a page from the client
 */
export async function updateSearchIndexClient(pageId: string, title: string, contentJSON: any) {
  const response = await fetchWithAuth('/api/pages/update-search', {
    method: 'POST',
    body: JSON.stringify({ pageId, title, contentJSON }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update search index.');
  }

  return response.json();
}

/**
 * Example: Uploading a file attachment from the client
 */
export async function uploadAttachmentClient(pageId: string, file: File) {
  const auth = getAuth();
  const user = auth.currentUser;
   if (!user) {
    throw new Error('User is not authenticated.');
  }
  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append('pageId', pageId);
  formData.append('idToken', token); // Pass token in body for multipart
  formData.append('file', file, file.name);

  const response = await fetch('/api/attachments/upload', {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header for FormData, browser does it automatically with boundary
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file.');
  }

  return response.json();
}
