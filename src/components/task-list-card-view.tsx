
'use client';
import type { TaskList } from '@/lib/types';
import { TaskListCard } from './task-list-card';
import { TasksIcon } from './icons/tools/tasks-icon';
import { cn } from '@/lib/utils';

interface TaskListCardViewProps {
  taskLists: TaskList[];
  onDelete: (listId: string) => void;
  cardSize?: 'small' | 'medium' | 'large';
}

export function TaskListCardView({ taskLists, onDelete, cardSize = 'large' }: TaskListCardViewProps) {
  if (taskLists.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <TasksIcon className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Task Lists Yet</h3>
            <p className="text-muted-foreground">Create your first task list to get started.</p>
        </div>
    )
  }

  return (
    <div className={cn(
        "grid gap-6",
        cardSize === 'large' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        cardSize === 'medium' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
        cardSize === 'small' && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
    )}>
      {taskLists.map(list => (
        <TaskListCard key={list.id} list={list} onDelete={() => onDelete(list.id)} size={cardSize} />
      ))}
    </div>
  );
}
