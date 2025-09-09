
'use client';

import type { StudyGoal, StudyProfile, StudySession, StudySubtopic } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

interface InsightsDashboardProps {
  goals: StudyGoal[];
  subtopics: StudySubtopic[];
  sessions: StudySession[];
  onAddSample: () => void;
  onCleanup: () => void;
}

function formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(' ') : '0m';
}

export function InsightsDashboard({ goals, subtopics, sessions, onAddSample, onCleanup }: InsightsDashboardProps) {
  const { user } = useAuth();

  const totalGoals = goals.length;
  
  const weeklyStudyTime = useMemo(() => {
      const oneWeekAgo = moment().subtract(7, 'days').startOf('day');
      const weeklySessions = sessions.filter(s => moment(s.date.toDate()).isAfter(oneWeekAgo));
      return weeklySessions.reduce((acc, session) => acc + session.durationSeconds, 0);
  }, [sessions]);
  
  const averageSubtopicTime = useMemo(() => {
    const completedSubtopicsWithTime = subtopics.filter(s => s.isCompleted && (s.timeSpentSeconds || 0) > 0);
    if (completedSubtopicsWithTime.length === 0) return 0;
    const totalSeconds = completedSubtopicsWithTime.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);
    return Math.round((totalSeconds / completedSubtopicsWithTime.length) / 60); // in minutes
  }, [subtopics]);
  
  const progressPerGoal = useMemo(() => {
    return goals.map(goal => {
        const goalSubtopics = subtopics.filter(s => s.goalId === goal.id);
        const completedCount = goalSubtopics.filter(s => s.isCompleted).length;
        const percentage = goalSubtopics.length > 0 ? (completedCount / goalSubtopics.length) * 100 : 0;
        return {
            name: goal.title.length > 15 ? `${goal.title.substring(0, 15)}...` : goal.title,
            progress: parseFloat(percentage.toFixed(1)),
        };
    }).sort((a,b) => b.progress - a.progress);
  }, [goals, subtopics]);


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 col-span-full">
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
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg. Subtopic Time</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                 <div className="text-2xl font-bold">~{averageSubtopicTime} min</div>
            </CardContent>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Progress per Goal</CardTitle>
                <CardDescription>Completion percentage for each of your study goals.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{}} className="h-[250px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={progressPerGoal} layout="vertical" margin={{ left: 10, right: 30 }}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                             <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                             <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                             <Bar dataKey="progress" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="flex flex-col justify-center">
            <CardHeader>
                 <CardTitle>Utilities</CardTitle>
                 <CardDescription>Extra actions for managing your study tracker.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-center gap-4">
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
