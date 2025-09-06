
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Task, Stage } from '@/lib/types';
import { useToast } from './use-toast';
import moment from 'moment';
import { Button } from '@/components/ui/button';

interface TaskReminderContextType {
    overdueTasks: Task[];
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
    const remindedTasks = useRef(new Set<string>());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
        }
    }, []);
    
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
                        audioRef.current?.play().catch(e => console.log("Audio play failed:", e));
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

    }, [tasks, stages, user, toast, getDoneStageIds]);

    const value = {
        overdueTasks
    };

    return (
        <TaskReminderContext.Provider value={value}>
            {children}
        </TaskReminderContext.Provider>
    );
}
