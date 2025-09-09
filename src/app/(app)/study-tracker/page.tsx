
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { StudyGoal } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddStudyGoalDialog } from '@/components/study-tracker/add-study-goal-dialog';
import { StudyGoalCard } from '@/components/study-tracker/study-goal-card';
import { deleteStudyGoal } from '@/lib/study-tracker';
import { useToast } from '@/hooks/use-toast';

export default function StudyTrackerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'studyGoals'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGoal));
        setGoals(goalsData);
      });
      return () => unsubscribe();
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

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">Study Tracker</h1>
            <p className="text-muted-foreground">Track your learning goals and progress.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Study Goal
            </Button>
        </div>
      </div>
      
       {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Study Goals Yet</h3>
            <p className="text-muted-foreground">Click "New Study Goal" to set your first one.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
                <StudyGoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
            ))}
        </div>
      )}

      <AddStudyGoalDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
