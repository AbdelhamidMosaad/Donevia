
'use client';
import type { Task } from '@/lib/types';
import { TaskCard } from './task-card';
import { PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

type Column = 'Backlog' | 'To Do' | 'In Progress' | 'Done';

const columns: Column[] = ['Backlog', 'To Do', 'In Progress', 'Done'];

export function TaskBoard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'tasks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const onDragEnd = (result: DropResult) => {
    // For now, we are not handling drag and drop reordering to keep it simple.
    // This can be implemented by updating the task status in Firestore.
    console.log(result);
  };

  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col] = tasks.filter((task) => task.status === col);
    return acc;
  }, {} as Record<Column, Task[]>);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        {columns.map((column) => (
          <Droppable droppableId={column} key={column}>
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col bg-muted/50 rounded-lg"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold font-headline text-lg">{column}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground bg-background rounded-full px-2 py-0.5">
                      {tasksByColumn[column].length}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <PlusCircle className="h-4 w-4" />
                      <span className="sr-only">Add task</span>
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                  {tasksByColumn[column].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
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
