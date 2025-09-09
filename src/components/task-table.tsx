
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
import { Flag, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import moment from 'moment';

const priorityColors = {
    Low: 'text-gray-500',
    Medium: 'text-yellow-500',
    High: 'text-red-500',
};

interface TaskTableProps {
    listId: string;
}

type Column = 'title' | 'status' | 'priority' | 'dueDate' | 'tags' | 'createdAt';

const allColumns: { id: Column; label: string }[] = [
    { id: 'title', label: 'Task' },
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'tags', label: 'Tags' },
    { id: 'createdAt', label: 'Created At' },
];

export function TaskTable({ listId }: TaskTableProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Column[]>(['title', 'status', 'priority', 'dueDate']);

  useEffect(() => {
    if (user && listId) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists()) {
          const tableColumns = docSnap.data().tableColumns || {};
          if (tableColumns[listId]) {
            setVisibleColumns(tableColumns[listId]);
          }
        }
      });
    }
  }, [user, listId]);
  
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
  
  const handleColumnVisibilityChange = async (columnId: Column) => {
    const newVisibleColumns = visibleColumns.includes(columnId)
      ? visibleColumns.filter(id => id !== columnId)
      : [...visibleColumns, columnId];
    setVisibleColumns(newVisibleColumns);
    if(user) {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, {
            tableColumns: {
                [listId]: newVisibleColumns
            }
        }, { merge: true });
    }
  };
  
  const columnsToRender = useMemo(() => {
    return allColumns.filter(c => visibleColumns.includes(c.id));
  }, [visibleColumns]);

  return (
    <>
    <div className="flex justify-end mb-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allColumns.map(column => (
                     <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={visibleColumns.includes(column.id)}
                        onCheckedChange={() => handleColumnVisibilityChange(column.id)}
                        disabled={column.id === 'title'}
                     >
                        {column.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            {columnsToRender.map(column => (
                <TableHead key={column.id}>{column.label}</TableHead>
            ))}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task: Task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              {columnsToRender.map(column => (
                 <TableCell key={column.id}>
                    {column.id === 'title' && <span className="font-medium">{task.title}</span>}
                    {column.id === 'status' && (
                        <Badge variant={task.status === doneStageId ? 'default' : 'secondary'} className={task.status === doneStageId ? 'bg-green-600/80 text-primary-foreground' : ''}>
                            {getStageName(task.status)}
                        </Badge>
                    )}
                    {column.id === 'priority' && (
                        <div className="flex items-center gap-2">
                            <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                            <span>{task.priority}</span>
                        </div>
                    )}
                    {column.id === 'dueDate' && task.dueDate && moment(task.dueDate.toDate()).format('MMM D, YYYY')}
                    {column.id === 'tags' && task.tags?.join(', ')}
                    {column.id === 'createdAt' && task.createdAt && moment(task.createdAt.toDate()).format('MMM D, YYYY')}
                 </TableCell>
              ))}
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
    </>
  );
}
