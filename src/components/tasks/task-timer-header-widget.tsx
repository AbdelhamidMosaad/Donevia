
'use client';

import { useTaskTimer } from '@/hooks/use-task-timer';
import { Button } from '../ui/button';
import { Timer, Pause, ListTodo } from 'lucide-react';

export function TaskTimerHeaderWidget() {
    const { activeItem, elapsedTime, stopTimer, isActive } = useTaskTimer();

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
        <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800 p-1.5 rounded-lg">
            <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 truncate max-w-28">{activeItem.title}</span>
                <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-300">{formatTime(elapsedTime)}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 dark:text-amber-300" onClick={stopTimer}>
                <Pause />
            </Button>
        </div>
    );
}
