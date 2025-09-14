
'use client';

import { useState, useRef, useEffect } from 'react';
import type { Whiteboard } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
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

interface WhiteboardCardProps {
  whiteboard: Whiteboard;
  onDelete: () => void;
}

export function WhiteboardCard({ whiteboard, onDelete }: WhiteboardCardProps) {
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

  return (
    <a href={`/whiteboard/${whiteboard.id}`} onClick={handleCardClick} className="block cursor-pointer">
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group">
        <CardHeader className="flex-row items-start justify-between w-full relative">
          <div>
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                className="text-lg font-headline"
                onClick={(e) => e.preventDefault()}
              />
            ) : (
              <CardTitle className="font-headline hover:underline text-xl flex items-center gap-2">
                <WhiteboardIcon className="h-6 w-6 text-primary" />
                {whiteboard.name}
              </CardTitle>
            )}
            <CardDescription className="mt-1">
              {whiteboard.updatedAt && typeof whiteboard.updatedAt.toDate === 'function'
                ? `Updated on ${whiteboard.updatedAt.toDate().toLocaleDateString()}`
                : 'Just now'}
            </CardDescription>
          </div>
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
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
                  <AlertDialogContent
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
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
          </div>
        </CardHeader>
      </Card>
    </a>
  );
}
