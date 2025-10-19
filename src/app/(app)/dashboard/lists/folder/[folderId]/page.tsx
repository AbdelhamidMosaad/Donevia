
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, ArrowLeft, Folder as FolderIcon, GripHorizontal, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { TaskList as TaskListType, TaskFolder } from '@/lib/types';
import { collection, onSnapshot, query, doc, getDoc, setDoc, addDoc, Timestamp, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { TaskListCardView } from '@/components/task-list-card-view';
import { TaskListListView } from '@/components/task-list-list-view';
import { FolderCard } from '@/components/tasks/folder-card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { deleteTaskFolder, deleteTaskFromDb, deleteTaskList } from '@/lib/tasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';

type View = 'card' | 'list';
type CardSize = 'small' | 'medium' | 'large';


export default function TaskFolderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  const { toast } = useToast();
  
  const [view, setView] = useState<View>('card');
  const [cardSize, setCardSize] = useState<CardSize>('large');

  const [currentFolder, setCurrentFolder] = useState<TaskFolder | null>(null);
  const [taskLists, setTaskLists] = useState<TaskListType[]>([]);
  const [subFolders, setSubFolders] = useState<TaskFolder[]>([]);
  const [allFolders, setAllFolders] = useState<TaskFolder[]>([]);

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
    if (user && folderId) {
      const folderRef = doc(db, 'users', user.uid, 'taskFolders', folderId);
      const unsubscribeFolder = onSnapshot(folderRef, (doc) => {
        if (doc.exists()) {
          setCurrentFolder({ id: doc.id, ...doc.data() } as TaskFolder);
        } else {
          toast({ variant: 'destructive', title: 'Folder not found' });
          router.push('/dashboard/lists');
        }
      });
      
      const listsQuery = query(collection(db, 'users', user.uid, 'taskLists'), where('folderId', '==', folderId));
      const unsubscribeLists = onSnapshot(listsQuery, (snapshot) => {
        setTaskLists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskListType)));
      });

      const subFoldersQuery = query(collection(db, 'users', user.uid, 'taskFolders'), where('parentId', '==', folderId));
      const unsubscribeSubFolders = onSnapshot(subFoldersQuery, (snapshot) => {
        setSubFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskFolder)));
      });

      const allFoldersQuery = query(collection(db, 'users', user.uid, 'taskFolders'));
      const unsubscribeAllFolders = onSnapshot(allFoldersQuery, (snapshot) => {
        setAllFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskFolder)));
      });

      return () => {
        unsubscribeFolder();
        unsubscribeLists();
        unsubscribeSubFolders();
        unsubscribeAllFolders();
      };
    }
  }, [user, folderId, router, toast]);

  const handleViewChange = async (newView: View) => {
    if (newView && user) {
        setView(newView);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { taskListsView: newView }, { merge: true });
    }
  };
  
  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize && user) {
        setCardSize(newSize);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { taskListsCardSize: newSize }, { merge: true });
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
        folderId: folderId,
      });
      setIsNewListDialogOpen(false);
      setNewListName('');
      router.push(`/dashboard/list/${newListRef.id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error adding task list.' });
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
            parentId: folderId,
        });
        toast({ title: "✓ Folder Created" });
        setIsNewFolderDialogOpen(false);
        setNewFolderName('');
    } catch (e) {
        toast({ variant: 'destructive', title: 'Failed to create folder.' });
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!user) return;
    try {
        await deleteTaskList(user.uid, listId);
        toast({ title: 'List deleted successfully.' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error deleting list.' });
    }
  };

  const handleDeleteFolder = async (folderIdToDelete: string) => {
    if (!user) return;
    try {
        await deleteTaskFolder(user.uid, folderIdToDelete);
        toast({ title: '✓ Folder Deleted'});
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete folder.'});
    }
  };

  const handleMoveList = async (listId: string, targetFolderId: string | null) => {
    if (!user) return;
    const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
    await updateDoc(listRef, { folderId: targetFolderId });
    toast({ title: '✓ List Moved' });
  };
  
  const handleMoveFolder = async (folderToMoveId: string, newParentId: string | null) => {
    if (!user) return;
    const folderRef = doc(db, 'users', user.uid, 'taskFolders', folderToMoveId);
    await updateDoc(folderRef, { parentId: newParentId });
    toast({ title: '✓ Folder Moved'});
  };

  if (loading || !user || !currentFolder) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push(currentFolder.parentId ? `/dashboard/lists/folder/${currentFolder.parentId}` : '/dashboard/lists')}><ArrowLeft /></Button>
            <div>
                <div className="flex items-center gap-2">
                    <FolderIcon className="h-7 w-7 text-primary"/>
                    <h1 className="text-3xl font-bold font-headline capitalize">{currentFolder.name}</h1>
                </div>
                <p className="text-muted-foreground">Manage your task lists and folders.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
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
      </div>
      
       {taskLists.length === 0 && subFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <h3 className="text-xl font-semibold font-headline">This folder is empty</h3>
            <p className="text-muted-foreground">Click "New" to create a list or sub-folder.</p>
        </div>
      ) : (
         <div className="flex-1 space-y-8">
            {subFolders.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-headline mb-4">Sub-folders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {subFolders.map(folder => (
                    <FolderCard 
                        key={folder.id} 
                        folder={folder}
                        allFolders={allFolders}
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
                <TaskListCardView taskLists={taskLists} folders={allFolders} onDelete={handleDeleteList} onMove={handleMoveList} cardSize={cardSize} />
                ) : (
                <TaskListListView taskLists={taskLists} folders={allFolders} onDelete={handleDeleteList} onMove={handleMoveList} />
                )}
            </div>
        </div>
      )}

        <Dialog open={isNewListDialogOpen} onOpenChange={setIsNewListDialogOpen}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Create New Task List</DialogTitle>
                    <DialogDescription>Enter a name for your new task list in this folder.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="list-name">List Name</Label>
                    <Input
                        id="list-name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="e.g., Q1 Marketing"
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
                    <DialogTitle>Create New Sub-folder</DialogTitle>
                    <DialogDescription>Enter a name for your new sub-folder.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                        id="folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g., Archived Projects"
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

