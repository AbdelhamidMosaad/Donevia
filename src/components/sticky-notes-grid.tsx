
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
      {sortedNotes.map((note) => (
        <div key={note.id}>
          <StickyNoteCard
            note={note}
            onClick={() => onNoteClick(note)}
            onDelete={() => onDeleteNote(note.id)}
            className="h-auto"
          />
        </div>
      ))}
    </div>
  );
}
