
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
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { SettingsDialog } from './settings-dialog';
import { DoneviaLogo } from './logo';
import Link from 'next/link';
import { useSidebar } from './ui/sidebar';

export function AppHeader() {
  const [isClient, setIsClient] = React.useState(false);
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();


  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleLogout = async () => {
    await signOut(auth);
  };


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={toggleSidebar}>
          <DoneviaLogo className="size-5 shrink-0" />
      </Button>
      <div className="hidden items-center gap-4 md:flex">
        <Link href="/dashboard" className="items-center gap-2 flex">
          <DoneviaLogo className="size-6 shrink-0" />
          <span className="text-lg font-semibold font-headline">Donevia</span>
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
