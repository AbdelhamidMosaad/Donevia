
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

interface AddBookmarkDialogProps {
  bookmark?: Bookmark | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  categories: string[];
  focusColorPicker?: boolean;
}

const colorPalette = ['#FFFFFF', '#FFCDD2', '#D1C4E9', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#FFE0B2', '#F5F5F5'];

export function AddBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
  categories,
  focusColorPicker,
}: AddBookmarkDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const isEditMode = !!bookmark;

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>('work');
  const [color, setColor] = useState<string | undefined>();

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setColor(undefined);
    setCategory(categories[0] as BookmarkCategory || 'other');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && bookmark) {
        setTitle(bookmark.title);
        setUrl(bookmark.url);
        setDescription(bookmark.description || '');
        setCategory(bookmark.category);
        setColor(bookmark.color);
      } else {
        resetForm();
      }
      setIsSaving(false);
      isInitialMount.current = true;
      
      if (focusColorPicker && colorPickerRef.current) {
        setTimeout(() => colorPickerRef.current?.focus(), 100);
      }
    }
  }, [open, bookmark, isEditMode, categories, focusColorPicker]);
  
  const formatUrl = (inputUrl: string) => {
    if (!inputUrl) return '';
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        return 'https://' + inputUrl;
    }
    return inputUrl;
  };
  
  const debouncedSave = useDebouncedCallback(async (bookmarkData) => {
    if (!user || !isEditMode || !bookmark) return;

    try {
        await updateBookmark(user.uid, bookmark.id, bookmarkData);
        toast({ title: '✓ Saved', description: 'Bookmark details have been updated.' });
    } catch (e) {
        console.error("Error auto-saving bookmark:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save bookmark.' });
    }
  }, 1500);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    
    if (isEditMode && open) {
        const bookmarkData = {
            title,
            url: formatUrl(url),
            description,
            category,
            color: color === '#FFFFFF' ? undefined : color,
        };
        debouncedSave(bookmarkData);
    }
  }, [title, url, description, category, color, isEditMode, open, debouncedSave]);

  // Manual save for new bookmarks
  const handleSaveNew = async () => {
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
      color: color === '#FFFFFF' ? undefined : color,
    };

    try {
      await addBookmark(user.uid, bookmarkData);
      toast({ title: 'Bookmark Added', description: `"${title}" has been added successfully.` });
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
          <DialogDescription>{isEditMode ? 'Changes are saved automatically.' : 'Fill in the information below.'}</DialogDescription>
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
                {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div ref={colorPickerRef} tabIndex={-1} className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="color" className="text-right">Color</Label>
             <div className="col-span-3 flex flex-wrap gap-2">
                {colorPalette.map(c => (
                    <button
                        key={c}
                        type="button"
                        className={cn("h-8 w-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110", color === c || (!color && c === '#FFFFFF') ? 'ring-2 ring-offset-2 ring-primary' : '')}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    >
                       {(color === c || (!color && c === '#FFFFFF')) && <Check className="h-4 w-4" style={{color: c === '#FFFFFF' ? 'black' : 'white'}} />}
                    </button>
                ))}
             </div>
          </div>
        </div>
        {!isEditMode && (
            <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
            <Button onClick={handleSaveNew} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
            </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
