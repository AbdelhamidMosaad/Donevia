import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { pageId, title, content } = await request.json();

    if (!pageId || !content || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const pageRef = adminDb.collection('users').doc(userId).collection('pages').doc(pageId);
    const pageDoc = await pageRef.get();

    if (!pageDoc.exists) {
        return NextResponse.json({ error: 'Page not found or insufficient permissions' }, { status: 404 });
    }

    const revisionData = {
      pageId,
      title,
      snapshot: content,
      createdAt: Timestamp.now(),
      authorId: userId,
    };

    const revisionRef = await adminDb.collection('users').doc(userId).collection('revisions').add(revisionData);

    // Prune old revisions, keep the last 20
    const revisionsQuery = adminDb.collection('users').doc(userId).collection('revisions')
      .where('pageId', '==', pageId)
      .orderBy('createdAt', 'desc')
      .limit(50); // Fetch more than needed to check if pruning is necessary

    const revisionsSnapshot = await revisionsQuery.get();
    if (revisionsSnapshot.size > 20) {
      const batch = adminDb.batch();
      const revisionsToDelete = revisionsSnapshot.docs.slice(20);
      revisionsToDelete.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    return NextResponse.json({ success: true, revisionId: revisionRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error saving revision:', error);
    if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
