
'use client';
import type { TaskList, Task } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Folder, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';


interface TaskListListViewProps {
  taskLists: TaskList[];
  onDelete: (listId: string) => void;
}

export function TaskListListView({ taskLists, onDelete }: TaskListListViewProps) {
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (editingListId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingListId]);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribes = taskLists.map(list => {
      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', list.id));
      return onSnapshot(q, (snapshot) => {
        setTaskCounts(prevCounts => ({
          ...prevCounts,
          [list.id]: snapshot.size,
        }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());

  }, [user, taskLists]);

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
    
    handleCancelEdit();
    
    if (!trimmedName || !originalList) {
      toast({ variant: 'destructive', title: 'Error', description: 'List name cannot be empty.' });
      return;
    }
    
    if (originalList.name === trimmedName) return;

    const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
    try {
      await updateDoc(listRef, { name: trimmedName });
      toast({ title: '✓ List Updated', description: `List renamed to "${trimmedName}".` });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename list.' });
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taskLists.map(list => (
            <TableRow key={list.id}>
              <TableCell>
                {editingListId === list.id ? (
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 shrink-0" />
                    <Input 
                      ref={inputRef}
                      value={editingListName}
                      onChange={(e) => setEditingListName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, list.id)}
                      onBlur={() => handleFinishEdit(list.id)}
                      className="h-8"
                    />
                  </div>
                ) : (
                  <Link href={`/dashboard/lists/${list.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                      <Folder className="h-4 w-4" />
                      {list.name}
                  </Link>
                )}
              </TableCell>
              <TableCell>{list.createdAt.toDate().toLocaleDateString()}</TableCell>
              <TableCell>{taskCounts[list.id] || 0}</TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => handleStartEdit(list)}><Edit className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
