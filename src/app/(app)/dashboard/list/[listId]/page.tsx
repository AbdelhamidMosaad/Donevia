
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, LayoutGrid, List, Table } from 'lucide-react';
import { TaskCalendar } from '@/components/task-calendar';
import { TaskList } from '@/components/task-list';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AddTaskDialog } from '@/components/add-task-dialog';
import type { Task } from '@/lib/types';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
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
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && listId) {
      const listDocRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribeList = onSnapshot(listDocRef, (doc) => {
        if (doc.exists()) {
          setListName(doc.data().name);
        } else {
          // Handle case where list doesn't exist, maybe redirect
          router.push('/dashboard');
        }
      });

      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId));
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

    
  if (loading || !user) {
    return <div>Loading...</div>; // Or a spinner component
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
        <div>
            <h1 className="text-3xl font-bold font-headline capitalize">{listName}</h1>
            <p className="text-muted-foreground">Manage your tasks for this list.</p>
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
          <AddTaskDialog listId={listId} defaultStatus="todo">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </AddTaskDialog>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto">
        {renderView()}
      </div>
    </div>
  );
}
