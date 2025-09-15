import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    // Store tokens securely (in database in production)
    // For now, we'll pass them via URL params to the frontend
    const frontendRedirectUrl = new URL('/', request.url);
    frontendRedirectUrl.searchParams.set('access_token', tokens.access_token);
    frontendRedirectUrl.searchParams.set('refresh_token', tokens.refresh_token || '');
    frontendRedirectUrl.searchParams.set('user_id', userInfo.id);
    frontendRedirectUrl.searchParams.set('user_email', userInfo.email);

    return NextResponse.redirect(frontendRedirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}