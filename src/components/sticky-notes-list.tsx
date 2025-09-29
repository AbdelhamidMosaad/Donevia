
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
    <div className="w-full">
        <div 
            className="gap-4 w-full"
            style={{
                columnCount: 4,
                columnGap: '1rem',
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
