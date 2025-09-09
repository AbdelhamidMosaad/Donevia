
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MeetingNote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MeetingNotesEditor } from '@/components/meeting-notes/meeting-notes-editor';

export default function MeetingNotePage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const noteId = params.noteId as string;

  const [noteData, setNoteData] = useState<MeetingNote | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/');
      return;
    }
    if (!noteId) return;

    const noteRef = doc(db, 'users', user.uid, 'meetingNotes', noteId);
    const unsubscribe = onSnapshot(noteRef, (docSnap) => {
      if (docSnap.exists()) {
        setNoteData({ id: docSnap.id, ...docSnap.data() } as MeetingNote);
      } else {
        router.push('/meeting-notes');
      }
    });

    return () => unsubscribe();
  }, [user, noteId, loading, router]);

  if (loading || !noteData) {
    return <div>Loading meeting note...</div>;
  }

  return (
    <div className="h-full flex flex-col">
       <MeetingNotesEditor note={noteData} />
    </div>
  );
}
