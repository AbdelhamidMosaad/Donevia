
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { logStudySession } from '@/lib/study-tracker';

interface StudyTimerState {
  activeItemId: string | null;
  activeItemTitle: string | null;
  activeItemType: 'topic' | 'chapter' | null;
  startTime: number | null; // epoch time
  isActive: boolean;
}

interface StudyTimerContextType extends StudyTimerState {
  elapsedTime: number;
  toggleTimer: (itemId: string, itemTitle: string, itemType: 'topic' | 'chapter') => void;
  stopTimer: () => void;
  activeItem: { itemId: string, title: string | null } | null;
}

const StudyTimerContext = createContext<StudyTimerContextType | undefined>(undefined);

export function useStudyTimer() {
    const context = useContext(StudyTimerContext);
    if (!context) {
        throw new Error('useStudyTimer must be used within a StudyTimerProvider');
    }
    return context;
}

export function StudyTimerProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, setState] = useState<StudyTimerState>({
        activeItemId: null,
        activeItemTitle: null,
        activeItemType: null,
        startTime: null,
        isActive: false,
    });
    const [elapsedTime, setElapsedTime] = useState(0);

    // Fetch initial state from Firestore
    useEffect(() => {
        if (user) {
            const stateRef = doc(db, 'users', user.uid, 'studyTimer', 'state');
            const unsubscribe = onSnapshot(stateRef, (docSnap) => {
                if (docSnap.exists()) {
                    setState(docSnap.data() as StudyTimerState);
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

    const updateFirestoreState = useCallback(async (newState: Partial<StudyTimerState>) => {
        if (!user) return;
        const stateRef = doc(db, 'users', user.uid, 'studyTimer', 'state');
        await updateDoc(stateRef, newState);
    }, [user]);

    const stopTimer = useCallback(async () => {
        if (!user || !state.activeItemId || !state.startTime || !state.activeItemType) return;
        
        const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        
        await logStudySession(user.uid, state.activeItemId, state.activeItemType, durationSeconds);

        const newState: StudyTimerState = {
            activeItemId: null,
            activeItemTitle: null,
            activeItemType: null,
            startTime: null,
            isActive: false,
        };
        setState(newState);
        await updateFirestoreState(newState);

    }, [user, state, updateFirestoreState]);


    const toggleTimer = useCallback(async (itemId: string, itemTitle: string, itemType: 'topic' | 'chapter') => {
        if (!user) return;
        
        const isDifferentItem = state.activeItemId !== itemId;

        // If a timer is active, stop it first
        if(state.isActive) {
            const oldItemId = state.activeItemId;
            const oldItemType = state.activeItemType;
            const oldStartTime = state.startTime;
            
            if(oldItemId && oldStartTime && oldItemType) {
                 const durationSeconds = Math.floor((Date.now() - oldStartTime) / 1000);
                 await logStudySession(user.uid, oldItemId, oldItemType, durationSeconds);
            }
        }
        
        // If it's the same item being toggled off, or a different item was stopped
        if (!isDifferentItem && state.isActive) {
             const newState: StudyTimerState = { activeItemId: null, activeItemTitle: null, activeItemType: null, startTime: null, isActive: false };
             setState(newState);
             await updateFirestoreState(newState);
        } else {
             // Starting a new timer (or switching)
            const newState: StudyTimerState = {
                activeItemId: itemId,
                activeItemTitle: itemTitle,
                activeItemType: itemType,
                startTime: Date.now(),
                isActive: true,
            };
            setState(newState);
            await updateFirestoreState(newState);
        }
    }, [user, state, updateFirestoreState, logStudySession]);
    
    // Effect to handle cleanup on page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            // This logic relies on the state when the event listener was added.
            if (state.isActive && state.activeItemId && state.startTime && state.activeItemType) {
                 const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
                 logStudySession(user!.uid, state.activeItemId, state.activeItemType, durationSeconds);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [state.isActive, state.activeItemId, state.activeItemType, state.startTime, user]);


    const value = {
        ...state,
        activeItem: state.activeItemId ? { itemId: state.activeItemId, title: state.activeItemTitle } : null,
        elapsedTime,
        toggleTimer,
        stopTimer,
    };

    return (
        <StudyTimerContext.Provider value={value}>
            {children}
        </StudyTimerContext.Provider>
    );
}
