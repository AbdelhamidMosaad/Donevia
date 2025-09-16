
'use client';

import { useState, useRef, useEffect } from 'react';
import type { Whiteboard } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { WhiteboardIcon } from '../icons/tools/whiteboard-icon';
import moment from 'moment';
import { cn } from '@/lib/utils';

interface WhiteboardCardProps {
  whiteboard: Whiteboard;
  onDelete: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function WhiteboardCard({ whiteboard, onDelete, size = 'large' }: WhiteboardCardProps) {
  const [editingName, setEditingName] = useState(whiteboard.name);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = async () => {
    if (!user || !editingName.trim() || editingName === whiteboard.name) {
      setIsEditing(false);
      setEditingName(whiteboard.name);
      return;
    }

    const boardRef = doc(db, 'users', user.uid, 'whiteboards', whiteboard.id);
    try {
      await updateDoc(boardRef, { name: editingName.trim() });
      toast({ title: '✓ Whiteboard Renamed' });
    } catch (e) {
      console.error('Error renaming whiteboard: ', e);
      toast({ variant: 'destructive', title: 'Error renaming whiteboard' });
      setEditingName(whiteboard.name);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(whiteboard.name);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isEditing) return;
    router.push(`/whiteboard/${whiteboard.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <a href={`/whiteboard/${whiteboard.id}`} onClick={handleCardClick} className="group block h-full">
      <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
        <div className={cn("p-6 flex flex-col items-center text-center h-full justify-center", size === 'medium' && 'p-4', size === 'small' && 'p-3')}>
            <WhiteboardIcon className={cn("mb-4", size === 'large' && 'h-24 w-24', size === 'medium' && 'h-16 w-16', size === 'small' && 'h-12 w-12 mb-2')} />
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
              <h3 className={cn("font-bold font-headline text-foreground", size === 'large' && 'text-lg', size === 'medium' && 'text-base', size === 'small' && 'text-sm')}>{whiteboard.name}</h3>
            )}
            {size !== 'small' && <p className="text-xs text-muted-foreground mt-1">
                {whiteboard.updatedAt && typeof whiteboard.updatedAt.toDate === 'function'
                ? `Updated ${moment(whiteboard.updatedAt.toDate()).fromNow()}`
                : 'Just now'}
            </p>}
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={handleActionClick}
            >
                <MoreHorizontal className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={handleActionClick}>
            <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Rename
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
                    This will permanently delete the "{whiteboard.name}"
                    whiteboard. This action cannot be undone.
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
      </Card>
    </a>
  );
}
