
'use client';

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
  LayoutDashboard,
  FileText,
  PenSquare,
  GitBranch,
  BrainCircuit,
  Settings,
  HelpCircle,
  PlusCircle,
  Folder,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DoneviaLogo } from './logo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';

export function AppSidebar() {
  const pathname = usePathname();

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
          <DoneviaLogo className="size-6 shrink-0" />
          <span className="text-lg font-semibold font-headline">Donevia</span>
        </Link>
        <SidebarTrigger className="[&_svg]:size-4 ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                <Collapsible className="w-full">
                    <CollapsibleTrigger asChild>
                         <div className="flex items-center w-full">
                            <SidebarMenuButton
                                asChild
                                isActive={pathname.startsWith('/dashboard')}
                                tooltip={{ children: "Task Management" }}
                                className="flex-1"
                            >
                                <Link href="/dashboard">
                                    <LayoutDashboard />
                                    <span>Task Management</span>
                                </Link>
                            </SidebarMenuButton>
                            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto shrink-0 group-data-[collapsible=icon]:hidden">
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            <SidebarMenuSubItem>
                                <SidebarMenuSubButton asChild isActive={pathname === '/dashboard'}>
                                    <Link href="/dashboard">
                                        <Folder className="h-3 w-3" />
                                        <span>All Tasks</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
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
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip={{ children: 'Settings' }}>
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
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
