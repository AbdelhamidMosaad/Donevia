


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
import { ReminderDialogProvider } from '@/hooks/use-reminder-dialog';
import { ReminderDialog } from '@/components/reminder-dialog';
import { StudyTimerProvider } from '@/hooks/use-study-timer';
import { TaskTimerProvider } from '@/hooks/use-task-timer';
import { useTasks } from '@/hooks/use-tasks';


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, settings } = useAuth();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
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
        <ReminderDialogProvider>
          <PlannerReminderProvider>
            <PomodoroProvider>
                <TaskTimerProvider>
                  <StudyTimerProvider>
                    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarOpenChange}>
                      <AppSidebar />
                      <SidebarInset>
                          <div className="flex flex-col h-screen">
                            <AppHeader />
                            <main className="flex-1 overflow-y-auto px-4 md:px-6">
                                {children}
                            </main>
                          </div>
                      </SidebarInset>
                    </SidebarProvider>
                  </StudyTimerProvider>
                </TaskTimerProvider>
            </PomodoroProvider>
          </PlannerReminderProvider>
           <ReminderDialog />
        </ReminderDialogProvider>
      </StudyReminderProvider>
    </TaskReminderProvider>
  );
}

// We need a wrapper component to use the useTasks hook, as it needs to be inside the AuthProvider.
export default function AppLayout({ children }: { children: React.ReactNode }) {
    // This component is a placeholder to ensure the layout structure remains the same
    // but the logic is moved to AppLayoutContent which can use hooks.
    // In a real app, you might see this pattern to compose providers.
    const TasksProvider = ({ children }: { children: React.ReactNode }) => {
        useTasks();
        return <>{children}</>;
    };

    return (
        <TasksProvider>
            <AppLayoutContent>{children}</AppLayoutContent>
        </TasksProvider>
    )
}
