'use client';

import type { Task } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { BasicTaskItem } from './basic-task-item';

interface BasicToDoListProps {
  tasks: Task[];
  doneStageId?: string;
  todoStageId?: string;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function BasicToDoList({ tasks, doneStageId, todoStageId, onUpdateTask }: BasicToDoListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-16">
                <p>No tasks for this period.</p>
            </div>
        )
    }

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        {tasks.map((task) => (
          <BasicTaskItem 
            key={task.id} 
            task={task} 
            isDone={task.status === doneStageId}
            onToggle={() => {
                if (!doneStageId || !todoStageId) return;
                const newStatus = task.status === doneStageId ? todoStageId : doneStageId;
                onUpdateTask(task.id, { status: newStatus });
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
