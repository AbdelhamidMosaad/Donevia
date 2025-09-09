
'use client';

import type { StudyGoal, StudyProfile, StudySession } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Lightbulb, PlusSquare, Trash2, Flame, BarChart, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useEffect, useMemo } from 'react';
import moment from 'moment';

interface InsightsDashboardProps {
  goals: StudyGoal[];
  onAddSample: () => void;
  onCleanup: () => void;
}

function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '0m';
}

export function InsightsDashboard({ goals, onAddSample, onCleanup }: InsightsDashboardProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    if (user) {
        const sessionsRef = collection(db, 'users', user.uid, 'studySessions');
        const unsubscribe = onSnapshot(sessionsRef, (snapshot) => {
            setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession)))
        });
        return () => unsubscribe();
    }
  }, [user]);

  const totalGoals = goals.length;
  
  const weeklyStudyTime = useMemo(() => {
      const oneWeekAgo = moment().subtract(7, 'days').startOf('day');
      const weeklySessions = sessions.filter(s => moment(s.date.toDate()).isAfter(oneWeekAgo));
      return weeklySessions.reduce((acc, session) => acc + session.durationSeconds, 0);
  }, [sessions]);


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 col-span-full lg:col-span-1">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                 <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalGoals}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatTime(weeklyStudyTime)}</div>
            </CardContent>
        </Card>
        <Card className="flex flex-col justify-center">
            <CardContent className="pt-6 flex flex-col md:flex-row items-center justify-center gap-4">
                 <Button onClick={onAddSample} variant="outline" className="w-full md:w-auto">
                    <PlusSquare className="mr-2 h-4 w-4" /> Sample
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full md:w-auto">
                            <Trash2 className="mr-2 h-4 w-4" /> Cleanup
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete all subtopics that have been marked as completed across all of your study goals. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onCleanup}>Yes, cleanup</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    </div>
  );
}
