
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { Task, Stage, UserSettings } from '@/lib/types';
import { addTaskToDb, updateTaskInDb, deleteTaskFromDb } from '@/lib/tasks';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';


export function useTasks() {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch stages and categories from settings
  useEffect(() => {
    if (settings.taskSettings) {
      if (settings.taskSettings.stages) {
        setStages(settings.taskSettings.stages.sort((a,b) => a.order - b.order));
      }
      if (settings.taskSettings.categories) {
        setCategories(settings.taskSettings.categories);
      }
    }
  }, [settings.taskSettings]);

  // Fetch all tasks for the user
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const q = query(collection(db, 'users', user.uid, 'tasks'));
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
  }, [user, toast]);

  const addTask = useCallback(async (newTaskData: Omit<Task, 'id'|'createdAt'|'updatedAt'|'ownerId'>) => {
    if (!user) return null;
    
    try {
        const newDocRef = await addTaskToDb(user.uid, newTaskData);
        const optimisticTask: Task = {
            ...newTaskData,
            id: newDocRef.id,
            ownerId: user.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            deleted: false,
        };
        setTasks(prev => [...prev, optimisticTask]);
        return optimisticTask;
    } catch (e) {
        toast({ variant: 'destructive', title: 'Failed to add task' });
        console.error(e);
        return null;
    }
  }, [user, toast]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: Timestamp.now() } : t));

    try {
        await updateTaskInDb(user.uid, taskId, updates);
    } catch (e) {
        // Revert on failure by re-fetching. A more robust solution would store original task state.
        const originalTask = tasks.find(t => t.id === taskId);
        setTasks(prev => prev.map(t => t.id === taskId ? (originalTask || t) : t));
        toast({ variant: 'destructive', title: 'Failed to update task' });
        console.error(e);
    }
  }, [user, tasks, toast]);
  
  const updateStages = useCallback(async (newStages: Stage[]) => {
      setStages(newStages); // Optimistic update
      // The saving logic is handled in BoardSettings component
  }, []);

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

  return { tasks, stages, categories, isLoading, addTask, updateTask, deleteTask, updateStages };
}
