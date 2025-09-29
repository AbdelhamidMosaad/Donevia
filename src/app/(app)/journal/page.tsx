
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { JournalEntry } from '@/lib/types';
import { collection, onSnapshot, query, addDoc, Timestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { JournalIcon } from '@/components/icons/tools/journal-icon';
import { JournalEntryList } from '@/components/journal/journal-entry-list';
import moment from 'moment';

export default function JournalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'journalEntries'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
        setEntries(entriesData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddEntry = async () => {
    if (!user) return;
    try {
      const newEntryRef = await addDoc(collection(db, 'users', user.uid, 'journalEntries'), {
        title: moment().format('MMMM D, YYYY, h:mm A'),
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        mood: 'Neutral',
        tags: [],
      });
      toast({
        title: 'New Entry Created',
        description: `Your new journal entry is ready.`,
      });
      router.push(`/journal/${newEntryRef.id}`);
    } catch (e) {
      console.error("Error adding entry: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create new entry.',
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if(!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'journalEntries', entryId));
        toast({ title: 'Entry deleted' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error deleting entry' });
    }
  }


  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <JournalIcon className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Journal</h1>
                <p className="text-muted-foreground">Reflect, record, and gain insights into your thoughts.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleAddEntry}>
              <PlusCircle />
              New Entry
            </Button>
        </div>
      </div>
      
       <JournalEntryList entries={entries} onDelete={handleDeleteEntry} />
    </div>
  );
}
