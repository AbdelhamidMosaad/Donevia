
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { NotebookSidebar } from '@/components/notebooks/notebook-sidebar';
import { PageEditor } from '@/components/notebooks/page-editor';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAtom } from 'jotai';
import { selectedPageAtom, selectedNotebookAtom, selectedSectionAtom } from '@/lib/notebook-store';
import { BrainCircuit } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Page } from '@/lib/types';
import { useParams } from 'next/navigation';

export default function NotebooksPageWithId() {
  const { user } = useAuth();
  const params = useParams();
  const pageId = params.pageId as string;

  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  const [, setSelectedNotebook] = useAtom(selectedNotebookAtom);
  const [, setSelectedSection] = useAtom(selectedSectionAtom);

  useEffect(() => {
    if (user && pageId) {
      const pageRef = doc(db, 'users', user.uid, 'pages', pageId);
      getDoc(pageRef).then((docSnap) => {
        if (docSnap.exists()) {
          const pageData = { id: docSnap.id, ...docSnap.data() } as Page;
          setSelectedPage(pageData);
        } else {
            // handle page not found
        }
      });
    }
  }, [user, pageId, setSelectedPage]);


  // Reset selections on unmount/user change
  useEffect(() => {
    return () => {
      setSelectedNotebook(null);
      setSelectedSection(null);
    };
  }, [user, setSelectedNotebook, setSelectedSection]);

  return (
    <div className="h-[calc(100vh-theme(height.14)-2rem)] flex">
      <ResizablePanelGroup direction="horizontal" className="w-full h-full rounded-lg border">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <NotebookSidebar />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col">
            {selectedPage ? (
              <PageEditor key={selectedPage.id} page={selectedPage} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <BrainCircuit className="h-16 w-16 mb-4" />
                <h2 className="text-xl font-semibold">Select a page to start editing</h2>
                <p>Choose a page from the sidebar, or create a new notebook to begin.</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
