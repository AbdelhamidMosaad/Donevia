
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AiTaskSuggester } from '@/components/ai-task-suggester';
import { tasks } from '@/lib/mock-data';
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
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">Calendar</h1>
            <p className="text-muted-foreground">Manage your tasks and events.</p>
        </div>
        <div className="flex items-center gap-2">
          <AiTaskSuggester currentTasks={currentTasks} userGoal={userGoal} />
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        <TaskCalendar />
      </div>
    </div>
  );
}
