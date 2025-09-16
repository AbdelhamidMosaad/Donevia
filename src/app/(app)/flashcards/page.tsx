'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Layers, FolderPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Deck, FlashcardFolder } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DeckCard } from '@/components/flashcards/deck-card';
import { useToast } from '@/hooks/use-toast';
import { deleteDeck, addFlashcardFolder, deleteFlashcardFolder } from '@/lib/flashcards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderCard } from '@/components/flashcards/folder-card';
import { FlashcardsIcon } from '@/components/icons/tools/flashcards-icon';

export default function FlashcardsDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const decksQuery = query(collection(db, 'users', user.uid, 'flashcardDecks'), orderBy('createdAt', 'desc'));
      const unsubscribeDecks = onSnapshot(decksQuery, (snapshot) => {
        const decksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deck));
        setDecks(decksData);
      });

      const foldersQuery = query(collection(db, 'users', user.uid, 'flashcardFolders'), orderBy('createdAt', 'desc'));
      const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        setFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashcardFolder)));
      });

      return () => {
        unsubscribeDecks();
        unsubscribeFolders();
      };
    }
  }, [user]);
  
  const handleAddDeck = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'flashcardDecks'), {
        name: 'Untitled Deck',
        description: '',
        folderId: null,
        ownerId: user.uid,
        isPublic: false,
        editors: [],
        viewers: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({ title: '✓ Deck Created' });
      router.push(`/flashcards/${docRef.id}`);
    } catch (e) {
      console.error("Error adding deck: ", e);
      toast({ variant: 'destructive', title: 'Error creating deck.'});
    }
  };

  const handleAddFolder = async () => {
    if (!user) return;
    try {
        await addFlashcardFolder(user.uid, 'New Folder');
        toast({ title: '✓ Folder Created' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error creating folder.'});
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

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    try {
      await deleteFlashcardFolder(user.uid, folderId);
      toast({ title: 'Folder deleted.'});
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error deleting folder.'});
    }
  };
  
  const handleMoveDeckToFolder = async (deckId: string, folderId: string | null) => {
    if (!user) return;
    try {
      const deckRef = doc(db, 'users', user.uid, 'flashcardDecks', deckId);
      await updateDoc(deckRef, { folderId });
      toast({ title: '✓ Deck Moved' });
    } catch(e) {
       toast({ variant: 'destructive', title: 'Error moving deck.'});
    }
  };

  const unfiledDecks = decks.filter(d => !d.folderId);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <FlashcardsIcon className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline">Flashcard Decks</h1>
            <p className="text-muted-foreground">Organize your flashcards into decks for focused studying.</p>
          </div>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>
                  <PlusCircle /> New
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={handleAddDeck}>
                    <Layers /> New Deck
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={handleAddFolder}>
                    <FolderPlus/> New Folder
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
       {decks.length === 0 && folders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
          <FlashcardsIcon className="h-24 w-24 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Decks Yet</h3>
          <p className="text-muted-foreground">Click "New" to create your first deck or folder.</p>
        </div>
      ) : (
         <div className="space-y-8">
            {folders.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold font-headline mb-4">Folders</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {folders.map(folder => (
                            <FolderCard key={folder.id} folder={folder} onDelete={() => handleDeleteFolder(folder.id)} />
                        ))}
                    </div>
                </div>
            )}
             <div>
                <h2 className="text-2xl font-bold font-headline mb-4">Decks</h2>
                {unfiledDecks.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {unfiledDecks.map(deck => (
                            <DeckCard 
                                key={deck.id} 
                                deck={deck} 
                                folders={folders}
                                onDelete={() => handleDeleteDeck(deck.id)} 
                                onMove={handleMoveDeckToFolder}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">No decks outside of folders.</p>
                )}
            </div>
         </div>
      )}
    </div>
  );
}
