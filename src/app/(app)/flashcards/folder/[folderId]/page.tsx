
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Layers, Folder, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import type { Deck, FlashcardFolder } from '@/lib/types';
import { collection, onSnapshot, query, doc, addDoc, Timestamp, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { DeckCard } from '@/components/flashcards/deck-card';
import { deleteDeck } from '@/lib/flashcards';

export default function FlashcardsFolderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  const { toast } = useToast();
  
  const [decks, setDecks] = useState<Deck[]>([]);
  const [allFolders, setAllFolders] = useState<FlashcardFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FlashcardFolder | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && folderId) {
       const folderRef = doc(db, 'users', user.uid, 'flashcardFolders', folderId);
       const unsubscribeFolder = onSnapshot(folderRef, (doc) => {
         if (doc.exists()) {
           setCurrentFolder({ id: doc.id, ...doc.data() } as FlashcardFolder);
         } else {
           toast({ variant: 'destructive', title: 'Folder not found' });
           router.push('/flashcards');
         }
       });

      const decksQuery = query(collection(db, 'users', user.uid, 'flashcardDecks'), where('folderId', '==', folderId));
      const unsubscribeDecks = onSnapshot(decksQuery, (snapshot) => {
        setDecks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deck)));
      });

      const allFoldersQuery = query(collection(db, 'users', user.uid, 'flashcardFolders'));
       const unsubscribeAllFolders = onSnapshot(allFoldersQuery, (snapshot) => {
        setAllFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashcardFolder)));
      });

      return () => {
        unsubscribeFolder();
        unsubscribeDecks();
        unsubscribeAllFolders();
      };
    }
  }, [user, folderId, router, toast]);

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

  const handleAddDeck = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'flashcardDecks'), {
        name: 'Untitled Deck',
        description: '',
        folderId: folderId,
        ownerId: user.uid,
        isPublic: false,
        editors: [],
        viewers: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({
        title: '✓ Deck Created',
        description: `"Untitled Deck" has been created in this folder.`,
      });
      router.push(`/flashcards/${docRef.id}`);
    } catch (e) {
      console.error("Error adding deck: ", e);
      toast({ variant: 'destructive', title: 'Error creating deck.' });
    }
  };

  const handleMoveDeckToFolder = async (deckId: string, targetFolderId: string | null) => {
    if (!user) return;
    try {
        const deckRef = doc(db, 'users', user.uid, 'flashcardDecks', deckId);
        await updateDoc(deckRef, { folderId: targetFolderId });
        toast({ title: '✓ Deck Moved' });
    } catch(e) {
        console.error("Error moving deck: ", e);
        toast({ variant: 'destructive', title: 'Error moving deck.'});
    }
  };

  if (loading || !user || !currentFolder) {
    return <div>Loading folder...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
         <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/flashcards')}><ArrowLeft /></Button>
            <div>
                 <div className="flex items-center gap-2">
                    <Folder className="h-7 w-7 text-primary"/>
                    <h1 className="text-3xl font-bold font-headline">{currentFolder.name}</h1>
                </div>
                <p className="text-muted-foreground">Manage decks in this folder.</p>
            </div>
        </div>
        <Button onClick={handleAddDeck}>
          <PlusCircle />
          New Deck
        </Button>
      </div>
      
       {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <h3 className="text-xl font-semibold font-headline">This folder is empty</h3>
            <p className="text-muted-foreground">Click "New Deck" to add a deck to this folder.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  folders={allFolders}
                  onDelete={() => handleDeleteDeck(deck.id)}
                  onMove={handleMoveDeckToFolder}
                />
            ))}
        </div>
      )}
    </div>
  );
}
