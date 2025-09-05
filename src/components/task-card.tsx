
'use client'

import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MoreHorizontal, Flag, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { AddTaskDialog } from './add-task-dialog';
import { useState } from 'react';
import { deleteTask } from '@/lib/tasks';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';


interface TaskCardProps {
  task: Task;
}

const priorityIcons = {
  Low: <Flag className="h-4 w-4 text-gray-400" />,
  Medium: <Flag className="h-4 w-4 text-yellow-500" />,
  High: <Flag className="h-4 w-4 text-red-500" />,
};

export function TaskCard({ task }: TaskCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDelete = async () => {
      if(!user) return;
      try {
        await deleteTask(user.uid, task.id);
        toast({ title: 'Task deleted' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error deleting task' });
      }
  }

  return (
    <>
    <Card 
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer active:cursor-grabbing"
        onClick={() => setIsEditDialogOpen(true)}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm leading-tight pr-2">{task.title}</p>
          <DropdownMenu onOpenChange={(e) => {
              // Stop propagation to prevent the card's onClick from firing
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
                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
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
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      {(task.priority || (task.tags && task.tags.length > 0)) &&
        <CardContent className="p-3 pt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
                {task.priority &&
                <div className="flex items-center gap-1" title={task.priority}>
                {priorityIcons[task.priority]}
                </div>
                }
            </div>
            </div>
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
        listId={task.listId}
        task={task}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
    />
    </>
  );
}

