'use client';
import type { StickyNote } from '@/lib/types';
import { StickyNoteCard } from './sticky-note-card';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';

interface StickyNotesBoardProps {
  notes: StickyNote[];
  onNoteClick: (note: StickyNote) => void;
  onDeleteNote: (noteId: string) => void;
}

const priorities: StickyNote['priority'][] = ['High', 'Medium', 'Low'];

const priorityMap: Record<string, StickyNote['priority']> = {
    'high-priority': 'High',
    'medium-priority': 'Medium',
    'low-priority': 'Low',
};

export function StickyNotesBoard({ notes, onNoteClick, onDeleteNote }: StickyNotesBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
    }

    const note = notes.find(n => n.id === draggableId);
    const newPriority = priorityMap[destination.droppableId];
    
    if (note && newPriority && user) {
        const noteRef = doc(db, 'users', user.uid, 'stickyNotes', draggableId);
        try {
            await updateDoc(noteRef, { priority: newPriority });
             toast({
                title: 'Note Priority Updated',
                description: `Note "${note.title}" moved to ${newPriority}.`,
            });
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update note priority.',
            });
        }
    }
  };

  const notesByPriority = useMemo(() => {
    const initial: Record<string, StickyNote[]> = { High: [], Medium: [], Low: [] };
    return notes.reduce((acc, note) => {
        const priority = note.priority || 'Medium';
        if (!acc[priority]) {
            acc[priority] = [];
        }
        acc[priority].push(note);
        return acc;
    }, initial);
  }, [notes]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start p-2">
        {priorities.map((priority) => (
            <div key={priority} className="flex flex-col">
                <div className="p-2">
                    <h2 className="font-semibold font-headline text-lg">{priority} Priority</h2>
                </div>
                 <Droppable droppableId={`${priority.toLowerCase()}-priority`}>
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex flex-col gap-4 bg-muted/50 rounded-lg p-2 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                        >
                            {notesByPriority[priority] && notesByPriority[priority].map((note, index) => (
                                <Draggable key={note.id} draggableId={note.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <StickyNoteCard 
                                                note={note} 
                                                onClick={() => onNoteClick(note)}
                                                onDelete={() => onDeleteNote(note.id)}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                 </Droppable>
            </div>
        ))}
        </div>
    </DragDropContext>
  );
}
