
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Deck } from '@/lib/types';
import { updateDeck } from '@/lib/flashcards';

interface AddDeckDialogProps {
  deck: Deck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDeckDialog({ deck, open, onOpenChange }: AddDeckDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || '');

  const resetForm = () => {
      setName(deck.name);
      setDescription(deck.description || '');
  }

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, deck]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Deck name cannot be empty.' });
      return;
    }

    console.log('Attempting to save deck:', name);
    setIsSaving(true);
    try {
      await updateDeck(user.uid, deck.id, { name, description });
      toast({ title: 'Deck details updated successfully!' });
      onOpenChange(false);
    } catch (e) {
      console.error("Error updating deck: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update deck.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Edit Deck Details</DialogTitle>
          <DialogDescription>Update the name and description for your deck.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
