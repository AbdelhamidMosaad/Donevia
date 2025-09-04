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
import { tasks as mockTasks, Task } from '@/lib/mock-data';
import { Checkbox } from './ui/checkbox';
import { Flag, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { format } from 'date-fns';

const priorityColors = {
    Low: 'text-gray-500',
    Medium: 'text-yellow-500',
    High: 'text-red-500',
};

const statusColors = {
    Backlog: 'outline',
    'To Do': 'secondary',
    'In Progress': 'default',
    Done: 'default',
};
const statusBg = {
    Done: 'bg-green-500/20 text-green-700 border-green-500/30',
};


export function TaskTable() {
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
          {mockTasks.map((task: Task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Badge variant={statusColors[task.status] as any} className={task.status === 'Done' ? 'bg-green-600/80 text-primary-foreground' : ''}>
                    {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                    <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
                    <span>{task.priority}</span>
                </div>
              </TableCell>
              <TableCell>{format(task.dueDate, 'MMM d, yyyy')}</TableCell>
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
