
'use client';

import { useState, useRef, useEffect } from 'react';
import type { TaskList } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
} from './ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { TasksIcon } from './icons/tools/tasks-icon';

interface TaskListCardProps {
  list: TaskList;
  onDelete: () => void;
}

export function TaskListCard({ list, onDelete }: TaskListCardProps) {
  const [editingName, setEditingName] = useState(list.name);
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
    if (!user || !editingName.trim() || editingName === list.name) {
      setIsEditing(false);
      setEditingName(list.name);
      return;
    }

    const listRef = doc(db, 'users', user.uid, 'taskLists', list.id);
    try {
      await updateDoc(listRef, { name: editingName.trim() });
      toast({ title: '✓ List Renamed' });
    } catch (e) {
      console.error("Error renaming list: ", e);
      toast({ variant: 'destructive', title: 'Error renaming list' });
      setEditingName(list.name);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(list.name);
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if(isEditing) return;
    router.push(`/dashboard/list/${list.id}`);
  }

  return (
    <div onClick={handleCardClick} className="group block h-full">
      <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
        <div className="p-6 flex flex-col items-center text-center">
            <TasksIcon className="h-24 w-24 mb-4" />
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
              <h3 className="text-lg font-bold font-headline text-foreground">{list.name}</h3>
            )}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Created on {list.createdAt.toDate().toLocaleDateString()}</p>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the "{list.name}" list and all of its tasks. This action cannot be undone.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete} variant="destructive">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
      </Card>
    </div>
  );
}
