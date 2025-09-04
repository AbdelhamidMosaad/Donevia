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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  GitBranch,
  BrainCircuit,
  Settings,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DoneviaLogo } from './logo';

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard', tooltip: 'Dashboard' },
    { href: '/notes', icon: <FileText />, label: 'Notes', tooltip: 'Notes' },
    { href: '/whiteboard', icon: <PenSquare />, label: 'Whiteboard', tooltip: 'Whiteboard' },
    { href: '/mind-map', icon: <GitBranch />, label: 'Mind Map', tooltip: 'Mind Map' },
    { href: '/notebooks', icon: <BrainCircuit />, label: 'Notebooks', tooltip: 'Notebooks' },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <DoneviaLogo className="size-6 shrink-0" />
          <span className="text-lg font-semibold font-headline">Donevia</span>
        </div>
        <SidebarTrigger className="[&_svg]:size-4 ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
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
            <SidebarMenuButton asChild tooltip={{ children: 'Settings' }}>
              <Link href="#">
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
