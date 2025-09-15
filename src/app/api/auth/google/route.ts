
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
  // Determine redirect URI based on environment
  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly openid email profile', // Added openid, email, profile
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Ensure refresh token is always sent
  });

  authUrl.search = params.toString();

  return NextResponse.redirect(authUrl.toString());
}
