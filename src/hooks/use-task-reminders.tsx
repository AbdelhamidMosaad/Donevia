
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Task, Stage, UserSettings } from '@/lib/types';
import { useToast } from './use-toast';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { useTasks } from './use-tasks';

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

const getRemindedTasksFromStorage = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    const stored = localStorage.getItem('remindedTasks');
    return stored ? new Set(JSON.parse(stored)) : new Set();
};

const saveRemindedTasksToStorage = (remindedSet: Set<string>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('remindedTasks', JSON.stringify(Array.from(remindedSet)));
};


export function TaskReminderProvider({ children }: { children: ReactNode }) {
    const { user, settings } = useAuth();
    const { toast } = useToast();
    const { tasks, stages } = useTasks();
    const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
    const [dismissedTaskIds, setDismissedTaskIds] = useState<Set<string>>(new Set());
    
    const remindedTasks = useRef<Set<string>>(getRemindedTasksFromStorage());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
        }

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller === null) {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            }).catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
        }
    }, []);
    
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
                listId: task.listId // listId is deprecated but kept for compatibility
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
        setDismissedTaskIds(prev => new Set(prev).add(taskId));
        setOverdueTasks(prev => prev.filter(task => task.id !== taskId));
    };

    // Check for overdue tasks and reminders
    useEffect(() => {
        const doneStageIds = getDoneStageIds();

        const checkTasks = () => {
            const now = moment();
            
            const newOverdueTasks = tasks.filter(task => {
                const isDone = doneStageIds.includes(task.status);
                const isOverdue = moment(task.dueDate.toDate()).isBefore(now, 'day');
                return isOverdue && !isDone && !dismissedTaskIds.has(task.id);
            });
            setOverdueTasks(newOverdueTasks);
            
            tasks.forEach(task => {
                const isDone = doneStageIds.includes(task.status);
                if (isDone) return;

                const dueDate = moment(task.dueDate.toDate());
                const reminderId = `${task.id}-${dueDate.format('YYYYMMDD')}`;

                if (task.reminder && task.reminder !== 'none' && !remindedTasks.current.has(reminderId)) {
                    const [amount, unit] = task.reminder.endsWith('m') 
                        ? [parseInt(task.reminder), 'minutes'] 
                        : [parseInt(task.reminder), 'hours'];

                    const reminderTime = dueDate.clone().subtract(amount, unit as moment.unitOfTime.DurationConstructor);

                    if (now.isSame(reminderTime, 'minute')) {
                        if (settings.notificationSound) {
                            audioRef.current?.play().catch(e => console.log("Audio play failed:", e));
                        }
                        showBrowserNotification(task);
                        toast({
                            title: `Reminder: ${task.title}`,
                            description: `Due ${dueDate.fromNow(true)}.`,
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
                        remindedTasks.current.add(reminderId);
                        saveRemindedTasksToStorage(remindedTasks.current);
                    }
                }
            });
        };
        
        checkTasks();

        const intervalId = setInterval(checkTasks, 60000); 

        return () => clearInterval(intervalId);

    }, [tasks, stages, user, toast, getDoneStageIds, settings.notificationSound, dismissedTaskIds]);

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
