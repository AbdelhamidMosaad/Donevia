
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Layers } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Deck } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DeckCard } from '@/components/flashcards/deck-card';
import { useToast } from '@/hooks/use-toast';
import { deleteDeck } from '@/lib/flashcards';

export default function FlashcardsDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'flashcardDecks'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const decksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deck));
        setDecks(decksData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddDeck = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'flashcardDecks'), {
        name: 'Untitled Deck',
        description: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({
        title: '✓ Deck Created',
        description: `"Untitled Deck" has been created.`,
      });
      router.push(`/flashcards/${docRef.id}`);
    } catch (e) {
      console.error("Error adding deck: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create deck. Please try again.',
      });
    }
  };
  
  const handleDeleteDeck = async (deckId: string) => {
      if(!user) return;
      try {
          await deleteDeck(user.uid, deckId);
          toast({ title: 'Deck deleted successfully.' });
      } catch(e) {
          console.error("Error deleting deck: ", e);
          toast({ variant: 'destructive', title: 'Error deleting deck.'});
      }
  }

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Flashcard Decks</h1>
          <p className="text-muted-foreground">Organize your flashcards into decks for focused studying.</p>
        </div>
        <Button onClick={handleAddDeck}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Deck
        </Button>
      </div>
      
      {decks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
          <Layers className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Decks Yet</h3>
          <p className="text-muted-foreground">Click "New Deck" to create your first set of flashcards.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => (
                <DeckCard key={deck.id} deck={deck} onDelete={() => handleDeleteDeck(deck.id)} />
            ))}
        </div>
      )}
    </div>
  );
}
