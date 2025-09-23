
'use client';

import { useState, useRef, useEffect } from 'react';
import type { MeetingNote } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
} from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { MeetingNotesIcon } from '../icons/tools/meeting-notes-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MeetingNoteCardProps {
  note: MeetingNote;
  onDelete: () => void;
  onDuplicate: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function MeetingNoteCard({ note, onDelete, onDuplicate, size = 'large' }: MeetingNoteCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleRename = async () => {
    if (!user || !name.trim() || name === note.title) {
      setIsEditing(false);
      setName(note.title);
      return;
    }
    const noteRef = doc(db, 'users', user.uid, 'meetingNotes', note.id);
    try {
        await updateDoc(noteRef, { title: name.trim() });
        toast({ title: '✓ Note Renamed' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error renaming note.' });
        setName(note.title);
    } finally {
        setIsEditing(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setName(note.title);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if(isEditing) return;
    router.push(`/meeting-notes/${note.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <a href={`/meeting-notes/${note.id}`} onClick={handleCardClick} className="group block h-full">
      <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
        <div className={cn(
            "p-6 flex flex-col items-center text-center h-full justify-center",
            size === 'medium' && 'p-4',
            size === 'small' && 'p-3'
        )}>
           <MeetingNotesIcon className={cn(
                "mb-4",
                size === 'large' && 'h-24 w-24',
                size === 'medium' && 'h-16 w-16',
                size === 'small' && 'h-12 w-12 mb-2'
            )} />
             {isEditing ? (
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                className="text-lg font-headline text-center bg-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
                <h3 className={cn("font-bold font-headline text-foreground", 
                    size === 'large' && 'text-lg',
                    size === 'medium' && 'text-base',
                    size === 'small' && 'text-sm'
                )}>{note.title}</h3>
            )}
            {size !== 'small' && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.startDate ? `Meeting on ${moment(note.startDate.toDate()).format('ll')}` : 'No date set'}</p>}
        </div>
        <div className="absolute top-2 right-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={handleActionClick}>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={handleActionClick}>
                 <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                 <DropdownMenuItem onSelect={onDuplicate}>
                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive w-full"
                    >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={handleActionClick}>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the "{note.title}"
                        meeting note. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </Card>
    </a>
  );
}
