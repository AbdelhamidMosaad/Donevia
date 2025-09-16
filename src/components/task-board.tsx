
'use client';
import type { Task, Stage } from '@/lib/types';
import { TaskCard } from './task-card';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { BoardSettings } from './board-settings';
import { BoardTaskCreator } from './board-task-creator';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Loader2, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/use-tasks';

interface TaskBoardProps {
  listId: string;
}

export function TaskBoard({ listId }: TaskBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [error, setError] = useState<string | null>(null);

  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  // Fetch stages for the current list
  useEffect(() => {
    if (user && listId) {
      const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribe = onSnapshot(listRef, (docSnap) => {
        if (docSnap.exists()) {
          const listData = docSnap.data();
          setStages(listData.stages?.sort((a: Stage, b: Stage) => a.order - b.order) || []);
        }
      });
      return () => unsubscribe();
    }
  }, [user, listId]);
  
  // Fetch tasks for the current list with proper loading and error handling
  useEffect(() => {
    if (user && listId) {
      console.log('Fetching tasks for list:', listId);
      setIsLoading(true); // Set loading true at the start of the fetch
      setError(null);

      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)).filter(task => !task.deleted);
          console.log(`Successfully fetched ${tasksData.length} tasks.`);
          setTasks(tasksData);
          setIsLoading(false); // Set loading false on successful data retrieval
        }, 
        (err) => {
          console.error("Error fetching tasks: ", err);
          toast({ variant: 'destructive', title: 'Error loading tasks.'});
          setError('Failed to load tasks. Please try again.');
          setIsLoading(false); // Also set loading false on error
        }
      );
      
      return () => unsubscribe();
    }
  }, [user, listId, toast]);


  useEffect(() => {
      const storedCollapsedState = localStorage.getItem(`collapsed-stages-${listId}`);
      if (storedCollapsedState) {
          setCollapsedStages(JSON.parse(storedCollapsedState));
      }
  }, [listId]);

  const updateCollapsedState = (newState: Record<string, boolean>) => {
      setCollapsedStages(newState);
      localStorage.setItem(`collapsed-stages-${listId}`, JSON.stringify(newState));
  }

  const toggleCollapseStage = (stageId: string) => {
      const newState = {...collapsedStages, [stageId]: !collapsedStages[stageId]};
      updateCollapsedState(newState);
  };
  
  const sortedStages = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === 'COLUMN') {
        const newStages = Array.from(sortedStages);
        const [reorderedItem] = newStages.splice(source.index, 1);
        newStages.splice(destination.index, 0, reorderedItem);

        const updatedStages = newStages.map((stage, index) => ({ ...stage, order: index }));
        
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
            await updateDoc(taskRef, { status: newStatus });
             toast({
                title: 'Task Updated',
                description: `Task "${task.title}" moved to ${stages.find(s => s.id === newStatus)?.name}.`,
            });
        }
    }
  };

  const tasksByColumn = useMemo(() => {
      const tasksWithOrder = tasks.map(task => {
        const stageTasks = tasks.filter(t => t.status === task.status);
        const order = stageTasks.findIndex(t => t.id === task.id);
        return { ...task, order };
      });

      return sortedStages.reduce((acc, stage) => {
        acc[stage.id] = tasksWithOrder
            .filter((task) => task.status === stage.id)
            .sort((a, b) => a.order - b.order);
        return acc;
      }, {} as Record<string, (Task & {order: number})[]>);
    }, [sortedStages, tasks]);

  // Conditional Rendering Logic
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-destructive">
            <p>{error}</p>
        </div>
    );
  }

  if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 border rounded-lg bg-muted/50">
            <Kanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">This board is empty</h3>
            <p className="text-muted-foreground">Add your first task to get started.</p>
        </div>
      );
  }
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="mb-4 flex justify-end items-center gap-2">
             <BoardSettings listId={listId} currentStages={stages} />
        </div>
      <Droppable droppableId="board" direction="horizontal" type="COLUMN">
        {(provided) => (
            <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-row gap-6 items-start"
            >
            {sortedStages.map((stage, index) => {
                const isCollapsed = collapsedStages[stage.id];
                return (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                                "flex flex-col transition-all duration-300",
                                isCollapsed ? 'w-16' : 'flex-1 min-w-[220px]'
                            )}
                        >
                            <Droppable droppableId={stage.id} type="TASK" isDropDisabled={isCollapsed}>
                                {(droppableProvided, droppableSnapshot) => (
                                <div 
                                    className={`flex flex-col bg-muted/50 rounded-lg transition-colors duration-200 h-full ${droppableSnapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                                >
                                    <div 
                                        {...provided.dragHandleProps} 
                                        className="flex items-center justify-between p-3 border-b cursor-grab"
                                        onClick={() => toggleCollapseStage(stage.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            <h2 className={cn("font-semibold font-headline text-lg", isCollapsed && "transform -rotate-90 origin-center whitespace-nowrap")}>
                                                {!isCollapsed && stage.name}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-sm text-muted-foreground bg-background rounded-full px-2 py-0.5", isCollapsed && "transform -rotate-90")}>
                                                {tasksByColumn[stage.id]?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                    {!isCollapsed && (
                                        <>
                                        <div 
                                            className="flex-1 overflow-y-auto"
                                        >
                                            <div 
                                                ref={droppableProvided.innerRef}
                                                {...droppableProvided.droppableProps}
                                                className="p-2 min-h-[100px]"
                                            >
                                                {tasksByColumn[stage.id] && tasksByColumn[stage.id].map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(taskProvided, taskSnapshot) => (
                                                    <div
                                                        ref={taskProvided.innerRef}
                                                        {...taskProvided.draggableProps}
                                                        {...taskProvided.dragHandleProps}
                                                        style={{...taskProvided.draggableProps.style, opacity: taskSnapshot.isDragging ? 0.8 : 1}}
                                                        className="task-card-wrapper mb-2"
                                                    >
                                                        <TaskCard task={task} />
                                                    </div>
                                                )}
                                                </Draggable>
                                                ))}
                                                {droppableProvided.placeholder}
                                            </div>
                                        </div>
                                        <div className="p-1 border-t mt-auto">
                                          <BoardTaskCreator listId={listId} stageId={stage.id} />
                                        </div>
                                        </>
                                    )}
                                </div>
                                )}
                            </Droppable>
                        </div>
                    )}
                </Draggable>
                )
            })}
            {provided.placeholder}
            </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
