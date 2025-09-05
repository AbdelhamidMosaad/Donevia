
'use client';
import type { TaskList } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Folder, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';

interface TaskListListViewProps {
  taskLists: TaskList[];
}

export function TaskListListView({ taskLists }: TaskListListViewProps) {
    if (taskLists.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <Folder className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Task Lists Yet</h3>
            <p className="text-muted-foreground">Create your first task list to get started.</p>
        </div>
    )
  }
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taskLists.map(list => (
            <TableRow key={list.id}>
              <TableCell>
                <Link href={`/dashboard/lists/${list.id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                    <Folder className="h-4 w-4" />
                    {list.name}
                </Link>
              </TableCell>
              <TableCell>{list.createdAt.toDate().toLocaleDateString()}</TableCell>
              <TableCell>0</TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
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
