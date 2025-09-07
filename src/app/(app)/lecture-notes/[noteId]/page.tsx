
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LectureNote } from '@/lib/types';
import { DocEditor } from '@/components/docs/doc-editor';
import { WelcomeScreen } from '@/components/welcome-screen';

export default function LectureNotePage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const noteId = params.noteId as string;

  const [noteData, setNoteData] = useState<LectureNote | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
        router.push('/');
        return;
    }
    if (!noteId) return;

    const noteRef = doc(db, 'users', user.uid, 'lectureNotes', noteId);
    const unsubscribe = onSnapshot(noteRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as LectureNote;
        // The DocEditor component expects an ownerId, so we add it.
        const docCompatibleData = { ...data, ownerId: user.uid };
        setNoteData(docCompatibleData as any);
      } else {
        toast({ variant: 'destructive', title: 'Lecture note not found' });
        router.push('/lecture-notes');
      }
    });

    return () => unsubscribe();
  }, [user, noteId, loading, router, toast]);

  if (loading || !noteData) {
    return <WelcomeScreen />;
  }

  // We can reuse the DocEditor as it is compatible.
  return (
    <div className="h-full flex flex-col">
        <DocEditor key={noteData.id} doc={noteData as any} />
    </div>
  );
}
