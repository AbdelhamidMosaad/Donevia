
'use client';
import type { TaskList, Task, TaskFolder } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2, Move, Folder as FolderIcon } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { TasksIcon } from './icons/tools/tasks-icon';


interface TaskListListViewProps {
  taskLists: TaskList[];
  folders: TaskFolder[];
  onDelete: (listId: string) => void;
  onMove: (listId: string, folderId: string | null) => void;
}

function ListRow({ list, folders, onDelete, onMove }: { list: TaskList; folders: TaskFolder[]; onDelete: (listId: string) => void; onMove: (listId: string, folderId: string | null) => void; }) {
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [taskCount, setTaskCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingListId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingListId]);
  
  useEffect(() => {
    if (user && list.id) {
        const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', list.id));
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            setTaskCount(snapshot.size);
        });
        return () => unsubscribe();
    }
  }, [user, list.id]);

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
    const originalList = list;
    const trimmedName = editingListName.trim();
    
    if (!trimmedName || !originalList || (originalList.name === trimmedName)) {
      handleCancelEdit();
      return;
    }
    
    setEditingListId(null);
    setEditingListName('');

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

  return (
     <TableRow key={list.id}>
      <TableCell>
        {editingListId === list.id ? (
          <div className="flex items-center gap-2">
            <TasksIcon className="h-5 w-5 shrink-0" />
            <Input 
              ref={inputRef}
              value={editingListName}
              onChange={(e) => setEditingListName(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, list.id)}
              onBlur={() => handleFinishEdit(list.id)}
              className="h-8"
              onClick={e => e.stopPropagation()}
            />
          </div>
        ) : (
          <Link href={`/dashboard/list/${list.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
              <TasksIcon className="h-5 w-5" />
              {list.name}
          </Link>
        )}
      </TableCell>
      <TableCell>{list.createdAt.toDate().toLocaleDateString()}</TableCell>
      <TableCell>{taskCount}</TableCell>
      <TableCell>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => handleStartEdit(list)}><Edit className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
              <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Move className="mr-2 h-4 w-4" />
                    Move to Folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {list.folderId && 
                        <DropdownMenuItem onSelect={() => onMove(list.id, null)}>
                            Remove from folder
                        </DropdownMenuItem>
                    }
                    {folders.map(folder => (
                      <DropdownMenuItem key={folder.id} onSelect={() => onMove(list.id, folder.id)} disabled={list.folderId === folder.id}>
                        <FolderIcon className="mr-2 h-4 w-4" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                    {folders.length === 0 && <DropdownMenuItem disabled>No folders created</DropdownMenuItem>}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
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
                          <AlertDialogAction onClick={() => onDelete(list.id)} variant="destructive">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}


export function TaskListListView({ taskLists, folders, onDelete, onMove }: TaskListListViewProps) {
  if (taskLists.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <TasksIcon className="h-24 w-24 text-muted-foreground mb-4" />
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
            <ListRow key={list.id} list={list} folders={folders} onDelete={onDelete} onMove={onMove} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
