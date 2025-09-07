
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Habit, HabitCompletion } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Repeat } from 'lucide-react';
import moment from 'moment';
import { AddHabitDialog } from '@/components/habits/add-habit-dialog';
import { HabitCalendar } from '@/components/habits/habit-calendar';
import { HabitStats } from '@/components/habits/habit-stats';
import { calculateStreaks, toggleHabitCompletion } from '@/lib/habits';
import * as LucideIcons from 'lucide-react';

export default function HabitDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const habitId = params.habitId as string;

  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isEditHabitOpen, setIsEditHabitOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && habitId) {
      const habitRef = doc(db, 'users', user.uid, 'habits', habitId);
      const unsubscribeHabit = onSnapshot(habitRef, (doc) => {
        if (doc.exists()) {
          setHabit({ id: doc.id, ...doc.data() } as Habit);
        } else {
          router.push('/habits');
        }
      });

      const completionsQuery = query(collection(db, 'users', user.uid, 'habitCompletions'), where('habitId', '==', habitId), orderBy('date', 'asc'));
      const unsubscribeCompletions = onSnapshot(completionsQuery, (snapshot) => {
        setCompletions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitCompletion)));
      });
      
      return () => {
        unsubscribeHabit();
        unsubscribeCompletions();
      };
    }
  }, [user, habitId, router]);

  const stats = useMemo(() => calculateStreaks(completions), [completions]);

  const handleDateToggle = (date: Date, isCompleted: boolean) => {
    if(!user || !habit) return;
    const dateStr = moment(date).format('YYYY-MM-DD');
    toggleHabitCompletion(user.uid, habit.id, dateStr, !isCompleted);
  };

  if (loading || !user || !habit) {
    return <div className="flex items-center justify-center h-full"><p>Loading habit...</p></div>;
  }
  
  const IconComponent = (LucideIcons as any)[habit.icon] || LucideIcons.CheckCircle;

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/habits')}><ArrowLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-3">
                <IconComponent className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">{habit.title}</h1>
                    <p className="text-muted-foreground">{habit.description}</p>
                </div>
            </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditHabitOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Habit</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <HabitStats stats={stats} />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Progress Calendar</CardTitle>
            <CardDescription>Click on a date to mark it as complete or incomplete.</CardDescription>
        </CardHeader>
        <CardContent>
            <HabitCalendar completions={completions} onDateToggle={handleDateToggle} />
        </CardContent>
      </Card>
      
       <AddHabitDialog habit={habit} open={isEditHabitOpen} onOpenChange={setIsEditHabitOpen} />
    </div>
  );
}
