
'use client';

import { useState, useEffect, useRef } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { StickyNoteCard } from './sticky-note-card';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface StickyNotesCanvasProps {
  notes: StickyNote[];
  onNoteClick: (note: StickyNote) => void;
}

const NOTE_WIDTH = 250;
const NOTE_HEIGHT = 250;
const GRID_GAP = 16;

export function StickyNotesCanvas({ notes, onNoteClick }: StickyNotesCanvasProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(1);

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !user) {
      return;
    }

    const note = notes.find(n => n.id === draggableId);
    if (!note) return;

    // Convert linear index to grid coordinates
    const toCol = destination.index % cols;
    const toRow = Math.floor(destination.index / cols);

    // Check if destination is occupied
    const targetNote = notes.find(n => n.gridPosition?.col === toCol && n.gridPosition?.row === toRow);
    if (targetNote && targetNote.id !== draggableId) {
        // Simple rejection: return to original position. A swap could also be implemented here.
        return;
    }

    const noteRef = doc(db, 'users', user.uid, 'stickyNotes', draggableId);
    await updateDoc(noteRef, { gridPosition: { col: toCol, row: toRow } });
  };
  
  // Create a sparse grid representation for rendering
  const grid: (StickyNote | null)[][] = [];
  let maxRow = 0;
  notes.forEach(note => {
    const { col = 0, row = 0 } = note.gridPosition || {};
    if (!grid[row]) grid[row] = [];
    grid[row][col] = note;
    if (row > maxRow) maxRow = row;
  });

  // Flatten the grid into a single array for react-beautiful-dnd, preserving order
  const flatNotes: (StickyNote | null)[] = [];
  const numRows = Math.max(maxRow + 1, Math.ceil(notes.length / cols));
  
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < cols; c++) {
      flatNotes.push(grid[r]?.[c] || null);
    }
  }


  return (
    <div ref={canvasRef} className="relative h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="canvas" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${NOTE_WIDTH}px)`,
                gridAutoRows: `${NOTE_HEIGHT}px`,
              }}
            >
              {flatNotes.map((note, index) => (
                note ? (
                  <Draggable key={note.id} draggableId={note.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          gridColumnStart: (note.gridPosition?.col ?? 0) + 1,
                          gridRowStart: (note.gridPosition?.row ?? 0) + 1,
                          transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
                        }}
                      >
                        <StickyNoteCard note={note} onClick={() => onNoteClick(note)} />
                      </div>
                    )}
                  </Draggable>
                ) : (
                    // Render a placeholder for empty grid cells to maintain layout
                    <div key={`placeholder-${index}`} className="pointer-events-none" />
                )
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}