
'use client';

import type { StudyGoal, StudyProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Lightbulb, PlusSquare, Trash2, Flame } from 'lucide-react';
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
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useEffect } from 'react';

interface InsightsDashboardProps {
  goals: StudyGoal[];
  onAddSample: () => void;
  onCleanup: () => void;
}

function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
}

export function InsightsDashboard({ goals, onAddSample, onCleanup }: InsightsDashboardProps) {
  const { user } = useAuth();
  const [studyProfile, setStudyProfile] = useState<StudyProfile | null>(null);

  useEffect(() => {
    if (user) {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const unsubscribe = onSnapshot(settingsRef, (doc) => {
            if (doc.exists() && doc.data().studyProfile) {
                setStudyProfile(doc.data().studyProfile);
            } else {
                setStudyProfile({ currentStreak: 0, longestStreak: 0, lastStudyDay: '', level: 1, experiencePoints: 0, earnedBadges: [] });
            }
        });
        return () => unsubscribe();
    }
  }, [user]);

  const totalGoals = goals.length;
  const totalStudyTime = goals.reduce((acc, goal) => acc + (goal.timeSpentSeconds || 0), 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 col-span-full lg:col-span-1">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalGoals}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formatTime(totalStudyTime)}</div>
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
