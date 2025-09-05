
'use client';
import type { Task } from '@/lib/types';
import { TaskCard } from './task-card';
import { PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AddTaskDialog } from './add-task-dialog';
import { useToast } from '@/hooks/use-toast';

type Column = 'Backlog' | 'To Do' | 'In Progress' | 'Done';

const columns: Column[] = ['Backlog', 'To Do', 'In Progress', 'Done'];

interface TaskBoardProps {
  listId: string;
}

export function TaskBoard({ listId }: TaskBoardProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user && listId) {
      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });
      return () => unsubscribe();
    }
  }, [user, listId]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const task = tasks.find(t => t.id === draggableId);
    if (task && user) {
      const newStatus = destination.droppableId as Column;
      const taskRef = doc(db, 'users', user.uid, 'tasks', draggableId);
      try {
        await updateDoc(taskRef, { status: newStatus });
        toast({
          title: 'Task Updated',
          description: `Task "${task.title}" moved to ${newStatus}.`,
        });
      } catch (error) {
        console.error("Error updating task status: ", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update task status.',
        });
      }
    }
  };

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col] = tasks.filter((task) => task.status === col).sort((a,b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    return acc;
  }, {} as Record<Column, Task[]>);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full items-start">
        {columns.map((column) => (
          <Droppable droppableId={column} key={column}>
            {(provided, snapshot) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex flex-col bg-muted/50 rounded-lg transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold font-headline text-lg">{column}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground bg-background rounded-full px-2 py-0.5">
                      {tasksByColumn[column].length}
                    </span>
                    <AddTaskDialog listId={listId} defaultStatus={column}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Add task</span>
                      </Button>
                    </AddTaskDialog>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-y-auto min-h-[100px]">
                  {tasksByColumn[column].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1}}
                        >
                          <TaskCard task={task} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
