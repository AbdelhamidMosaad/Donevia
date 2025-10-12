
'use client';

import { useStudyTimer } from '@/hooks/use-study-timer';
import { Button } from '../ui/button';
import { Timer, Pause, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StudyTimerHeaderWidget() {
    const { activeItem, elapsedTime, stopTimer, isActive } = useStudyTimer();

    if (!isActive || !activeItem) {
        return null;
    }

    const formatTime = (totalMilliseconds: number) => {
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const parts = [];
        if (hours > 0) parts.push(String(hours).padStart(2, '0'));
        parts.push(String(minutes).padStart(2, '0'));
        parts.push(String(seconds).padStart(2, '0'));
        
        return parts.join(':');
    };

    return (
        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 p-1.5 rounded-lg">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-200 truncate max-w-28">{activeItem.title}</span>
                <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-300">{formatTime(elapsedTime)}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 dark:text-blue-300" onClick={stopTimer}>
                <Pause />
            </Button>
        </div>
    );
}
