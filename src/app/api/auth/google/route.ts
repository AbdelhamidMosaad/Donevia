// src/app/api/auth/google/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // 1. Get configuration from Environment Variables
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  
  // 2. Construct the redirect URI for the callback
  // Use the current request's hostname to build the URL dynamically
  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  // 3. Construct the Google Auth URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent',
  });

  googleAuthUrl.search = params.toString();

  // 4. Redirect to Google's authentication page
  return NextResponse.redirect(googleAuthUrl.toString());
}