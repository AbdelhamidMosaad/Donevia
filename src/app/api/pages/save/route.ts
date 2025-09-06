
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Page } from '@/lib/types';

// TipTap JSON content is a structured object. This function recursively extracts text.
function extractTextFromNode(node: any): string {
    if (!node) {
        return '';
    }
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

    const { pageId, title, contentJSON, canvasColor, baseVersion } = await request.json();

    if (!pageId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pageRef = adminDb.collection('users').doc(userId).collection('pages').doc(pageId);
    
    const result = await adminDb.runTransaction(async (transaction) => {
        const pageDoc = await transaction.get(pageRef);
        if (!pageDoc.exists) {
            throw new Error('Page not found or insufficient permissions');
        }

        const currentPage = pageDoc.data() as Page;
        
        // Optimistic locking: check if the version matches
        if (currentPage.version !== baseVersion) {
           return { conflict: true, serverVersion: currentPage.version };
        }

        let searchText = currentPage.searchText;
        // Only update search text if content is actually being updated
        if (contentJSON) {
           try {
             searchText = (title + ' ' + extractTextFromNode(contentJSON)).trim().toLowerCase();
           } catch(e) {
                console.error("Failed to extract search text, will use old value. Error:", e);
           }
        }

        const updateData: Record<string, any> = {
            title,
            version: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
            lastEditedBy: userId,
            searchText,
        };

        if (contentJSON) {
            updateData.content = contentJSON;
        }

        if (canvasColor !== undefined) {
            updateData.canvasColor = canvasColor;
        }
        
        transaction.update(pageRef, updateData);

        return { conflict: false, newVersion: currentPage.version + 1 };
    });

    if (result.conflict) {
        return NextResponse.json({ error: 'Conflict: Page was updated by someone else.', conflict: true, serverVersion: result.serverVersion }, { status: 409 });
    }

    return NextResponse.json({ success: true, newVersion: result.newVersion }, { status: 200 });

  } catch (error) {
    console.error('Error saving page:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: (error as Error).message }, { status: 500 });
  }
}
