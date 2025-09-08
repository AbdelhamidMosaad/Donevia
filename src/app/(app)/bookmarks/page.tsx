'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bookmark as BookmarkIcon, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Bookmark } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteBookmark } from '@/lib/bookmarks';
import { AddBookmarkDialog } from '@/components/bookmarks/add-bookmark-dialog';
import { BookmarkCard } from '@/components/bookmarks/bookmark-card';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';

const CATEGORIES = ['all', 'work', 'personal', 'education', 'entertainment', 'shopping', 'other'];

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

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
      return () => unsubscribe();
    }
  }, [user]);

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

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const categoryMatch = activeCategory === 'all' || bookmark.category === activeCategory;
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
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
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
      />
    </div>
  );
}
