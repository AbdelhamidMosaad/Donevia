
'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeSettings = () => {};
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        if (doc.exists() && doc.data()) {
            const { theme, font } = doc.data();
            
            const body = document.body;
            
            // Remove any existing theme classes
            body.className = body.className.split(' ').filter(c => !c.startsWith('theme-') && c !== 'light' && c !== 'dark').join(' ');

            if (theme) {
              body.classList.add(theme);
            }
            
            if (font) {
              body.style.fontFamily = `var(--font-${font})`;
            } else {
              body.style.fontFamily = 'var(--font-inter)';
            }
        }
      });
    } else {
        // Not logged in, so clear any theme styles
        const body = document.body;
        body.className = body.className.split(' ').filter(c => !c.startsWith('theme-') && c !== 'light' && c !== 'dark').join(' ');
        body.style.fontFamily = 'var(--font-inter)';
    }
     return () => unsubscribeSettings();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
