
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, Folder, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Doc, DocFolder } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { DocListCardView } from '@/components/docs/doc-list-card-view';
import { DocListListView } from '@/components/docs/doc-list-list-view';

type View = 'card' | 'list';

export default function DocsFolderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [allFolders, setAllFolders] = useState<DocFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DocFolder | null>(null);

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
    }
  }, [user]);

  useEffect(() => {
    if (user && folderId) {
       const folderRef = doc(db, 'users', user.uid, 'docFolders', folderId);
       const unsubscribeFolder = onSnapshot(folderRef, (doc) => {
         if (doc.exists()) {
           setCurrentFolder({ id: doc.id, ...doc.data() } as DocFolder);
         } else {
           toast({ variant: 'destructive', title: 'Folder not found' });
           router.push('/docs');
         }
       });

      const docsQuery = query(collection(db, 'users', user.uid, 'docs'), where('folderId', '==', folderId));
      const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
        setDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doc)));
      });

      const allFoldersQuery = query(collection(db, 'users', user.uid, 'docFolders'));
       const unsubscribeAllFolders = onSnapshot(allFoldersQuery, (snapshot) => {
        setAllFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocFolder)));
      });

      return () => {
        unsubscribeFolder();
        unsubscribeDocs();
        unsubscribeAllFolders();
      };
    }
  }, [user, folderId, router, toast]);

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

  const handleAddDoc = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'docs'), {
        title: 'Untitled Document',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        folderId: folderId,
      });
      toast({
        title: '✓ Document Created',
        description: `"Untitled Document" has been created in this folder.`,
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

  const handleMoveToFolder = async (docId: string, targetFolderId: string | null) => {
    if (!user) return;
    try {
        const docRef = doc(db, 'users', user.uid, 'docs', docId);
        await updateDoc(docRef, { folderId: targetFolderId });
        toast({ title: '✓ Document Moved' });
    } catch(e) {
        console.error("Error moving document: ", e);
        toast({ variant: 'destructive', title: 'Error moving document.'});
    }
  };

  if (loading || !user || !currentFolder) {
    return <div>Loading folder...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
         <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/docs')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                 <div className="flex items-center gap-2">
                    <Folder className="h-7 w-7 text-primary"/>
                    <h1 className="text-3xl font-bold font-headline">{currentFolder.name}</h1>
                </div>
                <p className="text-muted-foreground">Manage documents in this folder.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Document view">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={handleAddDoc}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Doc
            </Button>
        </div>
      </div>
      
       {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <h3 className="text-xl font-semibold font-headline">This folder is empty</h3>
            <p className="text-muted-foreground">Click "New Doc" to add a document to this folder.</p>
        </div>
      ) : (
         <div className="flex-1">
            {view === 'card' ? (
              <DocListCardView docs={docs} folders={allFolders} onDelete={handleDeleteDoc} onMove={handleMoveToFolder} />
            ) : (
              <DocListListView docs={docs} folders={allFolders} onDelete={handleDeleteDoc} onMove={handleMoveToFolder} />
            )}
        </div>
      )}
    </div>
  );
}
