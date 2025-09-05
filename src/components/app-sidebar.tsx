
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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { SettingsDialog } from './settings-dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface TaskList {
  id: string;
  name: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();
  const [taskLists, setTaskLists] = React.useState<TaskList[]>([]);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

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
  
  const handleAddList = () => {
    if (isCreating) return;
    setIsCreating(true);
  }

  const handleFinishCreate = async () => {
    if (isSaving) return;

    if (!user || !newListName.trim()) {
      setNewListName('');
      setIsCreating(false);
      return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'taskLists'), {
        name: newListName,
        createdAt: Timestamp.now(),
      });
      toast({
        title: '✓ List Added',
        description: `"${newListName}" has been added successfully.`,
      });
    } catch (e) {
       console.error("Error adding document: ", e);
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add task list. Please try again.',
      });
    } finally {
      setNewListName('');
      setIsCreating(false);
      setIsSaving(false);
    }
  };
  
  const handleCancelCreate = () => {
    setNewListName('');
    setIsCreating(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishCreate();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  }

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
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleAddList}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
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
                            {isCreating && (
                              <SidebarMenuSubItem>
                                <div className="flex items-center gap-2 pl-2 py-1">
                                  <Folder className="h-4 w-4" />
                                  <Input 
                                    ref={inputRef}
                                    type="text"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleFinishCreate}
                                    placeholder="New list name"
                                    className="h-7 text-sm"
                                  />
                                </div>
                              </SidebarMenuSubItem>
                            )}
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
