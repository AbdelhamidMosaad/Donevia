
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Import } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Deck } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { importPublicDeck } from '@/lib/flashcards';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import moment from 'moment';

export default function PublicDecksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [publicDecks, setPublicDecks] = useState<(Deck & {id: string})[]>([]);
  const [importingDeckId, setImportingDeckId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const q = query(collection(db, 'publicDecks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const decksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (Deck & {id: string})));
      setPublicDecks(decksData);
    });
    return () => unsubscribe();
  }, []);

  const handleImport = async (deckId: string) => {
    if(!user) {
        toast({ variant: 'destructive', title: 'You must be logged in to import decks.' });
        return;
    }
    setImportingDeckId(deckId);
    try {
        const newDeckId = await importPublicDeck(user.uid, deckId);
        toast({ title: 'Deck Imported!', description: 'The deck has been added to your collection.' });
        router.push(`/flashcards/${newDeckId}`);
    } catch(e) {
        console.error("Error importing deck:", e);
        toast({ variant: 'destructive', title: 'Import Failed', description: (e as Error).message });
    } finally {
        setImportingDeckId(null);
    }
  };


  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Globe /> Public Decks Library</h1>
          <p className="text-muted-foreground">Browse and import decks shared by other users.</p>
        </div>
      </div>
      
      {publicDecks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
          <Globe className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">The Library is Empty</h3>
          <p className="text-muted-foreground">Check back later for publicly shared decks.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicDecks.map(deck => (
                <Card key={deck.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{deck.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{deck.description || 'No description.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-xs text-muted-foreground">Created: {moment(deck.createdAt.toDate()).format('MMM D, YYYY')}</p>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleImport(deck.id)} disabled={importingDeckId === deck.id}>
                            <Import className="mr-2 h-4 w-4" />
                            {importingDeckId === deck.id ? 'Importing...' : 'Import to My Decks'}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
