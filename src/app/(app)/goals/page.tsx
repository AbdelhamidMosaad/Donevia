
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, Minus, Plus, GripHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Goal } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddGoalDialog } from '@/components/goals/add-goal-dialog';
import { GoalCard } from '@/components/goals/goal-card';
import { deleteGoal } from '@/lib/goals';
import { useToast } from '@/hooks/use-toast';
import { GoalsIcon } from '@/components/icons/tools/goals-icon';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type CardSize = 'small' | 'medium' | 'large';

export default function GoalsPage() {
  const { user, loading, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [cardSize, setCardSize] = useState<CardSize>(settings.goalsCardSize || 'large');
  
  useEffect(() => {
    if(settings.goalsCardSize) {
        setCardSize(settings.goalsCardSize);
    }
  }, [settings.goalsCardSize]);

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
  
  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize && user) {
        setCardSize(newSize);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { goalsCardSize: newSize }, { merge: true });
    }
  }

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
            <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                <ToggleGroupItem value="small" aria-label="Small cards"><GripHorizontal/></ToggleGroupItem>
                <ToggleGroupItem value="medium" aria-label="Medium cards"><Minus/></ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle />
              New Goal
            </Button>
        </div>
      </div>
      
       {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
            <GoalsIcon className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Goals Yet</h3>
            <p className="text-muted-foreground">Click "New Goal" to set your first one.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} size={cardSize}/>
            ))}
        </div>
      )}

      <AddGoalDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
