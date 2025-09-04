
'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, List, LayoutGrid, Calendar, Table2 } from 'lucide-react';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { AiTaskSuggester } from '@/components/ai-task-suggester';
import { tasks } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskList } from '@/components/task-list';
import { TaskCalendar } from '@/components/task-calendar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  const userGoal = "Launch the new version of the Donevia productivity app by the end of the quarter.";
  const currentTasks = tasks
    .filter(t => t.status === 'In Progress' || t.status === 'To Do')
    .map(t => ({ id: t.id, title: t.title }));
    
  if (loading || !user) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground">Here&apos;s your current workload. Keep up the great work!</p>
        </div>
        <div className="flex items-center gap-2">
          <AiTaskSuggester currentTasks={currentTasks} userGoal={userGoal} />
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
          <TabsTrigger value="board"><LayoutGrid className="mr-2 h-4 w-4" />Board</TabsTrigger>
          <TabsTrigger value="table"><Table2 className="mr-2 h-4 w-4" />Table</TabsTrigger>
          <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />List</TabsTrigger>
          <TabsTrigger value="calendar"><Calendar className="mr-2 h-4 w-4" />Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-6">
          <TaskBoard />
        </TabsContent>
        <TabsContent value="table" className="mt-6">
          <TaskTable />
        </TabsContent>
        <TabsContent value="list" className="mt-6">
          <TaskList />
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <TaskCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
