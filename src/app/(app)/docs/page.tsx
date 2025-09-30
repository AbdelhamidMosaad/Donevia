
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, FolderPlus, Minus, Plus, GripHorizontal, FileText, CheckCircle } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type View = 'card' | 'list';
type CardSize = 'small' | 'medium' | 'large';

export default function DocsDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [cardSize, setCardSize] = useState<CardSize>('large');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<DocFolder[]>([]);

  const [isNewDocDialogOpen, setIsNewDocDialogOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [createdDocInfo, setCreatedDocInfo] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists()) {
            const userSettings = docSnap.data();
            if (userSettings.docsView) {
                setView(userSettings.docsView);
            }
             if (userSettings.docsCardSize) {
                setCardSize(userSettings.docsCardSize);
            }
        }
      });

      const foldersQuery = query(collection(db, 'users', user.uid, 'docFolders'), orderBy('createdAt', 'desc'));
      const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        const foldersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocFolder));
        setFolders(foldersData);
      });
      
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

  useEffect(() => {
    if(!isNewDocDialogOpen) {
        setNewDocName('');
        setCreatedDocInfo(null);
    }
  }, [isNewDocDialogOpen]);


  const handleViewChange = async (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            await setDoc(settingsRef, { docsView: newView }, { merge: true });
        }
    }
  }

  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize) {
        setCardSize(newSize);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            await setDoc(settingsRef, { docsCardSize: newSize }, { merge: true });
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
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'docFolders', folderId));
      toast({ title: 'Folder deleted' });
    } catch(e) {
       console.error("Error deleting folder: ", e);
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete folder.' });
    }
  };

  const handleAddDoc = async () => {
    if (!user || !newDocName.trim()) {
        toast({variant: 'destructive', title: 'Document name cannot be empty.'});
        return;
    };
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'docs'), {
        title: newDocName.trim(),
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        folderId: null,
      });
      toast({
        title: '✓ Document Created',
        description: `"${newDocName.trim()}" has been created.`,
      });
      setCreatedDocInfo({ id: docRef.id, title: newDocName.trim() });
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
            {view === 'card' && (
                 <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                    <ToggleGroupItem value="small" aria-label="Small cards"><GripHorizontal/></ToggleGroupItem>
                    <ToggleGroupItem value="medium" aria-label="Medium cards"><Minus/></ToggleGroupItem>
                    <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
                </ToggleGroup>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <PlusCircle />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => setIsNewDocDialogOpen(true)}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {folders.map(folder => (
                    <FolderCard key={folder.id} folder={folder} onDelete={() => handleDeleteFolder(folder.id)} />
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h2 className="text-2xl font-bold font-headline mb-4">Documents</h2>
              {view === 'card' ? (
                <DocListCardView docs={unfiledDocs} folders={folders} onDelete={handleDeleteDoc} onMove={handleMoveToFolder} cardSize={cardSize}/>
              ) : (
                <DocListListView docs={unfiledDocs} folders={folders} onDelete={handleDeleteDoc} onMove={handleMoveToFolder} />
              )}
            </div>
        </div>
      )}
        <Dialog open={isNewDocDialogOpen} onOpenChange={setIsNewDocDialogOpen}>
            <DialogContent>
                 {createdDocInfo ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2"><CheckCircle className="text-green-500"/> Success!</DialogTitle>
                            <DialogDescription>Your document "{createdDocInfo.title}" has been created.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewDocDialogOpen(false)}>Close</Button>
                            <Button onClick={() => router.push(`/docs/${createdDocInfo.id}`)}>
                                <FileText className="mr-2 h-4 w-4"/> Open Document
                            </Button>
                        </DialogFooter>
                    </>
                 ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create New Document</DialogTitle>
                            <DialogDescription>Enter a name for your new document to get started.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="doc-name">Document Name</Label>
                            <Input
                                id="doc-name"
                                value={newDocName}
                                onChange={(e) => setNewDocName(e.target.value)}
                                placeholder="e.g., Project Proposal"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddDoc()}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsNewDocDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddDoc} disabled={!newDocName.trim()}>Create</Button>
                        </DialogFooter>
                    </>
                 )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
