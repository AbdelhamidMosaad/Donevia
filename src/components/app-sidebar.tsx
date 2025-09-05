
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
  MoreHorizontal,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, orderBy, addDoc, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { SettingsDialog } from './settings-dialog';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

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
  const [editingListId, setEditingListId] = React.useState<string | null>(null);
  const [editingListName, setEditingListName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editingListId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingListId]);

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

  const handleAddList = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'taskLists'), {
        name: 'Untitled List',
        createdAt: Timestamp.now(),
      });
      toast({
        title: '✓ List Added',
        description: `"Untitled List" has been added.`,
      });
      setEditingListId(docRef.id);
      setEditingListName('Untitled List');
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add task list. Please try again.',
      });
    }
  };

  const handleStartEdit = (list: TaskList) => {
    setEditingListId(list.id);
    setEditingListName(list.name);
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditingListName('');
  };

  const handleFinishEdit = async () => {
    if (!editingListId || !user) return;

    const trimmedName = editingListName.trim();
    if (!trimmedName) {
      handleDeleteList(editingListId); // Delete if name is empty
      handleCancelEdit();
      return;
    }

    const listRef = doc(db, 'users', user.uid, 'taskLists', editingListId);
    try {
      await updateDoc(listRef, { name: trimmedName });
      toast({
        title: '✓ List Updated',
        description: `List renamed to "${trimmedName}".`,
      });
    } catch (e) {
      console.error("Error updating document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to rename list.',
      });
    } finally {
      handleCancelEdit();
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
    try {
      await deleteDoc(listRef);
      toast({
        title: '✓ List Deleted',
      });
    } catch (e) {
      console.error("Error deleting document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete list.',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

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
              <div className="flex items-center w-full justify-between relative group">
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
                <div className="absolute right-2 top-1/2 -translate-y-1/2 group-data-[collapsible=icon]:hidden">
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleAddList}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {taskLists.map(list => (
                    <SidebarMenuSubItem key={list.id} className="group/sub-item">
                      {editingListId === list.id ? (
                        <div className="flex items-center gap-2 pl-2 py-1">
                          <Folder className="h-4 w-4" />
                          <Input
                            ref={inputRef}
                            type="text"
                            value={editingListName}
                            onChange={(e) => setEditingListName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleFinishEdit}
                            className="h-7 text-sm"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center w-full">
                           <SidebarMenuSubButton asChild isActive={pathname === `/dashboard/list/${list.id}`} className="flex-1">
                              <Link href={`/dashboard/list/${list.id}`}>
                                  <Folder className="h-4 w-4" />
                                  <span>{list.name}</span>
                              </Link>
                          </SidebarMenuSubButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/sub-item:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => handleStartEdit(list)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Rename</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeleteList(list.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
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
