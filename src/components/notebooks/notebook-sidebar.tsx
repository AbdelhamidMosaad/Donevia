
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  updateDoc,
  doc,
  writeBatch,
  getDocs,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import type { Notebook, Section, Page } from '@/lib/types';
import { useAtom } from 'jotai';
import { selectedNotebookAtom, selectedSectionAtom, selectedPageAtom } from '@/lib/notebook-store';
import { Plus, MoreVertical, Edit, Trash2, Book, ChevronRight, ChevronDown, FileText, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '../ui/scroll-area';
import { NotebookSearchBar } from './search-bar';
import { useRouter } from 'next/navigation';

export function NotebookSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [pages, setPages] = useState<Record<string, Page[]>>({});
  const [selectedNotebook, setSelectedNotebook] = useAtom(selectedNotebookAtom);
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionAtom);
  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

  // Fetch notebooks
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'notebooks'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotebooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notebook)));
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch sections for notebooks
  useEffect(() => {
    if (!user || notebooks.length === 0) return;
    const unsubscribes = notebooks.map(notebook => {
      const q = query(collection(db, 'users', user.uid, 'sections'), where('notebookId', '==', notebook.id), orderBy('order', 'asc'));
      return onSnapshot(q, (snapshot) => {
        const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
        setSections(prev => ({...prev, [notebook.id]: sectionsData }));
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, notebooks]);
  
  // Fetch pages for sections
  useEffect(() => {
    if (!user) return;
    const allSections = Object.values(sections).flat();
    if(allSections.length === 0) return;

    const unsubscribes = allSections.map(section => {
        const q = query(collection(db, 'users', user.uid, 'pages'), where('sectionId', '==', section.id), orderBy('createdAt', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const pagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Page));
            setPages(prev => ({...prev, [section.id]: pagesData }));
        });
    });
     return () => unsubscribes.forEach(unsub => unsub());
  }, [user, sections]);

  const handleCreateNotebook = async () => {
    if (!user) return;
    router.push('/notebooks');
  }

  const handleCreateSection = async (notebookId: string) => {
      if(!user) return;
      const newOrder = sections[notebookId]?.length || 0;
      await addDoc(collection(db, 'users', user.uid, 'sections'), {
        notebookId: notebookId,
        title: 'Untitled Section',
        order: newOrder,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
  }

  const handleCreatePage = async (sectionId: string) => {
      if(!user) return;
      const docRef = await addDoc(collection(db, 'users', user.uid, 'pages'), {
            sectionId: sectionId,
            title: 'Untitled Page',
            content: { type: 'doc', content: [{type: 'paragraph'}] },
            searchText: 'untitled page',
            version: 1,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
      router.push(`/notebooks/${docRef.id}`);
  }

  const startEditing = (id: string, name: string) => {
    setEditingItemId(id);
    setEditingItemName(name);
  }

  const handleRename = async (type: 'notebook' | 'section' | 'page', id: string) => {
    if(!user || !editingItemName.trim()) {
        setEditingItemId(null);
        setEditingItemName('');
        return;
    };
    
    const collectionName = type === 'notebook' ? 'notebooks' : type === 'section' ? 'sections' : 'pages';
    const docRef = doc(db, 'users', user.uid, collectionName, id);
    await updateDoc(docRef, { title: editingItemName.trim() });
    toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} renamed` });
    setEditingItemId(null);
    setEditingItemName('');
  }
  
  const handleDelete = async (type: 'notebook'|'section'|'page', id: string) => {
    if(!user) return;
    try {
        if(type === 'page') {
             await deleteDoc(doc(db, 'users', user.uid, 'pages', id));
        } else if (type === 'section') {
            const batch = writeBatch(db);
            const sectionRef = doc(db, 'users', user.uid, 'sections', id);
            const qPages = query(collection(db, 'users', user.uid, 'pages'), where('sectionId', '==', id));
            const pagesSnap = await getDocs(qPages);
            pagesSnap.forEach(pageDoc => batch.delete(pageDoc.ref));
            batch.delete(sectionRef);
            await batch.commit();
        } else if (type === 'notebook') {
            const batch = writeBatch(db);
            const notebookRef = doc(db, 'users', user.uid, 'notebooks', id);
            const qSections = query(collection(db, 'users', user.uid, 'sections'), where('notebookId', '==', id));
            const sectionsSnap = await getDocs(qSections);
            for (const sectionDoc of sectionsSnap.docs) {
                 const qPages = query(collection(db, 'users', user.uid, 'pages'), where('sectionId', '==', sectionDoc.id));
                 const pagesSnap = await getDocs(qPages);
                 pagesSnap.forEach(pageDoc => batch.delete(pageDoc.ref));
                 batch.delete(sectionDoc.ref);
            }
            batch.delete(notebookRef);
            await batch.commit();
        }
        toast({title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`});
    } catch(e) {
        toast({variant: 'destructive', title: `Error deleting ${type}`});
        console.error(e);
    }
  }

  const handleSelectPage = (page: Page) => {
      setSelectedPage(page);
      router.push(`/notebooks/${page.id}`);
  }

  const renderItemActions = (item: Notebook | Section | Page, type: 'notebook' | 'section' | 'page') => {
    const isNotebook = type === 'notebook';
    const isSection = type === 'section';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
                    <MoreVertical className="h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => startEditing(item.id, item.title)}><Edit className="mr-2 h-4 w-4"/>Rename</DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will delete "{item.title}" and all its contents. This action is irreversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(type, item.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <DropdownMenuSeparator />
                {isNotebook && <DropdownMenuItem onSelect={() => handleCreateSection(item.id)}><FolderPlus className="mr-2 h-4 w-4"/>New Section</DropdownMenuItem>}
                {isSection && <DropdownMenuItem onSelect={() => handleCreatePage(item.id)}><Plus className="mr-2 h-4 w-4"/>New Page</DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu>
    )
  }

  const renderItem = (item: Notebook | Section | Page, type: 'notebook' | 'section' | 'page', level: number = 0) => {
    const isSelected = (type === 'notebook' && selectedNotebook?.id === item.id) ||
                       (type === 'section' && selectedSection?.id === item.id) ||
                       (type === 'page' && selectedPage?.id === item.id);

    const isCollapsible = type === 'notebook' || type === 'section';
    
    const content = (
        <div className={cn(
            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm group hover:bg-accent",
             isSelected && "bg-accent text-accent-foreground"
        )}>
            {editingItemId === item.id ? (
                <Input
                    value={editingItemName}
                    onChange={(e) => setEditingItemName(e.target.value)}
                    onBlur={() => handleRename(type, item.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(type, item.id)}
                    className="h-7"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <>
                    <div className="flex items-center gap-2 flex-1 truncate">
                        {type === 'notebook' && <Book className="h-4 w-4"/>}
                        {type === 'page' && <FileText className="h-4 w-4"/>}
                        <span className="truncate">{item.title}</span>
                    </div>
                    {renderItemActions(item, type)}
                </>
            )}
        </div>
    );

    if (isCollapsible) {
        const defaultOpen = (type === 'notebook' && selectedNotebook?.id === item.id) || 
                            (type === 'section' && selectedSection?.id === item.id);
        const children = type === 'notebook' ? sections[item.id] : pages[(item as Section).id];

        return (
            <Collapsible key={item.id} defaultOpen={defaultOpen} className="w-full">
                 <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                         <div className="flex items-center gap-1 cursor-pointer flex-1 group">
                             <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90"/>
                             {content}
                         </div>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <div className="pl-6 space-y-1 py-1">
                        {type === 'notebook' && (sections[item.id] || []).map(section => renderItem(section, 'section', level + 1))}
                        {type === 'section' && (pages[item.id] || []).map(page => renderItem(page, 'page', level + 1))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return (
        <div key={item.id} onClick={() => handleSelectPage(item as Page)} className="cursor-pointer">
            {content}
        </div>
    )
  }

  return (
    <>
    <div className="h-full flex flex-col p-2 bg-muted/50">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-lg font-bold font-headline truncate">{selectedNotebook?.title || 'Notebooks'}</h2>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleCreateNotebook} title="New Notebook">
              <Plus className="h-4 w-4" />
            </Button>
        </div>
      </div>
      <div className="px-2 pb-2">
        <NotebookSearchBar onSelectPage={handleSelectPage} />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {notebooks.map(notebook => renderItem(notebook, 'notebook'))}
        </div>
      </ScrollArea>
    </div>
    </>
  );
}
