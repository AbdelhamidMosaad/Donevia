
'use client';

import { useState, useEffect, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Save } from 'lucide-react';

interface PomodoroSettingsData {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
}

interface PomodoroSettingsProps {
    children: ReactNode;
    onSave: (settings: PomodoroSettingsData) => void;
    currentSettings: PomodoroSettingsData;
}

export function PomodoroSettings({ children, onSave, currentSettings }: PomodoroSettingsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState(currentSettings);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings]);

    const handleSave = () => {
        onSave(settings);
        setIsOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pomodoro Settings</DialogTitle>
                    <DialogDescription>
                        Customize your session durations and intervals.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="workMinutes" className="text-right">
                            Work
                        </Label>
                        <Input
                            id="workMinutes"
                            name="workMinutes"
                            type="number"
                            value={settings.workMinutes}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="shortBreakMinutes" className="text-right">
                            Short Break
                        </Label>
                        <Input
                            id="shortBreakMinutes"
                            name="shortBreakMinutes"
                            type="number"
                            value={settings.shortBreakMinutes}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="longBreakMinutes" className="text-right">
                            Long Break
                        </Label>
                        <Input
                            id="longBreakMinutes"
                            name="longBreakMinutes"
                            type="number"
                            value={settings.longBreakMinutes}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="longBreakInterval" className="text-right">
                            Long Break Interval
                        </Label>
                        <Input
                            id="longBreakInterval"
                            name="longBreakInterval"
                            type="number"
                            value={settings.longBreakInterval}
                            onChange={handleChange}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>
                        <Save />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
