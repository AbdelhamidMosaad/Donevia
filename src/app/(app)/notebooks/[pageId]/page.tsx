
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PageEditor } from '@/components/notebooks/page-editor';
import { useAtom } from 'jotai';
import { selectedPageAtom, selectedNotebookAtom, selectedSectionAtom } from '@/lib/notebook-store';
import { BrainCircuit, Maximize, Minimize } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Page } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { NotebookSidebar } from '@/components/notebooks/notebook-sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function NotebooksPageWithId() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const {toast} = useToast();
  const pageId = params.pageId as string;

  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  const [, setSelectedNotebook] = useAtom(selectedNotebookAtom);
  const [, setSelectedSection] = useAtom(selectedSectionAtom);

  useEffect(() => {
    if (user && pageId) {
      if (pageId.startsWith('new')) {
         // This is a placeholder for a new page, don't fetch.
         // The creation flow should handle redirection.
         return;
      }
      const pageRef = doc(db, 'users', user.uid, 'pages', pageId);
      const unsubscribe = onSnapshot(pageRef, (docSnap) => {
        if (docSnap.exists()) {
          const pageData = { id: docSnap.id, ...docSnap.data() } as Page;
          setSelectedPage(pageData);
          
          // Also update the notebook and section context
          if (pageData.sectionId) {
            getDoc(doc(db, 'users', user.uid, 'sections', pageData.sectionId)).then(sectionSnap => {
                if(sectionSnap.exists()) {
                    const sectionData = {id: sectionSnap.id, ...sectionSnap.data()};
                    setSelectedSection(sectionData as any);
                    if (sectionData.notebookId) {
                         getDoc(doc(db, 'users', user.uid, 'notebooks', sectionData.notebookId)).then(notebookSnap => {
                            if(notebookSnap.exists()) {
                                setSelectedNotebook({id: notebookSnap.id, ...notebookSnap.data()} as any);
                            }
                        })
                    }
                }
            })
          }

        } else {
           toast({variant: 'destructive', title: 'Page not found'});
           router.push('/notebooks');
        }
      });
       return () => unsubscribe();
    }
  }, [user, pageId, setSelectedPage, router, setSelectedNotebook, setSelectedSection, toast]);


  // Reset selections on unmount/user change
  useEffect(() => {
    return () => {
      setSelectedNotebook(null);
      setSelectedSection(null);
      setSelectedPage(null);
    };
  }, [user, setSelectedNotebook, setSelectedSection, setSelectedPage]);

  return (
    <div className="h-full flex">
       <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                 <NotebookSidebar />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
                <div className="h-full flex flex-col relative bg-card">
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

