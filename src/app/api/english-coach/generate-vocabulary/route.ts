import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { generateVocabularyStory } from '@/ai/flows/vocabulary-coach-flow';
import type { VocabularyCoachRequest } from '@/lib/types/vocabulary';

// This API route is no longer used by the component, which now calls the flow directly.
// It is kept here for potential future use or direct API access if needed.
export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const body: VocabularyCoachRequest = await request.json();
    
    if (!body.level) {
        return NextResponse.json({ error: 'Vocabulary level is required.' }, { status: 400 });
    }

    const result = await generateVocabularyStory(body);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in vocabulary coach API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
