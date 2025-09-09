
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers3, RefreshCw, Shuffle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import type { Deck, FlashcardToolCard } from '@/lib/types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { StudyCard } from '@/components/flashcards/study-card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function StudyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deckId = params.deckId as string;
  const { toast } = useToast();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<FlashcardToolCard[]>([]);
  const [shuffledCards, setShuffledCards] = useState<FlashcardToolCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

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
          router.push('/flashcards');
        }
      });
      
      const cardsQuery = query(collection(db, 'users', user.uid, 'flashcards'), where('deckId', '==', deckId));
      const unsubscribeCards = onSnapshot(cardsQuery, (snapshot) => {
        const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashcardToolCard));
        setCards(cardsData);
        setShuffledCards(cardsData); // Initially set to original order
        setCurrentCardIndex(0);
      });
      
      return () => {
        unsubscribeDeck();
        unsubscribeCards();
      };
    }
  }, [user, deckId, router]);

  const handleShuffle = () => {
    setShuffledCards([...cards].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0);
    toast({ title: "Deck shuffled!" });
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setShuffledCards(cards); // Reset to original order
    toast({ title: "Deck restarted." });
  };

  const handleNext = () => {
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  if (loading || !user || !deck) {
    return <div>Loading study session...</div>;
  }
  
  if (cards.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold">This deck is empty!</h2>
            <p className="text-muted-foreground">Add some cards to start studying.</p>
            <Button onClick={() => router.push(`/flashcards/${deckId}`)} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Deck
            </Button>
        </div>
    )
  }

  const currentCard = shuffledCards[currentCardIndex];

  return (
    <div className="flex flex-col h-full items-center justify-center gap-6">
        <div className="absolute top-6 left-6">
            <Button variant="outline" onClick={() => router.push(`/flashcards/${deckId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Deck
            </Button>
        </div>
       <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Studying: {deck.name}</h1>
        <p className="text-muted-foreground">Card {currentCardIndex + 1} of {shuffledCards.length}</p>
       </div>

       <StudyCard card={currentCard} />

       <div className="flex items-center gap-4">
            <Button variant="secondary" onClick={handlePrev} disabled={currentCardIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleShuffle}>
                <Shuffle className="mr-2 h-4 w-4" /> Shuffle
            </Button>
            <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="mr-2 h-4 w-4" /> Restart
            </Button>
            <Button variant="secondary" onClick={handleNext} disabled={currentCardIndex === shuffledCards.length - 1}>
                <ChevronRight className="h-4 w-4" />
            </Button>
       </div>
    </div>
  );
}
