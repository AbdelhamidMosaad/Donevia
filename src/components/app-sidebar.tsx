
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
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
      <SidebarHeader className="p-3 justify-center">
         {/* SidebarTrigger has been removed from here and integrated into SidebarRail */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                <Collapsible className="w-full" open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
                    <div className="flex items-center w-full justify-between relative">
                        <CollapsibleTrigger asChild className="w-full">
                            <SidebarMenuButton
                                isActive={pathname.startsWith('/dashboard')}
                                tooltip={{ children: "Task Management" }}
                            >
                                <Folder />
                                <span className="group-data-[collapsible=icon]:hidden flex-1 text-left">Task Management</span>
                                <ChevronDown className={cn("transition-transform duration-200 group-data-[collapsible=icon]:hidden", isCollapsibleOpen && "rotate-180")} />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                         <div className="absolute right-8 top-1/2 -translate-y-1/2 group-data-[collapsible=icon]:hidden">
                            <AddTaskListDialog>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </AddTaskListDialog>
                         </div>
                    </div>
                    <CollapsibleContent>
                        <SidebarMenuSub>
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
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
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
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
             </SettingsDialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={{ children: 'Help' }}>
              <Link href="#">
                <HelpCircle />
                <span className="group-data-[collapsible=icon]:hidden">Help</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
