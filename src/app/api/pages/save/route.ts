

import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Page, Revision } from '@/lib/types';
import TextStyle from '@tiptap/extension-text-style';

// Helper to extract text from TipTap JSON for search indexing
function extractTextFromNode(node: any): string {
    if (!node) {
        return '';
    }
    if (node.type === 'text' && node.text) {
        return node.text + ' ';
    }
    if (Array.isArray(node.content)) {
        return node.content.map(extractTextFromNode).join('');
    }
    return '';
}

export async function POST(request: Request) {
  const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string;
  try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
  } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
  }

  const { pageId, title, contentJSON, version: clientVersion, canvasColor } = await request.json();

  if (!pageId || !title || clientVersion === undefined) { // contentJSON can be null/empty
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const pageRef = adminDb.collection('users').doc(userId).collection('pages').doc(pageId);

  try {
    const status = await adminDb.runTransaction(async (transaction) => {
      const pageDoc = await transaction.get(pageRef);

      if (!pageDoc.exists) {
        throw new Error('Page not found or insufficient permissions');
      }

      const serverPage = pageDoc.data() as Page;
      const serverVersion = serverPage.version || 0;

      // --- Concurrency Check ---
      if (clientVersion < serverVersion) {
        // Conflict detected!
        // Save the client's attempted changes as a revision instead of overwriting.
        const revisionData: Omit<Revision, 'id'> = {
            pageId,
            title,
            snapshot: contentJSON,
            createdAt: Timestamp.now(),
            authorId: userId,
            reason: 'conflict-save-attempt'
        };
        const revisionRef = adminDb.collection('users').doc(userId).collection('revisions').doc();
        transaction.set(revisionRef, revisionData);

        // Return a conflict error with the server's current state
        return { 
            status: 'conflict', 
            serverVersion: serverVersion, 
            serverContent: serverPage.content,
            serverTitle: serverPage.title,
        };
      }

      // --- Success ---
      // No conflict, proceed with the update.
      const newVersion = serverVersion + 1;
      let searchText = title.trim().toLowerCase();
      try {
        if (contentJSON && typeof contentJSON === 'object') {
            searchText += ' ' + extractTextFromNode(contentJSON).trim().toLowerCase();
        }
      } catch (e) {
          console.error("Error extracting text from contentJSON: ", e);
          // Don't fail the whole save if text extraction fails, just log it.
      }


      const updateData: Partial<Page> = {
        title,
        content: contentJSON,
        version: newVersion,
        searchText,
        updatedAt: Timestamp.now(),
        lastEditedBy: userId,
      };

      if (typeof canvasColor === 'string') {
        updateData.canvasColor = canvasColor;
      }

      transaction.update(pageRef, updateData);

      return { status: 'ok', newVersion };
    });

    if (status.status === 'conflict') {
        return NextResponse.json(status, { status: 409 }); // 409 Conflict
    }

    return NextResponse.json(status, { status: 200 });

  } catch (error) {
    console.error('Error in save transaction:', error);
    if (error instanceof Error && error.message.includes('Page not found')) {
        return NextResponse.json({ error: 'Page not found or insufficient permissions' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
