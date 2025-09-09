
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardSignature } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { MeetingNote } from '@/lib/types';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { MeetingNoteCard } from '@/components/meeting-notes/meeting-note-card';
import { deleteMeetingNote } from '@/lib/meeting-notes';

export default function MeetingNotesDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'meetingNotes'),
        orderBy('date', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MeetingNote)
        );
        setMeetingNotes(notesData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddNote = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'meetingNotes'), {
        title: 'Untitled Meeting',
        date: Timestamp.now(),
        attendees: [],
        agenda: [],
        notes: { type: 'doc', content: [{ type: 'paragraph' }] },
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({
        title: '✓ Meeting Note Created',
        description: `"Untitled Meeting" has been created.`,
      });
      router.push(`/meeting-notes/${docRef.id}`);
    } catch (e) {
      console.error('Error adding meeting note: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create meeting note. Please try again.',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      await deleteMeetingNote(user.uid, noteId);
      toast({ title: 'Meeting Note deleted' });
    } catch (e) {
      console.error('Error deleting meeting note: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete meeting note.',
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
          <h1 className="text-3xl font-bold font-headline">Meeting Notes</h1>
          <p className="text-muted-foreground">Capture and organize your meeting minutes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNote}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Meeting Note
          </Button>
        </div>
      </div>

      {meetingNotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
          <ClipboardSignature className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Meeting Notes Yet</h3>
          <p className="text-muted-foreground">
            Click "New Meeting Note" to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {meetingNotes.map((note) => (
            <MeetingNoteCard
              key={note.id}
              note={note}
              onDelete={() => handleDeleteNote(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
