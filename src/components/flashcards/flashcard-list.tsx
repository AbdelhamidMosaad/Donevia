
'use client';

import { useState } from 'react';
import type { FlashcardToolCard } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AddFlashcardDialog } from './add-flashcard-dialog';
import { deleteCard } from '@/lib/flashcards';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface FlashcardListProps {
  cards: FlashcardToolCard[];
}

export function FlashcardList({ cards }: FlashcardListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingCard, setEditingCard] = useState<FlashcardToolCard | null>(null);

  const handleDelete = async (cardId: string) => {
    if (!user) return;
    try {
      await deleteCard(user.uid, cardId);
      toast({ title: 'Card deleted.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting card.' });
    }
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Front</TableHead>
              <TableHead>Back</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.map((card) => (
              <TableRow key={card.id}>
                <TableCell className="font-medium truncate max-w-sm">{card.front}</TableCell>
                <TableCell className="truncate max-w-sm">{card.back}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => setEditingCard(card)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the flashcard.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(card.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editingCard && (
        <AddFlashcardDialog
          deckId={editingCard.deckId}
          card={editingCard}
          open={!!editingCard}
          onOpenChange={(isOpen) => !isOpen && setEditingCard(null)}
        />
      )}
    </>
  );
}
