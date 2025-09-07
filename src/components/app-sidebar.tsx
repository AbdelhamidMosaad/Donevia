
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
  Repeat,
  BarChart3,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsDialog } from './settings-dialog';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserSettings } from '@/lib/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const defaultMenuItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard', tooltip: 'Dashboard', id: 'dashboard' },
    { href: '/dashboard/lists', icon: <Kanban />, label: 'Task Management', tooltip: 'Task Management', id: 'tasks' },
    { href: '/dashboard/analytics', icon: <BarChart3 />, label: 'Analytics', tooltip: 'Analytics', id: 'analytics' },
    { href: '/dashboard/recap', icon: <Sparkles />, label: 'Recap', tooltip: 'Recap', id: 'recap' },
    { href: '/habits', icon: <Repeat />, label: 'Habit Tracker', tooltip: 'Habit Tracker', id: 'habits' },
    { href: '/goals', icon: <Target />, label: 'Goals', tooltip: 'Goals', id: 'goals' },
    { href: '/notes', icon: <FileText />, label: 'Sticky Notes', tooltip: 'Sticky Notes', id: 'notes' },
    { href: '/whiteboard', icon: <PenSquare />, label: 'Whiteboard', tooltip: 'Whiteboard', id: 'whiteboard' },
    { href: '/mind-map', icon: <GitBranch />, label: 'Mind Map', tooltip: 'Mind Map', id: 'mindmap' },
    { href: '/notebooks', icon: <BookOpen />, label: 'Notebooks', tooltip: 'Notebooks', id: 'notebooks' },
    { href: '/docs', icon: <FileSignature />, label: 'Docs', tooltip: 'Docs', id: 'docs' },
    { href: '/pomodoro', icon: <Timer />, label: 'Pomodoro', tooltip: 'Pomodoro Timer', id: 'pomodoro' },
    { href: '/crm', icon: <Briefcase />, label: 'CRM', tooltip: 'CRM', id: 'crm' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = React.useState(defaultMenuItems);

  React.useEffect(() => {
    if (user) {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const unsubscribe = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                const settings = doc.data() as UserSettings;
                if (settings.sidebarOrder && settings.sidebarOrder.length > 0) {
                    const orderedItems = settings.sidebarOrder.map(id => 
                        defaultMenuItems.find(item => item.id === id)
                    ).filter(Boolean) as typeof defaultMenuItems;
                    
                    // Add any new default items that are not in the saved order
                    const newItems = defaultMenuItems.filter(defaultItem => 
                        !orderedItems.some(orderedItem => orderedItem.id === defaultItem.id)
                    );
                    setMenuItems([...orderedItems, ...newItems]);
                } else {
                     setMenuItems(defaultMenuItems);
                }
            } else {
                setMenuItems(defaultMenuItems);
            }
        });
        return () => unsubscribe();
    }
  }, [user]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };
  
  const handleDragEnd = async (result: DropResult) => {
      if (!result.destination || !user) return;

      const items = Array.from(menuItems);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setMenuItems(items);

      const newOrder = items.map(item => item.id);
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      await setDoc(settingsRef, { sidebarOrder: newOrder }, { merge: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="p-3 justify-center">
        {/* SidebarTrigger (if needed) can go here */}
      </SidebarHeader>
      <SidebarContent>
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sidebar-menu">
                {(provided) => (
                    <SidebarMenu {...provided.droppableProps} ref={provided.innerRef}>
                    {menuItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                           {(provided, snapshot) => (
                                <SidebarMenuItem ref={provided.innerRef} {...provided.draggableProps}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                        tooltip={{ children: item.tooltip }}
                                    >
                                        <Link href={item.href} className="flex items-center w-full">
                                            <div {...provided.dragHandleProps} className="group-data-[collapsible=icon]:hidden mr-2 p-1">
                                                <GripVertical className="h-4 w-4 text-muted-foreground"/>
                                            </div>
                                            {item.icon}
                                            <span className="group-data-[collapsible=icon]:hidden flex-1">{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                           )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    </SidebarMenu>
                )}
            </Droppable>
        </DragDropContext>
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
