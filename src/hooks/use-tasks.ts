
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { Task, Stage } from '@/lib/types';
import { addTaskToDb, updateTaskInDb, deleteTaskFromDb } from '@/lib/tasks';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from './use-toast';

export function useTasks(listId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch stages for the current list
  useEffect(() => {
    if (user && listId) {
      const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribe = onSnapshot(listRef, (docSnap) => {
        if (docSnap.exists()) {
          const listData = docSnap.data();
          setStages(listData.stages?.sort((a: Stage, b: Stage) => a.order - b.order) || []);
        }
      });
      return () => unsubscribe();
    }
  }, [user, listId]);

  // Fetch tasks for the current list
  useEffect(() => {
    if (user && listId) {
      setIsLoading(true);
      const q = query(collection(db, 'users', user.uid, 'tasks'), where('listId', '==', listId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)).filter(task => !task.deleted);
        setTasks(tasksData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching tasks:", error);
        toast({ variant: 'destructive', title: 'Error loading tasks.'});
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, listId, toast]);

  const addTask = useCallback(async (newTaskData: Omit<Task, 'id'|'createdAt'|'updatedAt'|'ownerId'>) => {
    if (!user) return;
    
    // Optimistic update
    const tempId = uuidv4();
    const now = Timestamp.now();
    const optimisticTask: Task = {
        ...newTaskData,
        id: tempId,
        ownerId: user.uid,
        createdAt: now,
        updatedAt: now,
        deleted: false,
    };
    setTasks(prev => [...prev, optimisticTask]);

    try {
        const docRef = await addTaskToDb(user.uid, newTaskData);
        // Replace temp task with real one from Firestore if needed for other operations
        // This part is tricky; often the onSnapshot listener handles this automatically.
        // For now, we assume the snapshot will update the UI correctly.
    } catch (e) {
        // Revert optimistic update on failure
        setTasks(prev => prev.filter(t => t.id !== tempId));
        toast({ variant: 'destructive', title: 'Failed to add task' });
        console.error(e);
    }
  }, [user, toast]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    const originalTasks = tasks;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: Timestamp.now() } : t));

    try {
        await updateTaskInDb(user.uid, taskId, updates);
    } catch (e) {
        // Revert on failure
        setTasks(originalTasks);
        toast({ variant: 'destructive', title: 'Failed to update task' });
        console.error(e);
    }
  }, [user, tasks, toast]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return;

    const originalTasks = tasks;
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
        await deleteTaskFromDb(user.uid, taskId);
    } catch(e) {
        // Revert on failure
        setTasks(originalTasks);
        toast({ variant: 'destructive', title: 'Failed to delete task' });
        console.error(e);
    }
  }, [user, tasks, toast]);
  
  const tasksByStage = useMemo(() => {
    const initial: Record<string, Task[]> = {};
    stages.forEach(stage => initial[stage.id] = []);
    return tasks.reduce((acc, task) => {
      const stageId = task.status;
      if (acc[stageId]) {
        acc[stageId].push(task);
      } else if (!acc['uncategorized']) {
        // Handle tasks with a status that no longer exists
        acc['uncategorized'] = [task];
      } else {
        acc['uncategorized'].push(task);
      }
      return acc;
    }, initial);
  }, [tasks, stages]);


  return { tasks, stages, isLoading, addTask, updateTask, deleteTask, tasksByStage };
}
