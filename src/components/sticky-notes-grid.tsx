
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { StickyNoteCard } from './sticky-note-card';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StickyNotesGridProps {
  notes: StickyNote[];
  onNoteClick: (note: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export function StickyNotesGrid({ notes, onNoteClick, onDeleteNote }: StickyNotesGridProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orderedNotes, setOrderedNotes] = useState<StickyNote[]>([]);

  useEffect(() => {
    // Sort notes initially by their saved order, falling back to creation date
    const sorted = [...notes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setOrderedNotes(sorted);
  }, [notes]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || !user) return;
    if (destination.index === source.index) return;

    const items = Array.from(orderedNotes);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);
    
    setOrderedNotes(items); // Optimistic UI update

    const batch = writeBatch(db);
    items.forEach((note, index) => {
      const noteRef = doc(db, 'users', user.uid, 'stickyNotes', note.id);
      batch.update(noteRef, { order: index });
    });

    try {
      await batch.commit();
      toast({ title: 'Note order saved.' });
    } catch (e) {
      console.error("Error updating note order:", e);
      setOrderedNotes(notes); // Revert on failure
      toast({ variant: 'destructive', title: 'Failed to reorder notes.' });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="notes-grid">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="p-4"
            style={{
              columnCount: 'auto',
              columnWidth: '250px',
              columnGap: '1rem',
            }}
          >
            {orderedNotes.map((note, index) => (
              <Draggable key={note.id} draggableId={note.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "mb-4 break-inside-avoid",
                      snapshot.isDragging && 'shadow-2xl'
                    )}
                    style={{ ...provided.draggableProps.style }}
                  >
                    <StickyNoteCard
                      note={note}
                      onClick={() => onNoteClick(note)}
                      onDelete={() => onDeleteNote(note.id)}
                      className="h-auto"
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
