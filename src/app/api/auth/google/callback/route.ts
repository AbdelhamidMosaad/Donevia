
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.redirect(new URL('/planner?error=auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/planner?error=no_code', request.url));
  }

  try {
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);
    }

    // IMPORTANT: In a production app, you would securely store the `refresh_token` 
    // in your backend database (e.g., Firestore) associated with the user's ID.
    // For this demonstration, we are only passing the short-lived access_token to the client.
    // This means the connection will still be lost on refresh, but the server-side flow is now correctly structured.

    const frontendRedirectUrl = new URL('/planner', request.url);
    frontendRedirectUrl.searchParams.set('access_token', tokens.access_token);
    // In a real app, you would not pass the refresh token to the client.
    // frontendRedirectUrl.searchParams.set('refresh_token', tokens.refresh_token || '');
    
    return NextResponse.redirect(frontendRedirectUrl);

  } catch (err: any) {
    console.error('Callback error:', err);
    return NextResponse.redirect(new URL(`/planner?error=server_error&message=${encodeURIComponent(err.message)}`, request.url));
  }
}
