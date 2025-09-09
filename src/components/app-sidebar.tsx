
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  FileText,
  PenSquare,
  GitBranch,
  Settings,
  HelpCircle,
  LayoutDashboard,
  Kanban,
  FileSignature,
  Timer,
  Target,
  Repeat,
  BarChart3,
  Sparkles,
  GripVertical,
  GraduationCap,
  Bookmark,
  Briefcase,
  BrainCircuit,
  Users,
  BookOpen,
  Layers,
  Globe,
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
    { href: '/dashboard', icon: <LayoutDashboard className="text-blue-500" />, label: 'Dashboard', tooltip: 'Dashboard', id: 'dashboard' },
    { href: '/dashboard/lists', icon: <Kanban className="text-purple-500" />, label: 'Task Management', tooltip: 'Task Management', id: 'tasks' },
    { href: '/crm', icon: <Briefcase className="text-amber-500" />, label: 'CRM', tooltip: 'CRM', id: 'crm' },
    { href: '/habits', icon: <Repeat className="text-teal-500" />, label: 'Habit Tracker', tooltip: 'Habit Tracker', id: 'habits' },
    { href: '/goals', icon: <Target className="text-red-500" />, label: 'Goals', tooltip: 'Goals', id: 'goals' },
    { href: '/study-tracker', icon: <GraduationCap className="text-lime-500" />, label: 'Study Tracker', tooltip: 'Study Tracker', id: 'study-tracker' },
    { href: '/flashcards', icon: <Layers className="text-indigo-500" />, label: 'Flashcards', tooltip: 'Flashcards', id: 'flashcards' },
    { href: '/notes', icon: <FileText className="text-orange-500" />, label: 'Sticky Notes', tooltip: 'Sticky Notes', id: 'notes' },
    { href: '/bookmarks', icon: <Bookmark className="text-blue-500" />, label: 'Bookmarks', tooltip: 'Bookmarks', id: 'bookmarks' },
    { href: '/work-tracker', icon: <Briefcase className="text-amber-500" />, label: 'Work Tracker', tooltip: 'Work Tracker', id: 'work-tracker' },
    { href: '/brainstorming', icon: <BrainCircuit className="text-violet-500" />, label: 'Brainstorming', tooltip: 'Brainstorming', id: 'brainstorming' },
    { href: '/whiteboard', icon: <PenSquare className="text-indigo-500" />, label: 'Whiteboard', tooltip: 'Whiteboard', id: 'whiteboard' },
    { href: '/mind-map', icon: <GitBranch className="text-pink-500" />, label: 'Mind Map', tooltip: 'Mind Map', id: 'mindmap' },
    { href: '/docs', icon: <FileSignature className="text-cyan-500" />, label: 'Docs', tooltip: 'Docs', id: 'docs' },
    { href: '/learning-tool', icon: <GraduationCap className="text-lime-500" />, label: 'Learning Tool', tooltip: 'Learning Tool', id: 'learning-tool' },
    { href: '/pomodoro', icon: <Timer className="text-rose-500" />, label: 'Pomodoro', tooltip: 'Pomodoro Timer', id: 'pomodoro' },
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

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/list');
    }
     if (href === '/crm') {
      return pathname === '/crm' || pathname.startsWith('/crm/');
    }
     if (href === '/flashcards') {
      return pathname.startsWith('/flashcards') && !pathname.startsWith('/flashcards/public');
    }
    if (href === '/goals') {
        return pathname.startsWith('/goals');
    }
    if (href === '/study-tracker') {
        return pathname.startsWith('/study-tracker');
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
                    {menuItems.map((item, index) => {
                        return (
                             <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided) => (
                                    <SidebarMenuItem ref={provided.innerRef} {...provided.draggableProps}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive(item.href)}
                                            tooltip={{ children: item.tooltip }}
                                        >
                                            <Link href={item.href || '#'} className="flex items-center w-full">
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
                        )
                    })}
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
              <Link href="/help">
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
