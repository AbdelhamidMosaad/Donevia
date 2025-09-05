
'use client';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    let unsubscribe = () => {};
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists() && doc.data()) {
            const { theme, font } = doc.data();
            
            if (theme) {
              document.body.className = '';
              if (theme !== 'light') {
                  document.body.classList.add(theme === 'dark' ? 'dark' : `theme-${theme}`);
              }
            }

            if (font) {
                document.body.style.fontFamily = `var(--font-${font})`;
            } else {
                document.body.style.fontFamily = `var(--font-inter)`;
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
