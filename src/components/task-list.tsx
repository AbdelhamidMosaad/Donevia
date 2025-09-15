
'use client';
import { useState, useEffect } from 'react';
import type { Task, Stage } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';


interface TaskListProps {
    tasks: Task[];
    stages: Stage[];
    onDeleteTask: (taskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskList({ tasks, stages, onDeleteTask }: TaskListProps) {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortedAndFilteredTasks, setSortedAndFilteredTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    let newTasks = [...tasks];
    if (filterStatus !== 'all') {
        newTasks = newTasks.filter(task => task.status === filterStatus);
    }
    newTasks.sort((a, b) => {
        if (sortBy === 'dueDate') {
            return a.dueDate.toMillis() - b.dueDate.toMillis();
        }
        if (sortBy === 'priority') {
            const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        // default to createdAt
        return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    });
    setSortedAndFilteredTasks(newTasks);
  }, [tasks, sortBy, filterStatus]);


  const getStageName = (statusId: string) => {
      return stages.find(s => s.id === statusId)?.name || statusId;
  }
  
   const handleDelete = async (taskId: string) => {
      try {
        await onDeleteTask(taskId);
        toast({ title: 'Task deleted' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error deleting task' });
      }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-headline">Task List</h2>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        {sortedAndFilteredTasks.map(task => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div className="flex-1">
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-muted-foreground truncate">{task.description}</p>
            </div>
            <div className="flex items-center gap-4 mx-4">
               <Badge variant={task.status === stages.find(s => s.name === 'Done')?.id ? 'default' : 'secondary'} className={task.status === stages.find(s => s.name === 'Done')?.id ? 'bg-green-500' : ''}>{getStageName(task.status)}</Badge>
               <Badge variant="outline">{task.priority}</Badge>
               <span className="text-sm text-muted-foreground">{task.dueDate.toDate().toLocaleDateString()}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4" /> Mark as complete</DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this task.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(task.id)} variant="destructive">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </Card>
  );
}
