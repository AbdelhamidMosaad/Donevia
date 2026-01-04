
'use client';

import { AppHeader } from '@/components/app-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WelcomeScreen } from '@/components/welcome-screen';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTasks } from '@/hooks/use-tasks';
import { GoogleCalendarProvider } from '@/hooks/use-google-calendar';


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
    <GoogleCalendarProvider>
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
    </GoogleCalendarProvider>
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
