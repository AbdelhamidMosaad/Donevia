'use client';

import { useState, useEffect, useMemo } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
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
    const { source, destination } = result;

    // If dropped outside of any droppable area, do nothing.
    // The library will automatically handle reverting the item to its original position.
    if (!destination) {
      return;
    }
    
    if (!user) return;
    if (destination.index === source.index && destination.droppableId === source.droppableId) return;

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

  // Create columns
  const columns = useMemo(() => {
    const cols: StickyNote[][] = [[], [], []];
    orderedNotes.forEach((note, index) => {
      cols[index % 3].push(note);
    });
    return cols;
  }, [orderedNotes]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 p-4">
        {columns.map((columnNotes, colIndex) => (
          <Droppable key={colIndex} droppableId={`col-${colIndex}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex flex-col gap-0 min-h-[100px]",
                  snapshot.isDraggingOver && 'bg-muted/50 rounded-lg'
                )}
              >
                {columnNotes.map((note) => {
                   const index = orderedNotes.findIndex(n => n.id === note.id);
                   return (
                  <Draggable key={note.id} draggableId={note.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(snapshot.isDragging && 'shadow-2xl', 'p-2')} // Added padding around each item
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
                )})}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
