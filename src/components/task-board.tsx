'use client';
import type { Task } from '@/lib/mock-data';
import { tasks as mockTasks } from '@/lib/mock-data';
import { TaskCard } from './task-card';
import { PlusCircle } from 'lucide-react';
import { Button } from './ui/button';

type Column = 'Backlog' | 'To Do' | 'In Progress' | 'Done';

const columns: Column[] = ['Backlog', 'To Do', 'In Progress', 'Done'];

export function TaskBoard() {
  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col] = mockTasks.filter((task) => task.status === col);
    return acc;
  }, {} as Record<Column, Task[]>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
      {columns.map((column) => (
        <div key={column} className="flex flex-col bg-muted/50 rounded-lg">
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
            {tasksByColumn[column].map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
