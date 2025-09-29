
'use client';
import type { StickyNote } from '@/lib/types';
import { StickyNoteCard } from './sticky-note-card';

interface StickyNotesListProps {
  notes: StickyNote[];
  onNoteClick: (note: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export function StickyNotesList({ notes, onNoteClick, onDeleteNote }: StickyNotesListProps) {
  const sortedNotes = [...notes].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4 p-2">
      {sortedNotes.map((note) => (
        <StickyNoteCard
          key={note.id}
          note={note}
          onClick={() => onNoteClick(note)}
          onDelete={() => onDeleteNote(note.id)}
          className="h-auto"
        />
      ))}
    </div>
  );
}
