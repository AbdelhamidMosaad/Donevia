
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { PlannerEvent, UserSettings } from '@/lib/types';
import { useToast } from './use-toast';
import moment from 'moment';

interface PlannerReminderContextType {}

const PlannerReminderContext = createContext<PlannerReminderContextType | undefined>(undefined);

export function usePlannerReminders() {
    const context = useContext(PlannerReminderContext);
    if (!context) {
        throw new Error('usePlannerReminders must be used within a PlannerReminderProvider');
    }
    return context;
}

export function PlannerReminderProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [settings, setSettings] = useState<Partial<UserSettings>>({ notificationSound: true });
    const audioRef = useRef<HTMLAudioElement | null>(null);

     useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
        }
    }, []);

    useEffect(() => {
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
                if (docSnap.exists()) {
                    setSettings(docSnap.data());
                }
            });
            return () => unsubscribe();
        }
    }, [user]);
    
    const showBrowserNotification = (event: PlannerEvent) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const startTime = moment(event.start);
        const options: NotificationOptions = {
            body: `Starts ${startTime.fromNow()}.`,
            icon: '/logo.png',
            badge: '/badge.png',
            vibrate: [200, 100, 200],
        };

        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(`Event: ${event.title}`, options);
        });
    };
    
    const checkReminders = useCallback((events: PlannerEvent[]) => {
        const remindedEvents = new Set<string>();
        const now = moment();
        events.forEach(event => {
            if (!event.reminder || event.reminder === 'none' || remindedEvents.has(event.id)) {
                return;
            }

            const startTime = moment(event.start);
            let reminderTime: moment.Moment | null = null;
            
            switch (event.reminder) {
                case '5m': reminderTime = startTime.clone().subtract(5, 'minutes'); break;
                case '15m': reminderTime = startTime.clone().subtract(15, 'minutes'); break;
                case '30m': reminderTime = startTime.clone().subtract(30, 'minutes'); break;
                case '1h': reminderTime = startTime.clone().subtract(1, 'hour'); break;
                case '1d': reminderTime = startTime.clone().subtract(1, 'day'); break;
            }

            if (reminderTime && now.isAfter(reminderTime) && now.isBefore(startTime)) {
                if (settings.notificationSound) {
                    audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                }
                showBrowserNotification(event);
                toast({
                    title: `Reminder: ${event.title}`,
                    description: `Starts in ${startTime.fromNow(true)}.`,
                });
                remindedEvents.add(event.id);
            }
        });
    }, [settings.notificationSound, toast, showBrowserNotification]);


    const value = {
        checkReminders,
    };

    return (
        <PlannerReminderContext.Provider value={value}>
            {children}
        </PlannerReminderContext.Provider>
    );
}

// A hook to use inside the component that has the events
export const useEventReminders = (events: PlannerEvent[]) => {
    const { checkReminders } = usePlannerReminders();
    useEffect(() => {
        const intervalId = setInterval(() => checkReminders(events), 60000); // Check every minute
        checkReminders(events); // Initial check
        return () => clearInterval(intervalId);
    }, [events, checkReminders]);
};
