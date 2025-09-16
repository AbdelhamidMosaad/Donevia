'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, FolderPlus, MoreHorizontal, Edit, Trash2, LayoutGrid, List, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Bookmark } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, writeBatch, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteBookmark } from '@/lib/bookmarks';
import { AddBookmarkDialog } from '@/components/bookmarks/add-bookmark-dialog';
import { BookmarkCardView } from '@/components/bookmarks/bookmark-card-view';
import { BookmarkListView } from '@/components/bookmarks/bookmark-list-view';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { BookmarksIcon } from '@/components/icons/tools/bookmarks-icon';

type View = 'card' | 'list';
type CardSize = 'small' | 'large';
const DEFAULT_CATEGORIES = ['work', 'personal', 'education', 'entertainment', 'shopping', 'other'];

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [view, setView] = useState<View>('card');
  const [cardSize, setCardSize] = useState<CardSize>('large');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  const [isRenameCategoryOpen, setIsRenameCategoryOpen] = useState(false);
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
  const [renamedCategory, setRenamedCategory] = useState('');
  
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [focusColorPicker, setFocusColorPicker] = useState(false);

  const debouncedSearch = useDebouncedCallback((value) => {
    setSearchQuery(value);
  }, 300);

  useEffect(() => {
    if (user) {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        getDoc(settingsRef).then(docSnap => {
            if (docSnap.exists()) {
                const settings = docSnap.data();
                if (settings.bookmarksView) {
                    setView(settings.bookmarksView);
                }
                 if (settings.bookmarkCardSize) {
                    setCardSize(settings.bookmarkCardSize);
                }
            }
        });
    }
  }, [user]);

  const handleViewChange = (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            setDoc(settingsRef, { bookmarksView: newView }, { merge: true });
        }
    }
  };
  
  const handleCardSizeChange = (newSize: CardSize) => {
      if (newSize) {
          setCardSize(newSize);
          if(user) {
              const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
              setDoc(settingsRef, { bookmarkCardSize: newSize }, { merge: true });
          }
      }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'bookmarks'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookmarksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
        setBookmarks(bookmarksData);
      });

      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().bookmarkSettings) {
              setCustomCategories(docSnap.data().bookmarkSettings.categories || []);
          }
      });
      
      return () => {
          unsubscribe();
          unsubscribeSettings();
      }
    }
  }, [user]);

  const allCategories = useMemo(() => {
    const combined = [...DEFAULT_CATEGORIES, ...customCategories];
    return ['all', ...Array.from(new Set(combined))];
  }, [customCategories]);

  // --- Category Management ---
  const handleAddNewCategory = async () => {
    if (!user || !newCategory.trim()) return;
    const lowerCaseCategory = newCategory.trim().toLowerCase();
    
    if (allCategories.includes(lowerCaseCategory)) {
        toast({ variant: 'destructive', title: 'Category already exists' });
        return;
    }

    const newCategories = [...customCategories, lowerCaseCategory];
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    try {
        await setDoc(settingsRef, { bookmarkSettings: { categories: newCategories } }, { merge: true });
        toast({ title: 'Category Added', description: `"${newCategory}" has been added.`});
        setIsAddCategoryOpen(false);
        setNewCategory('');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error adding category' });
    }
  };

  const handleRenameCategory = async () => {
    if (!user || !categoryToRename || !renamedCategory.trim()) return;
    
    const lowerCaseNewCategory = renamedCategory.trim().toLowerCase();
    if(lowerCaseNewCategory === categoryToRename) {
        setIsRenameCategoryOpen(false);
        return;
    }

    if(allCategories.includes(lowerCaseNewCategory)) {
        toast({ variant: 'destructive', title: 'Category already exists' });
        return;
    }

    const batch = writeBatch(db);
    
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    const newCategories = customCategories.map(c => c === categoryToRename ? lowerCaseNewCategory : c);
    
    batch.set(settingsRef, { bookmarkSettings: { categories: newCategories } }, { merge: true });

    const bookmarksToUpdateQuery = query(collection(db, 'users', user.uid, 'bookmarks'), where('category', '==', categoryToRename));
    const querySnapshot = await getDocs(bookmarksToUpdateQuery);
    querySnapshot.forEach(doc => {
        batch.update(doc.ref, { category: lowerCaseNewCategory });
    });
    
    try {
        await batch.commit();
        toast({ title: "Category Renamed", description: `"${categoryToRename}" is now "${lowerCaseNewCategory}".`});
        if(activeCategory === categoryToRename) {
            setActiveCategory(lowerCaseNewCategory);
        }
        setIsRenameCategoryOpen(false);
        setCategoryToRename(null);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error renaming category.' });
    }
  };
  
  const handleDeleteCategory = async () => {
    if (!user || !categoryToDelete) return;

    const batch = writeBatch(db);
    
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    const newCategories = customCategories.filter(c => c !== categoryToDelete);
    batch.set(settingsRef, { bookmarkSettings: { categories: newCategories } }, { merge: true });
    
    const bookmarksToUpdateQuery = query(collection(db, 'users', user.uid, 'bookmarks'), where('category', '==', categoryToDelete));
    const querySnapshot = await getDocs(bookmarksToUpdateQuery);
    querySnapshot.forEach(doc => {
        batch.update(doc.ref, { category: 'other' });
    });

    try {
        await batch.commit();
        toast({ title: 'Category Deleted', description: `Bookmarks from "${categoryToDelete}" were moved to "other".` });
         if(activeCategory === categoryToDelete) {
            setActiveCategory('other');
        }
        setCategoryToDelete(null);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error deleting category.' });
    }
  };


  // --- Bookmark Management ---
  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) return;
    try {
      await deleteBookmark(user.uid, bookmarkId);
      toast({ title: 'Bookmark Deleted', description: 'The bookmark has been removed.' });
    } catch (e) {
      console.error("Error deleting bookmark: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete bookmark.' });
    }
  };

  const handleEditBookmark = (bookmark: Bookmark, focusColor: boolean = false) => {
    setEditingBookmark(bookmark);
    setFocusColorPicker(focusColor);
    setIsAddDialogOpen(true);
  };
  
  const handleOpenAddDialog = () => {
    setEditingBookmark(null);
    setFocusColorPicker(false);
    setIsAddDialogOpen(true);
  }

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const categoryMatch = activeCategory === 'all' || bookmark.category.toLowerCase() === activeCategory;
      const searchMatch = searchQuery.trim() === '' ||
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return categoryMatch && searchMatch;
    });
  }, [bookmarks, activeCategory, searchQuery]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <BookmarksIcon className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline">Bookmark Manager</h1>
            <p className="text-muted-foreground">Organize and access your favorite websites with ease.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="View toggle">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
            {view === 'card' && (
                <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                    <ToggleGroupItem value="small" aria-label="Small cards"><Minus/></ToggleGroupItem>
                    <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
                </ToggleGroup>
            )}
            <Button onClick={handleOpenAddDialog}>
                <PlusCircle />
                New Bookmark
            </Button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bookmarks by title, URL, or description..."
            className="pl-8"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {allCategories.map(category => {
              const isCustom = !DEFAULT_CATEGORIES.includes(category) && category !== 'all';
              const button = (
                <Button
                  key={category}
                  variant={activeCategory === category ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              );

              if (isCustom) {
                return (
                    <DropdownMenu key={category}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={activeCategory === category ? 'default' : 'outline'}
                                className="capitalize pr-2"
                            >
                                <span onClick={(e) => { e.stopPropagation(); setActiveCategory(category) }} className="px-2 py-1 -ml-2 mr-1">{category}</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => {setCategoryToRename(category); setRenamedCategory(category); setIsRenameCategoryOpen(true);}}>
                               <Edit /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setCategoryToDelete(category)} className="text-destructive focus:text-destructive">
                                <Trash2 /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
              }
              return button;
          })}
           <Button variant="outline" size="sm" onClick={() => setIsAddCategoryOpen(true)}>
                <FolderPlus /> New Category
            </Button>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
          <BookmarksIcon className="h-24 w-24 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Bookmarks Yet</h3>
          <p className="text-muted-foreground">Click "New Bookmark" to add your first one.</p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
          <h3 className="text-xl font-semibold font-headline">No Bookmarks Found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
        </div>
      ) : (
        view === 'card' ? (
            <BookmarkCardView 
                bookmarks={filteredBookmarks}
                onEdit={handleEditBookmark}
                onDelete={handleDeleteBookmark}
                cardSize={cardSize}
            />
        ) : (
            <BookmarkListView 
                bookmarks={filteredBookmarks}
                onEdit={handleEditBookmark}
                onDelete={handleDeleteBookmark}
            />
        )
      )}

      {/* Dialogs */}
      <AddBookmarkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        bookmark={editingBookmark}
        categories={allCategories.filter(c => c !== 'all')}
        focusColorPicker={focusColorPicker}
      />
      
       <AlertDialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Add New Category</AlertDialogTitle>
                    <AlertDialogDescription>Enter a name for your new bookmark category.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="new-category-name" className="sr-only">Category Name</Label>
                    <Input
                        id="new-category-name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g. Design Inspiration"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNewCategory('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAddNewCategory} disabled={!newCategory.trim()}>Add</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isRenameCategoryOpen} onOpenChange={setIsRenameCategoryOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Rename Category</AlertDialogTitle>
                    <AlertDialogDescription>Enter a new name for the category "{categoryToRename}".</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="rename-category-name" className="sr-only">New Name</Label>
                    <Input
                        id="rename-category-name"
                        value={renamedCategory}
                        onChange={(e) => setRenamedCategory(e.target.value)}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRenameCategory} disabled={!renamedCategory.trim()}>Rename</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete the category "{categoryToDelete}". Bookmarks using this category will be moved to "other".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCategory} variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
