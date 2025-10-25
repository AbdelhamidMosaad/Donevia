
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, LayoutGrid, List, Table, Loader2, BarChart3, FolderPlus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { TaskCalendar } from '@/components/task-calendar';
import { TaskList } from '@/components/task-list';
import { TaskBoard } from '@/components/task-board';
import { TaskTable } from '@/components/task-table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs"
import { AddTaskDialog } from '@/components/add-task-dialog';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TasksIcon } from '@/components/icons/tools/tasks-icon';
import { useTasks } from '@/hooks/use-tasks';
import { BoardSettings } from '@/components/board-settings';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import type { UserSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

type View = 'board' | 'list' | 'table' | 'calendar' | 'analytics';
const DEFAULT_CATEGORIES = ['general', 'work', 'personal'];

export default function TaskListsPage() {
  const { user, settings, loading: authLoading } = useAuth();
  const router = useRouter();
  const { tasks, stages, addTask, updateTask, deleteTask, isLoading: tasksLoading, categories } = useTasks();
  const { toast } = useToast();

  const [view, setView] = useState<View>('board');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isRenameCategoryOpen, setIsRenameCategoryOpen] = useState(false);
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
  const [renamedCategory, setRenamedCategory] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (settings?.tasksView) {
      setView(settings.tasksView);
    }
    if (settings.taskSettings?.categories) {
        setCustomCategories(settings.taskSettings.categories);
    }
  }, [settings]);
  
  const allCategories = useMemo(() => {
    const combined = [...DEFAULT_CATEGORIES, ...customCategories];
    return ['all', ...Array.from(new Set(combined))];
  }, [customCategories]);

  const filteredTasks = useMemo(() => {
    if (activeCategory === 'all') {
      return tasks;
    }
    return tasks.filter(task => (task.category || 'general') === activeCategory);
  }, [tasks, activeCategory]);

  const handleViewChange = async (newView: View) => {
    if (newView && user) {
        setView(newView);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { tasksView: newView }, { merge: true });
    }
  };

  const handleSaveSettings = async (newSettings: Partial<UserSettings['taskSettings']>) => {
    if(!user) return;
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    await setDoc(settingsRef, {
        taskSettings: {
            ...settings.taskSettings,
            ...newSettings,
        }
    }, { merge: true });
  }

  const handleAddNewCategory = async () => {
    if (!newCategory.trim()) return;
    const lowerCaseCategory = newCategory.trim().toLowerCase();
    
    if (allCategories.includes(lowerCaseCategory)) {
        toast({ variant: 'destructive', title: 'Category already exists' });
        return;
    }

    const newCategories = [...customCategories, lowerCaseCategory];
    await handleSaveSettings({ categories: newCategories });
    toast({ title: 'Category Added', description: `"${newCategory}" has been added.`});
    setIsAddCategoryOpen(false);
    setNewCategory('');
  };

  const handleRenameCategory = async () => {
    if (!categoryToRename || !renamedCategory.trim()) return;
    
    const lowerCaseNewCategory = renamedCategory.trim().toLowerCase();
    if(lowerCaseNewCategory === categoryToRename) {
        setIsRenameCategoryOpen(false);
        return;
    }

    if(allCategories.includes(lowerCaseNewCategory)) {
        toast({ variant: 'destructive', title: 'Category already exists' });
        return;
    }

    const newCategories = customCategories.map(c => c === categoryToRename ? lowerCaseNewCategory : c);
    await handleSaveSettings({ categories: newCategories });
    
    const tasksToUpdate = tasks.filter(t => t.category === categoryToRename);
    for (const task of tasksToUpdate) {
        await updateTask(task.id, { category: lowerCaseNewCategory });
    }

    toast({ title: "Category Renamed", description: `"${categoryToRename}" is now "${lowerCaseNewCategory}".`});
    if(activeCategory === categoryToRename) {
        setActiveCategory(lowerCaseNewCategory);
    }
    setIsRenameCategoryOpen(false);
    setCategoryToRename(null);
  };
  
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const newCategories = customCategories.filter(c => c !== categoryToDelete);
    await handleSaveSettings({ categories: newCategories });

    const tasksToUpdate = tasks.filter(t => t.category === categoryToDelete);
    for (const task of tasksToUpdate) {
        await updateTask(task.id, { category: 'general' });
    }

    toast({ title: 'Category Deleted', description: `Bookmarks from "${categoryToDelete}" were moved to "general".` });
    if(activeCategory === categoryToDelete) {
        setActiveCategory('general');
    }
    setCategoryToDelete(null);
  };
    
  if (authLoading || !user) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="ml-2">Loading Tasks...</p>
        </div>
    );
  }

  const renderView = (currentView: View) => {
    if (tasksLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="ml-2">Loading tasks...</p>
        </div>
      );
    }
    switch (currentView) {
      case 'list':
        return <TaskList tasks={filteredTasks} stages={stages} onDeleteTask={deleteTask} onUpdateTask={updateTask} />;
      case 'board':
        return <TaskBoard />; // Using a dummy listId since it's global now
      case 'table':
        return <TaskTable tasks={filteredTasks} stages={stages} />;
      case 'calendar':
        return <TaskCalendar tasks={filteredTasks} onUpdateTask={updateTask} />;
      case 'analytics':
        return <AnalyticsDashboard tasks={filteredTasks} stages={stages} />;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <div>
                 <div className="flex items-center gap-2">
                    <TasksIcon className="h-7 w-7 text-primary" />
                    <h1 className="text-3xl font-bold font-headline capitalize">Tasks</h1>
                </div>
                <p className="text-muted-foreground">Manage all your tasks in one place.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {view === 'board' && <BoardSettings currentStages={stages} />}
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle />
              New Task
            </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
          {allCategories.map(category => {
              const isCustom = !DEFAULT_CATEGORIES.includes(category) && category !== 'all';
              if (isCustom) {
                  return (
                    <div key={category} className="inline-flex">
                      <Button
                        variant={activeCategory === category ? 'default' : 'outline'}
                        onClick={() => setActiveCategory(category)}
                        className="capitalize rounded-r-none"
                      >
                        {category}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant={activeCategory === category ? 'default' : 'outline'} size="icon" className="h-full w-8 rounded-l-none border-l-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => {setCategoryToRename(category); setRenamedCategory(category); setIsRenameCategoryOpen(true);}}>
                            <Edit className="mr-2 h-4 w-4"/> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setCategoryToDelete(category)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
              }
              return (
                  <Button
                    key={category}
                    variant={activeCategory === category ? 'default' : 'outline'}
                    onClick={() => setActiveCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
              );
          })}
           <Button variant="outline" size="sm" onClick={() => setIsAddCategoryOpen(true)}>
                <FolderPlus /> New Category
            </Button>
        </div>
      
       <Tabs value={view} onValueChange={(v) => handleViewChange(v as View)} className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="board"><LayoutGrid /> Board</TabsTrigger>
            <TabsTrigger value="list"><List /> List</TabsTrigger>
            <TabsTrigger value="table"><Table /> Table</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarIcon /> Calendar</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 /> Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="flex-1 mt-4 overflow-y-auto">{renderView('board')}</TabsContent>
          <TabsContent value="list" className="flex-1 mt-4 overflow-y-auto">{renderView('list')}</TabsContent>
          <TabsContent value="table" className="flex-1 mt-4 overflow-y-auto">{renderView('table')}</TabsContent>
          <TabsContent value="calendar" className="flex-1 mt-4 overflow-y-auto">{renderView('calendar')}</TabsContent>
          <TabsContent value="analytics" className="flex-1 mt-4 overflow-y-auto">{renderView('analytics')}</TabsContent>
       </Tabs>

       <AddTaskDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
          onTaskAdded={addTask} 
          onTaskUpdated={updateTask}
          categories={allCategories.filter(c => c !== 'all')}
        />
        
        <AlertDialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Add New Category</AlertDialogTitle>
                    <AlertDialogDescription>Enter a name for your new task category.</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="new-category-name" className="sr-only">Category Name</Label>
                    <Input
                        id="new-category-name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g., Marketing"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setNewCategory('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAddNewCategory} disabled={!newCategory.trim()}>Add</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isRenameCategoryOpen} onOpenChange={setIsRenameCategoryOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Rename Category</AlertDialogTitle>
                    <AlertDialogDescription>Enter a new name for the category "{categoryToRename}".</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="rename-category-name" className="sr-only">New Name</Label>
                    <Input
                        id="rename-category-name"
                        value={renamedCategory}
                        onChange={(e) => setRenamedCategory(e.target.value)}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRenameCategory} disabled={!renamedCategory.trim()}>Rename</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete the category "{categoryToDelete}". Tasks using this category will be moved to "general".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCategory} variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
