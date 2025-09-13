
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { improveEmail } from '@/ai/flows/email-coach-flow';
import type { EmailCoachRequest } from '@/lib/types/email-coach';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const body: EmailCoachRequest = await request.json();
    
    if (!body.emailText || !body.context) {
        return NextResponse.json({ error: 'Email text and context are required.' }, { status: 400 });
    }

    const result = await improveEmail(body);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in email coach API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
