
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { StudyGoal } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { StudyGoalCard } from './study-goal-card';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

interface StudyGoalBoardProps {
  goals: StudyGoal[];
}

const statuses: StudyGoal['status'][] = ['Not Started', 'In Progress', 'Completed', 'Archived'];

export function StudyGoalBoard({ goals }: StudyGoalBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !user) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const goal = goals.find(g => g.id === draggableId);
    const newStatus = destination.droppableId as StudyGoal['status'];

    if (goal) {
      const goalRef = doc(db, 'users', user.uid, 'studyGoals', draggableId);
      try {
        await updateDoc(goalRef, { status: newStatus });
        toast({
          title: 'Goal Updated',
          description: `"${goal.title}" moved to ${newStatus}.`,
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error updating goal status.' });
      }
    }
  };

  const goalsByStatus = useMemo(() => {
    const initial: Record<string, StudyGoal[]> = {};
    statuses.forEach(status => (initial[status] = []));
    return goals.reduce((acc, goal) => {
      const status = goal.status || 'Not Started';
      if (acc[status]) {
        acc[status].push(goal);
      }
      return acc;
    }, initial);
  }, [goals]);

  return (
    <ScrollArea className="-mx-4">
        <div className="px-4 pb-4">
            <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 items-start">
                {statuses.map(status => (
                <div key={status} className="flex flex-col w-72">
                    <h2 className="text-lg font-semibold font-headline p-3">{status}</h2>
                    <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                        <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-4 bg-muted/50 rounded-lg p-4 min-h-[300px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-primary/10' : ''
                        }`}
                        >
                        {goalsByStatus[status]?.map((goal, index) => (
                            <Draggable key={goal.id} draggableId={goal.id} index={index}>
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <StudyGoalCard
                                    goal={goal}
                                    folders={[]} 
                                    onDelete={() => {}} // Deletion is handled on the main page
                                    onMove={() => {}}   // Moving is handled on the main page
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
        </div>
        <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
