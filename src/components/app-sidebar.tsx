
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
  Settings,
  HelpCircle,
  LayoutDashboard,
  Kanban,
  BookOpen,
  FileSignature,
  Timer,
  Target,
  Briefcase,
  GraduationCap,
  Repeat,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsDialog } from './settings-dialog';

export function AppSidebar() {
  const pathname = usePathname();

  // Define all sidebar menu items with their path, icon, label, and tooltip.
  const menuItems = [
    { href: '/dashboard/lists', icon: <Kanban />, label: 'Task Management', tooltip: 'Task Management' },
    { href: '/dashboard/analytics', icon: <BarChart3 />, label: 'Analytics', tooltip: 'Analytics' },
    { href: '/dashboard/recap', icon: <Sparkles />, label: 'Recap', tooltip: 'Recap' },
    { href: '/habits', icon: <Repeat />, label: 'Habit Tracker', tooltip: 'Habit Tracker' },
    { href: '/goals', icon: <Target />, label: 'Goals', tooltip: 'Goals' },
    { href: '/notes', icon: <FileText />, label: 'Sticky Notes', tooltip: 'Sticky Notes' },
    { href: '/whiteboard', icon: <PenSquare />, label: 'Whiteboard', tooltip: 'Whiteboard' },
    { href: '/mind-map', icon: <GitBranch />, label: 'Mind Map', tooltip: 'Mind Map' },
    { href: '/notebooks', icon: <BookOpen />, label: 'Notebooks', tooltip: 'Notebooks' },
    { href: '/docs', icon: <FileSignature />, label: 'Docs', tooltip: 'Docs' },
    { href: '/pomodoro', icon: <Timer />, label: 'Pomodoro', tooltip: 'Pomodoro Timer' },
    { href: '/crm', icon: <Briefcase />, label: 'CRM', tooltip: 'CRM' },
    { href: '/learning-tool', icon: <GraduationCap />, label: 'Learning Tool', tooltip: 'Learning Tool' },
  ];

  // Helper to determine if menu item is active
  const isActive = (href: string) => {
    // For root dashboard
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    // For other items, check if path starts with menu item href
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="p-3 justify-center">
        {/* SidebarTrigger (if needed) can go here */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/dashboard') && !pathname.includes('/dashboard/lists') && !pathname.includes('/dashboard/analytics') && !pathname.includes('/dashboard/recap')}
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
                isActive={isActive(item.href)}
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
