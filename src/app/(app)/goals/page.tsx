
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Goal } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddGoalDialog } from '@/components/goals/add-goal-dialog';
import { GoalCard } from '@/components/goals/goal-card';
import { deleteGoal } from '@/lib/goals';
import { useToast } from '@/hooks/use-toast';
import { GoalsIcon } from '@/components/icons/tools/goals-icon';

export default function GoalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
        setGoals(goalsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await deleteGoal(user.uid, goalId);
      toast({ title: 'Goal Deleted', description: 'The goal and its related data have been removed.' });
    } catch (e) {
      console.error("Error deleting goal: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete goal.' });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <GoalsIcon className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Goals</h1>
                <p className="text-muted-foreground">Track your ambitions and milestones.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Goal
            </Button>
        </div>
      </div>
      
       {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <GoalsIcon className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Goals Yet</h3>
            <p className="text-muted-foreground">Click "New Goal" to set your first one.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
            ))}
        </div>
      )}

      <AddGoalDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
