
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Folder as FolderIcon, ArrowLeft, GripHorizontal, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import type { StudyGoal, StudyFolder } from '@/lib/types';
import { collection, onSnapshot, query, doc, addDoc, Timestamp, where, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { StudyGoalCard } from '@/components/study-tracker/study-goal-card';
import { deleteStudyGoal, deleteStudyFolder, moveStudyFolder } from '@/lib/study-tracker';
import { StudyFolderCard } from '@/components/study-tracker/study-folder-card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

type CardSize = 'small' | 'medium' | 'large';

export default function StudyFolderPage() {
  const { user, loading, settings } = useAuth();
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [subFolders, setSubFolders] = useState<StudyFolder[]>([]);
  const [allFolders, setAllFolders] = useState<StudyFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<StudyFolder | null>(null);
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
    if (user && folderId) {
       const folderRef = doc(db, 'users', user.uid, 'studyFolders', folderId);
       const unsubscribeFolder = onSnapshot(folderRef, (doc) => {
         if (doc.exists()) {
           setCurrentFolder({ id: doc.id, ...doc.data() } as StudyFolder);
         } else {
           toast({ variant: 'destructive', title: 'Folder not found' });
           router.push('/study-tracker');
         }
       });

      const goalsQuery = query(collection(db, 'users', user.uid, 'studyGoals'), where('folderId', '==', folderId));
      const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
        setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGoal)));
      });
      
      const subFoldersQuery = query(collection(db, 'users', user.uid, 'studyFolders'), where('parentId', '==', folderId));
      const unsubscribeSubFolders = onSnapshot(subFoldersQuery, (snapshot) => {
        setSubFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyFolder)));
      });


      const allFoldersQuery = query(collection(db, 'users', user.uid, 'studyFolders'));
       const unsubscribeAllFolders = onSnapshot(allFoldersQuery, (snapshot) => {
        setAllFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyFolder)));
      });

      return () => {
        unsubscribeFolder();
        unsubscribeGoals();
        unsubscribeAllFolders();
        unsubscribeSubFolders();
      };
    }
  }, [user, folderId, router, toast]);

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await deleteStudyGoal(user.uid, goalId);
      toast({ title: 'Study Goal Deleted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting goal.' });
    }
  };

  const handleMoveGoalToFolder = async (goalId: string, targetFolderId: string | null) => {
    if (!user) return;
    try {
        const goalRef = doc(db, 'users', user.uid, 'studyGoals', goalId);
        await updateDoc(goalRef, { folderId: targetFolderId });
        toast({ title: '✓ Goal Moved' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error moving goal.'});
    }
  };

  const handleDeleteFolder = async (folderIdToDelete: string) => {
    if (!user) return;
    try {
      await deleteStudyFolder(user.uid, folderIdToDelete);
      toast({ title: 'Folder deleted' });
    } catch(e) {
       console.error("Error deleting folder: ", e);
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete folder.' });
    }
  };

  const handleMoveFolder = async (folderToMoveId: string, newParentId: string | null) => {
    if (!user) return;
    try {
      await moveStudyFolder(user.uid, folderToMoveId, newParentId);
      toast({ title: '✓ Folder Moved' });
    } catch (e) {
      console.error("Error moving folder: ", e);
      toast({ variant: 'destructive', title: 'Error moving folder.' });
    }
  };
  
  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize && user) {
        setCardSize(newSize);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { studyTrackerCardSize: newSize }, { merge: true });
    }
  }


  if (loading || !user || !currentFolder) {
    return <div>Loading folder...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
         <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push(currentFolder.parentId ? `/study-tracker/folder/${currentFolder.parentId}` : '/study-tracker')}><ArrowLeft /></Button>
            <div>
                 <div className="flex items-center gap-2">
                    <FolderIcon className="h-7 w-7 text-primary"/>
                    <h1 className="text-3xl font-bold font-headline">{currentFolder.name}</h1>
                </div>
                <p className="text-muted-foreground">Manage study goals and folders.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                <ToggleGroupItem value="small" aria-label="Small cards"><GripHorizontal/></ToggleGroupItem>
                <ToggleGroupItem value="medium" aria-label="Medium cards"><Minus/></ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
            </ToggleGroup>
        </div>
      </div>
      
       {goals.length === 0 && subFolders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <h3 className="text-xl font-semibold font-headline">This folder is empty</h3>
            <p className="text-muted-foreground">This folder doesn't contain any study goals or sub-folders yet.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-8">
            {subFolders.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-headline mb-4">Sub-folders</h2>
                <div className={cn(
                        "grid gap-6",
                        cardSize === 'large' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                        cardSize === 'medium' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                        cardSize === 'small' && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
                    )}>
                  {subFolders.map(folder => (
                    <StudyFolderCard 
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
              <h2 className="text-2xl font-bold font-headline mb-4">Study Goals</h2>
               {goals.length > 0 ? (
                 <div className={cn(
                    "grid gap-6",
                    cardSize === 'large' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                    cardSize === 'medium' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                    cardSize === 'small' && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
                )}>
                    {goals.map(goal => (
                        <StudyGoalCard
                          key={goal.id}
                          goal={goal}
                          folders={allFolders}
                          onDelete={() => handleDeleteGoal(goal.id)}
                          onMove={handleMoveGoalToFolder}
                          size={cardSize}
                        />
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No study goals in this folder.</p>
              )}
            </div>
        </div>
      )}
    </div>
  );
}
