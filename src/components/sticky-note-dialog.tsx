

'use client';

import { useState, useEffect, useRef } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Palette, Check, CaseSensitive, Flag, MessageSquareQuote, ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GrammarCoach } from './english-coach/grammar-coach';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';

interface StickyNoteDialogProps {
  note: StickyNote;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onNoteDeleted: () => void;
}

const backgroundColors = ['#fff176', '#ff8a65', '#81d4fa', '#aed581', '#ce93d8', '#fdcbf1', '#fdfd96'];
const textColors = ['#000000', '#FFFFFF', '#ef4444', '#3b82f6', '#16a34a', '#7c3aed'];

export function StickyNoteDialog({ note, isOpen, onOpenChange, onNoteDeleted }: StickyNoteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [text, setText] = useState(note.text);
  const [bgColor, setBgColor] = useState(note.color);
  const [textColor, setTextColor] = useState(note.textColor);
  const [priority, setPriority] = useState<StickyNote['priority']>(note.priority || 'Medium');
  const [imageUrl, setImageUrl] = useState(note.imageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const noteRef = user ? doc(db, 'users', user.uid, 'stickyNotes', note.id) : null;

  useEffect(() => {
    setTitle(note.title);
    setText(note.text);
    setBgColor(note.color);
    setTextColor(note.textColor);
    setPriority(note.priority || 'Medium');
    setImageUrl(note.imageUrl);
  }, [note]);

  const handleColorChange = async (newColor: string, type: 'background' | 'text') => {
    if (!noteRef) return;
    const fieldToUpdate = type === 'background' ? 'color' : 'textColor';
    const stateUpdateFn = type === 'background' ? setBgColor : setTextColor;
    stateUpdateFn(newColor);
    try {
      await updateDoc(noteRef, { [fieldToUpdate]: newColor, updatedAt: serverTimestamp() });
    } catch (e) {
      toast({ variant: 'destructive', title: `Error updating ${type} color` });
    }
  };
  
  const handlePriorityChange = async (newPriority: StickyNote['priority']) => {
    if (!noteRef) return;
    setPriority(newPriority);
     try {
      await updateDoc(noteRef, { priority: newPriority, updatedAt: serverTimestamp() });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error updating priority' });
    }
  };

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(async () => {
      if (!noteRef) return;
      if (title !== note.title || text !== note.text) {
        try {
          await updateDoc(noteRef, { title, text, updatedAt: serverTimestamp() });
        } catch (e) { console.error('Error updating note:', e); }
      }
    }, 500);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [title, text, note.title, note.text, noteRef]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const wordCount = newText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount <= 1000) {
      setText(newText);
    } else {
        toast({ variant: 'destructive', title: 'Word limit reached' });
    }
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user || !noteRef) return;
    const file = event.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image under 5MB.' });
      return;
    }
    setIsUploading(true);

    const idToken = await getAuth().currentUser?.getIdToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idToken', idToken!);
    
    try {
        const res = await fetch('/api/notes/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json();
        
        await updateDoc(noteRef, { imageUrl: url, updatedAt: serverTimestamp() });
        setImageUrl(url);
        toast({ title: 'Image uploaded successfully!' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Upload failed', description: (e as Error).message });
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleRemoveImage = async () => {
    if (!noteRef) return;
    setImageUrl(undefined);
    try {
        await updateDoc(noteRef, { imageUrl: deleteField(), updatedAt: serverTimestamp() });
        toast({ title: 'Image removed' });
    } catch(e) {
         toast({ variant: 'destructive', title: 'Failed to remove image.' });
    }
  };

  const handleGrammarCheckClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 border-none shadow-2xl max-w-2xl w-full h-auto max-h-[80vh] flex flex-col" 
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <DialogHeader className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <DialogTitle>
             <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-lg w-full"
                placeholder="Note Title"
                style={{ color: 'inherit' }}
            />
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {imageUrl && (
              <div className="relative group">
                <Image src={imageUrl} alt={title || 'Note image'} width={500} height={300} className="rounded-md object-cover w-full" />
                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemoveImage}><X/></Button>
              </div>
            )}
            <textarea
                value={text}
                onChange={handleTextChange}
                className="h-full w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-base"
                placeholder="Type your note here..."
                style={{ color: 'inherit' }}
                rows={10}
            />
        </div>
        <DialogFooter className="p-2 border-t flex justify-between items-center" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
             <div onClick={handleGrammarCheckClick}>
                <GrammarCoach text={text} onCorrection={setText} />
             </div>
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10" onClick={() => fileInputRef.current?.click()}>
                    {isUploading ? <Loader2 className="animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                
                <Select onValueChange={handlePriorityChange} value={priority}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-black/10 hover:bg-black/10">
                    <Flag className="h-3 w-3 mr-1"/>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
                </Select>
                <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10">
                    <Palette className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="flex gap-1">
                    {backgroundColors.map((c) => (
                        <button
                        key={c}
                        onClick={() => handleColorChange(c, 'background')}
                        className={cn('h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center')}
                        style={{ backgroundColor: c }}
                        >
                        {bgColor === c && <Check className="h-4 w-4 text-black" />}
                        </button>
                    ))}
                    </div>
                </PopoverContent>
                </Popover>
                <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10">
                    <CaseSensitive className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="flex gap-1">
                    {textColors.map((c) => (
                        <button
                        key={c}
                        onClick={() => handleColorChange(c, 'text')}
                        className={cn('h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center')}
                        style={{ backgroundColor: c }}
                        >
                        {textColor === c && <Check className="h-4 w-4" style={{ color: c === '#FFFFFF' ? '#000000' : '#FFFFFF' }} />}
                        </button>
                    ))}
                    </div>
                </PopoverContent>
                </Popover>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
