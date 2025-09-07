
'use client';

import type { Habit, HabitCompletion } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import Link from 'next/link';
import { AddHabitDialog } from './add-habit-dialog';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toggleHabitCompletion } from '@/lib/habits';
import moment from 'moment';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onDelete: (habitId: string) => void;
}

export function HabitCard({ habit, onDelete }: HabitCardProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  
  const todayStr = moment().format('YYYY-MM-DD');
  const isCompletedToday = useMemo(() => {
    return completions.some(c => c.date === todayStr);
  }, [completions, todayStr]);

  useEffect(() => {
    if (user && habit.id) {
        const completionsQuery = query(
            collection(db, 'users', user.uid, 'habitCompletions'), 
            where('habitId', '==', habit.id),
            orderBy('date', 'desc')
        );
        const unsubscribe = onSnapshot(completionsQuery, (snapshot) => {
            setCompletions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HabitCompletion)));
        });
        return () => unsubscribe();
    }
  }, [user, habit.id]);


  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleToggleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    toggleHabitCompletion(user.uid, habit.id, todayStr, !isCompletedToday);
  }

  const IconComponent = (LucideIcons as any)[habit.icon] || LucideIcons.CheckCircle;

  return (
    <>
      <Link href={`/habits/${habit.id}`} className="group">
        <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
          <CardHeader className="flex-row items-start justify-between">
            <div className="flex items-center gap-3">
              <IconComponent className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline group-hover:underline">{habit.title}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">{habit.description}</CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleDeleteClick}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={handleDeleteClick}>
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={handleDeleteClick}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the habit "{habit.title}" and all its history.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(habit.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground">Track your daily progress and build a consistent routine.</p>
          </CardContent>
          <CardFooter>
            <Button
                onClick={handleToggleToday}
                className={cn(
                    "w-full",
                    isCompletedToday && "bg-green-600 hover:bg-green-700"
                )}
            >
                {isCompletedToday ? 'Completed Today!' : 'Mark as Done for Today'}
            </Button>
          </CardFooter>
        </Card>
      </Link>
      <AddHabitDialog habit={habit} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
