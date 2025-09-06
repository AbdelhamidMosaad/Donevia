
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, addDoc, Timestamp, orderBy, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { StickyNote } from '@/lib/types';
import { StickyNoteDialog } from '@/components/sticky-note-dialog';
import { StickyNotesCanvas } from '@/components/sticky-notes-canvas';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function StickyNotesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);
  
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

  const findNextAvailablePosition = (currentNotes: StickyNote[]) => {
    const occupiedPositions = new Set(
        currentNotes.filter(n => n.gridPosition).map(n => `${n.gridPosition!.row},${n.gridPosition!.col}`)
    );
    let row = 0;
    let col = 0;
    let i = 0;
    // A better implementation would know the number of columns available.
    while(occupiedPositions.has(`${row},${col}`)) {
        i++;
        col = i % 100; // Assume 100 columns max for finding a spot
        row = Math.floor(i / 100);
    }
    return { row, col };
  };

  const handleAddNote = async () => {
    if (!user) return;
    try {
      const position = findNextAvailablePosition(notes);

      await addDoc(collection(db, 'users', user.uid, 'stickyNotes'), {
        title: 'New Note',
        text: '',
        color: '#fff176', // Default yellow
        textColor: '#000000', // Default black text
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        priority: 'Medium',
        gridPosition: position
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

  const handleNoteClick = (note: StickyNote) => {
    setEditingNote(note);
  };
  
  const handleDialogClose = () => {
    setEditingNote(null);
  }

  const handleNoteDeleted = () => {
      setEditingNote(null);
  }

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
        <div className="flex items-center gap-2">
            <Button onClick={handleAddNote}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Note
            </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Sticky Notes Yet</h3>
            <p className="text-muted-foreground">Click "Add Note" to create your first one.</p>
        </div>
      ) : (
        <div className="flex-1">
            <StickyNotesCanvas notes={notes} onNoteClick={handleNoteClick} />
        </div>
      )}

      {editingNote && (
        <StickyNoteDialog 
            note={editingNote} 
            isOpen={!!editingNote} 
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleDialogClose();
                }
            }} 
            onNoteDeleted={handleNoteDeleted}
        />
      )}
    </div>
  );
}
