
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, Minus, Plus, GripHorizontal, Folder as FolderIcon, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { TaskList as TaskListType, TaskFolder, Task, Stage } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, writeBatch, where, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { TaskListCardView } from '@/components/task-list-card-view';
import { TaskListListView } from '@/components/task-list-list-view';
import { TasksIcon } from '@/components/icons/tools/tasks-icon';
import { v4 as uuidv4 } from 'uuid';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FolderCard } from '@/components/tasks/folder-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { deleteTaskFolder, deleteTaskList } from '@/lib/tasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

type View = 'card' | 'list';
type CardSize = 'small' | 'medium' | 'large';

export default function TaskListsPage() {
  const { user, loading, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<View>('card');
  const [cardSize, setCardSize] = useState<CardSize>(settings.taskListsCardSize || 'large');
  const [taskLists, setTaskLists] = useState<TaskListType[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allStages, setAllStages] = useState<Stage[]>([]);
  const [folders, setFolders] = useState<TaskFolder[]>([]);

  const [isNewListDialogOpen, setIsNewListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists()) {
          const userSettings = docSnap.data();
          if (userSettings.taskListsView) {
            setView(userSettings.taskListsView);
          }
          if (userSettings.taskListsCardSize) {
            setCardSize(userSettings.taskListsCardSize);
          }
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const listsQuery = query(collection(db, 'users', user.uid, 'taskLists'));
      const unsubscribeLists = onSnapshot(listsQuery, (snapshot) => {
        const listsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskListType));
        setTaskLists(listsData);
        
        const stagesData: Stage[] = [];
        listsData.forEach(list => {
            if(list.stages) {
                stagesData.push(...list.stages);
            }
        });
        setAllStages(stagesData.filter((stage, index, self) => index === self.findIndex(s => s.id === stage.id && s.name === stage.name)));
      });
      
      const foldersQuery = query(collection(db, 'users', user.uid, 'taskFolders'));
      const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        setFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskFolder)));
      });

      const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      });

      return () => {
          unsubscribeLists();
          unsubscribeFolders();
          unsubscribeTasks();
      };
    }
  }, [user]);

  const handleViewChange = async (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            await setDoc(settingsRef, { taskListsView: newView }, { merge: true });
        }
    }
  }

  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize) {
        setCardSize(newSize);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            await setDoc(settingsRef, { taskListsCardSize: newSize }, { merge: true });
        }
    }
  }
  
    const handleDeleteList = async (listId: string) => {
        if (!user) return;
        try {
            await deleteTaskList(user.uid, listId);
            toast({ title: 'List deleted successfully.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error deleting list.' });
        }
    };

  const handleAddList = async () => {
    if (!user || !newListName.trim()) {
        toast({ variant: 'destructive', title: 'List name cannot be empty.' });
        return;
    }
    try {
      const newListRef = await addDoc(collection(db, 'users', user.uid, 'taskLists'), {
        name: newListName.trim(),
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        stages: [
            { id: uuidv4(), name: 'Backlog', order: 0 },
            { id: uuidv4(), name: 'To Do', order: 1 },
            { id: uuidv4(), name: 'In Progress', order: 2 },
            { id: uuidv4(), name: 'Done', order: 3 },
        ],
        folderId: null,
      });
      setIsNewListDialogOpen(false);
      setNewListName('');
      router.push(`/dashboard/list/${newListRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add task list. Please try again.',
      });
    }
  };

  const handleAddFolder = async () => {
    if (!user || !newFolderName.trim()) {
        toast({ variant: 'destructive', title: 'Folder name cannot be empty.'});
        return;
    }
    try {
        await addDoc(collection(db, 'users', user.uid, 'taskFolders'), {
            name: newFolderName.trim(),
            ownerId: user.uid,
            createdAt: Timestamp.now(),
            parentId: null,
        });
        toast({ title: "✓ Folder Created" });
        setIsNewFolderDialogOpen(false);
        setNewFolderName('');
    } catch (e) {
        console.error("Error creating folder:", e);
        toast({ variant: 'destructive', title: 'Failed to create folder.' });
    }
  };
  
  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    try {
        await deleteTaskFolder(user.uid, folderId);
        toast({ title: '✓ Folder Deleted'});
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete folder.'});
    }
  }
  
  const handleMoveList = async (listId: string, folderId: string | null) => {
    if (!user) return;
    const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
    await updateDoc(listRef, { folderId });
    toast({ title: '✓ List Moved' });
  }

  const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
    if (!user) return;
    const folderRef = doc(db, 'users', user.uid, 'taskFolders', folderId);
    await updateDoc(folderRef, { parentId: newParentId });
    toast({ title: '✓ Folder Moved'});
  }

  const unfiledLists = taskLists.filter(l => !l.folderId);
  const topLevelFolders = folders.filter(f => !f.parentId);


  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <TasksIcon className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Task Management</h1>
                    <p className="text-muted-foreground">Organize your tasks into lists and folders.</p>
                </div>
            </div>
        </div>
      
        <Tabs defaultValue="lists" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="lists">Lists</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/>Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="lists" className="flex-1 mt-4 flex flex-col min-h-0">
                 <div className="flex items-center justify-end gap-2 mb-4">
                    <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Task list view">
                        <ToggleGroupItem value="card" aria-label="Card view">
                            <LayoutGrid />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view">
                            <List />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    {view === 'card' && (
                        <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                            <ToggleGroupItem value="small" aria-label="Small cards"><GripHorizontal/></ToggleGroupItem>
                            <ToggleGroupItem value="medium" aria-label="Medium cards"><Minus/></ToggleGroupItem>
                            <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
                        </ToggleGroup>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button>
                            <PlusCircle />
                            New
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => setIsNewListDialogOpen(true)}>New Task List</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsNewFolderDialogOpen(true)}><FolderIcon className="mr-2 h-4 w-4" />New Folder</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {taskLists.length === 0 && folders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
                        <TasksIcon className="h-24 w-24 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold font-headline">No Task Lists Yet</h3>
                        <p className="text-muted-foreground">Click "New" to create your first list or folder.</p>
                    </div>
                ) : (
                    <div className="flex-1 space-y-8">
                        {topLevelFolders.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold font-headline mb-4">Folders</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {topLevelFolders.map(folder => (
                                <FolderCard 
                                    key={folder.id} 
                                    folder={folder}
                                    allFolders={folders}
                                    onDelete={() => handleDeleteFolder(folder.id)}
                                    onMove={handleMoveFolder}
                                    size={cardSize}
                                />
                            ))}
                            </div>
                        </div>
                        )}
                        <div>
                        <h2 className="text-2xl font-bold font-headline mb-4">Task Lists</h2>
                            {view === 'card' ? (
                            <TaskListCardView taskLists={unfiledLists} folders={folders} onDelete={handleDeleteList} onMove={handleMoveList} cardSize={cardSize} />
                            ) : (
                            <TaskListListView taskLists={unfiledLists} folders={folders} onDelete={handleDeleteList} onMove={handleMoveList} />
                            )}
                        </div>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="analytics" className="flex-1 mt-4">
                <AnalyticsDashboard tasks={allTasks} stages={allStages} />
            </TabsContent>
        </Tabs>
      

        <Dialog open={isNewListDialogOpen} onOpenChange={setIsNewListDialogOpen}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Create New Task List</DialogTitle>
                    <DialogDescription>Enter a name for your new task list.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="list-name">List Name</Label>
                    <Input
                        id="list-name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="e.g., Q4 Marketing Plan"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewListDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddList} disabled={!newListName.trim()}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>Enter a name for your new folder.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                        id="folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g., Work Projects"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddFolder} disabled={!newFolderName.trim()}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
