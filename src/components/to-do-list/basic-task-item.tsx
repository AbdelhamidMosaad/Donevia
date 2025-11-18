'use client';

import type { Task } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import moment from 'moment';

interface BasicTaskItemProps {
    task: Task;
    isDone: boolean;
    onToggle: () => void;
}

export function BasicTaskItem({ task, isDone, onToggle }: BasicTaskItemProps) {
    return (
        <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
            <Checkbox checked={isDone} onCheckedChange={onToggle} id={`task-${task.id}`} />
            <div className="flex-1">
                <label 
                    htmlFor={`task-${task.id}`} 
                    className={cn("font-medium cursor-pointer", isDone && "line-through text-muted-foreground")}
                >
                    {task.title}
                </label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.category && <Badge variant="outline" className="capitalize">{task.category}</Badge>}
                    {task.dueDate && <span>{moment(task.dueDate.toDate()).format('MMM D')}</span>}
                </div>
            </div>
        </div>
    )
}
