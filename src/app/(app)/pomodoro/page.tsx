
'use client';

import { PomodoroTimer } from '@/components/pomodoro-timer';
import { usePomodoro } from '@/hooks/use-pomodoro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { PomodoroSettings } from '@/components/pomodoro-settings';
import { Button } from '@/components/ui/button';
import { PomodoroIcon } from '@/components/icons/tools/pomodoro-icon';

export default function PomodoroPage() {
    const { settings, setSettings, saveSettings } = usePomodoro();

    const handleSettingsSave = (newSettings: any) => {
        setSettings(newSettings);
        saveSettings(newSettings);
    };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex items-center gap-4">
        <PomodoroIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Pomodoro Timer</h1>
          <p className="text-muted-foreground">Improve your focus with a built-in time management tool.</p>
        </div>
      </div>
        <div className="grid md:grid-cols-2 gap-8 items-center justify-center h-full">
            <div className="flex justify-center">
                <PomodoroTimer />
            </div>
            <div className="flex justify-center">
                <Card className="w-full max-w-lg text-center bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                        <PomodoroIcon className="h-16 w-16 text-primary" />
                        </div>
                        <CardTitle className="mt-4 font-headline text-2xl">Pomodoro Timer Settings</CardTitle>
                        <CardDescription>Configure your sessions. The timer is always accessible from the top-right of your screen.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PomodoroSettings onSave={handleSettingsSave} currentSettings={settings}>
                        <Button>
                            <Settings />
                            Open Settings
                            </Button>
                        </PomodoroSettings>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
