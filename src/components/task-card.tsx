
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
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm leading-tight">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title={task.priority}>
              {priorityIcons[task.priority]}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{task.dueDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          <Avatar className="h-6 w-6">
            <AvatarImage src="https://picsum.photos/24/24" data-ai-hint="person avatar"/>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
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
