
'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Doc } from '@/lib/types';
import { DocEditor } from '@/components/docs/doc-editor';
import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose, Maximize, Minimize } from 'lucide-react';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
import { WelcomeScreen } from '@/components/welcome-screen';


export default function DocPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const docId = params.docId as string;

  const [docData, setDocData] = useState<Doc | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorPanelRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (loading) return;
    if (!user) {
        router.push('/');
        return;
    }
    if (!docId) return;

    const docRef = doc(db, 'users', user.uid, 'docs', docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDocData({ id: docSnap.id, ...docSnap.data() } as Doc);
      } else {
        toast({ variant: 'destructive', title: 'Document not found' });
        router.push('/docs');
      }
    });

    return () => unsubscribe();
  }, [user, docId, loading, router, toast]);

  const toggleSidebar = () => {
    const panel = sidebarPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const toggleFullscreen = () => {
    const elem = editorPanelRef.current;
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

  if (loading || !docData) {
    return <WelcomeScreen />;
  }

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
                <DocsSidebar activeDocId={docId} />
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
                <div ref={editorPanelRef} className="h-full flex flex-col relative rounded-lg overflow-hidden bg-background">
                     <div className="absolute top-4 right-4 z-10">
                        <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-black dark:text-white">
                            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </Button>
                    </div>
                    <DocEditor key={docData.id} doc={docData} />
                </div>
            </ResizablePanel>
       </ResizablePanelGroup>
    </div>
  );
}
