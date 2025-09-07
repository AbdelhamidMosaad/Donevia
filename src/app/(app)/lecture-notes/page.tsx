
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, BookText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { LectureNote } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { DocListCardView } from '@/components/docs/doc-list-card-view';
import { DocListListView } from '@/components/docs/doc-list-list-view';
import { GenerateLectureNotesDialog } from '@/components/lecture-notes/generate-dialog';

type View = 'card' | 'list';

export default function LectureNotesDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [notes, setNotes] = useState<LectureNote[]>([]);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().lectureNotesView) {
          setView(docSnap.data().lectureNotesView);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'lectureNotes'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LectureNote));
        setNotes(notesData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleViewChange = (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            setDoc(settingsRef, { lectureNotesView: newView }, { merge: true });
        }
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'lectureNotes', noteId));
        toast({ title: 'Lecture note deleted' });
    } catch (e) {
        console.error("Error deleting document: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete note.' });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  // We can reuse the Doc views as the data structure is compatible
  const notesAsDocs = notes.map(n => ({ ...n, ownerId: user.uid }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">Lecture Notes</h1>
            <p className="text-muted-foreground">Your AI-generated study notes.</p>
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
            <Button onClick={() => setIsGenerateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Note
            </Button>
        </div>
      </div>
      
       {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <BookText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Notes Yet</h3>
            <p className="text-muted-foreground">Click "New Note" to generate your first one.</p>
        </div>
      ) : (
         <div className="flex-1">
            {view === 'card' ? (
              <DocListCardView docs={notesAsDocs} onDelete={handleDeleteNote} />
            ) : (
              <DocListListView docs={notesAsDocs} onDelete={handleDeleteNote} />
            )}
        </div>
      )}
       <GenerateLectureNotesDialog 
        isOpen={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        onNoteCreated={(noteId) => router.push(`/lecture-notes/${noteId}`)}
      />
    </div>
  );
}
