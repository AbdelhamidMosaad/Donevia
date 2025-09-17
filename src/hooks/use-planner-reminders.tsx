

'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { PlannerEvent, UserSettings, Reminder } from '@/lib/types';
import moment from 'moment';
import { useReminderDialog } from './use-reminder-dialog';

interface PlannerReminderContextType {}

const PlannerReminderContext = createContext<PlannerReminderContextType | undefined>(undefined);

// A hook to be used by the Planner page to trigger checks
export function useEventReminders(events: PlannerEvent[]) {
    const context = useContext(PlannerReminderContext);
    if (!context) {
        throw new Error('useEventReminders must be used within a PlannerReminderProvider');
    }
    
    // The actual logic is now inside the provider, so this hook just signals usage
    // and passes the events to the provider's checking mechanism.
    const { checkReminders } = context as { checkReminders: (events: PlannerEvent[]) => void };
    useEffect(() => {
        const intervalId = setInterval(() => checkReminders(events), 60000); // Check every minute
        checkReminders(events); // Initial check
        return () => clearInterval(intervalId);
    }, [events, checkReminders]);
}


export function PlannerReminderProvider({ children }: { children: ReactNode }) {
    const { showReminder } = useReminderDialog();
    const { user } = useAuth();
    const [settings, setSettings] = useState<Partial<UserSettings>>({ notificationSound: true });
    const remindedEvents = useRef(new Set<string>());
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
        const now = moment();
        events.forEach(event => {
            if (!event.reminders || event.reminders.length === 0) {
                return;
            }

            const startTime = moment(event.start);

            event.reminders.forEach(reminder => {
                if (reminder === 'none') return;
                
                const reminderId = `${event.id}-${reminder}-${startTime.format('YYYYMMDDHHmm')}`;
                if (remindedEvents.current.has(reminderId)) {
                    return;
                }

                let reminderTime: moment.Moment | null = null;
                
                switch (reminder) {
                    case '5m': reminderTime = startTime.clone().subtract(5, 'minutes'); break;
                    case '15m': reminderTime = startTime.clone().subtract(15, 'minutes'); break;
                    case '30m': reminderTime = startTime.clone().subtract(30, 'minutes'); break;
                    case '1h': reminderTime = startTime.clone().subtract(1, 'hour'); break;
                    case '1d': reminderTime = startTime.clone().subtract(1, 'day'); break;
                }

                if (reminderTime && now.isSame(reminderTime, 'minute')) {
                    if (settings.notificationSound) {
                        audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                    }
                    showBrowserNotification(event);
                    showReminder({
                        title: `Reminder: ${event.title}`,
                        description: `Starts ${startTime.fromNow()}.`,
                    });
                    remindedEvents.current.add(reminderId);
                }
            });
        });
    }, [settings.notificationSound, showReminder]);


    const value = {
        checkReminders,
    };

    return (
        <PlannerReminderContext.Provider value={value}>
            {children}
        </PlannerReminderContext.Provider>
    );
}

// A simple hook to get the context - no logic here
export function usePlannerReminders() {
    const context = useContext(PlannerReminderContext);
    if (!context) {
        throw new Error('usePlannerReminders must be used within a PlannerReminderProvider');
    }
    return context;
}
