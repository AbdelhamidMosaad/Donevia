
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { logTimeOnTask } from '@/lib/tasks';

interface TaskTimerState {
  activeItemId: string | null;
  activeItemTitle: string | null;
  startTime: number | null; // epoch time
  isActive: boolean;
}

interface TaskTimerContextType extends TaskTimerState {
  elapsedTime: number;
  toggleTimer: (itemId: string, itemTitle: string) => void;
  stopTimer: () => void;
  activeItem: { itemId: string, title: string | null } | null;
}

const TaskTimerContext = createContext<TaskTimerContextType | undefined>(undefined);

export function useTaskTimer() {
    const context = useContext(TaskTimerContext);
    if (!context) {
        throw new Error('useTaskTimer must be used within a TaskTimerProvider');
    }
    return context;
}

export function TaskTimerProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, setState] = useState<TaskTimerState>({
        activeItemId: null,
        activeItemTitle: null,
        startTime: null,
        isActive: false,
    });
    const [elapsedTime, setElapsedTime] = useState(0);

    // Fetch initial state from Firestore
    useEffect(() => {
        if (user) {
            const stateRef = doc(db, 'users', user.uid, 'taskTimer', 'state');
            const unsubscribe = onSnapshot(stateRef, (docSnap) => {
                if (docSnap.exists()) {
                    setState(docSnap.data() as TaskTimerState);
                } else {
                    // Initialize if it doesn't exist
                    setDoc(stateRef, state);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (state.isActive && state.startTime) {
            interval = setInterval(() => {
                setElapsedTime(Date.now() - state.startTime!);
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.isActive, state.startTime]);

    const updateFirestoreState = useCallback(async (newState: Partial<TaskTimerState>) => {
        if (!user) return;
        const stateRef = doc(db, 'users', user.uid, 'taskTimer', 'state');
        await updateDoc(stateRef, newState);
    }, [user]);

    const stopTimer = useCallback(async () => {
        if (!user || !state.activeItemId || !state.startTime) return;
        
        const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        
        if (durationSeconds > 0) {
            await logTimeOnTask(user.uid, state.activeItemId, durationSeconds);
        }

        const newState: TaskTimerState = {
            activeItemId: null,
            activeItemTitle: null,
            startTime: null,
            isActive: false,
        };
        setState(newState);
        await updateFirestoreState(newState);

    }, [user, state, updateFirestoreState]);


    const toggleTimer = useCallback(async (itemId: string, itemTitle: string) => {
        if (!user) return;
        
        const isDifferentItem = state.activeItemId !== itemId;

        // If a timer is active, stop it first
        if(state.isActive) {
            const oldItemId = state.activeItemId;
            const oldStartTime = state.startTime;
            
            if(oldItemId && oldStartTime) {
                 const durationSeconds = Math.floor((Date.now() - oldStartTime) / 1000);
                 if (durationSeconds > 0) {
                    await logTimeOnTask(user.uid, oldItemId, durationSeconds);
                 }
            }
        }
        
        // If it's the same item being toggled off, or a different item was stopped
        if (!isDifferentItem && state.isActive) {
             const newState: TaskTimerState = { activeItemId: null, activeItemTitle: null, startTime: null, isActive: false };
             setState(newState);
             await updateFirestoreState(newState);
        } else {
             // Starting a new timer (or switching)
            const newState: TaskTimerState = {
                activeItemId: itemId,
                activeItemTitle: itemTitle,
                startTime: Date.now(),
                isActive: true,
            };
            setState(newState);
            await updateFirestoreState(newState);
        }
    }, [user, state, updateFirestoreState]);
    
    // Effect to handle cleanup on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            // This logic relies on the state when the event listener was added.
            if (state.isActive && state.activeItemId && state.startTime) {
                 const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
                 if (durationSeconds > 0) {
                    logTimeOnTask(user!.uid, state.activeItemId, durationSeconds);
                 }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [state.isActive, state.activeItemId, state.startTime, user]);


    const value = {
        ...state,
        activeItem: state.activeItemId ? { itemId: state.activeItemId, title: state.activeItemTitle } : null,
        elapsedTime,
        toggleTimer,
        stopTimer,
    };

    return (
        <TaskTimerContext.Provider value={value}>
            {children}
        </TaskTimerContext.Provider>
    );
}
