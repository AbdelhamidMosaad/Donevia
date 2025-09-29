
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { StickyNoteCard } from './sticky-note-card';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface StickyNotesCanvasProps {
  notes: StickyNote[];
  onNoteClick: (note: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

export function StickyNotesCanvas({ notes, onNoteClick, onDeleteNote }: StickyNotesCanvasProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Derive a sorted list of notes to ensure stable order for dnd
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const posA = a.gridPosition || { row: 0, col: 0 };
      const posB = b.gridPosition || { row: 0, col: 0 };
      const indexA = posA.row * 1000 + posA.col; // Assuming max 1000 cols
      const indexB = posB.row * 1000 + posB.col;
      return indexA - indexB;
    });
  }, [notes]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !user) {
      return;
    }
     if (destination.index === source.index) {
      return;
    }

    const reorderedNotes = Array.from(sortedNotes);
    const [movedNote] = reorderedNotes.splice(source.index, 1);
    reorderedNotes.splice(destination.index, 0, movedNote);

    for (let i = 0; i < reorderedNotes.length; i++) {
        const note = reorderedNotes[i];
        const noteRef = doc(db, 'users', user.uid, 'stickyNotes', note.id);
        // The index is now the order. We don't need row/col for masonry.
        await updateDoc(noteRef, { order: i });
    }
  };
  
  return (
    <div ref={canvasRef} className="relative h-full p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="canvas">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="gap-4"
              style={{
                columnCount: 3,
                columnGap: '1rem',
              }}
            >
              {sortedNotes.map((note, index) => (
                <Draggable key={note.id} draggableId={note.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={cn(
                        'transition-shadow mb-4 break-inside-avoid',
                        snapshot.isDragging && 'shadow-2xl'
                      )}
                      style={{
                        ...provided.draggableProps.style,
                      }}
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
    </div>
  );
}
