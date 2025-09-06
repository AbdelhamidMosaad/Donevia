
'use client';

import { useState, useEffect, useRef } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Palette, Trash2, Check, CaseSensitive, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface StickyNoteDialogProps {
  note: StickyNote;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const backgroundColors = ['#fff176', '#ff8a65', '#81d4fa', '#aed581', '#ce93d8', '#fdcbf1', '#fdfd96'];
const textColors = ['#000000', '#FFFFFF', '#ef4444', '#3b82f6', '#16a34a', '#7c3aed'];

export function StickyNoteDialog({ note, isOpen, onOpenChange }: StickyNoteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [text, setText] = useState(note.text);
  const [bgColor, setBgColor] = useState(note.color);
  const [textColor, setTextColor] = useState(note.textColor);
  const [priority, setPriority] = useState<StickyNote['priority']>(note.priority || 'Medium');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const noteRef = user ? doc(db, 'users', user.uid, 'stickyNotes', note.id) : null;

  // Reset state when a new note is passed in
  useEffect(() => {
    setTitle(note.title);
    setText(note.text);
    setBgColor(note.color);
    setTextColor(note.textColor);
    setPriority(note.priority || 'Medium');
  }, [note]);


  const handleDelete = async () => {
    if (!noteRef) return;
    try {
      await deleteDoc(noteRef);
      toast({ title: '✓ Note Deleted' });
      onOpenChange(false); // Close the dialog
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting note' });
    }
  };

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

  // Debounce updates to Firestore for text and title
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(async () => {
      if (!noteRef) return;
      if (title !== note.title || text !== note.text) {
        try {
          await updateDoc(noteRef, {
            title,
            text,
            updatedAt: serverTimestamp(),
          });
        } catch (e) {
          console.error('Error updating note:', e);
        }
      }
    }, 500); // 500ms debounce delay

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [title, text, note.title, note.text, noteRef]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const wordCount = newText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount <= 1000) {
      setText(newText);
    } else {
        toast({
            variant: 'destructive',
            title: 'Word limit reached',
            description: 'Sticky notes are limited to 1000 words.',
        })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 border-none shadow-2xl max-w-2xl w-full h-[60vh] flex flex-col" 
        style={{ backgroundColor: bgColor, color: textColor }}
        onInteractOutside={(e) => e.preventDefault()}
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
        <div className="flex-1 p-4 overflow-y-auto">
            <textarea
                value={text}
                onChange={handleTextChange}
                className="h-full w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-base"
                placeholder="Type your note here..."
                style={{ color: 'inherit' }}
            />
        </div>
        <DialogFooter className="p-2 border-t flex justify-end items-center gap-1" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
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
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/10">
                <Palette className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex gap-1">
                {backgroundColors.map((c) => (
                    <button
                    key={c}
                    onClick={() => handleColorChange(c, 'background')}
                    className={cn(
                        'h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center'
                    )}
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
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/10">
                <CaseSensitive className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex gap-1">
                {textColors.map((c) => (
                    <button
                    key={c}
                    onClick={() => handleColorChange(c, 'text')}
                    className={cn(
                        'h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center'
                    )}
                    style={{ backgroundColor: c }}
                    >
                    {textColor === c && <Check className="h-4 w-4" style={{ color: c === '#FFFFFF' ? '#000000' : '#FFFFFF' }} />}
                    </button>
                ))}
                </div>
            </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 hover:bg-destructive/20 text-destructive/70 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
