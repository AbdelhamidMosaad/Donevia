
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    
    // Check if user exists. If not, you might want to create one,
    // but for this flow, we assume the user is already signed into Firebase.
    try {
        await admin.auth().getUser(uid);
    } catch (error) {
        // Handle case where user does not exist if necessary,
        // for example, by creating the user.
        // For now, we'll assume the user exists.
        console.warn(`Attempted to create token for non-existent user: ${uid}`);
    }

    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({ customToken });

  } catch (error) {
    console.error('Custom token creation error:', error);
    return NextResponse.json({ error: 'Failed to create custom token' }, { status: 500 });
  }
}
