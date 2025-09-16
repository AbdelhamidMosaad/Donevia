
'use client';

import { useState, useEffect } from 'react';
import type { Habit, HabitCompletion } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { toggleHabitCompletion } from '@/lib/habits';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import moment from 'moment';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface HabitTrackerProps {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export function HabitTracker({ habits, onEdit, onDelete }: HabitTrackerProps) {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<Record<string, Set<string>>>({});
  const [currentWeek, setCurrentWeek] = useState(moment().startOf('week'));

  useEffect(() => {
    if (!user) return;

    const habitIds = habits.map(h => h.id);
    if (habitIds.length === 0) return;

    const completionsRef = collection(db, 'users', user.uid, 'habitCompletions');
    const q = query(completionsRef, where('habitId', 'in', habitIds));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCompletions: Record<string, Set<string>> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as HabitCompletion;
        if (!newCompletions[data.habitId]) {
          newCompletions[data.habitId] = new Set();
        }
        newCompletions[data.habitId].add(data.date);
      });
      setCompletions(newCompletions);
    });

    return () => unsubscribe();
  }, [user, habits]);

  const handleToggleCompletion = (habitId: string, date: string) => {
    if (!user) return;
    const isCompleted = completions[habitId]?.has(date);
    toggleHabitCompletion(user.uid, habitId, date, !isCompleted);
  };

  const days = Array.from({ length: 7 }, (_, i) => currentWeek.clone().add(i, 'days'));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(currentWeek.clone().subtract(1, 'week'))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold font-headline">
            {currentWeek.format('MMMM D')} - {currentWeek.clone().endOf('week').format('MMMM D, YYYY')}
          </h3>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(currentWeek.clone().add(1, 'week'))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Habit</TableHead>
                {days.map(day => (
                  <TableHead key={day.format('YYYY-MM-DD')} className="text-center">
                    <div className="flex flex-col items-center">
                      <span>{day.format('ddd')}</span>
                      <span className="text-xs text-muted-foreground">{day.format('D')}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {habits.map(habit => (
                <TableRow key={habit.id}>
                  <TableCell className="font-medium">{habit.name}</TableCell>
                  {days.map(day => {
                    const dateString = day.format('YYYY-MM-DD');
                    const isCompleted = completions[habit.id]?.has(dateString);
                    return (
                      <TableCell key={dateString} className="text-center">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleToggleCompletion(habit.id, dateString)}
                          aria-label={`Mark ${habit.name} as done for ${dateString}`}
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => onEdit(habit)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete the habit "{habit.name}".</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(habit.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
