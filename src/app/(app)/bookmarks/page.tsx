
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bookmark as BookmarkIcon, Search, FolderPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Bookmark } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteBookmark } from '@/lib/bookmarks';
import { AddBookmarkDialog } from '@/components/bookmarks/add-bookmark-dialog';
import { BookmarkCard } from '@/components/bookmarks/bookmark-card';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';
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
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';

const DEFAULT_CATEGORIES = ['work', 'personal', 'education', 'entertainment', 'shopping', 'other'];

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const debouncedSearch = useDebouncedCallback((value) => {
    setSearchQuery(value);
  }, 300);

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

      const settingsRef = doc(db, 'users', user.uid, 'profile', 'bookmarkSettings');
      const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
              setCustomCategories(docSnap.data().categories || []);
          }
      });
      
      return () => {
          unsubscribe();
          unsubscribeSettings();
      }
    }
  }, [user]);

  const handleAddNewCategory = async () => {
    if (!user || !newCategory.trim()) return;
    const lowerCaseCategory = newCategory.trim().toLowerCase();
    
    if (allCategories.includes(lowerCaseCategory)) {
        toast({ variant: 'destructive', title: 'Category already exists' });
        return;
    }

    const newCategories = [...customCategories, lowerCaseCategory];
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'bookmarkSettings');
    try {
        await setDoc(settingsRef, { categories: newCategories }, { merge: true });
        toast({ title: 'Category Added', description: `"${newCategory}" has been added.`});
        setNewCategory('');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error adding category' });
    }
  }

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

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setIsAddDialogOpen(true);
  };
  
  const handleOpenAddDialog = () => {
    setEditingBookmark(null);
    setIsAddDialogOpen(true);
  }

  const allCategories = useMemo(() => {
    const combined = [...DEFAULT_CATEGORIES, ...customCategories];
    return ['all', ...Array.from(new Set(combined))];
  }, [customCategories]);

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
        <div>
          <h1 className="text-3xl font-bold font-headline">Bookmark Manager</h1>
          <p className="text-muted-foreground">Organize and access your favorite websites with ease.</p>
        </div>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Bookmark
        </Button>
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
          {allCategories.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <FolderPlus className="mr-2 h-4 w-4" /> New Category
                    </Button>
                </AlertDialogTrigger>
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
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
          <BookmarkIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Bookmarks Yet</h3>
          <p className="text-muted-foreground">Click "New Bookmark" to add your first one.</p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
          <h3 className="text-xl font-semibold font-headline">No Bookmarks Found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={() => handleEditBookmark(bookmark)}
              onDelete={() => handleDeleteBookmark(bookmark.id)}
            />
          ))}
        </div>
      )}

      <AddBookmarkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        bookmark={editingBookmark}
        categories={allCategories.filter(c => c !== 'all')}
      />
    </div>
  );
}
