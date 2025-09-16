
'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { WelcomeScreen } from '@/components/welcome-screen';
import type { UserSettings } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  settings: Partial<UserSettings>;
}

const fonts: Record<string, string> = {
    inter: 'var(--font-inter)',
    roboto: 'var(--font-roboto)',
    'open-sans': 'var(--font-open-sans)',
    lato: 'var(--font-lato)',
    poppins: 'var(--font-poppins)',
    'source-sans-pro': 'var(--font-source-sans-pro)',
    nunito: 'var(--font-nunito)',
    montserrat: 'var(--font-montserrat)',
    'playfair-display': 'var(--font-playfair-display)',
    'jetbrains-mono': 'var(--font-jetbrains-mono)',
    bahnschrift: 'Bahnschrift, sans-serif',
};

const defaultSettings: UserSettings = {
    theme: 'light',
    font: 'inter',
    sidebarVariant: 'sidebar',
    sidebarOpen: true,
    notificationSound: true,
    taskListsView: 'card',
    taskListsCardSize: 'large',
    docsView: 'card',
    docsCardSize: 'large',
    meetingNotesView: 'card',
    meetingNotesCardSize: 'large',
    notesView: 'board',
    studyTrackerView: 'card',
    homeCardSize: 'large',
    listViews: {},
    tableColumns: {},
    sidebarOrder: [],
    toolOrder: [],
    currency: 'USD',
    studyProfile: {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDay: '',
        level: 1,
        experiencePoints: 0,
        earnedBadges: [],
    }
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Partial<UserSettings>>(defaultSettings);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeSettings = () => {};
    const body = document.body;
    
    // Function to strip all theme and font classes
    const resetStyling = () => {
        const themeClasses: UserSettings['theme'][] = ['light', 'dark', 'theme-indigo', 'theme-purple', 'theme-green', 'theme-sunset', 'theme-mint', 'theme-jade', 'theme-periwinkle', 'theme-sky', 'theme-orchid', 'theme-sage', 'theme-coral'];
        body.classList.remove(...themeClasses);
        body.style.fontFamily = ''; // Reset inline font style
    }

    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        resetStyling(); // Reset before applying new styles
        if (doc.exists() && doc.data()) {
            const userSettings = { ...defaultSettings, ...doc.data() } as UserSettings;
            setSettings(userSettings);
            
            body.classList.add(userSettings.theme);
            
            if (userSettings.font && fonts[userSettings.font]) {
              body.style.fontFamily = fonts[userSettings.font];
            } else {
              body.style.fontFamily = fonts['inter']; // Default to inter
            }
        } else {
            // No settings doc, apply defaults
            setSettings(defaultSettings);
            body.classList.add('light');
            body.style.fontFamily = fonts['inter'];
        }
      });
    } else {
        // Not logged in, so clear any theme styles and apply defaults for landing page
        resetStyling();
        setSettings(defaultSettings);
        body.style.fontFamily = fonts['inter'];
    }
     return () => unsubscribeSettings();
  }, [user]);
  
  if (loading) {
    return <WelcomeScreen />;
  }


  return (
    <AuthContext.Provider value={{ user, loading, settings }}>
      {children}
    </AuthContext.Provider>
  );
}
