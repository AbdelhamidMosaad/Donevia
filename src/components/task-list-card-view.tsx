
'use client';
import type { TaskList } from '@/lib/types';
import { TaskListCard } from './task-list-card';
import { TasksIcon } from './icons/tools/tasks-icon';

interface TaskListCardViewProps {
  taskLists: TaskList[];
  onDelete: (listId: string) => void;
}

export function TaskListCardView({ taskLists, onDelete }: TaskListCardViewProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {taskLists.map(list => (
        <TaskListCard key={list.id} list={list} onDelete={() => onDelete(list.id)} />
      ))}
    </div>
  );
}
