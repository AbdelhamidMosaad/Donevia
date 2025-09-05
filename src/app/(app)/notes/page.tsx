
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, addDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { StickyNote } from '@/lib/types';
import { StickyNoteCard } from '@/components/sticky-note-card';

export default function StickyNotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState<StickyNote[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const notesRef = collection(db, 'users', user.uid, 'stickyNotes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StickyNote));
        setNotes(notesData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddNote = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'stickyNotes'), {
        title: 'New Note',
        text: '',
        color: '#fff176', // Default yellow
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({
        title: '✓ Note Added',
        description: 'A new sticky note has been created.',
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add new note. Please try again.',
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
          <h1 className="text-3xl font-bold font-headline">Sticky Notes</h1>
          <p className="text-muted-foreground">Your personal space for quick thoughts and reminders.</p>
        </div>
        <Button onClick={handleAddNote}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Sticky Notes Yet</h3>
            <p className="text-muted-foreground">Click "Add Note" to create your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {notes.map(note => (
            <StickyNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
