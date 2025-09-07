
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { generateLectureNotesFlow } from '@/ai/flows/generate-lecture-notes-flow';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { sourceText } = await request.json();

    if (!sourceText) {
        return NextResponse.json({ error: 'Missing source text in request body.' }, { status: 400 });
    }

    const { title, content } = await generateLectureNotesFlow({ sourceText });

    // Save the generated note to Firestore
    const lectureNotesRef = collection(adminDb, 'users', userId, 'lectureNotes');
    const newDocRef = await addDoc(lectureNotesRef, {
        title,
        content,
        sourceText,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, noteId: newDocRef.id }, { status: 200 });

  } catch (error) {
    console.error('Error in lecture notes generation API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
