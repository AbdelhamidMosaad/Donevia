
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, BarChart3, Folder as FolderIcon, GripHorizontal, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { StudyGoal, StudySubtopic, StudySession, StudyFolder } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddStudyGoalDialog } from '@/components/study-tracker/add-study-goal-dialog';
import { StudyGoalCard } from '@/components/study-tracker/study-goal-card';
import { deleteStudyGoal, addStudyFolder, deleteStudyFolder, moveStudyFolder } from '@/lib/study-tracker';
import { useToast } from '@/hooks/use-toast';
import { InsightsDashboard } from '@/components/study-tracker/insights-dashboard';
import { GamificationProfile } from '@/components/study-tracker/gamification-profile';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StudyGoalListView } from '@/components/study-tracker/study-goal-list-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyTrackerIcon } from '@/components/icons/tools/study-tracker-icon';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StudyFolderCard } from '@/components/study-tracker/study-folder-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


type View = 'card' | 'list';
type CardSize = 'small' | 'medium' | 'large';

export default function StudyTrackerPage() {
  const { user, loading, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [subtopics, setSubtopics] = useState<StudySubtopic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [folders, setFolders] = useState<StudyFolder[]>([]);
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [view, setView] = useState<View>('card');
  const [cardSize, setCardSize] = useState<CardSize>(settings.studyTrackerCardSize || 'large');
  
  useEffect(() => {
    if(settings.studyTrackerCardSize) {
        setCardSize(settings.studyTrackerCardSize);
    }
  }, [settings.studyTrackerCardSize]);


  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
     if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().studyTrackerView) {
          setView(docSnap.data().studyTrackerView);
        }
      });
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const goalsQuery = query(collection(db, 'users', user.uid, 'studyGoals'), orderBy('createdAt', 'desc'));
      const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
        const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGoal));
        setGoals(goalsData);
      });

      const subtopicsQuery = query(collection(db, 'users', user.uid, 'studySubtopics'));
      const unsubscribeSubtopics = onSnapshot(subtopicsQuery, (snapshot) => {
        const subtopicsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySubtopic));
        setSubtopics(subtopicsData);
      });
      
      const sessionsQuery = query(collection(db, 'users', user.uid, 'studySessions'));
      const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
        const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
        setSessions(sessionsData);
      });
      
      const foldersQuery = query(collection(db, 'users', user.uid, 'studyFolders'), orderBy('createdAt', 'desc'));
      const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        setFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyFolder)));
      });

      return () => {
        unsubscribeGoals();
        unsubscribeSubtopics();
        unsubscribeSessions();
        unsubscribeFolders();
      }
    }
  }, [user]);

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await deleteStudyGoal(user.uid, goalId);
      toast({ title: 'Study Goal Deleted', description: 'The study goal and its milestones have been removed.' });
    } catch (e) {
      console.error("Error deleting study goal: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete study goal.' });
    }
  };
  
    const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    try {
      await deleteStudyFolder(user.uid, folderId);
      toast({ title: 'Folder deleted.'});
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error deleting folder.'});
    }
  };
  
  const handleAddFolder = async () => {
    if (!user || !newFolderName.trim()) {
        toast({ variant: 'destructive', title: 'Folder name cannot be empty.' });
        return;
    }
    try {
        await addStudyFolder(user.uid, newFolderName, null);
        toast({ title: '✓ Folder Created' });
        setIsNewFolderDialogOpen(false);
        setNewFolderName('');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error creating folder.'});
    }
  };
  
  const handleMoveGoalToFolder = async (goalId: string, folderId: string | null) => {
    if (!user) return;
    try {
        const goalRef = doc(db, 'users', user.uid, 'studyGoals', goalId);
        await updateDoc(goalRef, { folderId: folderId });
        toast({ title: '✓ Goal Moved' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error moving goal.'});
    }
  };
  
  const handleMoveFolder = async (folderId: string, newParentId: string | null) => {
    if (!user) return;
    try {
      await moveStudyFolder(user.uid, folderId, newParentId);
      toast({ title: '✓ Folder Moved' });
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error moving folder.'});
    }
  };

  
  const handleViewChange = (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            setDoc(settingsRef, { studyTrackerView: newView }, { merge: true });
        }
    }
  };

  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize && user) {
        setCardSize(newSize);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { studyTrackerCardSize: newSize }, { merge: true });
    }
  }
  
  const topLevelFolders = folders.filter(f => !f.parentId);
  const unfiledGoals = goals.filter(g => !g.folderId);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex items-center gap-4">
          <StudyTrackerIcon className="h-10 w-10 text-primary"/>
          <div>
              <h1 className="text-3xl font-bold font-headline">Study Tracker</h1>
              <p className="text-muted-foreground">Track your learning goals, progress, and gamified stats.</p>
          </div>
      </div>
      
       <Tabs defaultValue="goals" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="goals"><StudyTrackerIcon className="mr-2 h-4 w-4"/> Study Goals</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/> Analytics & Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="goals" className="flex-1 flex flex-col min-h-0 mt-4 space-y-4">
                <div className="flex justify-end items-center gap-2">
                    <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Study Goal view">
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
                                <PlusCircle /> New
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             <DropdownMenuItem onSelect={() => setIsAddGoalDialogOpen(true)}>New Study Goal</DropdownMenuItem>
                             <DropdownMenuItem onSelect={() => setIsNewFolderDialogOpen(true)}><FolderIcon className="mr-2 h-4 w-4"/>New Folder</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {goals.length === 0 && folders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
                        <StudyTrackerIcon className="h-24 w-24 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold font-headline">No Study Goals Yet</h3>
                        <p className="text-muted-foreground">Click "New" to set your first goal or folder.</p>
                    </div>
                ) : (
                    <div className="flex-1 space-y-8">
                        {topLevelFolders.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold font-headline mb-4">Folders</h2>
                                <div className={cn(
                                    "grid gap-6",
                                    cardSize === 'large' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                                    cardSize === 'medium' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                                    cardSize === 'small' && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
                                )}>
                                    {topLevelFolders.map(folder => (
                                        <StudyFolderCard key={folder.id} folder={folder} allFolders={folders} onDelete={() => handleDeleteFolder(folder.id)} onMove={handleMoveFolder} size={cardSize} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div>
                             <h2 className="text-2xl font-bold font-headline mb-4">Study Goals</h2>
                             {unfiledGoals.length > 0 ? (
                                 view === 'list' ? (
                                    <StudyGoalListView goals={unfiledGoals} folders={folders} onDelete={handleDeleteGoal} onMove={handleMoveGoalToFolder} />
                                ) : (
                                    <div className={cn(
                                        "grid gap-6",
                                        cardSize === 'large' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                                        cardSize === 'medium' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                                        cardSize === 'small' && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
                                    )}>
                                        {unfiledGoals.map(goal => (
                                            <StudyGoalCard key={goal.id} goal={goal} folders={folders} onDelete={handleDeleteGoal} onMove={handleMoveGoalToFolder} size={cardSize} />
                                        ))}
                                    </div>
                                )
                             ) : (
                                <p className="text-muted-foreground text-sm">No goals outside of folders.</p>
                             )}
                        </div>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 mt-4">
                 <div className="grid lg:grid-cols-[1fr_350px] gap-6">
                    <InsightsDashboard 
                        goals={goals} 
                        subtopics={subtopics} 
                        sessions={sessions}
                    />
                    <GamificationProfile />
                </div>
            </TabsContent>
        </Tabs>

      <AddStudyGoalDialog open={isAddGoalDialogOpen} onOpenChange={setIsAddGoalDialogOpen} />
      
       <AlertDialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Folder</AlertDialogTitle>
            <AlertDialogDescription>Enter a name for your new study folder.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name" className="sr-only">Folder Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., Q4 Exams"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddFolder} disabled={!newFolderName.trim()}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
