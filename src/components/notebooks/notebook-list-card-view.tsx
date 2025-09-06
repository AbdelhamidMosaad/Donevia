
'use client';
import type { Notebook } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Book, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';


interface NotebookListCardViewProps {
  notebooks: Notebook[];
  onDelete: (listId: string) => void;
}

export function NotebookListCardView({ notebooks, onDelete }: NotebookListCardViewProps) {
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

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
    
    if (originalList.title === trimmedName) {
        return; // No change
    }

    const listRef = doc(db, 'users', user.uid, 'notebooks', listId);
    try {
      await updateDoc(listRef, { title: trimmedName });
      toast({ title: '✓ Notebook Updated', description: `Notebook renamed to "${trimmedName}".` });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename notebook.' });
    }
  };
  
  const handleNavigate = async (e: React.MouseEvent, notebookId: string) => {
    e.preventDefault();
    if (!user) return;
    
    // Find the first page of the first section to navigate to.
    const sectionsRef = collection(db, 'users', user.uid, 'sections');
    const qSections = query(sectionsRef, where('notebookId', '==', notebookId), orderBy('order', 'asc'), limit(1));
    const sectionsSnap = await getDocs(qSections);

    if (sectionsSnap.empty) {
        toast({title: 'Empty Notebook', description: 'Create a section and page in this notebook to get started.'});
        // We still navigate to a placeholder pageId to show the notebook context
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, listId: string) => {
    if (e.key === 'Enter') handleFinishEdit(listId);
    else if (e.key === 'Escape') handleCancelEdit();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {notebooks.map(list => (
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
                  <a href={`/notebooks/new?notebookId=${list.id}`} onClick={(e) => handleNavigate(e, list.id)} className="cursor-pointer">
                    <CardTitle className="flex items-center gap-2 font-headline hover:underline">
                      <Book className="h-5 w-5 text-primary" />
                      {list.title}
                    </CardTitle>
                  </a>
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
            </CardHeader>
             <a href={`/notebooks/new?notebookId=${list.id}`} onClick={(e) => handleNavigate(e, list.id)} className="flex-1 cursor-pointer">
                <CardContent>
                  <p className="text-sm text-muted-foreground">Click to open this notebook.</p>
                </CardContent>
            </a>
          </Card>
      ))}
    </div>
  );
}
