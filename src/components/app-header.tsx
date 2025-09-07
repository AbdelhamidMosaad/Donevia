
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
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut, Bell, CheckCircle } from 'lucide-react';
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
    dismissOverdueTask(task.id);
    router.push(`/dashboard/lists/${task.listId}`);
  };


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={toggleSidebar}>
          <DoneviaLogo className="size-5 shrink-0" />
      </Button>
      <div className="hidden items-center gap-4 md:flex">
        <Link href="/dashboard" className="items-center gap-2 flex">
          <DoneviaLogo className="size-6 shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold font-headline leading-none">Donevia</span>
            <span className="text-xs text-muted-foreground">Get it done, your way.</span>
          </div>
        </Link>
      </div>
      <div className="w-full flex-1">
        {isClient && (
          <form>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search everywhere..."
                className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
              />
            </div>
          </form>
        )}
      </div>

       <PomodoroHeaderWidget />

       <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
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
                  <DropdownMenuItem key={task.id} className="cursor-pointer" onSelect={() => handleNotificationClick(task)}>
                    <div className="flex flex-col">
                        <span className="font-semibold">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                            Due {moment(task.dueDate.toDate()).fromNow()}
                        </span>
                    </div>
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
          <Button variant="secondary" size="icon" className="rounded-full">
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
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
            </DropdownMenuItem>
          </SettingsDialog>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
