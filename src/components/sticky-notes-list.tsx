'use client';
import type { StickyNote } from '@/lib/types';
import { StickyNoteCard } from './sticky-note-card';
import { cn } from '@/lib/utils';

interface StickyNotesListProps {
  notes: StickyNote[];
  onNoteClick: (note: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export function StickyNotesList({ notes, onNoteClick, onDeleteNote }: StickyNotesListProps) {
  const sortedNotes = [...notes].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

  return (
    <div className="w-full">
        <div 
            className="gap-4 w-full columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5"
        >
          {sortedNotes.map((note) => (
             <div key={note.id} className="mb-4 break-inside-avoid">
                 <StickyNoteCard
                    note={note}
                    onClick={() => onNoteClick(note)}
                    onDelete={() => onDeleteNote(note.id)}
                    className="h-auto"
                />
             </div>
          ))}
        </div>
    </div>
  );
}
