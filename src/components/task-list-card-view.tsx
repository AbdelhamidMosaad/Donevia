
'use client';
import type { TaskList } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Folder, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';


interface TaskListCardViewProps {
  taskLists: TaskList[];
  onDelete: (listId: string) => void;
}

export function TaskListCardView({ taskLists, onDelete }: TaskListCardViewProps) {
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingListId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingListId]);

  const handleStartEdit = (list: TaskList) => {
    setEditingListId(list.id);
    setEditingListName(list.name);
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditingListName('');
  };

  const handleFinishEdit = async (listId: string) => {
    if (!user) return;

    const originalList = taskLists.find(l => l.id === listId);
    const trimmedName = editingListName.trim();
    
    // Cancel editing state immediately for optimistic UI
    handleCancelEdit();
    
    if (!trimmedName || !originalList) {
      toast({ variant: 'destructive', title: 'Error', description: 'List name cannot be empty.' });
      return;
    }
    
    if (originalList.name === trimmedName) {
        return; // No change
    }

    const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
    try {
      await updateDoc(listRef, { name: trimmedName });
      toast({ title: '✓ List Updated', description: `List renamed to "${trimmedName}".` });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename list.' });
      // Optionally revert UI
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, listId: string) => {
    if (e.key === 'Enter') handleFinishEdit(listId);
    else if (e.key === 'Escape') handleCancelEdit();
  };


  if (taskLists.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <Folder className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Task Lists Yet</h3>
            <p className="text-muted-foreground">Create your first task list to get started.</p>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {taskLists.map(list => (
          <Card key={list.id} className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                {editingListId === list.id ? (
                  <Input 
                    ref={inputRef}
                    value={editingListName}
                    onChange={(e) => setEditingListName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, list.id)}
                    onBlur={() => handleFinishEdit(list.id)}
                    className="text-lg font-headline"
                  />
                ) : (
                  <Link href={`/dashboard/lists/${list.id}`} passHref>
                    <CardTitle className="flex items-center gap-2 font-headline hover:underline">
                      <Folder className="h-5 w-5 text-primary" />
                      {list.name}
                    </CardTitle>
                  </Link>
                )}
                <CardDescription className="mt-1">
                  Created on {list.createdAt.toDate().toLocaleDateString()}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleStartEdit(list)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
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
                              <AlertDialogAction onClick={() => onDelete(list.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
             <Link href={`/dashboard/lists/${list.id}`} passHref className="flex-1">
                <CardContent>
                  <p className="text-sm text-muted-foreground">This list is ready for your tasks.</p>
                </CardContent>
            </Link>
          </Card>
      ))}
    </div>
  );
}
