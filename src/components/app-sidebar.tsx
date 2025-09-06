
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
} from '@/components/ui/sidebar';
import {
  FileText,
  PenSquare,
  GitBranch,
  BrainCircuit,
  Settings,
  HelpCircle,
  Folder,
  LayoutDashboard,
  Kanban,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsDialog } from './settings-dialog';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserSettings } from '@/lib/types';


export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [sidebarPosition, setSidebarPosition] = React.useState<UserSettings['sidebarPosition']>('left');

   React.useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().sidebarPosition) {
          setSidebarPosition(docSnap.data().sidebarPosition);
        }
      });
    }
  }, [user]);

  const menuItems = [
    { href: '/dashboard/lists', icon: <Kanban />, label: 'Task Management', tooltip: 'Task Management' },
    { href: '/notes', icon: <FileText />, label: 'Sticky Notes', tooltip: 'Sticky Notes' },
    { href: '/whiteboard', icon: <PenSquare />, label: 'Whiteboard', tooltip: 'Whiteboard' },
    { href: '/mind-map', icon: <GitBranch />, label: 'Mind Map', tooltip: 'Mind Map' },
    { href: '/notebooks', icon: <BookOpen />, label: 'Notebooks', tooltip: 'Notebooks' },
  ];

  return (
    <Sidebar collapsible="icon" side={sidebarPosition}>
      <SidebarRail />
      <SidebarHeader className="p-3 justify-center">
         {/* SidebarTrigger has been removed from here and integrated into SidebarRail */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard'}
                    tooltip={{ children: "Dashboard" }}
                >
                    <Link href="/dashboard">
                        <LayoutDashboard />
                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
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
