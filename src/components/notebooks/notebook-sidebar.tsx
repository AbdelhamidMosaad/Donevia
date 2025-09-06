
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
import { Plus, MoreVertical, Edit, Trash2, Book, ChevronRight, ChevronDown, FileText, Upload, Download } from 'lucide-react';
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
import { ExportDialog } from './export-dialog';

export function NotebookSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [pages, setPages] = useState<Record<string, Page[]>>({});
  const [selectedNotebook, setSelectedNotebook] = useAtom(selectedNotebookAtom);
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionAtom);
  const [selectedPage, setSelectedPage] = useAtom(selectedPageAtom);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [exportingNotebook, setExportingNotebook] = useState<Notebook | null>(null);

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

  const handleCreate = async (type: 'notebook' | 'section' | 'page', parentId?: string) => {
    if (!user) return;

    if (type === 'notebook') {
      await addDoc(collection(db, 'users', user.uid, 'notebooks'), {
        ownerId: user.uid,
        title: 'Untitled Notebook',
        color: '#4A90E2',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else if (type === 'section' && parentId) {
      await addDoc(collection(db, 'users', user.uid, 'sections'), {
        notebookId: parentId,
        title: 'Untitled Section',
        order: sections[parentId]?.length || 0,
      });
    } else if (type === 'page' && parentId) {
        await addDoc(collection(db, 'users', user.uid, 'pages'), {
            sectionId: parentId,
            title: 'Untitled Page',
            content: { type: 'doc', content: [] },
            searchText: 'untitled page',
            version: 1,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    }
  };

  const startEditing = (id: string, name: string) => {
    setEditingItemId(id);
    setEditingItemName(name);
  }

  const handleRename = async (type: 'notebook' | 'section' | 'page', id: string) => {
    if(!user || !editingItemName.trim()) return;
    
    const collectionName = type === 'notebook' ? 'notebooks' : type === 'section' ? 'sections' : 'pages';
    const docRef = doc(db, 'users', user.uid, collectionName, id);
    await updateDoc(docRef, { title: editingItemName.trim() });
    toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} renamed` });
    setEditingItemId(null);
    setEditingItemName('');
  }
  
  const handleDeleteNotebook = async (notebookId: string) => {
      if(!user) return;
      const batch = writeBatch(db);
      
      // Delete notebook
      const notebookRef = doc(db, 'users', user.uid, 'notebooks', notebookId);
      batch.delete(notebookRef);
      
      // Delete sections and pages
      const sectionsRef = collection(db, 'users', user.uid, 'sections');
      const qSections = query(sectionsRef, where('notebookId', '==', notebookId));
      const sectionsSnap = await getDocs(qSections);
      
      for (const sectionDoc of sectionsSnap.docs) {
        batch.delete(sectionDoc.ref);
        const pagesRef = collection(db, 'users', user.uid, 'pages');
        const qPages = query(pagesRef, where('sectionId', '==', sectionDoc.id));
        const pagesSnap = await getDocs(qPages);
        pagesSnap.forEach(pageDoc => batch.delete(pageDoc.ref));
      }
      
      await batch.commit();
      toast({title: 'Notebook deleted'});
  }
  
   const handleDeleteSection = async (sectionId: string) => {
      if(!user) return;
      const batch = writeBatch(db);
      
      // Delete Section
      const sectionRef = doc(db, 'users', user.uid, 'sections', sectionId);
      batch.delete(sectionRef);

      // Delete Pages within section
      const pagesRef = collection(db, 'users', user.uid, 'pages');
      const qPages = query(pagesRef, where('sectionId', '==', sectionId));
      const pagesSnap = await getDocs(qPages);
      pagesSnap.forEach(pageDoc => batch.delete(pageDoc.ref));
      
      await batch.commit();
      toast({title: 'Section deleted'});
  }
  
  const handleDeletePage = async (pageId: string) => {
      if(!user) return;
      const pageRef = doc(db, 'users', user.uid, 'pages', pageId);
      await deleteDoc(pageRef);
      toast({title: 'Page deleted'});
  }

  const handleSelectPage = (page: Page) => {
      setSelectedPage(page);
      const parentSection = Object.values(sections).flat().find(s => s.id === (page as Page).sectionId);
      if(parentSection) {
          setSelectedSection(parentSection);
          const parentNotebook = notebooks.find(n => n.id === parentSection.notebookId);
          setSelectedNotebook(parentNotebook || null);
      }
  }

  const renderItem = (item: Notebook | Section | Page, type: 'notebook' | 'section' | 'page') => {
      const isSelected = (type === 'notebook' && selectedNotebook?.id === item.id) ||
                         (type === 'section' && selectedSection?.id === item.id) ||
                         (type === 'page' && selectedPage?.id === item.id);
      
      const onSelect = () => {
          if(type === 'notebook') setSelectedNotebook(item as Notebook);
          if(type === 'section') {
            setSelectedSection(item as Section);
            const parentNotebook = notebooks.find(n => n.id === (item as Section).notebookId);
            setSelectedNotebook(parentNotebook || null);
          }
          if(type === 'page') {
            handleSelectPage(item as Page);
          }
      };
      
      const icon = type === 'notebook' ? <Book className="h-4 w-4"/> : <FileText className="h-4 w-4"/>;

      return (
           <div 
            key={item.id} 
            className={cn(
                "flex items-center justify-between rounded-md px-2 py-1.5 text-sm group hover:bg-accent",
                isSelected && "bg-accent text-accent-foreground",
                type === 'section' && "pl-6",
                type === 'page' && "pl-10",
            )}
           >
                {editingItemId === item.id ? (
                    <Input
                        value={editingItemName}
                        onChange={(e) => setEditingItemName(e.target.value)}
                        onBlur={() => handleRename(type, item.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(type, item.id)}
                        className="h-7"
                        autoFocus
                    />
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer flex-1 truncate" onClick={onSelect}>
                        {type !== 'section' && icon}
                        <span className="truncate">{item.title}</span>
                    </div>
                )}
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
                                    <AlertDialogAction onClick={() => {
                                        if (type === 'notebook') handleDeleteNotebook(item.id);
                                        else if (type === 'section') handleDeleteSection(item.id);
                                        else if (type === 'page') handleDeletePage(item.id);
                                    }}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <DropdownMenuSeparator />
                        {type === 'notebook' && <DropdownMenuItem onSelect={() => handleCreate('section', item.id)}><Plus className="mr-2 h-4 w-4"/>New Section</DropdownMenuItem>}
                        {type === 'section' && <DropdownMenuItem onSelect={() => handleCreate('page', item.id)}><Plus className="mr-2 h-4 w-4"/>New Page</DropdownMenuItem>}
                         {type === 'notebook' && (
                             <>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={() => setExportingNotebook(item as Notebook)}>
                                <Download className="mr-2 h-4 w-4" /> Export
                             </DropdownMenuItem>
                            </>
                         )}
                    </DropdownMenuContent>
                 </DropdownMenu>
           </div>
      )
  }

  return (
    <>
    <div className="h-full flex flex-col p-2 bg-muted/50">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-lg font-bold font-headline">Notebooks</h2>
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => {}} title="Import Notebook">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleCreate('notebook')} title="New Notebook">
              <Plus className="h-4 w-4" />
            </Button>
        </div>
      </div>
      <div className="px-2 pb-2">
        <NotebookSearchBar onSelectPage={handleSelectPage} />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {notebooks.map(notebook => (
              <Collapsible key={notebook.id} defaultOpen={true} className="w-full">
                {renderItem(notebook, 'notebook')}
                <CollapsibleContent>
                    {(sections[notebook.id] || []).map(section => (
                        <Collapsible key={section.id} defaultOpen={true} className="w-full">
                            <CollapsibleTrigger className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm group hover:bg-accent">
                                 <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90"/>
                                 <span className="truncate flex-1 text-left">{section.title}</span>
                                 {/* Dropdown for section actions can be added here if needed */}
                            </CollapsibleTrigger>
                             <CollapsibleContent>
                                {(pages[section.id] || []).map(page => renderItem(page, 'page'))}
                             </CollapsibleContent>
                        </Collapsible>
                    ))}
                </CollapsibleContent>
              </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
     {exportingNotebook && (
        <ExportDialog
          notebook={exportingNotebook}
          isOpen={!!exportingNotebook}
          onClose={() => setExportingNotebook(null)}
        />
      )}
    </>
  );
}
