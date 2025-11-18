'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ListTodo } from 'lucide-react';
import moment from 'moment';
import type { Task, Stage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AddTaskDialog } from '@/components/add-task-dialog';
import { PlusCircle } from 'lucide-react';
import { BasicToDoList } from '@/components/to-do-list/basic-to-do-list';


export default function ToDoListPage() {
  const { user, loading: authLoading } = useAuth();
  const { tasks, stages, isLoading: tasksLoading, deleteTask, updateTask, addTask, categories } = useTasks();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const doneStage = useMemo(() => stages.find(s => s.name === 'Done'), [stages]);
  const todoStage = useMemo(() => stages.find(s => s.name === 'To Do'), [stages]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const tasksToday = useMemo(() => {
    return tasks.filter(task => moment(task.dueDate.toDate()).isSame(moment(), 'day'));
  }, [tasks]);

  const tasksThisWeek = useMemo(() => {
    const startOfWeek = moment().startOf('week');
    const endOfWeek = moment().endOf('week');
    return tasks.filter(task => moment(task.dueDate.toDate()).isBetween(startOfWeek, endOfWeek, 'day', '[]'));
  }, [tasks]);

  const renderTaskList = (filteredTasks: Task[]) => {
    if (tasksLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="ml-2">Loading tasks...</p>
        </div>
      );
    }
    return <BasicToDoList 
      tasks={filteredTasks} 
      doneStageId={doneStage?.id} 
      todoStageId={todoStage?.id} 
      onUpdateTask={updateTask} 
    />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <ListTodo className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline">To-do List</h1>
            <p className="text-muted-foreground">Your personal task manager for daily and weekly planning.</p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle /> New Task
        </Button>
      </div>

      <Tabs defaultValue="today" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="flex-1 mt-4 overflow-y-auto">
          {renderTaskList(tasksToday)}
        </TabsContent>
        <TabsContent value="week" className="flex-1 mt-4 overflow-y-auto">
          {renderTaskList(tasksThisWeek)}
        </TabsContent>
        <TabsContent value="all" className="flex-1 mt-4 overflow-y-auto">
          {renderTaskList(tasks)}
        </TabsContent>
      </Tabs>

      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onTaskAdded={addTask}
        onTaskUpdated={updateTask}
        categories={categories}
      />
    </div>
  );
}
