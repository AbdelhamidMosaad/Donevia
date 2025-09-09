
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { FlashcardToolCard } from '@/lib/types';
import { addCard, updateCard } from '@/lib/flashcards';

interface AddFlashcardDialogProps {
  deckId: string;
  card?: FlashcardToolCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFlashcardDialog({ deckId, card, open, onOpenChange }: AddFlashcardDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!card;

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const resetForm = () => {
    setFront('');
    setBack('');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && card) {
        setFront(card.front);
        setBack(card.back);
      } else {
        resetForm();
      }
      setIsSaving(false);
    } else {
        resetForm();
    }
  }, [open, card, isEditMode]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!front.trim() || !back.trim()) {
      toast({ variant: 'destructive', title: 'Front and back content cannot be empty.' });
      return;
    }

    setIsSaving(true);
    const cardData = {
      front,
      back,
    };

    try {
      if (isEditMode && card) {
        await updateCard(user.uid, deckId, card.id, cardData);
        toast({ title: 'Card updated successfully!' });
      } else {
        await addCard(user.uid, deckId, cardData);
        toast({ title: 'Card added successfully!' });
      }
      onOpenChange(false);
    } catch (e) {
      console.error("Error saving card: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save card.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Flashcard' : 'Add New Flashcard'}</DialogTitle>
          <DialogDescription>
            Fill in the content for the front and back of the card.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="front">Front</Label>
            <Textarea id="front" value={front} onChange={(e) => setFront(e.target.value)} placeholder="Enter the question or term..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Back</Label>
            <Textarea id="back" value={back} onChange={(e) => setBack(e.target.value)} placeholder="Enter the answer or definition..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
