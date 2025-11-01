
'use client';
import type { Task, Stage } from '@/lib/types';
import { TaskCard } from './task-card';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { BoardTaskCreator } from './board-task-creator';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Loader2, Kanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/use-tasks';
import { AddTaskDialog } from './add-task-dialog';

interface TaskBoardProps {
}

export function TaskBoard({}: TaskBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tasks, stages: allStages, isLoading, updateTask: updateTaskInDb, updateStages: updateStagesInDb, addTask } = useTasks();
  const [stages, setStages] = useState<Stage[]>(allStages);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    setStages(allStages);
  }, [allStages]);

  useEffect(() => {
      const storedCollapsedState = localStorage.getItem(`collapsed-stages-global`);
      if (storedCollapsedState) {
          setCollapsedStages(JSON.parse(storedCollapsedState));
      }
  }, []);

  const updateCollapsedState = (newState: Record<string, boolean>) => {
      setCollapsedStages(newState);
      localStorage.setItem(`collapsed-stages-global`, JSON.stringify(newState));
  }

  const toggleCollapseStage = (stageId: string) => {
      const newState = {...collapsedStages, [stageId]: !collapsedStages[stageId]};
      updateCollapsedState(newState);
  };
  
  const sortedStages = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination || !user) return;

    if (type === 'COLUMN') {
        const newStages = Array.from(sortedStages);
        const [reorderedItem] = newStages.splice(source.index, 1);
        newStages.splice(destination.index, 0, reorderedItem);

        const updatedStages = newStages.map((stage, index) => ({ ...stage, order: index }));
        
        setStages(updatedStages);
        
        try {
            updateStagesInDb(updatedStages);
            toast({ title: "Board updated", description: "Column order saved." });
        } catch (error) {
            setStages(sortedStages);
            toast({ variant: 'destructive', title: 'Error updating board order.' });
        }
        return;
    }

    if (type === 'TASK') {
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }

        const task = tasks.find(t => t.id === draggableId);
        if (!task) return;
        
        const newStatus = destination.droppableId;
        
        try {
            await updateTaskInDb(draggableId, { status: newStatus });
            const stageName = stages.find(s => s.id === newStatus)?.name || newStatus;
            toast({
                title: 'Task Updated',
                description: `Task "${task.title}" moved to ${stageName}.`,
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating task.' });
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

    const handleTaskCreated = (newTask: Task) => {
        setEditingTask(newTask);
    };


  // Conditional Rendering Logic
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading board...</p>
      </div>
    );
  }
  
  return (
    <>
    <DragDropContext onDragEnd={onDragEnd}>
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
                                isCollapsed ? 'w-16' : 'w-72'
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
                                          <BoardTaskCreator stageId={stage.id} onTaskCreated={handleTaskCreated} />
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
    {editingTask && (
        <AddTaskDialog
            task={editingTask}
            open={!!editingTask}
            onOpenChange={(open) => {
                if (!open) setEditingTask(null);
            }}
            onTaskAdded={addTask}
            onTaskUpdated={updateTaskInDb}
            categories={allStages.flatMap(s => s.name)} // This seems incorrect, should be from settings
        />
    )}
    </>
  );
}
