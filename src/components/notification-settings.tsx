
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface NotificationSettingsProps {
    soundEnabled: boolean;
    onSoundChange: (enabled: boolean) => void;
}

export function NotificationSettings({ soundEnabled, onSoundChange }: NotificationSettingsProps) {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notification');
            return;
        }
        Notification.requestPermission().then((result) => {
            setPermission(result);
            if (result === 'granted') {
                 new Notification('Notifications Enabled!', { body: "You'll now receive reminders." });
            }
        });
    };

    if (!('Notification' in window)) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell /> Notifications</CardTitle>
                <CardDescription>Manage how you receive reminders and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {permission === 'granted' && (
                    <div className="flex items-center gap-2 text-green-600">
                        <Bell className="h-5 w-5" />
                        <p>Browser notifications are enabled.</p>
                    </div>
                )}
                 {permission === 'denied' && (
                    <div className="flex items-center gap-2 text-destructive">
                        <BellOff className="h-5 w-5" />
                        <p>Browser notifications are blocked. You'll need to enable them in your browser settings.</p>
                    </div>
                )}
                {permission === 'default' && (
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground">Enable browser notifications for reminders?</p>
                        <Button onClick={requestPermission}>Enable Notifications</Button>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                    <Label htmlFor="sound-switch" className="flex items-center gap-2">
                        {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        Notification Sound
                    </Label>
                    <Switch
                        id="sound-switch"
                        checked={soundEnabled}
                        onCheckedChange={onSoundChange}
                        disabled={permission !== 'granted'}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
