
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Folder as FolderIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import type { StudyGoal, StudyFolder } from '@/lib/types';
import { collection, onSnapshot, query, doc, addDoc, Timestamp, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { StudyGoalCard } from '@/components/study-tracker/study-goal-card';
import { deleteStudyGoal } from '@/lib/study-tracker';

export default function StudyFolderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [allFolders, setAllFolders] = useState<StudyFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<StudyFolder | null>(null);

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

      const allFoldersQuery = query(collection(db, 'users', user.uid, 'studyFolders'));
       const unsubscribeAllFolders = onSnapshot(allFoldersQuery, (snapshot) => {
        setAllFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyFolder)));
      });

      return () => {
        unsubscribeFolder();
        unsubscribeGoals();
        unsubscribeAllFolders();
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

  if (loading || !user || !currentFolder) {
    return <div>Loading folder...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
         <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/study-tracker')}><ArrowLeft /></Button>
            <div>
                 <div className="flex items-center gap-2">
                    <FolderIcon className="h-7 w-7 text-primary"/>
                    <h1 className="text-3xl font-bold font-headline">{currentFolder.name}</h1>
                </div>
                <p className="text-muted-foreground">Manage study goals in this folder.</p>
            </div>
        </div>
      </div>
      
       {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <h3 className="text-xl font-semibold font-headline">This folder is empty</h3>
            <p className="text-muted-foreground">This folder doesn't contain any study goals yet.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
                <StudyGoalCard
                  key={goal.id}
                  goal={goal}
                  folders={allFolders}
                  onDelete={() => handleDeleteGoal(goal.id)}
                  onMove={handleMoveGoalToFolder}
                />
            ))}
        </div>
      )}
    </div>
  );
}
