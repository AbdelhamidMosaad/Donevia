import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, List, LayoutGrid, Calendar, Table2 } from 'lucide-react';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { AiTaskSuggester } from '@/components/ai-task-suggester';
import { tasks } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const userGoal = "Launch the new version of the Donevia productivity app by the end of the quarter.";
  const currentTasks = tasks
    .filter(t => t.status === 'In Progress' || t.status === 'To Do')
    .map(t => ({ id: t.id, title: t.title }));

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
          <TabsTrigger value="list" disabled><List className="mr-2 h-4 w-4" />List</TabsTrigger>
          <TabsTrigger value="calendar" disabled><Calendar className="mr-2 h-4 w-4" />Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-6">
          <TaskBoard />
        </TabsContent>
        <TabsContent value="table" className="mt-6">
          <TaskTable />
        </TabsContent>
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>List View</CardTitle>
              <CardDescription>This feature is coming soon!</CardDescription>
            </CardHeader>
            <CardContent>
              <p>A compact list of all your tasks is on the way.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>This feature is coming soon!</CardDescription>
            </CardHeader>
            <CardContent>
              <p>A full-featured calendar to visualize your schedule is under construction.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
