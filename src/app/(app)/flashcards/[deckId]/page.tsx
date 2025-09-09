
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers3, PlusCircle, BookOpen, Search, Download, Upload, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import type { Deck, FlashcardToolCard, FlashcardProgress } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FlashcardList } from '@/components/flashcards/flashcard-list';
import { AddFlashcardDialog } from '@/components/flashcards/add-flashcard-dialog';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';
import { exportDeckToJSON, importDeckFromJSON } from '@/lib/flashcards-import-export';
import { addCard } from '@/lib/flashcards';
import dayjs from 'dayjs';

export default function DeckDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deckId = params.deckId as string;
  const { toast } = useToast();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<FlashcardToolCard[]>([]);
  const [progressData, setProgressData] = useState<Map<string, FlashcardProgress>>(new Map());
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedCallback((value) => {
    setSearchQuery(value);
  }, 300);

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
      
      const cardsQuery = query(collection(db, 'users', user.uid, 'flashcardDecks', deckId, 'cards'), orderBy('createdAt', 'asc'));
      const unsubscribeCards = onSnapshot(cardsQuery, (snapshot) => {
        const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashcardToolCard));
        setCards(cardsData);
      });

      const progressQuery = query(collection(db, 'users', user.uid, 'flashcardDecks', deckId, 'progress'));
      const unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
        const newProgressData = new Map<string, FlashcardProgress>();
        snapshot.forEach(doc => {
            newProgressData.set(doc.id, doc.data() as FlashcardProgress);
        });
        setProgressData(newProgressData);
      });
      
      return () => {
        unsubscribeDeck();
        unsubscribeCards();
        unsubscribeProgress();
      };
    }
  }, [user, deckId, router, toast]);

  const dueCardsCount = useMemo(() => {
      const now = dayjs();
      return cards.reduce((count, card) => {
          const progress = progressData.get(card.id);
          if (!progress || dayjs(progress.dueDate).isBefore(now) || dayjs(progress.dueDate).isSame(now, 'day')) {
              return count + 1;
          }
          return count;
      }, 0);
  }, [cards, progressData]);

  const filteredCards = useMemo(() => {
    return cards.filter(card => 
        card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.back.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [cards, searchQuery]);

  const handleExport = () => {
    if (!deck) return;
    const json = exportDeckToJSON(deck, cards);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.name.replace(/ /g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Deck exported successfully!' });
  };
  
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !deckId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const result = e.target?.result as string;
            const importedData = importDeckFromJSON(result);
            if (!importedData) {
                throw new Error("Invalid JSON file.");
            }
            
            const batch = writeBatch(db);
            importedData.cards.forEach(card => {
                const cardRef = doc(collection(db, 'users', user.uid, 'flashcardDecks', deckId, 'cards'));
                batch.set(cardRef, {
                    deckId,
                    front: card.front,
                    back: card.back,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            });
            await batch.commit();
            toast({ title: `${importedData.cards.length} cards imported successfully!`});
        } catch (error) {
            console.error("Import failed:", error);
            toast({ variant: 'destructive', title: 'Import failed', description: (error as Error).message });
        } finally {
             if(importFileInputRef.current) importFileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
  }

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
            <Button onClick={() => router.push(`/flashcards/${deckId}/study`)} disabled={dueCardsCount === 0}>
              <BookOpen className="mr-2 h-4 w-4" /> Study ({dueCardsCount} due)
            </Button>
        </div>
      </div>
      
      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Flashcards in this Deck ({cards.length} total)</CardTitle>
                    <CardDescription>Manage the cards in your "{deck.name}" deck.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input placeholder="Search cards..." className="w-64" onChange={(e) => debouncedSearch(e.target.value)} />
                    <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                    <input type="file" ref={importFileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                    <Button variant="outline" size="sm" onClick={() => importFileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import</Button>
                </div>
              </div>
          </CardHeader>
          <CardContent>
              {cards.length > 0 ? (
                  <FlashcardList cards={filteredCards} deckId={deckId} />
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
