
'use client';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WelcomeScreen } from '@/components/welcome-screen';
import { TaskReminderProvider } from '@/hooks/use-task-reminders';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PomodoroProvider } from '@/hooks/use-pomodoro';
import { StudyReminderProvider } from '@/hooks/use-study-reminders';
import { UserSettings } from '@/lib/types';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data() as UserSettings;
            if (data.sidebarOpen !== undefined) {
              setSidebarOpen(data.sidebarOpen);
            }
        }
        setSettingsLoaded(true);
      });
    }
  }, [user]);

  const handleSidebarOpenChange = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
    if(user) {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        setDoc(settingsRef, { sidebarOpen: isOpen }, { merge: true });
    }
  };


  if (loading || !user || !settingsLoaded) {
    return <WelcomeScreen />;
  }

  return (
    <TaskReminderProvider>
      <StudyReminderProvider>
        <PomodoroProvider>
          <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={handleSidebarOpenChange}>
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
        </PomodoroProvider>
      </StudyReminderProvider>
    </TaskReminderProvider>
  );
}
