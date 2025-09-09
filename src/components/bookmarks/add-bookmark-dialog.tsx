
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Check, Loader2 } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

interface AddBookmarkDialogProps {
  bookmark?: Bookmark | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  categories: string[];
  focusColorPicker?: boolean;
}

const colorPalette = ['#FFFFFF', '#FFCDD2', '#D1C4E9', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#FFE0B2', '#F5F5F5'];

export function AddBookmarkDialog({
  bookmark,
  onOpenChange,
  open,
  categories,
  focusColorPicker,
}: AddBookmarkDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentBookmark, setCurrentBookmark] = useState(bookmark);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const isEditMode = !!currentBookmark;

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
    setCurrentBookmark(null);
  };

  useEffect(() => {
    if (open) {
      setCurrentBookmark(bookmark);
      if (bookmark) {
        setTitle(bookmark.title);
        setUrl(bookmark.url);
        setDescription(bookmark.description || '');
        setCategory(bookmark.category);
        setColor(bookmark.color);
      } else {
        setTitle('');
        setUrl('');
        setDescription('');
        setColor(undefined);
        setCategory(categories[0] as BookmarkCategory || 'other');
      }
      setSaveStatus('idle');
      isInitialMount.current = true;
      
      if (focusColorPicker && colorPickerRef.current) {
        setTimeout(() => colorPickerRef.current?.focus(), 100);
      }
    } else {
        // Reset form when dialog is closed
        resetForm();
    }
  }, [open, bookmark, categories, focusColorPicker]);
  
  const formatUrl = (inputUrl: string) => {
    if (!inputUrl) return '';
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        return 'https://' + inputUrl;
    }
    return inputUrl;
  };

  const createAndSetBookmark = async (newUrl: string) => {
    if (!user || isEditMode) return;
    
    setSaveStatus('saving');
    const bookmarkData = {
      title: 'New Bookmark',
      url: formatUrl(newUrl),
      description: '',
      category: categories[0] as BookmarkCategory || 'other',
    };
    
    try {
      const newDocRef = await addBookmark(user.uid, bookmarkData);
      const newBookmark: Bookmark = { ...bookmarkData, id: newDocRef.id, createdAt: new Date() as any };
      setCurrentBookmark(newBookmark);
      setSaveStatus('saved');
      toast({ title: 'Bookmark created!', description: 'You can now edit the details.'});
    } catch (e) {
      console.error("Error creating bookmark:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create bookmark.' });
      setSaveStatus('idle');
    }
  };
  
  const debouncedSave = useDebouncedCallback(async (dataToSave) => {
    if (!user || !isEditMode || !currentBookmark) return;
    
    setSaveStatus('saving');
    try {
        await updateBookmark(user.uid, currentBookmark.id, dataToSave);
        setSaveStatus('saved');
    } catch (e) {
        console.error("Error auto-saving bookmark:", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save bookmark.' });
        setSaveStatus('idle');
    }
  }, 1000);

  useEffect(() => {
    if (isInitialMount.current && open) {
        isInitialMount.current = false;
        return;
    }
    
    if (open) {
       if (!isEditMode) {
            // Logic for creating a new bookmark automatically
            const formattedUrl = formatUrl(url);
            if (formattedUrl && url.includes('.')) { // Simple validation for a URL
                createAndSetBookmark(url);
            }
       } else {
            // Logic for auto-saving an existing bookmark
            const bookmarkData = {
                title,
                url: formatUrl(url),
                description,
                category,
                color: color === '#FFFFFF' ? undefined : color,
            };
            debouncedSave(bookmarkData);
       }
    }
  }, [title, url, description, category, color, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex flex-row items-center justify-between pr-10">
          <div>
            <DialogTitle>{isEditMode ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
            <DialogDescription>
                {isEditMode ? 'Changes are saved automatically.' : 'Start by entering a URL below.'}
            </DialogDescription>
          </div>
           {saveStatus === 'saving' && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</div>}
           {saveStatus === 'saved' && <div className="flex items-center gap-2 text-sm text-green-600"><Check className="h-4 w-4" /> Saved</div>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} className="col-span-3" placeholder="https://example.com" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" disabled={!isEditMode} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" disabled={!isEditMode} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select onValueChange={(v: BookmarkCategory) => setCategory(v)} value={category} disabled={!isEditMode}>
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
                        className={cn("h-8 w-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110", color === c || (!color && c === '#FFFFFF') ? 'ring-2 ring-offset-2 ring-primary' : '', !isEditMode && 'cursor-not-allowed opacity-50')}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                        disabled={!isEditMode}
                    >
                       {(color === c || (!color && c === '#FFFFFF')) && <Check className="h-4 w-4" style={{color: c === '#FFFFFF' ? 'black' : 'white'}} />}
                    </button>
                ))}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
