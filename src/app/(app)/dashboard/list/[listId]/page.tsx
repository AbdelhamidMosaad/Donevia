
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, LayoutGrid, List, Table, ArrowLeft, Loader2, BarChart3 } from 'lucide-react';
import { TaskCalendar } from '@/components/task-calendar';
import { TaskList } from '@/components/task-list';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs"
import { AddTaskDialog } from '@/components/add-task-dialog';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TasksIcon } from '@/components/icons/tools/tasks-icon';
import { useTasks } from '@/hooks/use-tasks';
import { BoardSettings } from '@/components/board-settings';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

type View = 'board' | 'list' | 'table' | 'calendar' | 'analytics';

export default function TaskListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;
  const { tasks, stages, addTask, updateTask, deleteTask, isLoading: tasksLoading } = useTasks(listId);

  const [view, setView] = useState<View>('board');
  const [listName, setListName] = useState('');
  const [listExists, setListExists] = useState<boolean | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (user && listId) {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        getDoc(settingsRef).then(docSnap => {
            if (docSnap.exists()) {
                const listViews = docSnap.data().listViews || {};
                if (listViews[listId]) {
                    setView(listViews[listId]);
                }
            }
        });

      const listDocRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribeList = onSnapshot(listDocRef, (doc) => {
        if (doc.exists()) {
          setListName(doc.data().name);
          setListExists(true);
        } else {
          // Handle case where list doesn't exist, maybe redirect
          setListExists(false);
          router.push('/dashboard/lists');
        }
      });
      
      return () => {
        unsubscribeList();
      }
    }
  }, [user, listId, router]);

  const handleViewChange = async (newView: View) => {
    if (newView && user) {
        setView(newView);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { 
            listViews: {
                [listId]: newView
            }
        }, { merge: true });
    }
  };
    
  if (authLoading || !user || listExists === null) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="ml-2">Loading List...</p>
        </div>
    );
  }

  if (listExists === false) {
    // This case is handled by the redirect, but it's a good failsafe.
    return <div>List not found. Redirecting...</div>;
  }

  const renderView = (currentView: View) => {
    if (tasksLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="ml-2">Loading tasks...</p>
        </div>
      );
    }
    switch (currentView) {
      case 'list':
        return <TaskList tasks={tasks} stages={stages} onDeleteTask={deleteTask} onUpdateTask={updateTask} />;
      case 'board':
        return <TaskBoard listId={listId} />;
      case 'table':
        return <TaskTable listId={listId} tasks={tasks} stages={stages} />;
      case 'calendar':
        return <TaskCalendar listId={listId} tasks={tasks} onUpdateTask={updateTask} />;
      case 'analytics':
        return <AnalyticsDashboard tasks={tasks} stages={stages} />;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/lists')}><ArrowLeft /></Button>
            <div>
                 <div className="flex items-center gap-2">
                    <TasksIcon className="h-7 w-7 text-primary" />
                    <h1 className="text-3xl font-bold font-headline capitalize">{listName}</h1>
                </div>
                <p className="text-muted-foreground">Manage your tasks for this list.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {view === 'board' && <BoardSettings listId={listId} currentStages={stages} />}
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle />
              New Task
            </Button>
        </div>
      </div>
      
       <Tabs value={view} onValueChange={(v) => handleViewChange(v as View)} className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="board"><LayoutGrid /> Board</TabsTrigger>
            <TabsTrigger value="list"><List /> List</TabsTrigger>
            <TabsTrigger value="table"><Table /> Table</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarIcon /> Calendar</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 /> Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="flex-1 mt-4 overflow-y-auto">{renderView('board')}</TabsContent>
          <TabsContent value="list" className="flex-1 mt-4 overflow-y-auto">{renderView('list')}</TabsContent>
          <TabsContent value="table" className="flex-1 mt-4 overflow-y-auto">{renderView('table')}</TabsContent>
          <TabsContent value="calendar" className="flex-1 mt-4 overflow-y-auto">{renderView('calendar')}</TabsContent>
          <TabsContent value="analytics" className="flex-1 mt-4 overflow-y-auto">{renderView('analytics')}</TabsContent>
       </Tabs>

       <AddTaskDialog 
          listId={listId} 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
          onTaskAdded={addTask} 
          onTaskUpdated={updateTask}
        />
    </div>
  );
}

