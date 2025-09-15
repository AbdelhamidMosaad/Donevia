// src/app/api/auth/google/callback/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Get the authorization code from Google's callback
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    // 2. Exchange the code for access and refresh tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokens);
      return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 400 });
    }

    // 3. ✅ YOU NOW HAVE THE REFRESH TOKEN!
    // tokens.refresh_token contains your long-lived refresh token
    // tokens.access_token contains your short-lived access token

    // 4. (Optional) Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    // 5. Here you would typically:
    // - Save the refresh_token securely to a database
    // - Create a session or JWT for your frontend
    // - Redirect the user back to your application

    // For now, let's just redirect to the homepage with a success message
    const response = NextResponse.redirect(new URL('/', request.url));
    // You could set a cookie with the access token here if needed
    // response.cookies.set('google_access_token', tokens.access_token, { httpOnly: true });
    
    return response;

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}