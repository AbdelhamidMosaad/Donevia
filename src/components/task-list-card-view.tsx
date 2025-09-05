
'use client';
import type { TaskList } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Folder } from 'lucide-react';

interface TaskListCardViewProps {
  taskLists: TaskList[];
}

export function TaskListCardView({ taskLists }: TaskListCardViewProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {taskLists.map(list => (
        <Link key={list.id} href={`/dashboard/list/${list.id}`} passHref>
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Folder className="h-5 w-5 text-primary" />
                {list.name}
              </CardTitle>
              <CardDescription>
                Created on {list.createdAt.toDate().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {/* You can add a preview of tasks here in the future */}
              <p className="text-sm text-muted-foreground">This list is ready for your tasks.</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
