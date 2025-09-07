
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
import { usePomodoro } from '@/hooks/use-pomodoro';

export function PomodoroTimer() {
    const {
        mode,
        secondsLeft,
        isActive,
        sessionsCompleted,
        settings,
        toggleTimer,
        resetTimer,
        setMode,
        saveSettings
    } = usePomodoro();
    
    const getTimerDuration = useCallback(() => {
        switch (mode) {
            case 'work': return settings.workMinutes * 60;
            case 'shortBreak': return settings.shortBreakMinutes * 60;
            case 'longBreak': return settings.longBreakMinutes * 60;
        }
    }, [mode, settings]);

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
                 <PomodoroSettings onSave={saveSettings} currentSettings={settings}>
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
