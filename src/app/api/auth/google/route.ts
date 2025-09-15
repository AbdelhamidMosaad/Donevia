import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const OAUTH2_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const OAUTH2_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const OAUTH2_REDIRECT_URI = process.env.NEXT_PUBLIC_URL
  ? `${process.env.NEXT_PUBLIC_URL}/api/auth/google/callback`
  : 'http://localhost:9002/api/auth/google/callback';

export async function GET() {
  if (!OAUTH2_CLIENT_ID || !OAUTH2_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth2 credentials are not configured.' },
      { status: 500 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    OAUTH2_CLIENT_ID,
    OAUTH2_CLIENT_SECRET,
    OAUTH2_REDIRECT_URI
  );

  // Generate the url that will be used for the consent dialog.
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // This is crucial for getting a refresh token.
    prompt: 'consent', // Ensures the user is prompted for consent every time, necessary to get a refresh token.
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });

  return NextResponse.redirect(authorizeUrl);
}
