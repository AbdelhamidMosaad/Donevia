
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { logStudySession } from '@/lib/study-tracker';

interface StudyTimerState {
  activeTopicId: string | null;
  activeTopicTitle: string | null;
  startTime: number | null; // epoch time
  isActive: boolean;
}

interface StudyTimerContextType extends StudyTimerState {
  elapsedTime: number;
  toggleTimer: (topicId: string, topicTitle: string) => void;
  stopTimer: () => void;
  activeTopic: { topicId: string, title: string | null } | null;
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
        activeTopicId: null,
        activeTopicTitle: null,
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
        if (!user || !state.activeTopicId || !state.startTime) return;
        
        const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        
        await logStudySession(user.uid, state.activeTopicId, durationSeconds);

        const newState: StudyTimerState = {
            activeTopicId: null,
            activeTopicTitle: null,
            startTime: null,
            isActive: false,
        };
        setState(newState);
        await updateFirestoreState(newState);

    }, [user, state, updateFirestoreState]);


    const toggleTimer = useCallback(async (topicId: string, topicTitle: string) => {
        if (!user) return;
        
        const isDifferentTopic = state.activeTopicId !== topicId;

        // If a timer is active, stop it first
        if(state.isActive) {
            const oldTopicId = state.activeTopicId;
            const oldStartTime = state.startTime;
            
            if(oldTopicId && oldStartTime) {
                 const durationSeconds = Math.floor((Date.now() - oldStartTime) / 1000);
                 await logStudySession(user.uid, oldTopicId, durationSeconds);
            }
        }
        
        // If it's the same topic being toggled off, or a different topic was stopped
        if (!isDifferentTopic && state.isActive) {
             const newState: StudyTimerState = { activeTopicId: null, activeTopicTitle: null, startTime: null, isActive: false };
             setState(newState);
             await updateFirestoreState(newState);
        } else {
             // Starting a new timer (or switching)
            const newState: StudyTimerState = {
                activeTopicId: topicId,
                activeTopicTitle: topicTitle,
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
            // A more robust solution might involve reading directly from a ref
            // if state updates aren't guaranteed to be flushed.
            if (state.isActive && state.activeTopicId && state.startTime) {
                 const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
                 logStudySession(user!.uid, state.activeTopicId, durationSeconds);
                 // We don't need to update state or firestore here as the session is ending.
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [state.isActive, state.activeTopicId, state.startTime, user]);


    const value = {
        ...state,
        activeTopic: state.activeTopicId ? { topicId: state.activeTopicId, title: state.activeTopicTitle } : null,
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
