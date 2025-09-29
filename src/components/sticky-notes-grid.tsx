
'use client';

import type { StickyNote } from '@/lib/types';
import { StickyNoteCard } from './sticky-note-card';

interface StickyNotesGridProps {
  notes: StickyNote[];
  onNoteClick: (note: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export function StickyNotesGrid({ notes, onNoteClick, onDeleteNote }: StickyNotesGridProps) {
  const sortedNotes = [...notes].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

  return (
    <div className="w-full">
        <div 
            className="gap-4 w-full"
            style={{
                columnCount: 'auto',
                columnWidth: '250px',
            }}
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
