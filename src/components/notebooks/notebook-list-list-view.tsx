
'use client';
import type { Notebook } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Book, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';

interface NotebookListListViewProps {
  notebooks: Notebook[];
  onDelete: (listId: string) => void;
}

export function NotebookListListView({ notebooks, onDelete }: NotebookListListViewProps) {
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (editingListId && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [editingListId]);

  const handleStartEdit = (list: Notebook) => {
    setEditingListId(list.id);
    setEditingListName(list.title);
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditingListName('');
  };

  const handleFinishEdit = async (listId: string) => {
    if (!user) return;

    const originalList = notebooks.find(l => l.id === listId);
    const trimmedName = editingListName.trim();
    
    handleCancelEdit();
    
    if (!trimmedName || !originalList) {
      toast({ variant: 'destructive', title: 'Error', description: 'Notebook name cannot be empty.' });
      return;
    }
    
    if (originalList.title === trimmedName) return;

    const listRef = doc(db, 'users', user.uid, 'notebooks', listId);
    try {
      await updateDoc(listRef, { title: trimmedName });
      toast({ title: '✓ Notebook Updated', description: `Notebook renamed to "${trimmedName}".` });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename notebook.' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, listId: string) => {
    if (e.key === 'Enter') handleFinishEdit(listId);
    else if (e.key === 'Escape') handleCancelEdit();
  };
  
  const handleNavigate = async (e: React.MouseEvent, notebookId: string) => {
    e.preventDefault();
    if (!user) return;
    
    const sectionsRef = collection(db, 'users', user.uid, 'sections');
    const qSections = query(sectionsRef, where('notebookId', '==', notebookId), orderBy('order', 'asc'), limit(1));
    const sectionsSnap = await getDocs(qSections);

    if (sectionsSnap.empty) {
        toast({title: 'Empty Notebook', description: 'Create a section and page in this notebook to get started.'});
        router.push(`/notebooks/new?notebookId=${notebookId}`);
        return;
    }
    
    const firstSection = sectionsSnap.docs[0];
    
    const pagesRef = collection(db, 'users', user.uid, 'pages');
    const qPages = query(pagesRef, where('sectionId', '==', firstSection.id), orderBy('createdAt', 'asc'), limit(1));
    const pagesSnap = await getDocs(qPages);

    if(pagesSnap.empty) {
         toast({title: 'Empty Section', description: 'Create a page in this section to get started.'});
         router.push(`/notebooks/new?notebookId=${notebookId}&sectionId=${firstSection.id}`);
        return;
    }
    
    const firstPage = pagesSnap.docs[0];
    router.push(`/notebooks/${firstPage.id}`);
  }


  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notebooks.map(list => (
            <TableRow key={list.id} onDoubleClick={(e) => handleNavigate(e, list.id)} className="cursor-pointer">
              <TableCell>
                {editingListId === list.id ? (
                  <div className="flex items-center gap-2">
                    <Book className="h-4 w-4 shrink-0" />
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
                  <a href={`/notebooks/new?notebookId=${list.id}`} onClick={(e) => handleNavigate(e, list.id)} className="flex items-center gap-2 font-medium text-primary hover:underline">
                      <Book className="h-4 w-4" />
                      {list.title}
                  </a>
                )}
              </TableCell>
              <TableCell>{list.createdAt.toDate().toLocaleDateString()}</TableCell>
              <TableCell>{list.updatedAt.toDate().toLocaleDateString()}</TableCell>
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
                                    This will permanently delete the "{list.title}" notebook and all of its contents. This action cannot be undone.
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
