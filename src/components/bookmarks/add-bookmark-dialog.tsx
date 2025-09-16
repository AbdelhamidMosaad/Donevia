
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
import { Check, Loader2 } from 'lucide-react';
import { deleteField } from 'firebase/firestore';

interface AddBookmarkDialogProps {
  bookmark?: Bookmark | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  categories: string[];
  focusColorPicker?: boolean;
}

const lightColorPalette = ['#FFFFFF', '#FEE2E2', '#D1C4E9', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#FFE0B2', '#F5F5F5'];
const darkColorPalette = ['#1F2937', '#7F1D1D', '#4C1D95', '#1E3A8A', '#064E3B', '#713F12', '#7C2D12', '#374151'];


export function AddBookmarkDialog({
  bookmark,
  onOpenChange,
  open,
  categories,
  focusColorPicker,
}: AddBookmarkDialogProps) {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const isEditMode = !!bookmark;
  const isDarkMode = settings.theme?.includes('dark') || settings.theme?.includes('theme-');

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>('work');
  const [color, setColor] = useState<string | undefined>();
  
  const colorPalette = isDarkMode ? darkColorPalette : lightColorPalette;

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setColor(isDarkMode ? darkColorPalette[0] : lightColorPalette[0]);
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
      
      if (focusColorPicker && colorPickerRef.current) {
        setTimeout(() => colorPickerRef.current?.focus(), 100);
      }
    } else {
        resetForm();
    }
  }, [open, bookmark, categories, focusColorPicker, isEditMode]);
  
  const formatUrl = (inputUrl: string) => {
    if (!inputUrl) return '';
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        return 'https://' + inputUrl;
    }
    return inputUrl;
  };

 const handleSave = async () => {
    if (!user) return;
    
    if (!title || !url) {
        toast({ variant: 'destructive', title: 'Title and URL are required.' });
        return;
    }

    setIsSaving(true);
    
    const bookmarkData: Partial<Bookmark> = {
      title,
      url: formatUrl(url),
      description,
      category,
      color: color === lightColorPalette[0] || color === darkColorPalette[0] ? undefined : color,
    };
    
    try {
        if(isEditMode && bookmark) {
            const payload: { [key: string]: any } = {};
            Object.keys(bookmarkData).forEach((key) => {
                const value = bookmarkData[key as keyof typeof bookmarkData];
                if (value !== undefined) {
                    payload[key] = value;
                } else {
                    payload[key] = deleteField(); // Safely remove field if undefined
                }
            });
            await updateBookmark(user.uid, bookmark.id, payload);
            toast({ title: 'Bookmark updated successfully!' });
        } else {
            await addBookmark(user.uid, bookmarkData as any);
            toast({ title: 'Bookmark created successfully!' });
        }
      onOpenChange(false);
    } catch (e) {
      console.error("Error saving bookmark:", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save bookmark.' });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div>
            <DialogTitle>{isEditMode ? 'Edit Bookmark' : 'Add New Bookmark'}</DialogTitle>
            <DialogDescription>
                {isEditMode ? 'Update the details for your bookmark.' : 'Enter the details for your new bookmark.'}
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">URL</Label>
            <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} className="col-span-3" placeholder="https://example.com" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
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
                        className={cn("h-8 w-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110", color === c || (!color && c === colorPalette[0]) ? 'ring-2 ring-offset-2 ring-primary' : '')}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    >
                       {(color === c || (!color && c === colorPalette[0])) && <Check className="h-4 w-4" style={{color: isDarkMode ? 'white' : 'black'}} />}
                    </button>
                ))}
             </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            {isEditMode ? 'Save Changes' : 'Create Bookmark'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
