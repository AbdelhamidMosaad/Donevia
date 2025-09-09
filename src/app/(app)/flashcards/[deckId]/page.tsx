
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers3, PlusCircle, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import type { Deck, FlashcardToolCard } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FlashcardList } from '@/components/flashcards/flashcard-list';
import { AddFlashcardDialog } from '@/components/flashcards/add-flashcard-dialog';

export default function DeckDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deckId = params.deckId as string;
  const { toast } = useToast();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<FlashcardToolCard[]>([]);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && deckId) {
      const deckRef = doc(db, 'users', user.uid, 'flashcardDecks', deckId);
      const unsubscribeDeck = onSnapshot(deckRef, (doc) => {
        if (doc.exists()) {
          setDeck({ id: doc.id, ...doc.data() } as Deck);
        } else {
          toast({ variant: 'destructive', title: 'Deck not found' });
          router.push('/flashcards');
        }
      });
      
      const cardsQuery = query(collection(db, 'users', user.uid, 'flashcards'), orderBy('createdAt', 'asc'));
      const unsubscribeCards = onSnapshot(cardsQuery, (snapshot) => {
        const cardsData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as FlashcardToolCard))
          .filter(card => card.deckId === deckId);
        setCards(cardsData);
      });
      
      return () => {
        unsubscribeDeck();
        unsubscribeCards();
      };
    }
  }, [user, deckId, router, toast]);


  if (loading || !user || !deck) {
    return <div>Loading deck...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/flashcards')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                 <div className="flex items-center gap-2">
                    <Layers3 className="h-7 w-7 text-primary"/>
                    <h1 className="text-3xl font-bold font-headline">{deck.name}</h1>
                </div>
                <p className="text-muted-foreground">{deck.description || 'No description provided.'}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => setIsAddCardOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Card</Button>
            <Button onClick={() => router.push(`/flashcards/${deckId}/study`)} disabled={cards.length === 0}>
              <BookOpen className="mr-2 h-4 w-4" /> Start Studying
            </Button>
        </div>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Flashcards in this Deck</CardTitle>
               <CardDescription>Manage the cards in your "{deck.name}" deck.</CardDescription>
          </CardHeader>
          <CardContent>
              {cards.length > 0 ? (
                  <FlashcardList cards={cards} />
              ) : (
                  <div className="text-center py-8 text-muted-foreground">
                      <p>This deck is empty. Add a flashcard to get started!</p>
                  </div>
              )}
          </CardContent>
      </Card>

      <AddFlashcardDialog
        deckId={deckId}
        open={isAddCardOpen}
        onOpenChange={setIsAddCardOpen}
      />
    </div>
  );
}
