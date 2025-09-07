
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

    const body: StudyMaterialRequest = await request.json();
    
    // Basic validation
    if (!body.sourceText || !body.generationType) {
        return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const studyMaterial = await generateStudyMaterial(body);

    return NextResponse.json(studyMaterial, { status: 200 });

  } catch (error) {
    console.error('Error in study material generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
