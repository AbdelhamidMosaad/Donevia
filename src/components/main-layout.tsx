
'use client';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    let unsubscribe = () => {};
    if (user) {
      const profileRef = doc(db, 'users', user.uid, 'profile', 'theme');
      unsubscribe = onSnapshot(profileRef, (doc) => {
        if (doc.exists() && doc.data().theme) {
            const newTheme = doc.data().theme;
             setTheme(newTheme);
             document.body.className = '';
             if (newTheme !== 'light') {
                document.body.classList.add(newTheme === 'dark' ? 'dark' : `theme-${newTheme}`);
             }
        }
      });
    }
     return () => unsubscribe();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
