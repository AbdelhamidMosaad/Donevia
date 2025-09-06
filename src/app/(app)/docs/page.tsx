
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Doc } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { DocListCardView } from '@/components/docs/doc-list-card-view';
import { DocListListView } from '@/components/docs/doc-list-list-view';
import { BrainCircuit } from 'lucide-react';

type View = 'card' | 'list';

export default function DocsDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [docs, setDocs] = useState<Doc[]>([]);

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
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'docs'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doc));
        setDocs(listsData);
      });
      return () => unsubscribe();
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
        await doc(db, 'users', user.uid, 'docs', docId).delete();
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

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">Docs</h1>
            <p className="text-muted-foreground">All your documents in one place.</p>
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
            <BrainCircuit className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Documents Yet</h3>
            <p className="text-muted-foreground">Click "New Doc" to create your first one.</p>
        </div>
      ) : (
         <div className="flex-1">
            {view === 'card' ? (
              <DocListCardView docs={docs} onDelete={handleDeleteDoc} />
            ) : (
              <DocListListView docs={docs} onDelete={handleDeleteDoc} />
            )}
        </div>
      )}
    </div>
  );
}
