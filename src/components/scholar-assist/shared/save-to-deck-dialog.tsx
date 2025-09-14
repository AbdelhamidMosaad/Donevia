
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { Deck, Flashcard } from '@/lib/types';
import { addDeck, addCardsToDeck } from '@/lib/flashcards';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';


interface SaveToDeckDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    cards: Flashcard[];
    deckNameSuggestion?: string;
    onSaveComplete: () => void;
}

export function SaveToDeckDialog({
    isOpen,
    onOpenChange,
    cards,
    deckNameSuggestion,
    onSaveComplete
}: SaveToDeckDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [saveOption, setSaveOption] = useState<'new' | 'existing'>('new');
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [newDeckName, setNewDeckName] = useState(deckNameSuggestion || 'New Deck');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'users', user.uid, 'flashcardDecks'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDecks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deck)));
        });
        return () => unsubscribe();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            if (saveOption === 'new') {
                if (!newDeckName.trim()) {
                    toast({ variant: 'destructive', title: 'New deck name cannot be empty.' });
                    setIsLoading(false);
                    return;
                }
                // Create new deck, then add cards
                const newDeckRef = await addDeck(user.uid, { name: newDeckName });
                await addCardsToDeck(user.uid, newDeckRef.id, cards);
                toast({ title: `✓ Saved!`, description: `${cards.length} cards saved to new deck "${newDeckName}".` });
            } else { // existing
                if (!selectedDeckId) {
                    toast({ variant: 'destructive', title: 'Please select an existing deck.' });
                    setIsLoading(false);
                    return;
                }
                 await addCardsToDeck(user.uid, selectedDeckId, cards);
                 const deckName = decks.find(d => d.id === selectedDeckId)?.name;
                 toast({ title: `✓ Saved!`, description: `${cards.length} cards added to deck "${deckName}".` });
            }
            onSaveComplete();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving to deck:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Generated Flashcards</DialogTitle>
                    <DialogDescription>
                        Add these {cards.length} cards to a new or existing deck in your Flashcards tool.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <RadioGroup value={saveOption} onValueChange={(value: 'new' | 'existing') => setSaveOption(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="new-deck" />
                            <Label htmlFor="new-deck">Create a new deck</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="existing" id="existing-deck" />
                            <Label htmlFor="existing-deck">Add to an existing deck</Label>
                        </div>
                    </RadioGroup>

                    {saveOption === 'new' && (
                        <div className="space-y-2 pl-6">
                            <Label htmlFor="new-deck-name">New Deck Name</Label>
                            <Input
                                id="new-deck-name"
                                value={newDeckName}
                                onChange={(e) => setNewDeckName(e.target.value)}
                            />
                        </div>
                    )}
                     {saveOption === 'existing' && (
                        <div className="space-y-2 pl-6">
                             <Label htmlFor="select-deck">Select Deck</Label>
                             <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                                <SelectTrigger id="select-deck">
                                    <SelectValue placeholder="Choose a deck..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {decks.map(deck => (
                                        <SelectItem key={deck.id} value={deck.id}>
                                            {deck.name}
                                        </SelectItem>
                                    ))}
                                    {decks.length === 0 && <p className="p-2 text-sm text-muted-foreground">No decks found.</p>}
                                </SelectContent>
                             </Select>
                        </div>
                    )}
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2/> : <Save/>}
                        {isLoading ? 'Saving...' : 'Save Cards'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
