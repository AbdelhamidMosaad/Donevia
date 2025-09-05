
'use client';

import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  FileText,
  PenSquare,
  GitBranch,
  BrainCircuit,
  Settings,
  HelpCircle,
  PlusCircle,
  Folder,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DoneviaLogo } from './logo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddTaskListDialog } from './add-task-list-dialog';
import { cn } from '@/lib/utils';
import { SettingsDialog } from './settings-dialog';

interface TaskList {
  id: string;
  name: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [taskLists, setTaskLists] = React.useState<TaskList[]>([]);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'taskLists'), orderBy('createdAt'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskList));
        setTaskLists(lists);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const menuItems = [
    { href: '/notes', icon: <FileText />, label: 'Notes', tooltip: 'Notes' },
    { href: '/whiteboard', icon: <PenSquare />, label: 'Whiteboard', tooltip: 'Whiteboard' },
    { href: '/mind-map', icon: <GitBranch />, label: 'Mind Map', tooltip: 'Mind Map' },
    { href: '/notebooks', icon: <BrainCircuit />, label: 'Notebooks', tooltip: 'Notebooks' },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <DoneviaLogo className="size-7 shrink-0" />
          <span className="text-lg font-semibold font-headline">Donevia</span>
        </Link>
        <SidebarTrigger className="[&_svg]:size-4 ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                <Collapsible className="w-full" open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
                    <div className="flex items-center w-full relative">
                        <CollapsibleTrigger asChild className="flex-1">
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/dashboard')}
                                tooltip={{ children: "Task Management" }}
                            >
                                <Folder />
                                <span>Task Management</span>
                                <ChevronDown className={cn("ml-auto transition-transform duration-200", isCollapsibleOpen && "rotate-180")} />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                         <AddTaskListDialog>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 group-data-[collapsible=icon]:hidden absolute right-1.5 top-1/2 -translate-y-1/2">
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </AddTaskListDialog>
                    </div>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={pathname === '/dashboard'}>
                                    <Link href="/dashboard">
                                        <Folder className="h-4 w-4" />
                                        <span>All Tasks</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                             {taskLists.map(list => (
                                <SidebarMenuSubItem key={list.id}>
                                    <SidebarMenuSubButton asChild isActive={pathname === `/dashboard/list/${list.id}`}>
                                        <Link href={`/dashboard/list/${list.id}`}>
                                            <Folder className="h-4 w-4" />
                                            <span>{list.name}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuItem>

          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.tooltip }}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SettingsDialog>
                <SidebarMenuButton tooltip={{ children: 'Settings' }}>
                    <Settings />
                    <span>Settings</span>
                </SidebarMenuButton>
             </SettingsDialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: 'Help' }}>
              <Link href="#">
                <HelpCircle />
                <span>Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
