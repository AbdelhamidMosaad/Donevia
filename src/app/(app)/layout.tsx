
'use client';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WelcomeScreen } from '@/components/welcome-screen';
import { TaskReminderProvider } from '@/hooks/use-task-reminders';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PomodoroProvider } from '@/hooks/use-pomodoro';
import { StudyReminderProvider } from '@/hooks/use-study-reminders';
import { PlannerReminderProvider } from '@/hooks/use-planner-reminders';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, settings } = useAuth();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(settings?.sidebarOpen ?? true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    // Sync sidebar open state with settings from AuthProvider
    if (settings?.sidebarOpen !== undefined) {
      setSidebarOpen(settings.sidebarOpen);
    }
  }, [settings?.sidebarOpen]);


  const handleSidebarOpenChange = (isOpen: boolean) => {
    setSidebarOpen(isOpen);
    if(user) {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        setDoc(settingsRef, { sidebarOpen: isOpen }, { merge: true });
    }
  };


  if (loading || !user) {
    return <WelcomeScreen />;
  }

  return (
    <TaskReminderProvider>
      <StudyReminderProvider>
        <PlannerReminderProvider>
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
        </PlannerReminderProvider>
      </StudyReminderProvider>
    </TaskReminderProvider>
  );
}
