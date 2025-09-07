
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Repeat } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Habit } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddHabitDialog } from '@/components/habits/add-habit-dialog';
import { HabitCard } from '@/components/habits/habit-card';
import { deleteHabit } from '@/lib/habits';
import { useToast } from '@/hooks/use-toast';

export default function HabitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'habits'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const habitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
        setHabits(habitsData.filter(h => !h.archived));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;
    try {
      await deleteHabit(user.uid, habitId);
      toast({ title: 'Habit Deleted', description: 'The habit and its history have been removed.' });
    } catch (e) {
      console.error("Error deleting habit: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete habit.' });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">Habit Tracker</h1>
            <p className="text-muted-foreground">Build good habits, break bad ones.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Habit
            </Button>
        </div>
      </div>
      
       {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <Repeat className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Habits Yet</h3>
            <p className="text-muted-foreground">Click "New Habit" to start building a new routine.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map(habit => (
                <HabitCard key={habit.id} habit={habit} onDelete={handleDeleteHabit} />
            ))}
        </div>
      )}

      <AddHabitDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
