
'use client';

import { useCallback } from 'react';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { usePomodoro } from '@/hooks/use-pomodoro';
import { Card, CardContent } from './ui/card';
import { PomodoroIcon } from './icons/tools/pomodoro-icon';
import { cn } from '@/lib/utils';


export function PomodoroTimer() {
    const {
        mode,
        secondsLeft,
        isActive,
        sessionsCompleted,
        settings,
        toggleTimer,
        resetTimer,
        sessionEnded,
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
        work: 'hsl(var(--primary))',
        shortBreak: '#10B981', // green-500
        longBreak: 'hsl(var(--accent))'
    }
    
    const getDisplayText = () => {
        if (sessionEnded) {
            return "Done!";
        }
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <Card className="w-full max-w-sm text-center bg-card/60 backdrop-blur-sm shadow-xl border-white/20 p-8">
            <CardContent className="p-0">
                <div className="relative w-64 h-64 mx-auto mb-6">
                    <CircularProgressbar
                        value={sessionEnded ? 100 : percentage}
                        styles={buildStyles({
                            pathColor: sessionEnded ? '#4ade80' : modeColors[mode],
                            trailColor: 'hsl(var(--muted))',
                            pathTransitionDuration: 0.5
                        })}
                        strokeWidth={6}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <PomodoroIcon className="w-24 h-24" />
                         <p className={cn(
                             "text-4xl font-bold font-mono transition-colors duration-500",
                             isActive && "text-foreground",
                             sessionEnded && "text-green-500"
                         )}>
                            {getDisplayText()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <Button onClick={toggleTimer} size="lg" className="w-36">
                        {isActive ? <Pause /> : <Play />}
                        {sessionEnded ? (mode === 'work' ? 'Start Work' : 'Start Break') : (isActive ? 'Pause' : 'Start')}
                    </Button>
                    <Button onClick={() => resetTimer()} variant="outline" size="lg">
                        <RotateCcw /> Reset
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                    {mode === 'work' ? `Completed Sessions: ${sessionsCompleted}` : 'Enjoy your break!'}
                </p>
            </CardContent>
        </Card>
    );
}
