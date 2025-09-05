
'use client';

import type { StickyNote } from '@/lib/types';
import { Paperclip } from 'lucide-react';

interface StickyNoteCardProps {
  note: StickyNote;
  onClick: () => void;
}

export function StickyNoteCard({ note, onClick }: StickyNoteCardProps) {
  
  return (
    <div
      className="flex flex-col rounded-lg shadow-md p-4 h-64 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-xl"
      style={{ 
        backgroundColor: note.color,
        color: note.textColor,
       }}
      onClick={onClick}
    >
      <h3
        className="font-bold text-lg mb-2 truncate"
      >
        {note.title || "Untitled Note"}
      </h3>
      <p
        className="flex-1 text-sm w-full overflow-hidden whitespace-pre-wrap break-words"
      >
        {note.text}
      </p>
      {note.text && (
         <div className="flex justify-end items-center mt-2 opacity-60">
            <Paperclip className="h-4 w-4" />
         </div>
      )}
    </div>
  );
}
