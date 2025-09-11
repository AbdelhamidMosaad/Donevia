
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, LayoutGrid, List, Table, ArrowLeft } from 'lucide-react';
import { TaskCalendar } from '@/components/task-calendar';
import { TaskList } from '@/components/task-list';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AddTaskDialog } from '@/components/add-task-dialog';
import type { Task } from '@/lib/types';
import { collection, onSnapshot, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type View = 'calendar' | 'list' | 'board' | 'table';

export default function TaskListPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const listId = params.listId as string;

  const [view, setView] = useState<View>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [listName, setListName] = useState('');
  const [listExists, setListExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
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

      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId), where('deleted', '!=', true));
      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });
      
      return () => {
        unsubscribeList();
        unsubscribeTasks();
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
    
  if (loading || !user || listExists === null) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (listExists === false) {
    // This case is handled by the redirect, but it's a good failsafe.
    return <div>List not found. Redirecting...</div>;
  }

  const renderView = () => {
    switch (view) {
      case 'list':
        return <TaskList listId={listId} />;
      case 'board':
        return <TaskBoard listId={listId} />;
      case 'table':
        return <TaskTable listId={listId} />;
      case 'calendar':
      default:
        return <TaskCalendar listId={listId} />;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
           <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/lists')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <h1 className="text-3xl font-bold font-headline capitalize">{listName}</h1>
                <p className="text-muted-foreground">Manage your tasks for this list.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Task view">
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
          <AddTaskDialog listId={listId} onTaskAdded={() => {}}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </AddTaskDialog>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {renderView()}
      </div>
    </div>
  );
}
