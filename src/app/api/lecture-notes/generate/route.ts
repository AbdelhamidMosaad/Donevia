
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { generateLectureNotes } from '@/ai/flows/generate-lecture-notes-flow';
import type { LectureNotesRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const body: LectureNotesRequest = await request.json();

    if (!body.sourceText || !body.style || !body.complexity) {
        return NextResponse.json({ error: 'Missing required fields in request body.' }, { status: 400 });
    }

    const lectureNotes = await generateLectureNotes(body);

    return NextResponse.json(lectureNotes, { status: 200 });

  } catch (error) {
    console.error('Error in lecture notes generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
