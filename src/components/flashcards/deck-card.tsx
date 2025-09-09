
'use client';

import { useState } from 'react';
import type { Deck, FlashcardFolder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Layers3, MoreHorizontal, Edit, Trash2, Move, Folder } from 'lucide-react';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { AddDeckDialog } from './add-deck-dialog';
import { useRouter } from 'next/navigation';


interface DeckCardProps {
  deck: Deck;
  folders: FlashcardFolder[];
  onDelete: () => void;
  onMove: (deckId: string, folderId: string | null) => void;
}

export function DeckCard({ deck, folders, onDelete, onMove }: DeckCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/flashcards/${deck.id}`);
  }
  
  return (
    <>
      <div onClick={handleCardClick} className="group block cursor-pointer">
        <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
          <CardHeader className="flex-row items-start justify-between">
            <div>
                <div className="flex items-center gap-2">
                    <Layers3 className="h-5 w-5 text-primary" />
                    <CardTitle className="font-headline group-hover:underline">{deck.name}</CardTitle>
                </div>
              <CardDescription className="mt-1 line-clamp-2">{deck.description}</CardDescription>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); }}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => { e.stopPropagation(); }}>
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Move className="mr-2 h-4 w-4"/>Move to Folder
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                         {deck.folderId && (
                            <DropdownMenuItem onSelect={() => onMove(deck.id, null)}>
                                Remove from folder
                            </DropdownMenuItem>
                        )}
                        {folders.map(folder => (
                           <DropdownMenuItem key={folder.id} onSelect={() => onMove(deck.id, folder.id)} disabled={deck.folderId === folder.id}>
                            <Folder className="mr-2 h-4 w-4" /> {folder.name}
                           </DropdownMenuItem>
                        ))}
                         {folders.length === 0 && <DropdownMenuItem disabled>No folders created</DropdownMenuItem>}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the deck "{deck.name}" and all of its cards.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1" />
           <CardFooter>
             <p className="text-xs text-muted-foreground">Last updated: {deck.updatedAt.toDate().toLocaleDateString()}</p>
           </CardFooter>
        </Card>
      </div>
      <AddDeckDialog deck={deck} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
