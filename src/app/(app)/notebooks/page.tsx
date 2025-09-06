
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Notebook } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, writeBatch, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { NotebookListCardView } from '@/components/notebooks/notebook-list-card-view';
import { NotebookListListView } from '@/components/notebooks/notebook-list-list-view';
import { useAtom } from 'jotai';
import { selectedNotebookAtom, selectedSectionAtom, selectedPageAtom } from '@/lib/notebook-store';

type View = 'card' | 'list';

export default function NotebooksDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [, setSelectedNotebook] = useAtom(selectedNotebookAtom);
  const [, setSelectedSection] = useAtom(selectedSectionAtom);
  const [, setSelectedPage] = useAtom(selectedPageAtom);


  useEffect(() => {
    // Reset selections when viewing the dashboard
    setSelectedNotebook(null);
    setSelectedSection(null);
    setSelectedPage(null);
  }, [setSelectedNotebook, setSelectedSection, setSelectedPage]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().notebookView) {
          setView(docSnap.data().notebookView);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'notebooks'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notebook));
        setNotebooks(listsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleViewChange = (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            setDoc(settingsRef, { notebookView: newView }, { merge: true });
        }
    }
  }

  const handleDeleteNotebook = async (notebookId: string) => {
      if(!user) return;
      const batch = writeBatch(db);
      
      const notebookRef = doc(db, 'users', user.uid, 'notebooks', notebookId);
      batch.delete(notebookRef);
      
      const sectionsRef = collection(db, 'users', user.uid, 'sections');
      const qSections = query(sectionsRef, where('notebookId', '==', notebookId));
      const sectionsSnap = await getDocs(qSections);
      
      for (const sectionDoc of sectionsSnap.docs) {
        batch.delete(sectionDoc.ref);
        const pagesRef = collection(db, 'users', user.uid, 'pages');
        const qPages = query(pagesRef, where('sectionId', '==', sectionDoc.id));
        const pagesSnap = await getDocs(qPages);
        pagesSnap.forEach(pageDoc => batch.delete(pageDoc.ref));
      }
      
      await batch.commit();
      toast({title: 'Notebook deleted'});
  }

  const handleAddNotebook = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);

      const notebookRef = doc(collection(db, 'users', user.uid, 'notebooks'));
      batch.set(notebookRef, {
        ownerId: user.uid,
        title: 'Untitled Notebook',
        color: '#4A90E2',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      const sectionRef = doc(collection(db, 'users', user.uid, 'sections'));
      batch.set(sectionRef, {
         notebookId: notebookRef.id,
         title: 'First Section',
         order: 0,
      });
      
      const pageRef = doc(collection(db, 'users', user.uid, 'pages'));
      batch.set(pageRef, {
        sectionId: sectionRef.id,
        title: 'Untitled Page',
        content: { type: 'doc', content: [] },
        searchText: 'untitled page',
        version: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await batch.commit();

      toast({
        title: '✓ Notebook Added',
        description: `"Untitled Notebook" has been created.`,
      });
      router.push(`/notebooks/${pageRef.id}`);

    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add notebook. Please try again.',
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
            <h1 className="text-3xl font-bold font-headline">Notebooks</h1>
            <p className="text-muted-foreground">Organize your thoughts, ideas, and projects.</p>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Notebook view">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={handleAddNotebook}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Notebook
            </Button>
        </div>
      </div>
      
       {notebooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Notebooks Yet</h3>
            <p className="text-muted-foreground">Click "New Notebook" to create your first one.</p>
        </div>
      ) : (
         <div className="flex-1">
            {view === 'card' ? (
              <NotebookListCardView notebooks={notebooks} onDelete={handleDeleteNotebook} />
            ) : (
              <NotebookListListView notebooks={notebooks} onDelete={handleDeleteNotebook} />
            )}
        </div>
      )}
    </div>
  );
}

