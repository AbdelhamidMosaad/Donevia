
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Task, Stage, UserSettings } from '@/lib/types';
import { useToast } from './use-toast';
import moment from 'moment';
import { Button } from '@/components/ui/button';

interface TaskReminderContextType {
    overdueTasks: Task[];
    dismissOverdueTask: (taskId: string) => void;
}

const TaskReminderContext = createContext<TaskReminderContextType | undefined>(undefined);

export function useTaskReminders() {
    const context = useContext(TaskReminderContext);
    if (!context) {
        throw new Error('useTaskReminders must be used within a TaskReminderProvider');
    }
    return context;
}

export function TaskReminderProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);
    const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
    const [settings, setSettings] = useState<Partial<UserSettings>>({ notificationSound: true });
    const remindedTasks = useRef(new Set<string>());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            }).catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
        }

    }, []);
    
    // Fetch settings
    useEffect(() => {
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
                if(docSnap.exists()) {
                    setSettings(docSnap.data());
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Fetch all stages from all lists to determine 'Done' status
    useEffect(() => {
        if(user) {
            const listsRef = collection(db, 'users', user.uid, 'taskLists');
            const unsubscribe = onSnapshot(listsRef, (snapshot) => {
                const allStages: Stage[] = [];
                snapshot.forEach(doc => {
                    const listData = doc.data();
                    if(listData.stages) {
                        allStages.push(...listData.stages);
                    }
                });
                setStages(allStages);
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Fetch all tasks
    useEffect(() => {
        if (user) {
            const tasksRef = collection(db, 'users', user.uid, 'tasks');
            const q = query(tasksRef);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
                setTasks(tasksData);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const getDoneStageIds = useCallback(() => {
        return stages.filter(s => s.name.toLowerCase() === 'done').map(s => s.id);
    }, [stages]);

    const showBrowserNotification = (task: Task) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const dueDate = moment(task.dueDate.toDate());
        const options: NotificationOptions = {
            body: `Due ${dueDate.fromNow()}.`,
            icon: '/logo.png', // Make sure you have a logo.png in your /public folder
            badge: '/badge.png', // A smaller icon for notifications
            vibrate: [200, 100, 200],
            data: { 
                taskId: task.id,
                listId: task.listId
            },
            actions: [
                { action: 'mark-as-done', title: 'Mark as Done' },
            ]
        };

        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(`Reminder: ${task.title}`, options);
        });
    }

    const dismissOverdueTask = (taskId: string) => {
        setOverdueTasks(prev => prev.filter(task => task.id !== taskId));
    };

    // Check for overdue tasks and reminders
    useEffect(() => {
        const doneStageIds = getDoneStageIds();

        const checkTasks = () => {
            const now = moment();
            const newOverdueTasks: Task[] = [];
            
            tasks.forEach(task => {
                const dueDate = moment(task.dueDate.toDate());
                const isDone = doneStageIds.includes(task.status);
                
                // Check for overdue
                if (now.isAfter(dueDate) && !isDone) {
                    newOverdueTasks.push(task);
                }

                // Check for reminders
                if (task.reminder && task.reminder !== 'none' && !isDone && !remindedTasks.current.has(task.id)) {
                    const [amount, unit] = task.reminder.endsWith('m') 
                        ? [parseInt(task.reminder), 'minutes'] 
                        : [parseInt(task.reminder), 'hours'];

                    const reminderTime = dueDate.clone().subtract(amount, unit as moment.unitOfTime.DurationConstructor);

                    if (now.isAfter(reminderTime) && now.isBefore(dueDate)) {
                        if (settings.notificationSound) {
                            audioRef.current?.play().catch(e => console.log("Audio play failed:", e));
                        }
                        showBrowserNotification(task);
                        toast({
                            title: `Reminder: ${task.title}`,
                            description: `Due in ${dueDate.fromNow(true)}.`,
                            action: (
                                <Button size="sm" onClick={async () => {
                                    if(user && doneStageIds.length > 0) {
                                       const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
                                       await updateDoc(taskRef, { status: doneStageIds[0] });
                                    }
                                }}>
                                    Mark as Done
                                </Button>
                            )
                        });
                        remindedTasks.current.add(task.id);
                    }
                }
            });
            
            setOverdueTasks(newOverdueTasks);
        };
        
        const intervalId = setInterval(checkTasks, 60000); // Check every minute
        checkTasks(); // Initial check

        return () => clearInterval(intervalId);

    }, [tasks, stages, user, toast, getDoneStageIds, settings.notificationSound]);

    const value = {
        overdueTasks,
        dismissOverdueTask
    };

    return (
        <TaskReminderContext.Provider value={value}>
            {children}
        </TaskReminderContext.Provider>
    );
}
