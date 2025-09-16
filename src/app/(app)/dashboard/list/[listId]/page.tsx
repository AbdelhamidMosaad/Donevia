
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, LayoutGrid, List, Table, ArrowLeft, Loader2 } from 'lucide-react';
import { TaskCalendar } from '@/components/task-calendar';
import { TaskList } from '@/components/task-list';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AddTaskDialog } from '@/components/add-task-dialog';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TasksIcon } from '@/components/icons/tools/tasks-icon';
import { useTasks } from '@/hooks/use-tasks';
import { BoardSettings } from '@/components/board-settings';

type View = 'calendar' | 'list' | 'board' | 'table';

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

  const renderView = () => {
    if (tasksLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="ml-2">Loading tasks...</p>
        </div>
      );
    }
    switch (view) {
      case 'list':
        return <TaskList tasks={tasks} stages={stages} onDeleteTask={deleteTask} onUpdateTask={updateTask} />;
      case 'board':
        return <TaskBoard listId={listId} />;
      case 'table':
        return <TaskTable listId={listId} tasks={tasks} stages={stages} />;
      case 'calendar':
      default:
        return <TaskCalendar listId={listId} tasks={tasks} onUpdateTask={updateTask} />;
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
           <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Task view">
              <ToggleGroupItem value="board" aria-label="Board view">
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view">
                <Table />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar view">
                <CalendarIcon />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle />
              New Task
            </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {renderView()}
      </div>
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
