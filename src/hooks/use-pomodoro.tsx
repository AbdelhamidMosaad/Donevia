
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, Timestamp, addDoc, collection } from 'firebase/firestore';
import type { PomodoroMode, PomodoroState, PomodoroSettingsData } from '@/lib/types';

interface PomodoroContextType {
    mode: PomodoroMode;
    secondsLeft: number;
    isActive: boolean;
    sessionsCompleted: number;
    settings: PomodoroSettingsData;
    isEndingSoon: boolean;
    sessionEnded: boolean;
    toggleTimer: () => void;
    resetTimer: (switchToWork?: boolean) => void;
    setMode: (newMode: PomodoroMode) => void;
    setSettings: (settings: PomodoroSettingsData) => void;
    saveSettings: (settings: PomodoroSettingsData) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function usePomodoro() {
    const context = useContext(PomodoroContext);
    if (!context) {
        throw new Error('usePomodoro must be used within a PomodoroProvider');
    }
    return context;
}

const defaultSettings: PomodoroSettingsData = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
};

export function PomodoroProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, setState] = useState<Partial<PomodoroState>>({
        ...defaultSettings,
        mode: 'work',
        isActive: false,
        sessionsCompleted: 0,
        targetEndTime: null,
    });
    const [secondsLeft, setSecondsLeft] = useState(defaultSettings.workMinutes * 60);
    const [isEndingSoon, setIsEndingSoon] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

    const getTimerDuration = useCallback((mode: PomodoroMode, settings: PomodoroSettingsData) => {
        switch (mode) {
            case 'work': return settings.workMinutes * 60;
            case 'shortBreak': return settings.shortBreakMinutes * 60;
            case 'longBreak': return settings.longBreakMinutes * 60;
        }
    }, []);

    // Effect for initializing and fetching data from Firestore
    useEffect(() => {
        if (typeof window !== 'undefined') {
            notificationAudioRef.current = new Audio('/notification.mp3');
        }

        if (user) {
            const stateRef = doc(db, 'users', user.uid, 'pomodoro', 'state');
            const unsubscribe = onSnapshot(stateRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data() as PomodoroState;
                    setState(data);
                    
                    if (data.isActive && data.targetEndTime) {
                        const remaining = Math.max(0, data.targetEndTime.toMillis() - Date.now()) / 1000;
                        setSecondsLeft(Math.round(remaining));
                    } else {
                        setSecondsLeft(getTimerDuration(data.mode, data));
                    }
                } else {
                    // No state saved, initialize with defaults
                    const initial = { ...defaultSettings, mode: 'work', isActive: false, sessionsCompleted: 0, targetEndTime: null };
                    setDoc(stateRef, initial);
                    setState(initial);
                    setSecondsLeft(defaultSettings.workMinutes * 60);
                }
            });
            return () => unsubscribe();
        }
    }, [user, getTimerDuration]);


    // Core timer countdown logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (state.isActive) {
            interval = setInterval(() => {
                const remaining = Math.max(0, (state.targetEndTime?.toMillis() ?? 0) - Date.now()) / 1000;
                const roundedRemaining = Math.round(remaining);
                setSecondsLeft(roundedRemaining);
                
                setIsEndingSoon(roundedRemaining <= 60 && state.mode === 'work');

                if (remaining <= 0) {
                   setSessionEnded(true);
                   switchMode();
                }
            }, 1000);
        } else {
            setIsEndingSoon(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [state.isActive, state.targetEndTime, state.mode]);


    const playNotificationSound = () => {
        notificationAudioRef.current?.play().catch(e => console.error("Error playing sound:", e));
    };

    const showNotification = (message: string) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        new Notification('Donevia Pomodoro', { body: message, icon: '/logo.png' });
    };

    const updateStateInFirestore = useCallback(async (newState: Partial<PomodoroState>) => {
        if (!user) return;
        const stateRef = doc(db, 'users', user.uid, 'pomodoro', 'state');
        await updateDoc(stateRef, newState);
    }, [user]);

    const switchMode = useCallback((newMode?: PomodoroMode) => {
        if (!user || !state.mode) return;
        const sessionsCompleted = state.sessionsCompleted ?? 0;

        // Play sound and show notification for session completion
        if (state.isActive) {
            playNotificationSound();
            const message = state.mode === 'work' ? 'Work session finished! Time for a break.' : 'Break is over! Time to get back to work.';
            showNotification(message);
        }
        
        let nextMode: PomodoroMode;
        let newSessionsCompleted = sessionsCompleted;

        if (newMode) {
            nextMode = newMode;
        } else {
            if (state.mode === 'work') {
                newSessionsCompleted++;
                nextMode = newSessionsCompleted % (state.longBreakInterval ?? 4) === 0 ? 'longBreak' : 'shortBreak';
                // Log completed work session
                addDoc(collection(db, 'users', user.uid, 'pomodoroHistory'), {
                    type: 'work',
                    durationMinutes: state.workMinutes,
                    completedAt: serverTimestamp() as Timestamp
                });
            } else {
                nextMode = 'work';
            }
        }
        
        const settings = state as PomodoroSettingsData;
        const newDuration = getTimerDuration(nextMode, settings);
        updateStateInFirestore({ 
            mode: nextMode, 
            isActive: false, 
            sessionsCompleted: newSessionsCompleted,
            targetEndTime: null 
        });
        setSecondsLeft(newDuration);
        setSessionEnded(true); // Flag that a session just ended
    }, [state, user, getTimerDuration, updateStateInFirestore]);

    const toggleTimer = () => {
        const newIsActive = !state.isActive;
        if (sessionEnded) {
            setSessionEnded(false);
        }

        if (newIsActive) {
            // Starting the timer
            const duration = secondsLeft > 0 ? secondsLeft : getTimerDuration(state.mode!, state as PomodoroSettingsData);
            const endTime = Timestamp.fromMillis(Date.now() + duration * 1000);
            updateStateInFirestore({ isActive: true, targetEndTime: endTime });
        } else {
            // Pausing the timer
            updateStateInFirestore({ isActive: false, targetEndTime: null }); //seconds are already updated
        }
    };
    
    const resetTimer = (switchToWork = false) => {
        const resetMode = switchToWork ? 'work' : (state.mode || 'work');
        const duration = getTimerDuration(resetMode, state as PomodoroSettingsData);
        setSecondsLeft(duration);
        updateStateInFirestore({ mode: resetMode, isActive: false, targetEndTime: null });
        setSessionEnded(false);
    };

    const setModeHandler = (newMode: PomodoroMode) => {
        if (state.mode !== newMode) {
            switchMode(newMode);
        }
    };
    
    const saveSettings = async (newSettings: PomodoroSettingsData) => {
        if (!user) return;
        const stateRef = doc(db, 'users', user.uid, 'pomodoro', 'state');
        const settingsUpdate = {
            workMinutes: newSettings.workMinutes,
            shortBreakMinutes: newSettings.shortBreakMinutes,
            longBreakMinutes: newSettings.longBreakMinutes,
            longBreakInterval: newSettings.longBreakInterval,
        };
        await updateDoc(stateRef, settingsUpdate);
        
        // If not active, update the timer display
        if (!state.isActive) {
            setSecondsLeft(getTimerDuration(state.mode!, newSettings));
        }
    };
    
    const setSettingsHandler = (newSettings: PomodoroSettingsData) => {
        setState(s => ({...s, ...newSettings}));
    }

    const value = {
        mode: state.mode || 'work',
        secondsLeft,
        isActive: state.isActive || false,
        sessionsCompleted: state.sessionsCompleted || 0,
        settings: state as PomodoroSettingsData,
        isEndingSoon,
        sessionEnded,
        toggleTimer,
        resetTimer,
        setMode: setModeHandler,
        setSettings: setSettingsHandler,
        saveSettings,
    };

    return (
        <PomodoroContext.Provider value={value}>
            {children}
        </PomodoroContext.Provider>
    );
}
