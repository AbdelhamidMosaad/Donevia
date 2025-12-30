
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, HelpCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import type { Deck, FlashcardToolCard, FlashcardProgress } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDocs, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { StudyCard } from '@/components/flashcards/study-card';
import { initProgress, sm2Next } from '@/lib/srs';
import dayjs from 'dayjs';

type ReviewItem = {
    card: FlashcardToolCard;
    progress: FlashcardProgress;
};

export default function StudyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deckId = params.deckId as string;
  const { toast } = useToast();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const loadDueCards = useCallback(async () => {
    if (!user || !deckId) return;
    setIsLoading(true);

    const cardsSnap = await getDocs(collection(db, "users", user.uid, "flashcardDecks", deckId, "cards"));
    const cards = cardsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FlashcardToolCard));

    const progressColl = collection(db, "users", user.uid, "flashcardDecks", deckId, "progress");
    const progressSnap = await getDocs(progressColl);
    const progressMap = new Map(progressSnap.docs.map(d => [d.id, d.data() as FlashcardProgress]));
    
    const now = dayjs();
    const dueList: ReviewItem[] = [];
    for (const card of cards) {
      const progress = progressMap.get(card.id);
      if (!progress) {
        dueList.push({ card, progress: initProgress() });
      } else {
        const dueDate = dayjs(progress.dueDate);
        if (dueDate.isBefore(now) || dueDate.isSame(now, 'day')) {
          dueList.push({ card, progress });
        }
      }
    }
    
    dueList.sort((a, b) => dayjs(a.progress.dueDate).diff(dayjs(b.progress.dueDate)));

    setQueue(dueList);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsLoading(false);
  }, [user, deckId]);

  useEffect(() => {
    if (user && deckId) {
      const deckRef = doc(db, 'users', user.uid, 'flashcardDecks', deckId);
      const unsubscribeDeck = onSnapshot(deckRef, (doc) => {
        if (doc.exists()) setDeck({ id: doc.id, ...doc.data() } as Deck);
        else router.push('/flashcards');
      });

      loadDueCards();
      
      return () => unsubscribeDeck();
    }
  }, [user, deckId, router, loadDueCards]);

  const handleQuality = useCallback(async (quality: number) => {
    if (!user || !queue[currentIndex]) return;

    const { card, progress } = queue[currentIndex];
    const progressRef = doc(db, 'users', user.uid, 'flashcardDecks', deckId, 'progress', card.id);
    const cardRef = doc(db, 'users', user.uid, 'flashcardDecks', deckId, 'cards', card.id);
    
    const nextProgress = sm2Next(progress, quality);
    const isCorrect = quality >= 3;

    const batch = writeBatch(db);
    batch.set(progressRef, { ...nextProgress, updatedAt: serverTimestamp() }, { merge: true });
    batch.update(cardRef, { 
      [isCorrect ? 'correct' : 'wrong']: (isCorrect ? card.correct || 0 : card.wrong || 0) + 1,
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();

    const nextIndex = currentIndex + 1;
    if (nextIndex < queue.length) {
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
    } else {
        await loadDueCards(); // Reload when queue is finished
    }
  }, [user, currentIndex, queue, deckId, loadDueCards]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFlipped) {
        const keyNumber = parseInt(event.key);
        if (keyNumber >= 0 && keyNumber <= 5) {
          handleQuality(keyNumber);
        }
      }
      if (event.code === 'Space') {
        event.preventDefault();
        setIsFlipped(f => !f);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleQuality]);

  const currentCard = queue[currentIndex];

  if (loading || isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Loading review session...</p>
        </div>
    );
  }
  
  if (!currentCard) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <h2 className="text-2xl font-bold">No cards are due for review.</h2>
            <p className="text-muted-foreground">Well done! Come back later to review more cards.</p>
            <Button onClick={() => router.push(`/flashcards/${deckId}`)} className="mt-4">
                <ArrowLeft /> Go Back to Deck
            </Button>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full items-center gap-6">
       <div className="w-full max-w-2xl flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push(`/flashcards/${deckId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Deck
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold font-headline">Reviewing: {deck?.name}</h1>
              <p className="text-muted-foreground">Card {currentIndex + 1} of {queue.length}</p>
            </div>
             <div className="w-32"/>
        </div>

        <StudyCard card={currentCard.card} isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)} />

        <div className="h-32 mt-6">
           {isFlipped && (
                <div className="space-y-4 text-center">
                    <p className="font-semibold">How well did you know this? (0-5)</p>
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="destructive" onClick={() => handleQuality(0)} title="Forgot completely (0)">0</Button>
                        <Button variant="destructive" onClick={() => handleQuality(1)} title="Recalled with great difficulty (1)">1</Button>
                        <Button variant="secondary" onClick={() => handleQuality(2)} title="Recalled with difficulty (2)">2</Button>
                        <Button variant="secondary" onClick={() => handleQuality(3)} title="Recalled correctly, but with hesitation (3)">3</Button>
                        <Button onClick={() => handleQuality(4)} title="Recalled with ease (4)">4</Button>
                        <Button onClick={() => handleQuality(5)} title="Recalled perfectly (5)" className="bg-green-600 hover:bg-green-700">5</Button>
                    </div>
                </div>
           )}

           {!isFlipped && (
                <div className="mt-4 flex justify-center">
                    <Button size="lg" onClick={() => setIsFlipped(true)}>Show Answer (Space)</Button>
                </div>
           )}
        </div>
       </div>
    </div>
  );
}
