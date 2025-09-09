
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { generateFlashcards } from '@/ai/flows/generate-flashcards-flow';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const body = await request.json();
    
    if (!body.sourceText) {
        return NextResponse.json({ error: 'Missing sourceText field.' }, { status: 400 });
    }

    const result = await generateFlashcards({ sourceText: body.sourceText });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in AI flashcard generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
