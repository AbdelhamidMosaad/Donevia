
'use client';

import { useState, useRef, useEffect } from 'react';
import type { Deck, FlashcardFolder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, Move, Folder } from 'lucide-react';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import { AddDeckDialog } from './add-deck-dialog';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FlashcardsIcon } from '../icons/tools/flashcards-icon';
import { cn } from '@/lib/utils';

interface DeckCardProps {
  deck: Deck;
  folders: FlashcardFolder[];
  onDelete: () => void;
  onMove: (deckId: string, folderId: string | null) => void;
  size?: 'small' | 'medium' | 'large';
}

export function DeckCard({ deck, folders, onDelete, onMove, size = 'large' }: DeckCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState(deck.name);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleRename = async () => {
    if (!user || !editingName.trim() || editingName === deck.name) {
      setIsEditing(false);
      setEditingName(deck.name);
      return;
    }

    const deckRef = doc(db, 'users', user.uid, 'flashcardDecks', deck.id);
    try {
      await updateDoc(deckRef, { name: editingName.trim() });
      toast({ title: '✓ Deck Renamed' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error renaming deck' });
      setEditingName(deck.name);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(deck.name);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isEditing) return;
    router.push(`/flashcards/${deck.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <a href={`/flashcards/${deck.id}`} onClick={handleCardClick} className="group block h-full">
        <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
          <div className={cn("p-6 flex flex-col items-center text-center h-full justify-center", size === 'medium' && 'p-4', size === 'small' && 'p-3')}>
            <FlashcardsIcon className={cn("mb-4", size === 'large' && "h-24 w-24", size === 'medium' && "h-16 w-16", size === 'small' && "h-12 w-12 mb-2")} />
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                className="text-lg font-headline text-center bg-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 className={cn("font-bold font-headline text-foreground", size === 'large' && 'text-lg', size === 'medium' && 'text-base', size === 'small' && 'text-sm')}>{deck.name}</h3>
            )}
            {size !== 'small' && <p className="text-xs text-muted-foreground mt-1">Last updated: {deck.updatedAt.toDate().toLocaleDateString()}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={handleActionClick}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={handleActionClick}>
              <DropdownMenuItem onSelect={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Move className="mr-2 h-4 w-4" />Move to Folder
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
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
        </Card>
      </a>
      <AddDeckDialog deck={deck} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
