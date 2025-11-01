

'use client'

import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MoreHorizontal, Flag, Edit, Trash2, Play, Pause } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { AddTaskDialog } from './add-task-dialog';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/use-tasks';
import { useTaskTimer } from '@/hooks/use-task-timer';


interface TaskCardProps {
  task: Task;
}

const priorityIcons = {
  Low: <Flag className="h-4 w-4 text-gray-400" />,
  Medium: <Flag className="h-4 w-4 text-yellow-500" />,
  High: <Flag className="h-4 w-4 text-red-500" />,
};

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
        .map(v => v < 10 ? '0' + v : v)
        .filter((v, i) => v !== '00' || i > 0 || (h === 0 && m === 0))
        .join(':');
}


export function TaskCard({ task }: TaskCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { deleteTask, updateTask, categories } = useTasks();
  const { toast } = useToast();
  const { activeItem, toggleTimer, elapsedTime } = useTaskTimer();

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting task' });
    }
  }
  
  const isDueSoon = moment(task.dueDate.toDate()).isBefore(moment().add(3, 'days'));
  const isOverdue = moment(task.dueDate.toDate()).isBefore(moment(), 'day');
  const isTimerActive = activeItem?.itemId === task.id;

  return (
    <>
    <Card 
        className={cn(
            "hover:shadow-md transition-shadow duration-200 cursor-pointer active:cursor-grabbing text-[hsl(var(--card-foreground))] hover:bg-opacity-80",
            isTimerActive && "ring-2 ring-primary"
        )}
        style={{ backgroundColor: task.color }}
        onClick={() => setIsEditDialogOpen(true)}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm leading-tight pr-2">{task.title}</p>
          <DropdownMenu onOpenChange={(e) => {
              if (e) {
                const card = document.querySelector(`[data-task-id="${task.id}"]`);
                card?.setAttribute('data-menu-open', 'true');
              }
          }}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive w-full">
                         <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this task.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      {(task.priority || task.dueDate || (task.tags && task.tags.length > 0) || task.category) &&
        <CardContent className="p-3 pt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground" style={{color: "hsl(var(--card-foreground))"}}>
                <div className="flex items-center gap-2">
                    {task.priority &&
                    <div className="flex items-center gap-1" title={task.priority}>
                    {priorityIcons[task.priority]}
                    </div>
                    }
                     {task.dueDate && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : isDueSoon ? 'text-yellow-600' : ''}`}>
                            <Calendar className="h-3 w-3" />
                            <span>{moment(task.dueDate.toDate()).format('MMM D')}</span>
                        </div>
                    )}
                </div>
                 <div className="flex items-center gap-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={(e) => { e.stopPropagation(); toggleTimer(task.id, task.title); }}
                    >
                        {isTimerActive ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <span className="font-mono text-xs">
                        {isTimerActive ? formatTime(elapsedTime) : (task.timeSpentSeconds ? formatTime(task.timeSpentSeconds) : '0:00')}
                    </span>
                </div>
            </div>
             {task.category && (
                <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="capitalize">{task.category}</Badge>
                </div>
            )}
            {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                    {tag}
                </Badge>
                ))}
            </div>
            )}
        </CardContent>
      }
    </Card>
    <AddTaskDialog 
        task={task}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onTaskAdded={useTasks().addTask}
        onTaskUpdated={updateTask}
        categories={categories}
    />
    </>
  );
}
