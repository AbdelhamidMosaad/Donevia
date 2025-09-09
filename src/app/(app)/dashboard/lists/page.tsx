
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { TaskList } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, writeBatch, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TaskListCardView } from '@/components/task-list-card-view';
import { TaskListListView } from '@/components/task-list-list-view';
import { useToast } from '@/hooks/use-toast';


type View = 'card' | 'list';

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
      const docRef = await addDoc(collection(db, 'users', user.uid, 'taskLists'), {
        name: 'Untitled List',
        createdAt: Timestamp.now(),
      });
      toast({
        title: '✓ List Added',
        description: `"Untitled List" has been added.`,
      });
      router.push(`/dashboard/list/${docRef.id}`);
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
        <div>
            <h1 className="text-3xl font-bold font-headline">Task Lists</h1>
            <p className="text-muted-foreground">Organize your tasks into lists.</p>
        </div>
        <div className="flex items-center gap-2">
           <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Task list view">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={handleAddList}>
              <PlusCircle className="mr-2 h-4 w-4" />
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
