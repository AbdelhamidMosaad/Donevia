'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Bookmark, BookmarkCategory } from '@/lib/types';
import { addBookmark, updateBookmark } from '@/lib/bookmarks';

interface AddBookmarkDialogProps {
  bookmark?: Bookmark | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CATEGORIES: BookmarkCategory[] = ['work', 'personal', 'education', 'entertainment', 'shopping', 'other'];

export function AddBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
}: AddBookmarkDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!bookmark;

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>('work');

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setCategory('work');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && bookmark) {
        setTitle(bookmark.title);
        setUrl(bookmark.url);
        setDescription(bookmark.description || '');
        setCategory(bookmark.category);
      } else {
        resetForm();
      }
      setIsSaving(false);
    }
  }, [open, bookmark, isEditMode]);
  
  const formatUrl = (inputUrl: string) => {
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        return 'https://' + inputUrl;
    }
    return inputUrl;
  };

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!title || !url) {
      toast({ variant: 'destructive', title: 'Title and URL are required.' });
      return;
    }

    setIsSaving(true);
    const bookmarkData = {
      title,
      url: formatUrl(url),
      description,
      category,
    };

    try {
      if (isEditMode && bookmark) {
        await updateBookmark(user.uid, bookmark.id, bookmarkData);
        toast({ title: 'Bookmark Updated', description: `"${title}" has been updated.` });
      } else {
        await addBookmark(user.uid, bookmarkData);
        toast({ title: 'Bookmark Added', description: `"${title}" has been added successfully.` });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving bookmark: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save bookmark.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details for this bookmark.' : 'Fill in the information below.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select onValueChange={(v: BookmarkCategory) => setCategory(v)} value={category}>
              <SelectTrigger className="col-span-3 capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter(c => c !== 'all').map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
