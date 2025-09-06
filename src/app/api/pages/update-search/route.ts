import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

// TipTap JSON content is a structured object. This function recursively extracts text.
function extractTextFromNode(node: any): string {
    if (node.type === 'text' && node.text) {
        return node.text + ' ';
    }
    if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractTextFromNode).join('');
    }
    return '';
}

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { pageId, title, contentJSON } = await request.json();

    if (!pageId || !title || !contentJSON) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pageRef = adminDb.collection('users').doc(userId).collection('pages').doc(pageId);
    
    // Check for existence/permissions by trying to get the doc first
    const pageDoc = await pageRef.get();
    if (!pageDoc.exists) {
        return NextResponse.json({ error: 'Page not found or insufficient permissions' }, { status: 404 });
    }

    const searchText = (title + ' ' + extractTextFromNode(contentJSON)).trim().toLowerCase();

    await pageRef.update({ searchText });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error updating search index:', error);
    if (error instanceof Error && 'code' in error && error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
