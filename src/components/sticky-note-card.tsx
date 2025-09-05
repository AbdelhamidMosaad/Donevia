
'use client';

import { useState, useEffect, useRef } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Palette, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyNoteCardProps {
  note: StickyNote;
}

const colors = ['#fff176', '#ff8a65', '#81d4fa', '#aed581', '#ce93d8', '#fdfd96'];

export function StickyNoteCard({ note }: StickyNoteCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [text, setText] = useState(note.text);
  const [color, setColor] = useState(note.color);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const noteRef = user ? doc(db, 'users', user.uid, 'stickyNotes', note.id) : null;

  const handleDelete = async () => {
    if (!noteRef) return;
    try {
      await deleteDoc(noteRef);
      toast({ title: '✓ Note Deleted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting note' });
    }
  };

  const handleColorChange = async (newColor: string) => {
    if (!noteRef) return;
    setColor(newColor);
    try {
      await updateDoc(noteRef, { color: newColor, updatedAt: serverTimestamp() });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error updating color' });
    }
  };

  // Debounce updates to Firestore
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
          // Optional: toast error
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
    // Limit to ~1000 words
    const newText = e.target.value;
    const wordCount = newText.trim().split(/\s+/).length;
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
    <div
      className="flex flex-col rounded-lg shadow-md p-4 h-64 transition-all duration-200"
      style={{ backgroundColor: color }}
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-lg mb-2"
        placeholder="Note Title"
      />
      <textarea
        value={text}
        onChange={handleTextChange}
        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-sm w-full"
        placeholder="Type your note here..."
      />
      <div className="flex justify-end items-center mt-2 gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={cn(
                    'h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center'
                  )}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-4 w-4 text-black" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-destructive/70 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
