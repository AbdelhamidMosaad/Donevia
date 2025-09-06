
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PageEditor } from '@/components/notebooks/page-editor';
import { useAtom } from 'jotai';
import { selectedPageAtom, selectedNotebookAtom, selectedSectionAtom } from '@/lib/notebook-store';
import { BrainCircuit, Maximize, Minimize, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Page } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { NotebookSidebar } from '@/components/notebooks/notebook-sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

export default function NotebooksPageWithId() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const {toast} = useToast();
  const pageId = params.pageId as string;

  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  const [, setSelectedNotebook] = useAtom(selectedNotebookAtom);
  const [, setSelectedSection] = useAtom(selectedSectionAtom);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const [canvasColor, setCanvasColor] = useState<string>('hsl(var(--card))');


  const toggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  }


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
          setCanvasColor(pageData.canvasColor || 'hsl(var(--card))');
          
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
  
    const toggleFullscreen = () => {
        const elem = editorPanelRef.current; // Target the editor panel for fullscreen
        if (!elem) return;

        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


  return (
    <div className="h-full flex">
       <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel 
                ref={sidebarPanelRef}
                collapsible={true}
                collapsedSize={0}
                defaultSize={20} 
                minSize={15} 
                maxSize={30}
                onCollapse={() => setIsSidebarCollapsed(true)}
                onExpand={() => setIsSidebarCollapsed(false)}
                className={cn(isFullscreen && "hidden")}
            >
                 <NotebookSidebar />
            </ResizablePanel>
             <div className={cn("relative", isFullscreen && "hidden")}>
                <ResizableHandle withHandle />
                 <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-10 h-8 w-8 bg-background border rounded-full"
                >
                    {isSidebarCollapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
            </div>
            <ResizablePanel defaultSize={80}>
                <div ref={editorPanelRef} className="h-full flex flex-col relative rounded-lg overflow-hidden" style={{ backgroundColor: canvasColor }}>
                    <div className="absolute top-4 right-4 z-10">
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-black">
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </Button>
                    </div>
                    {selectedPage ? (
                    <PageEditor key={selectedPage.id} page={selectedPage} onCanvasColorChange={setCanvasColor} editorPanelRef={editorPanelRef} />
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
