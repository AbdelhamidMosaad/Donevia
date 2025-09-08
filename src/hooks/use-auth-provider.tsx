
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
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthChecked(true);
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    // Hide welcome screen after a short delay once auth is checked
    if (authChecked) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500); // Keep welcome screen for at least 1.5 seconds for branding
      return () => clearTimeout(timer);
    }
  }, [authChecked]);

  useEffect(() => {
    let unsubscribeSettings = () => {};
    const body = document.body;
    
    // Function to strip all theme and font classes
    const resetStyling = () => {
        const themeClasses: UserSettings['theme'][] = ['light', 'dark', 'theme-indigo', 'theme-purple', 'theme-green', 'theme-sunset', 'theme-mint'];
        body.classList.remove(...themeClasses);
        body.style.fontFamily = ''; // Reset inline font style
    }

    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        resetStyling(); // Reset before applying new styles
        if (doc.exists() && doc.data()) {
            const { theme, font } = doc.data();
            
            if (theme) {
              body.classList.add(theme);
            } else {
              body.classList.add('light'); // Default to light theme
            }
            
            if (font && fonts[font]) {
              body.style.fontFamily = fonts[font];
            } else {
              body.style.fontFamily = fonts['inter']; // Default to inter
            }
        } else {
            // No settings doc, apply defaults
            body.classList.add('light');
            body.style.fontFamily = fonts['inter'];
        }
      });
    } else {
        // Not logged in, so clear any theme styles and apply defaults for landing page
        resetStyling();
        body.style.fontFamily = fonts['inter'];
    }
     return () => unsubscribeSettings();
  }, [user]);
  
  if (loading) {
    return <WelcomeScreen />;
  }


  return (
    <AuthContext.Provider value={{ user, loading: !authChecked }}>
      {children}
    </AuthContext.Provider>
  );
}
