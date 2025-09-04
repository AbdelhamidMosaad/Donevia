'use client';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
    if (user) {
      const fetchTheme = async () => {
        const profileRef = doc(db, 'users', user.uid, 'profile', 'theme');
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists() && profileSnap.data().theme) {
          setTheme(profileSnap.data().theme);
        }
      };
      fetchTheme();
    }
  }, [user]);

  useEffect(() => {
    document.body.className = '';
    if (theme !== 'light') {
        document.body.classList.add(theme);
    }
  }, [theme]);


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
