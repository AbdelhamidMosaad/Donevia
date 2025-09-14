
'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Deck } from '@/lib/types';
import { updateDeck } from '@/lib/flashcards';
import { arrayUnion, arrayRemove } from 'firebase/firestore';

interface ShareDeckDialogProps {
  deck: Deck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDeckDialog({ deck, open, onOpenChange }: ShareDeckDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uid, setUid] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddPermission = async () => {
    if (!user || !uid.trim()) return;
    setIsSaving(true);
    try {
      await updateDeck(user.uid, deck.id, {
        editors: arrayUnion(uid.trim())
      });
      setUid('');
      toast({ title: 'Editor added successfully!' });
    } catch(e) {
      toast({ variant: 'destructive', title: 'Failed to add editor.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePermission = async (editorUid: string) => {
    if (!user) return;
    try {
        await updateDeck(user.uid, deck.id, {
            editors: arrayRemove(editorUid)
        });
        toast({ title: 'Editor removed.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Failed to remove editor.' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Deck</DialogTitle>
          <DialogDescription>
            Add collaborators to this deck by their User ID.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="uid" className="text-right">
              User ID
            </Label>
            <Input
              id="uid"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              className="col-span-3"
              placeholder="Enter user ID to add as editor"
            />
          </div>
          <Button onClick={handleAddPermission} disabled={isSaving || !uid.trim()}>
            {isSaving ? 'Adding...' : 'Add Editor'}
          </Button>
        </div>
         <div className="space-y-2">
            <h4 className="font-medium">Current Editors</h4>
            {deck.editors && deck.editors.length > 0 ? (
                <ul className="space-y-1">
                    {deck.editors.map(editorUid => (
                        <li key={editorUid} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                            <span>{editorUid}</span>
                            <Button variant="destructive" size="sm" onClick={() => handleRemovePermission(editorUid)}>Remove</Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">No other editors.</p>
            )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
