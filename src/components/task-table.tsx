
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Task, Stage } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import { Flag, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const priorityColors = {
    Low: 'text-gray-500',
    Medium: 'text-yellow-500',
    High: 'text-red-500',
};

interface TaskTableProps {
    listId: string;
}

export function TaskTable({ listId }: TaskTableProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  
  useEffect(() => {
    if (user && listId) {
      const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribeStages = onSnapshot(listRef, (docSnap) => {
        if(docSnap.exists()) {
          const listData = docSnap.data();
          setStages(listData.stages?.sort((a: Stage, b: Stage) => a.order - b.order) || []);
        }
      });

      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId));
      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });
      
      return () => {
          unsubscribeStages();
          unsubscribeTasks();
      };
    }
  }, [user, listId]);

  const getStageName = (statusId: string) => {
      return stages.find(s => s.id === statusId)?.name || statusId;
  }

  const doneStageId = stages.find(s => s.name.toLowerCase() === 'done')?.id;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task: Task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant={task.status === doneStageId ? 'default' : 'secondary'} className={task.status === doneStageId ? 'bg-green-600/80 text-primary-foreground' : ''}>
                    {getStageName(task.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                    <span>{task.priority}</span>
                </div>
              </TableCell>
              <TableCell>{task.dueDate.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
