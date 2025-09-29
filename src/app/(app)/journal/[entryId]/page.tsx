
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { JournalEntry } from '@/lib/types';
import { JournalEditor } from '@/components/journal/journal-editor';
import { WelcomeScreen } from '@/components/welcome-screen';


export default function JournalEntryPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const entryId = params.entryId as string;

  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
        router.push('/');
        return;
    }
    if (!entryId) return;

    const entryRef = doc(db, 'users', user.uid, 'journalEntries', entryId);
    const unsubscribe = onSnapshot(entryRef, (docSnap) => {
      if (docSnap.exists()) {
        setEntry({ id: docSnap.id, ...docSnap.data() } as JournalEntry);
      } else {
        toast({ variant: 'destructive', title: 'Journal entry not found' });
        router.push('/journal');
      }
    });

    return () => unsubscribe();
  }, [user, entryId, loading, router, toast]);


  if (loading || !entry) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-full flex flex-col">
       <JournalEditor entry={entry} />
    </div>
  );
}
