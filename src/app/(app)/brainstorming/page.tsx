
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BrainstormingIdea } from '@/lib/types';
import { BrainstormingCanvas } from '@/components/brainstorming/idea-canvas';
import { BrainstormingSidePanel } from '@/components/brainstorming/side-panel';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { addIdea } from '@/lib/brainstorm';
import { useToast } from '@/hooks/use-toast';

export default function BrainstormingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<BrainstormingIdea[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      setDataLoading(true);
      const q = query(collection(db, 'users', user.uid, 'brainstormingIdeas'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ideasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrainstormingIdea));
        setIdeas(ideasData);
        setDataLoading(false);
      }, (error) => {
        console.error("Error fetching brainstorming ideas:", error);
        setDataLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user, authLoading, router]);

  const handleAddIdea = async (content: string, color: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    try {
      await addIdea(user.uid, content, color);
      toast({ title: 'Idea added!' });
    } catch (error) {
      console.error("Failed to add idea:", error);
      toast({ variant: 'destructive', title: 'Failed to add idea.' });
    }
  };

  if (authLoading || dataLoading) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center">
         <Loader2 className="h-12 w-12 text-primary animate-spin" />
         <p className="mt-4 text-muted-foreground">Loading Brainstorming Tool...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Brainstorming</h1>
          <p className="text-muted-foreground">Capture, organize, and develop your ideas on an infinite canvas.</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_350px] gap-6 flex-1 min-h-0">
        <div className="lg:order-1 order-2 min-h-0">
            <BrainstormingCanvas ideas={ideas} />
        </div>
        <div className="lg:order-2 order-1">
            <BrainstormingSidePanel onAddIdea={handleAddIdea} />
        </div>
      </div>
    </div>
  );
}
