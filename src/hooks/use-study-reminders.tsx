
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import type { StudyChapter, UserSettings } from '@/lib/types';
import { useToast } from './use-toast';
import moment from 'moment';

interface StudyReminderContextType {}

const StudyReminderContext = createContext<StudyReminderContextType | undefined>(undefined);

export function useStudyReminders() {
    const context = useContext(StudyReminderContext);
    if (!context) {
        throw new Error('useStudyReminders must be used within a StudyReminderProvider');
    }
    return context;
}

export function StudyReminderProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [chapters, setChapters] = useState<StudyChapter[]>([]);
    const [settings, setSettings] = useState<Partial<UserSettings>>({ notificationSound: true });
    const remindedChapters = useRef(new Set<string>());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
        }
    }, []);

    // Fetch settings
    useEffect(() => {
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
                if(docSnap.exists()) {
                    setSettings(docSnap.data());
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Fetch all chapters
    useEffect(() => {
        if (user) {
            const chaptersRef = collection(db, 'users', user.uid, 'studyChapters');
            const q = query(chaptersRef);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const chaptersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyChapter));
                setChapters(chaptersData);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const showBrowserNotification = useCallback((chapter: StudyChapter) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        
        const dueDate = moment(chapter.dueDate!.toDate());
        const options: NotificationOptions = {
            body: `The chapter "${chapter.title}" is due ${dueDate.fromNow()}.`,
            icon: '/logo.png',
            badge: '/badge.png',
            vibrate: [200, 100, 200],
            data: { 
                goalId: chapter.goalId,
                chapterId: chapter.id
            },
        };

         navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Study Reminder', options);
        });
    }, []);

    // Check for reminders
    useEffect(() => {
        const checkChapters = () => {
            const now = moment();
            chapters.forEach(chapter => {
                if (!chapter.dueDate || !chapter.reminder || chapter.reminder === 'none' || remindedChapters.current.has(chapter.id)) {
                    return;
                }
                
                const dueDate = moment(chapter.dueDate.toDate());
                let reminderTime: moment.Moment | null = null;
                
                switch (chapter.reminder) {
                    case 'on-due-date':
                        reminderTime = dueDate.startOf('day');
                        break;
                    case '1-day':
                        reminderTime = dueDate.clone().subtract(1, 'day').startOf('day');
                        break;
                    case '2-days':
                        reminderTime = dueDate.clone().subtract(2, 'days').startOf('day');
                        break;
                    case '1-week':
                         reminderTime = dueDate.clone().subtract(1, 'week').startOf('day');
                        break;
                }

                if (reminderTime && now.isAfter(reminderTime)) {
                    if (settings.notificationSound) {
                        audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
                    }
                    showBrowserNotification(chapter);
                    toast({
                        title: `Study Reminder: ${chapter.title}`,
                        description: `Due ${dueDate.fromNow()}.`,
                    });
                    remindedChapters.current.add(chapter.id);
                }
            });
        };

        const intervalId = setInterval(checkChapters, 3600000); // Check every hour
        checkChapters(); // Initial check

        return () => clearInterval(intervalId);

    }, [chapters, settings.notificationSound, toast, showBrowserNotification]);

    return (
        <StudyReminderContext.Provider value={{}}>
            {children}
        </StudyReminderContext.Provider>
    );
}
