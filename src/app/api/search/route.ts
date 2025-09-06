
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Page, Section, Notebook } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const lowerCaseQuery = q.toLowerCase();
    
    const pagesRef = adminDb.collection('users').doc(userId).collection('pages');
    const querySnapshot = await pagesRef
        .where('searchText', '>=', lowerCaseQuery)
        .where('searchText', '<=', lowerCaseQuery + '\uf8ff')
        .limit(20)
        .get();

    const pages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Page));

    if (pages.length === 0) {
        return NextResponse.json({ results: [] }, { status: 200 });
    }

    // Fetch related sections and notebooks
    const sectionIds = [...new Set(pages.map(p => p.sectionId))];
    const sectionsRef = adminDb.collection('users').doc(userId).collection('sections');
    const sectionsSnapshot = await sectionsRef.where('__name__', 'in', sectionIds).get();
    const sections = sectionsSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() } as Section;
        return acc;
    }, {} as Record<string, Section>);

    const notebookIds = [...new Set(Object.values(sections).map(s => s.notebookId))];
    const notebooksRef = adminDb.collection('users').doc(userId).collection('notebooks');
    const notebooksSnapshot = await notebooksRef.where('__name__', 'in', notebookIds).get();
    const notebooks = notebooksSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = { id: doc.id, ...doc.data() } as Notebook;
        return acc;
    }, {} as Record<string, Notebook>);

    const results = pages.map(page => {
        const section = sections[page.sectionId];
        const notebook = section ? notebooks[section.notebookId] : undefined;
        return { page, section, notebook };
    }).filter(r => r.section && r.notebook); // Filter out any orphaned pages

    return NextResponse.json({ results }, { status: 200 });

  } catch (error) {
    console.error('Error in search API:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Authentication token expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
