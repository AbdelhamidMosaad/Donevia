import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { googleId, email, accessToken } = await request.json();

    if (!googleId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const admin = getFirebaseAdmin();
    
    // Create or get the Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
      // User doesn't exist, create them
      firebaseUser = await admin.auth().createUser({
        uid: `google:${googleId}`,
        email: email,
        emailVerified: true,
        displayName: email,
      });
    }

    // Create a custom token for this user
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid, {
      googleAccessToken: accessToken,
      googleId: googleId
    });

    return NextResponse.json({
      customToken,
      firebaseUserId: firebaseUser.uid
    });

  } catch (error) {
    console.error('Custom token creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create custom token' },
      { status: 500 }
    );
  }
}