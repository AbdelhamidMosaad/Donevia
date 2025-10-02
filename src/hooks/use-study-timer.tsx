
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { logStudySession } from '@/lib/study-tracker';

interface StudyTimerState {
  activeSubtopicId: string | null;
  activeSubtopicTitle: string | null;
  startTime: number | null; // epoch time
  isActive: boolean;
}

interface StudyTimerContextType extends StudyTimerState {
  elapsedTime: number;
  toggleTimer: (subtopicId: string, subtopicTitle: string) => void;
  stopTimer: () => void;
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
        activeSubtopicId: null,
        activeSubtopicTitle: null,
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
        if (!user || !state.activeSubtopicId || !state.startTime) return;
        
        const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        
        await logStudySession(user.uid, state.activeSubtopicId, durationSeconds);

        const newState: StudyTimerState = {
            activeSubtopicId: null,
            activeSubtopicTitle: null,
            startTime: null,
            isActive: false,
        };
        setState(newState);
        await updateFirestoreState(newState);

    }, [user, state, updateFirestoreState]);


    const toggleTimer = useCallback(async (subtopicId: string, subtopicTitle: string) => {
        if (!user) return;
        
        const isDifferentSubtopic = state.activeSubtopicId !== subtopicId;

        // If a timer is active, stop it first
        if(state.isActive) {
            const oldSubtopicId = state.activeSubtopicId;
            const oldStartTime = state.startTime;
            
            if(oldSubtopicId && oldStartTime) {
                 const durationSeconds = Math.floor((Date.now() - oldStartTime) / 1000);
                 await logStudySession(user.uid, oldSubtopicId, durationSeconds);
            }
        }
        
        // If it's the same subtopic being toggled off, or a different subtopic was stopped
        if (!isDifferentSubtopic && state.isActive) {
             const newState: StudyTimerState = { activeSubtopicId: null, activeSubtopicTitle: null, startTime: null, isActive: false };
             setState(newState);
             await updateFirestoreState(newState);
        } else {
             // Starting a new timer (or switching)
            const newState: StudyTimerState = {
                activeSubtopicId: subtopicId,
                activeSubtopicTitle: subtopicTitle,
                startTime: Date.now(),
                isActive: true,
            };
            setState(newState);
            await updateFirestoreState(newState);
        }
    }, [user, state, updateFirestoreState, logStudySession]);


    const value = {
        ...state,
        activeSubtopic: state.activeSubtopicId ? { subtopicId: state.activeSubtopicId, title: state.activeSubtopicTitle } : null,
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

