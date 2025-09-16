
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { TaskList, Stage } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, writeBatch, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { TaskListCardView } from '@/components/task-list-card-view';
import { TaskListListView } from '@/components/task-list-list-view';
import { TasksIcon } from '@/components/icons/tools/tasks-icon';
import { v4 as uuidv4 } from 'uuid';


type View = 'card' | 'list';

const defaultStages: Stage[] = [
    { id: uuidv4(), name: 'Backlog', order: 0 },
    { id: uuidv4(), name: 'To Do', order: 1 },
    { id: uuidv4(), name: 'In Progress', order: 2 },
    { id: uuidv4(), name: 'Done', order: 3 },
];

export default function TaskListsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().taskListsView) {
          setView(docSnap.data().taskListsView);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'taskLists'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskList));
        setTaskLists(listsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleViewChange = (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            setDoc(settingsRef, { taskListsView: newView }, { merge: true });
        }
    }
  }
  
    const handleDeleteList = async (listId: string) => {
    if (!user) return;

    try {
      const batch = writeBatch(db);

      // Delete the task list document
      const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
      batch.delete(listRef);

      // Query for all tasks in that list
      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      const q = query(tasksRef, where('listId', '==', listId));
      const tasksSnapshot = await getDocs(q);

      // Delete all tasks in the list
      tasksSnapshot.forEach((taskDoc) => {
        batch.delete(taskDoc.ref);
      });

      await batch.commit();
      toast({
        title: '✓ List Deleted',
        description: 'The list and all its tasks have been deleted.',
      });
    } catch (e) {
      console.error('Error deleting list and its tasks: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task list. Please try again.',
      });
    }
  };


  const handleAddList = async () => {
    if (!user) return;
    try {
      const newListRef = await addDoc(collection(db, 'users', user.uid, 'taskLists'), {
        name: 'Untitled List',
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        stages: defaultStages,
      });

      // Set the default view for this new list to 'board'
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      await setDoc(settingsRef, { 
          listViews: {
              [newListRef.id]: 'board'
          }
      }, { merge: true });

      toast({
        title: '✓ List Added',
        description: `"Untitled List" has been added.`,
      });
      router.push(`/dashboard/list/${newListRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add task list. Please try again.',
      });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <TasksIcon className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Task Lists</h1>
                <p className="text-muted-foreground">Organize your tasks into lists.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Task list view">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={handleAddList}>
              <PlusCircle />
              New List
            </Button>
        </div>
      </div>
      
      <div className="flex-1">
        {view === 'card' ? (
          <TaskListCardView taskLists={taskLists} onDelete={handleDeleteList} />
        ) : (
          <TaskListListView taskLists={taskLists} onDelete={handleDeleteList} />
        )}
      </div>
    </div>
  );
}
