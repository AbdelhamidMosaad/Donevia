
'use client';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WelcomeScreen } from './welcome-screen';
import { TaskReminderProvider } from '@/hooks/use-task-reminders';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().sidebarOpen !== undefined) {
          setSidebarOpen(docSnap.data().sidebarOpen);
        }
      });
    }
  }, [user]);


  if (loading || !user) {
    return <WelcomeScreen />;
  }

  return (
    <TaskReminderProvider>
        <SidebarProvider defaultOpen={sidebarOpen}>
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
    </TaskReminderProvider>
  );
}
