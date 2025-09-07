
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { generateRecap } from '@/ai/flows/recap-flow';
import type { RecapRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const body: RecapRequest = await request.json();

    if (!body.tasks || !body.period) {
        return NextResponse.json({ error: 'Missing tasks or period in request body.' }, { status: 400 });
    }

    const recapData = await generateRecap(body);

    return NextResponse.json(recapData, { status: 200 });

  } catch (error) {
    console.error('Error in recap generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
