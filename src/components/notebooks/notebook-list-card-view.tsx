
'use client';
import type { Notebook } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, Palette } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit, writeBatch, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';


interface NotebookListCardViewProps {
  notebooks: Notebook[];
  onDelete: (listId: string) => void;
}

const colors = ['#FFFFFF', '#FFDDC1', '#FFD3B5', '#FFFACD', '#D4EDDA', '#D1E7DD', '#C8E6C9', '#E1F5FE', '#D0E8F2', '#D6EAF8', '#E8DAEF', '#F4ECF7', '#FADBD8', '#FDEDEC'];


// Function to determine if a color is light or dark
const isColorLight = (color: string) => {
    if (!color.startsWith('#')) return true; // Default to light for invalid colors
    const hex = color.replace('#', '');
    const c_r = parseInt(hex.substring(0, 2), 16);
    const c_g = parseInt(hex.substring(2, 4), 16);
    const c_b = parseInt(hex.substring(4, 6), 16);
    const brightness = ((c_r * 299) + (c_g * 587) + (c_b * 114)) / 1000;
    return brightness > 155;
};


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
  
  const handleColorChange = async (notebookId: string, color: string) => {
    if (!user) return;
    const listRef = doc(db, 'users', user.uid, 'notebooks', notebookId);
    try {
        await updateDoc(listRef, { color });
    } catch (e) {
        console.error("Error updating document: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update color.' });
    }
  };

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
        // When notebook is empty, create a new page and navigate to it.
        const batch = writeBatch(db);
        const sectionRef = doc(collection(db, 'users', user.uid, 'sections'));
        batch.set(sectionRef, {
            notebookId: notebookId,
            title: 'Untitled Chapter',
            order: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        const pageRef = doc(collection(db, 'users', user.uid, 'pages'));
        batch.set(pageRef, {
            sectionId: sectionRef.id,
            title: 'Untitled Page',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            searchText: 'untitled page',
            version: 1,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        await batch.commit();
        router.push(`/notebooks/${pageRef.id}`);
        return;
    }
    
    const firstSection = sectionsSnap.docs[0];
    
    const pagesRef = collection(db, 'users', user.uid, 'pages');
    const qPages = query(pagesRef, where('sectionId', '==', firstSection.id), orderBy('createdAt', 'asc'), limit(1));
    const pagesSnap = await getDocs(qPages);

    if(pagesSnap.empty) {
        // When section is empty, create a new page and navigate to it.
        const pageRef = doc(collection(db, 'users', user.uid, 'pages'));
        await setDoc(pageRef, {
            sectionId: firstSection.id,
            title: 'Untitled Page',
            content: { type: 'doc', content: [{ type: 'paragraph' }] },
            searchText: 'untitled page',
            version: 1,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        router.push(`/notebooks/${pageRef.id}`);
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
      {notebooks.map(list => {
          const textColor = isColorLight(list.color) ? 'text-gray-800' : 'text-white';
          return (
          <a key={list.id} href={`/notebooks/new?notebookId=${list.id}`} onClick={(e) => handleNavigate(e, list.id)} className="block cursor-pointer">
            <Card 
                className={cn("hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group", textColor)}
                style={{ backgroundColor: list.color || '#FFFFFF' }}
            >
              <CardHeader className="flex-row items-start justify-between w-full relative">
                <div>
                  {editingListId === list.id ? (
                    <Input 
                      ref={inputRef}
                      value={editingListName}
                      onChange={(e) => setEditingListName(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, list.id)}
                      onBlur={() => handleFinishEdit(list.id)}
                      className="text-lg font-headline"
                      onClick={(e) => e.preventDefault()}
                    />
                  ) : (
                    <CardTitle className="font-headline hover:underline">
                      {list.title}
                    </CardTitle>
                  )}
                  <CardDescription className={cn("mt-1", isColorLight(list.color) ? 'text-gray-600' : 'text-gray-300')}>
                    Created on {list.createdAt.toDate().toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="absolute top-2 right-2">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0", textColor, "hover:bg-black/10")} onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                        <DropdownMenuItem onSelect={() => handleStartEdit(list)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger><Palette className="mr-2 h-4 w-4" />Change Color</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="grid grid-cols-4 gap-1 p-2">
                               {colors.map(color => (
                                 <DropdownMenuItem key={color} onSelect={() => handleColorChange(list.id, color)} className="p-0 m-0 w-8 h-8 flex items-center justify-center rounded-md" style={{backgroundColor: color}}>
                                     {list.color === color && <Check className={cn(isColorLight(color) ? 'text-black' : 'text-white')} />}
                                 </DropdownMenuItem>
                               ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will permanently delete the "{list.title}" notebook and all of its contents. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(list.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
              </CardContent>
            </Card>
          </a>
          )
        })}
    </div>
  );
}

