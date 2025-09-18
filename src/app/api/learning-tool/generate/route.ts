
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
    
    // Verify Firebase token
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      console.error('Firebase auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body with error handling
    let body: StudyMaterialRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Basic validation
    if (!body.sourceText || !body.generationType) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    
    if (body.generationType === 'notes' && !body.notesOptions) {
      return NextResponse.json({ error: 'Missing notesOptions for notes generation.' }, { status: 400 });
    }
    
    if (body.generationType === 'quiz' && !body.quizOptions) {
      return NextResponse.json({ error: 'Missing quizOptions for quiz generation.' }, { status: 400 });
    }
    
    if (body.generationType === 'flashcards' && !body.flashcardsOptions) {
      return NextResponse.json({ error: 'Missing flashcardsOptions for flashcards generation.' }, { status: 400 });
    }

    // Generate study material
    const studyMaterial = await generateStudyMaterial(body);

    return NextResponse.json(studyMaterial, { status: 200 });

  } catch (error) {
    console.error('Error in study material generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 });
  }
}
