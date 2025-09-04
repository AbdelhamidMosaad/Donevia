
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, LayoutGrid, List, Table } from 'lucide-react';
import { AiTaskSuggester } from '@/components/ai-task-suggester';
import { TaskCalendar } from '@/components/task-calendar';
import { TaskList } from '@/components/task-list';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AddTaskDialog } from '@/components/add-task-dialog';
import type { Task } from '@/lib/types';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type View = 'calendar' | 'list' | 'board' | 'table';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'tasks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const userGoal = "Launch the new version of the Donevia productivity app by the end of the quarter.";
  const currentTasks = tasks
    .filter(t => t.status === 'In Progress' || t.status === 'To Do')
    .map(t => ({ id: t.id, title: t.title }));
    
  if (loading || !user) {
    return <div>Loading...</div>; // Or a spinner component
  }

  const renderView = () => {
    switch (view) {
      case 'list':
        return <TaskList />;
      case 'board':
        return <TaskBoard />;
      case 'table':
        return <TaskTable />;
      case 'calendar':
      default:
        return <TaskCalendar />;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline capitalize">{view}</h1>
            <p className="text-muted-foreground">Manage your tasks and events.</p>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup type="single" value={view} onValueChange={(value: View) => value && setView(value)} aria-label="Task view">
              <ToggleGroupItem value="board" aria-label="Board view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <Table className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view">
                <CalendarIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          <AiTaskSuggester currentTasks={currentTasks} userGoal={userGoal} />
        </div>
      </div>
      
      <div className="flex-1">
        {renderView()}
      </div>
    </div>
  );
}
