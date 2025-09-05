
'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Task, Stage } from '@/lib/types';
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
  const [stages, setStages] = useState<Stage[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user && listId) {
      const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribeStages = onSnapshot(listRef, (docSnap) => {
        if(docSnap.exists()) {
          const listData = docSnap.data();
          setStages(listData.stages?.sort((a: Stage, b: Stage) => a.order - b.order) || []);
        }
      });

      let q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId), orderBy(sortBy, 'desc'));
      
      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        let tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        if (filterStatus !== 'all') {
            tasksData = tasksData.filter(task => task.status === filterStatus);
        }
        setTasks(tasksData);
      });

      return () => {
          unsubscribeStages();
          unsubscribeTasks();
      };
    }
  }, [user, listId, sortBy, filterStatus]);

  const getStageName = (statusId: string) => {
      return stages.find(s => s.id === statusId)?.name || statusId;
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
        {tasks.map(task => (
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
                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </Card>
  );
}
