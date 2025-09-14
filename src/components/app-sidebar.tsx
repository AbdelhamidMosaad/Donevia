
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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Settings,
  HelpCircle,
  Home,
  GripVertical,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SettingsDialog } from './settings-dialog';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { PlannerIcon } from '@/components/icons/tools/planner-icon';
import { TasksIcon } from '@/components/icons/tools/tasks-icon';
import { CrmIcon } from '@/components/icons/tools/crm-icon';
import { HabitsIcon } from '@/components/icons/tools/habits-icon';
import { GoalsIcon } from '@/components/icons/tools/goals-icon';
import { StudyTrackerIcon } from '@/components/icons/tools/study-tracker-icon';
import { FlashcardsIcon } from '@/components/icons/tools/flashcards-icon';
import { MeetingNotesIcon } from '@/components/icons/tools/meeting-notes-icon';
import { StickyNotesIcon } from '@/components/icons/tools/sticky-notes-icon';
import { BookmarksIcon } from '@/components/icons/tools/bookmarks-icon';
import { TradingTrackerIcon } from '@/components/icons/tools/trading-tracker-icon';
import { WorkTrackerIcon } from '@/components/icons/tools/work-tracker-icon';
import { EnglishCoachIcon } from '@/components/icons/tools/english-coach-icon';
import { BrainstormingIcon } from '@/components/icons/tools/brainstorming-icon';
import { WhiteboardIcon } from '@/components/icons/tools/whiteboard-icon';
import { MindMapIcon } from '@/components/icons/tools/mind-map-icon';
import { DocsIcon } from '@/components/icons/tools/docs-icon';
import { LearningAssistantIcon } from '@/components/icons/tools/learning-assistant-icon';
import { PomodoroIcon } from '@/components/icons/tools/pomodoro-icon';

const defaultMenuItems = [
    { href: '/home', icon: <Home />, label: 'Home', tooltip: 'Home', id: 'dashboard' },
    { href: '/planner', icon: <PlannerIcon />, label: 'Planner', tooltip: 'Planner', id: 'planner' },
    { href: '/dashboard/lists', icon: <TasksIcon />, label: 'Task Management', tooltip: 'Task Management', id: 'tasks' },
    { href: '/crm', icon: <CrmIcon />, label: 'CRM', tooltip: 'CRM', id: 'crm' },
    { href: '/habits', icon: <HabitsIcon />, label: 'Habit Tracker', tooltip: 'Habit Tracker', id: 'habits' },
    { href: '/goals', icon: <GoalsIcon />, label: 'Goals', tooltip: 'Goals', id: 'goals' },
    { href: '/study-tracker', icon: <StudyTrackerIcon />, label: 'Study Tracker', tooltip: 'Study Tracker', id: 'study-tracker' },
    { href: '/flashcards', icon: <FlashcardsIcon />, label: 'Flashcards', tooltip: 'Flashcards', id: 'flashcards' },
    { href: '/meeting-notes', icon: <MeetingNotesIcon />, label: 'Meeting Notes', tooltip: 'Meeting Notes', id: 'meeting-notes' },
    { href: '/notes', icon: <StickyNotesIcon />, label: 'Sticky Notes', tooltip: 'Sticky Notes', id: 'notes' },
    { href: '/bookmarks', icon: <BookmarksIcon />, label: 'Bookmarks', tooltip: 'Bookmarks', id: 'bookmarks' },
    { href: '/trading-tracker', icon: <TradingTrackerIcon />, label: 'Trading Tracker', tooltip: 'Trading Tracker', id: 'trading-tracker' },
    { href: '/work-tracker', icon: <WorkTrackerIcon />, label: 'Work Tracker', tooltip: 'Work Tracker', id: 'work-tracker' },
    { href: '/english-coach', icon: <EnglishCoachIcon />, label: 'English Coach', tooltip: 'English Coach', id: 'english-coach' },
    { href: '/brainstorming', icon: <BrainstormingIcon />, label: 'Brainstorming', tooltip: 'Brainstorming', id: 'brainstorming' },
    { href: '/whiteboard', icon: <WhiteboardIcon />, label: 'Whiteboard', tooltip: 'Whiteboard', id: 'whiteboard' },
    { href: '/mind-map', icon: <MindMapIcon />, label: 'Mind Map', tooltip: 'Mind Map', id: 'mindmap' },
    { href: '/docs', icon: <DocsIcon />, label: 'Docs', tooltip: 'Docs', id: 'docs' },
    { href: '/learning-tool', icon: <LearningAssistantIcon />, label: 'Learning Tool', tooltip: 'Learning Tool', id: 'learning-tool' },
    { href: '/pomodoro', icon: <PomodoroIcon />, label: 'Pomodoro', tooltip: 'Pomodoro Timer', id: 'pomodoro' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, settings } = useAuth();
  const { open } = useSidebar();
  const [menuItems, setMenuItems] = React.useState(defaultMenuItems);

  React.useEffect(() => {
    if (user) {
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
    }
  }, [user, settings.sidebarOrder]);

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/home') {
      return pathname === '/home';
    }
     if (href === '/dashboard/lists') {
      return pathname.startsWith('/dashboard/lists') || pathname.startsWith('/dashboard/list');
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
    <Sidebar variant={settings?.sidebarVariant}>
      <SidebarRail />
      <SidebarHeader>
        
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
                                    <SidebarMenuItem ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive(item.href)}
                                            tooltip={item.tooltip}
                                        >
                                            <Link href={item.href || '#'} className="flex items-center w-full">
                                                <div className={cn("p-1", !open && "hidden")}>
                                                    <GripVertical className="h-4 w-4 text-muted-foreground"/>
                                                </div>
                                                <div className="w-8 h-8 flex items-center justify-center">
                                                  {React.cloneElement(item.icon as React.ReactElement, { className: "h-6 w-6" })}
                                                </div>
                                                {open && <span className="flex-1 ml-2">{item.label}</span>}
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
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                {open && <span>Settings</span>}
              </SidebarMenuButton>
            </SettingsDialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help">
              <Link href="/help">
                <HelpCircle />
                {open && <span>Help</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
