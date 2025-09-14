
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, FolderPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Doc, DocFolder } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, orderBy, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { DocListCardView } from '@/components/docs/doc-list-card-view';
import { DocListListView } from '@/components/docs/doc-list-list-view';
import { FolderCard } from '@/components/docs/folder-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocsIcon } from '@/components/icons/tools/docs-icon';

type View = 'card' | 'list';

export default function DocsDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<DocFolder[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().docsView) {
          setView(docSnap.data().docsView);
        }
      });

      // Subscribe to folders
      const foldersQuery = query(collection(db, 'users', user.uid, 'docFolders'), orderBy('createdAt', 'desc'));
      const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        const foldersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocFolder));
        setFolders(foldersData);
      });
      
      // Subscribe to documents
      const docsQuery = query(collection(db, 'users', user.uid, 'docs'), orderBy('createdAt', 'desc'));
      const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
        const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doc));
        setDocs(docsData);
      });

      return () => {
        unsubscribeFolders();
        unsubscribeDocs();
      };
    }
  }, [user]);

  const handleViewChange = (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            setDoc(settingsRef, { docsView: newView }, { merge: true });
        }
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'docs', docId));
        toast({ title: 'Document deleted' });
    } catch (e) {
        console.error("Error deleting document: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete document.' });
    }
  };

   const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    // For now, we only delete the folder. Documents inside are not deleted.
    // A more robust implementation might ask the user what to do with them.
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'docFolders', folderId));
      toast({ title: 'Folder deleted' });
    } catch(e) {
       console.error("Error deleting folder: ", e);
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete folder.' });
    }
  };

  const handleAddDoc = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'docs'), {
        title: 'Untitled Document',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        folderId: null,
      });
      toast({
        title: '✓ Document Created',
        description: `"Untitled Document" has been created.`,
      });
      router.push(`/docs/${docRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create document. Please try again.',
      });
    }
  };

  const handleAddFolder = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'docFolders'), {
        name: 'New Folder',
        ownerId: user.uid,
        createdAt: Timestamp.now(),
      });
      toast({ title: '✓ Folder Created' });
    } catch (e) {
      console.error("Error adding folder: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create folder. Please try again.',
      });
    }
  };

  const handleMoveToFolder = async (docId: string, folderId: string | null) => {
    if (!user) return;
    try {
        const docRef = doc(db, 'users', user.uid, 'docs', docId);
        await updateDoc(docRef, { folderId: folderId });
        toast({ title: '✓ Document Moved' });
    } catch(e) {
        console.error("Error moving document: ", e);
        toast({ variant: 'destructive', title: 'Error moving document.'});
    }
  };

  const unfiledDocs = docs.filter(d => !d.folderId);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <DocsIcon className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Docs</h1>
                <p className="text-muted-foreground">All your documents and folders in one place.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Document view">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <PlusCircle />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={handleAddDoc}>
                  <PlusCircle /> New Doc
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleAddFolder}>
                  <FolderPlus /> New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
       {docs.length === 0 && folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <DocsIcon className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Documents Yet</h3>
            <p className="text-muted-foreground">Click "New" to create your first document or folder.</p>
        </div>
      ) : (
         <div className="flex-1 space-y-8">
            {folders.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-headline mb-4">Folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {folders.map(folder => (
                    <FolderCard key={folder.id} folder={folder} onDelete={() => handleDeleteFolder(folder.id)} />
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h2 className="text-2xl font-bold font-headline mb-4">Documents</h2>
              {view === 'card' ? (
                <DocListCardView docs={unfiledDocs} folders={folders} onDelete={handleDeleteDoc} onMove={handleMoveToFolder} />
              ) : (
                <DocListListView docs={unfiledDocs} folders={folders} onDelete={handleDeleteDoc} onMove={handleMoveToFolder} />
              )}
            </div>
        </div>
      )}
    </div>
  );
}
