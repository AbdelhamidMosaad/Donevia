
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

const NOTE_WIDTH = 250;
const GRID_GAP = 16;

export function StickyNotesCanvas({ notes, onNoteClick, onDeleteNote }: StickyNotesCanvasProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(1);

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


  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvasWidth = canvasRef.current.offsetWidth;
        const newCols = Math.max(1, Math.floor((canvasWidth + GRID_GAP) / (NOTE_WIDTH + GRID_GAP)));
        setCols(newCols);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current) {
        resizeObserver.observe(canvasRef.current);
    }
    
    return () => {
        window.removeEventListener('resize', handleResize);
        if (canvasRef.current) {
            resizeObserver.unobserve(canvasRef.current);
        }
    }
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !user) {
      return;
    }
     if (destination.index === source.index) {
      return;
    }

    // Create a mutable copy of the notes for manipulation
    const newNotesOrder = Array.from(sortedNotes);
    const [movedNote] = newNotesOrder.splice(source.index, 1);
    newNotesOrder.splice(destination.index, 0, movedNote);

    // Update grid positions based on the new flat array order
    for (let i = 0; i < newNotesOrder.length; i++) {
        const note = newNotesOrder[i];
        const newPos = {
            row: Math.floor(i / cols),
            col: i % cols
        };

        if (note.gridPosition?.row !== newPos.row || note.gridPosition?.col !== newPos.col) {
            const noteRef = doc(db, 'users', user.uid, 'stickyNotes', note.id);
            await updateDoc(noteRef, { gridPosition: newPos });
        }
    }
  };
  
  return (
    <div ref={canvasRef} className="relative h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="canvas" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid gap-4 p-4 items-start"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
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
                        'transition-shadow',
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
