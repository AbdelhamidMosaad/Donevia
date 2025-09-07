
'use client';

import { usePomodoro } from '@/hooks/use-pomodoro';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Timer, Play, Pause, RotateCcw, Settings, Coffee, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function PomodoroHeaderWidget() {
    const { mode, secondsLeft, isActive, toggleTimer, resetTimer, setMode } = usePomodoro();
    const router = useRouter();

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    
    const modeIcons = {
        work: <Brain className="h-4 w-4" />,
        shortBreak: <Coffee className="h-4 w-4" />,
        longBreak: <Coffee className="h-4 w-4" />,
    }

    const modeStyles = {
        work: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        shortBreak: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800',
        longBreak: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    }
    
    const modeStyle = modeStyles[mode] || 'bg-background';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("transition-colors", isActive ? `${modeStyle} animate-pulse` : '')}>
                    <Timer className="mr-2 h-4 w-4" />
                    {`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                    {modeIcons[mode]}
                    <span>
                        {mode === 'work' && 'Work Session'}
                        {mode === 'shortBreak' && 'Short Break'}
                        {mode === 'longBreak' && 'Long Break'}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={toggleTimer}>
                        {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        <span>{isActive ? 'Pause' : 'Start'}</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={resetTimer}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        <span>Reset</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Switch Mode</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setMode('work')} disabled={mode === 'work'}>
                        <Brain className="mr-2 h-4 w-4" />
                        <span>Work</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMode('shortBreak')} disabled={mode === 'shortBreak'}>
                        <Coffee className="mr-2 h-4 w-4" />
                        <span>Short Break</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setMode('longBreak')} disabled={mode === 'longBreak'}>
                        <Coffee className="mr-2 h-4 w-4" />
                        <span>Long Break</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/pomodoro')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
