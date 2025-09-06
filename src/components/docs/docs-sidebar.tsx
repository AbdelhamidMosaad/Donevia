
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  Timestamp,
  orderBy,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import type { Doc } from '@/lib/types';
import { Plus, MoreVertical, Trash2, FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface DocsSidebarProps {
  activeDocId: string;
}

export function DocsSidebar({ activeDocId }: DocsSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'users', user.uid, 'docs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doc));
      setDocs(docsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateDoc = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'docs'), {
        title: 'Untitled Document',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({ title: 'New document created' });
      router.push(`/docs/${docRef.id}`);
    } catch (error) {
      console.error("Error creating document: ", error);
      toast({ variant: 'destructive', title: 'Error creating document' });
    }
  };
  
  const handleDeleteDoc = async (docId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'docs', docId));
      toast({ title: 'Document deleted' });
      // If the active doc is deleted, navigate to the main docs page
      if (activeDocId === docId) {
          router.push('/docs');
      }
    } catch (error) {
       console.error("Error deleting document: ", error);
       toast({ variant: 'destructive', title: 'Error deleting document' });
    }
  };

  return (
    <div className="h-full flex flex-col p-2 bg-muted/50">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-base font-bold font-headline">Docs</h2>
        <Button variant="ghost" size="icon" onClick={handleCreateDoc} title="New Document">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {/* Add Search Bar here in the future */}
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/docs/${doc.id}`)}
              className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-sm group hover:bg-accent cursor-pointer",
                activeDocId === doc.id && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-2 flex-1 truncate">
                <FileSignature className="h-4 w-4" />
                <span className="truncate">{doc.title}</span>
              </div>
              <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the document "{doc.title}". This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteDoc(doc.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
