
'use client';
import type { MeetingNote } from '@/lib/types';
import { MeetingNoteCard } from './meeting-note-card';
import { MeetingNotesIcon } from '../icons/tools/meeting-notes-icon';

interface MeetingNoteCardViewProps {
  notes: MeetingNote[];
  onDelete: (noteId: string) => void;
}

export function MeetingNoteCardView({ notes, onDelete }: MeetingNoteCardViewProps) {
  if (notes.length === 0) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
            <MeetingNotesIcon className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Meeting Notes Yet</h3>
            <p className="text-muted-foreground">
                Click "New Meeting Note" to create your first one.
            </p>
        </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {notes.map((note) => (
        <MeetingNoteCard
          key={note.id}
          note={note}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </div>
  );
}
