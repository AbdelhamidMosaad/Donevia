import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { checkGrammar } from '@/ai/flows/grammar-coach-flow';
import type { GrammarCorrectionInput } from '@/ai/flows/grammar-coach-flow';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const body: GrammarCorrectionInput = await request.json();
    
    if (!body.text || body.text.length < 5) {
        return NextResponse.json({ error: 'Text input is required and must be at least 5 characters.' }, { status: 400 });
    }

    const result = await checkGrammar(body);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in grammar check API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
