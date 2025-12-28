
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut, Bell, CheckCircle, Trash2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { SettingsDialog } from './settings-dialog';
import { DoneviaLogo } from './logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSidebar } from './ui/sidebar';
import { Badge } from './ui/badge';
import type { Task } from '@/lib/types';
import moment from 'moment';
import { useTaskReminders } from '@/hooks/use-task-reminders';
import { PomodoroHeaderWidget } from './pomodoro-header-widget';
import { StudyTimerHeaderWidget } from './study-tracker/study-timer-header-widget';
import { TaskTimerHeaderWidget } from './tasks/task-timer-header-widget';

export function AppHeader() {
  const [isClient, setIsClient] = React.useState(false);
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { overdueTasks, dismissOverdueTask } = useTaskReminders();
  const router = useRouter();


  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleLogout = async () => {
    await signOut(auth);
  };
  
  const handleNotificationClick = (task: Task) => {
    router.push(`/dashboard/list/${task.listId}`);
  };

  const handleDismissNotification = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      dismissOverdueTask(taskId);
  }
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const query = formData.get('search') as string;
      if (query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
  }


  return (
    <header className="sticky top-4 z-40 mx-4 md:mx-6 my-4">
        <div className="flex h-16 items-center gap-4 rounded-2xl border bg-card px-4 shadow-lg lg:px-6">
      <Link href="/home" className="flex items-center gap-2">
        <DoneviaLogo className="h-16 w-16" />
      </Link>
      <div className="w-full flex-1 ml-4">
        {isClient && (
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                placeholder="Search everywhere..."
                className="w-full appearance-none bg-background/50 backdrop-blur-sm pl-8 shadow-sm md:w-2/3 lg:w-1/2"
              />
            </div>
          </form>
        )}
      </div>

       <TaskTimerHeaderWidget />
       <StudyTimerHeaderWidget />
       <PomodoroHeaderWidget />

       <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
                <Bell />
                {overdueTasks.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{overdueTasks.length}</Badge>
                )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Overdue Tasks</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
            {overdueTasks.length > 0 ? (
              overdueTasks.map(task => (
                  <DropdownMenuItem key={task.id} className="cursor-pointer flex justify-between items-center" onSelect={() => handleNotificationClick(task)}>
                    <div className="flex flex-col">
                        <span className="font-semibold">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                            Due {moment(task.dueDate.toDate()).fromNow()}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDismissNotification(e, task.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                <CheckCircle className="mx-auto h-8 w-8 mb-2"/>
                All caught up!
              </div>
            )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
       </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src={user?.photoURL || "https://picsum.photos/32/32"} data-ai-hint="person avatar" />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.displayName || user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <SettingsDialog>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Settings />
                <span>Settings</span>
            </DropdownMenuItem>
          </SettingsDialog>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
        </div>
    </header>
  );
}
