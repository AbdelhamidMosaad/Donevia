
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { generateStudyMaterial } from '@/ai/flows/generate-study-material';
import type { StudyMaterialRequest } from '@/ai/flows/learning-tool-flow';

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

    const requestPayload: StudyMaterialRequest = {
        sourceText: body.sourceText,
        generationType: 'flashcards',
        flashcardsOptions: {
            numCards: body.numCards || 10,
            style: body.style || 'basic',
        }
    };

    const result = await generateStudyMaterial(requestPayload);

    // Adapt the response to the format expected by the frontend component.
    // The component expects a `cards` property, but the unified flow returns `flashcardContent`.
    return NextResponse.json({ cards: result.flashcardContent }, { status: 200 });

  } catch (error) {
    console.error('Error in AI flashcard generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
