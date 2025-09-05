
'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Task } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface TaskListProps {
    listId: string;
}

export function TaskList({ listId }: TaskListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user && listId) {
      let q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId), orderBy(sortBy, 'desc'));
      
      if (filterStatus !== 'all') {
        // This is tricky with Firestore. You can't have multiple inequality filters on different fields.
        // And orderBy is considered one. If we want to filter by status, we might have to do it client side
        // or restructure data. For now, let's stick to the simple query and then filter client-side.
        // The query will just be for the listId, ordered by the selected field.
         q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId), orderBy(sortBy, 'desc'));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        if (filterStatus !== 'all') {
            tasksData = tasksData.filter(task => task.status === filterStatus);
        }
        setTasks(tasksData);
      });
      return () => unsubscribe();
    }
  }, [user, listId, sortBy, filterStatus]);

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
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Backlog">Backlog</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div className="flex-1">
              <p className="font-semibold">{task.title}</p>
              <p className="text-sm text-muted-foreground truncate">{task.description}</p>
            </div>
            <div className="flex items-center gap-4 mx-4">
               <Badge variant={task.status === 'Done' ? 'default' : 'secondary'} className={task.status === 'Done' ? 'bg-green-500' : ''}>{task.status}</Badge>
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
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </Card>
  );
}
