
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { PomodoroSettings } from './pomodoro-settings';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettingsData {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
}

const defaultSettings: PomodoroSettingsData = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
};

export function PomodoroTimer() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<PomodoroSettingsData>(defaultSettings);
    const [mode, setMode] = useState<PomodoroMode>('work');
    const [isActive, setIsActive] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(settings.workMinutes * 60);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

    const getTimerDuration = useCallback(() => {
        switch (mode) {
            case 'work': return settings.workMinutes * 60;
            case 'shortBreak': return settings.shortBreakMinutes * 60;
            case 'longBreak': return settings.longBreakMinutes * 60;
        }
    }, [mode, settings]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            notificationAudioRef.current = new Audio('/notification.mp3');
        }
    }, []);

    useEffect(() => {
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'pomodoro', 'settings');
            const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as PomodoroSettingsData);
                } else {
                    setDoc(settingsRef, defaultSettings);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    useEffect(() => {
        setSecondsLeft(getTimerDuration());
    }, [settings, mode, getTimerDuration]);

    const playNotificationSound = () => {
        notificationAudioRef.current?.play().catch(e => console.error("Error playing sound:", e));
    };

    const showNotification = (message: string) => {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', { body: message, icon: '/logo.png' });
        }
    };

    const switchMode = useCallback(() => {
        let nextMode: PomodoroMode;
        if (mode === 'work') {
            const newSessionsCompleted = sessionsCompleted + 1;
            setSessionsCompleted(newSessionsCompleted);
            if (user) {
                addDoc(collection(db, 'users', user.uid, 'pomodoroHistory'), {
                    type: 'work',
                    durationMinutes: settings.workMinutes,
                    completedAt: serverTimestamp() as Timestamp
                });
            }
            nextMode = newSessionsCompleted % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
        } else {
            nextMode = 'work';
        }
        setMode(nextMode);
        setIsActive(false);
    }, [mode, sessionsCompleted, settings, user]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(s => s - 1);
            }, 1000);
        } else if (isActive && secondsLeft === 0) {
            playNotificationSound();
            const message = mode === 'work' ? 'Work session finished! Time for a break.' : 'Break is over! Time to get back to work.';
            showNotification(message);
            switchMode();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, secondsLeft, mode, switchMode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setSecondsLeft(getTimerDuration());
    };

    const handleSettingsSave = (newSettings: PomodoroSettingsData) => {
        setSettings(newSettings);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'pomodoro', 'settings');
            setDoc(settingsRef, newSettings);
        }
        if (!isActive) {
            setSecondsLeft(newSettings.workMinutes * 60);
        }
    };

    const percentage = (secondsLeft / getTimerDuration()) * 100;
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    const modeColors = {
        work: '#3399FF', // primary
        shortBreak: '#10B981', // green-500
        longBreak: '#8040FF' // accent
    }

    return (
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card shadow-xl w-full max-w-md">
            <div className="w-64 h-64">
                <CircularProgressbar
                    value={percentage}
                    text={`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}
                    styles={buildStyles({
                        textColor: 'hsl(var(--foreground))',
                        pathColor: modeColors[mode],
                        trailColor: 'hsl(var(--muted))',
                        textSize: '20px',
                    })}
                />
            </div>
            <div className="flex items-center gap-4">
                <Button onClick={toggleTimer} size="lg" className="w-32">
                    {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={resetTimer} variant="outline" size="lg">
                    <RotateCcw className="mr-2" /> Reset
                </Button>
                 <PomodoroSettings onSave={handleSettingsSave} currentSettings={settings}>
                    <Button variant="ghost" size="icon">
                        <Settings />
                    </Button>
                </PomodoroSettings>
            </div>
             <p className="text-sm text-muted-foreground">
                {mode === 'work' ? `Completed Sessions: ${sessionsCompleted}` : 'Enjoy your break!'}
            </p>
        </div>
    );
}
