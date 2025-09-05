
'use client';
import type { Task, Stage } from '@/lib/types';
import { TaskCard } from './task-card';
import { PlusCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { BoardSettings } from './board-settings';
import { InlineTaskCreator } from './inline-task-creator';

interface TaskBoardProps {
  listId: string;
}

const defaultStages: Stage[] = [
    { id: 'backlog', name: 'Backlog', order: 0 },
    { id: 'todo', name: 'To Do', order: 1 },
    { id: 'inprogress', name: 'In Progress', order: 2 },
    { id: 'done', name: 'Done', order: 3 },
];

export function TaskBoard({ listId }: TaskBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [addingTaskToStage, setAddingTaskToStage] = useState<string | null>(null);

  useEffect(() => {
    if (user && listId) {
      const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribeList = onSnapshot(listRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.stages && data.stages.length > 0) {
            setStages(data.stages.sort((a, b) => a.order - b.order));
          } else {
            await updateDoc(listRef, { stages: defaultStages });
            setStages(defaultStages);
          }
        }
      });
      
      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId));
      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });

      return () => {
        unsubscribeList();
        unsubscribeTasks();
      }
    }
  }, [user, listId]);
  
  const sortedStages = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === 'COLUMN') {
        const newStages = Array.from(sortedStages);
        const [reorderedItem] = newStages.splice(source.index, 1);
        newStages.splice(destination.index, 0, reorderedItem);

        const updatedStages = newStages.map((stage, index) => ({ ...stage, order: index }));
        setStages(updatedStages);

        if (user) {
            const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
            await updateDoc(listRef, { stages: updatedStages });
            toast({ title: "Board updated", description: "Column order saved." });
        }
        return;
    }

    if (type === 'TASK') {
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const task = tasks.find(t => t.id === draggableId);
        if (task && user) {
            const newStatus = destination.droppableId;
            const taskRef = doc(db, 'users', user.uid, 'tasks', draggableId);
            try {
                await updateDoc(taskRef, { status: newStatus });
                toast({
                    title: 'Task Updated',
                    description: `Task "${task.title}" moved to ${stages.find(s => s.id === newStatus)?.name}.`,
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
    }
  };

  const tasksByColumn = useMemo(() => sortedStages.reduce((acc, stage) => {
    acc[stage.id] = tasks
      .filter((task) => task.status === stage.id)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return a.createdAt.toMillis() - b.createdAt.toMillis();
        }
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        return 0;
      });
    return acc;
  }, {} as Record<string, Task[]>), [sortedStages, tasks]);

  if (!user || stages.length === 0) {
      return <div>Loading board...</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="mb-4 flex justify-end">
             <BoardSettings listId={listId} currentStages={stages} />
        </div>
      <Droppable droppableId="board" direction="horizontal" type="COLUMN">
        {(provided) => (
            <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full items-start"
                style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(280px, 1fr))` }}
            >
            {sortedStages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="flex flex-col"
                        >
                            <Droppable droppableId={stage.id} type="TASK">
                                {(droppableProvided, droppableSnapshot) => (
                                <div 
                                    className={`flex flex-col bg-muted/50 rounded-lg transition-colors duration-200 ${droppableSnapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                                >
                                    <div {...provided.dragHandleProps} className="flex items-center justify-between p-4 border-b cursor-grab">
                                        <h2 className="font-semibold font-headline text-lg">{stage.name}</h2>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground bg-background rounded-full px-2 py-0.5">
                                                {tasksByColumn[stage.id]?.length || 0}
                                            </span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAddingTaskToStage(stage.id)}>
                                                <PlusCircle className="h-4 w-4" />
                                                <span className="sr-only">Add task</span>
                                            </Button>
                                        </div>
                                    </div>
                                    <div 
                                        ref={droppableProvided.innerRef}
                                        {...droppableProvided.droppableProps}
                                        className="p-4 flex-1 overflow-y-auto min-h-[100px]"
                                    >
                                        {addingTaskToStage === stage.id && (
                                            <InlineTaskCreator 
                                                listId={listId}
                                                stageId={stage.id}
                                                onCancel={() => setAddingTaskToStage(null)}
                                                onCreated={() => setAddingTaskToStage(null)}
                                            />
                                        )}
                                        {tasksByColumn[stage.id] && tasksByColumn[stage.id].map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                            {(taskProvided, taskSnapshot) => (
                                                <div
                                                ref={taskProvided.innerRef}
                                                {...taskProvided.draggableProps}
                                                {...taskProvided.dragHandleProps}
                                                style={{...taskProvided.draggableProps.style, opacity: taskSnapshot.isDragging ? 0.8 : 1}}
                                                >
                                                <TaskCard task={task} />
                                                </div>
                                            )}
                                            </Draggable>
                                        ))}
                                        {droppableProvided.placeholder}
                                    </div>
                                </div>
                                )}
                            </Droppable>
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
