'use server';

import { NextResponse, type NextRequest } from 'next/server';
import { google } from 'googleapis';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

const OAUTH2_CLIENT = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return new NextResponse('User not authenticated.', { status: 401 });
  }

  if (!code) {
    return new NextResponse('Authorization code not found.', { status: 400 });
  }

  try {
    // Verify the session cookie to get the user's UID
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userId = decodedIdToken.uid;

    // Exchange the authorization code for tokens
    const { tokens } = await OAUTH2_CLIENT.getToken(code);
    const { access_token, refresh_token, expiry_date, scope } = tokens;

    if (!refresh_token) {
        // This can happen if the user has already granted consent and the app doesn't force re-consent.
        // The existing refresh token will still be valid. We'll just update the access token.
        const tokenRef = adminDb.collection('users').doc(userId).collection('googleAuthTokens').doc('main');
        await tokenRef.update({
            access_token,
            expiry_date,
            scope,
        });
        console.log('Google access token refreshed (no new refresh token issued).');
    } else {
        // Store the new refresh token securely in Firestore, associated with the user
        const tokenRef = adminDb.collection('users').doc(userId).collection('googleAuthTokens').doc('main');
        await tokenRef.set({
            access_token,
            refresh_token,
            expiry_date,
            scope,
            userId, // Store userId for security rules
        });
        console.log('Google refresh token stored successfully.');
    }
    
    // Redirect user back to the planner page
    return NextResponse.redirect(new URL('/planner', request.url));

  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    return new NextResponse('Authentication failed.', { status: 500 });
  }
}
