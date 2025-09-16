
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { AddHabitDialog } from '@/components/habits/add-habit-dialog';
import { HabitTracker } from '@/components/habits/habit-tracker';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Habit } from '@/lib/types';
import { HabitsIcon } from '@/components/icons/tools/habits-icon';
import { useToast } from '@/hooks/use-toast';
import { deleteHabit } from '@/lib/habits';

export default function HabitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

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
        setHabits(habitsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleOpenAddDialog = () => {
    setEditingHabit(null);
    setIsAddDialogOpen(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsAddDialogOpen(true);
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;
    try {
        await deleteHabit(user.uid, habitId);
        toast({ title: "Habit deleted" });
    } catch(e) {
        toast({ variant: 'destructive', title: "Error deleting habit" });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <HabitsIcon className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Habit Tracker</h1>
                <p className="text-muted-foreground">Build consistency and track your daily habits.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle />
              New Habit
            </Button>
        </div>
      </div>
      
       {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <HabitsIcon className="h-24 w-24 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Habits Yet</h3>
            <p className="text-muted-foreground">Click "New Habit" to start tracking your first one.</p>
        </div>
      ) : (
         <HabitTracker 
            habits={habits}
            onEdit={handleEditHabit}
            onDelete={handleDeleteHabit}
          />
      )}

      <AddHabitDialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
            if (!open) {
                setEditingHabit(null);
            }
            setIsAddDialogOpen(open);
        }}
        habit={editingHabit}
      />
    </div>
  );
}
