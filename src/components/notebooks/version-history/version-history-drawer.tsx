
'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { Page, Revision } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RevisionItem } from './revision-item';
import { RevisionPreview } from './revision-preview';
import { Skeleton } from '@/components/ui/skeleton';

interface VersionHistoryDrawerProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (content: any, title: string) => void;
  currentContent: any;
}

export function VersionHistoryDrawer({ page, isOpen, onClose, onRestore, currentContent }: VersionHistoryDrawerProps) {
  const { user } = useAuth();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && isOpen) {
      setIsLoading(true);
      setSelectedRevision(null); // Reset selection when drawer opens
      const q = query(
        collection(db, 'users', user.uid, 'revisions'),
        where('pageId', '==', page.id),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRevisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Revision)));
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching revisions: ", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, page.id, isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-3/4 lg:w-1/2 xl:w-2/5 flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Version History</SheetTitle>
          <SheetDescription>Review and restore previous versions of "{page.title}".</SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex overflow-hidden">
          <aside className="w-1/3 border-r h-full overflow-y-auto">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : revisions.length > 0 ? (
                  revisions.map((rev) => (
                    <RevisionItem
                      key={rev.id}
                      revision={rev}
                      isSelected={selectedRevision?.id === rev.id}
                      onSelect={() => setSelectedRevision(rev)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center p-4">No history found.</p>
                )}
              </div>
            </ScrollArea>
          </aside>
          <main className="w-2/3 flex-1 overflow-y-auto">
             <RevisionPreview 
                revision={selectedRevision}
                currentPage={page}
                currentContent={currentContent}
                onRestore={onRestore}
             />
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
}
