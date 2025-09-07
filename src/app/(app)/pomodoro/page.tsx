
'use client';

import { PomodoroTimer } from '@/components/pomodoro-timer';

export default function PomodoroPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-3xl font-bold font-headline mb-2">Pomodoro Timer</h1>
        <p className="text-muted-foreground mb-8">Focus on your work, one session at a time.</p>
        <PomodoroTimer />
    </div>
  );
}
