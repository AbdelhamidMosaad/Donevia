
'use client';

import type { StudyGoal, StudySubtopic } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, GraduationCap } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import moment from 'moment';
import Link from 'next/link';
import { AddStudyGoalDialog } from './add-study-goal-dialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StudyGoalCardProps {
  goal: StudyGoal;
  onDelete: (goalId: string) => void;
}

export function StudyGoalCard({ goal, onDelete }: StudyGoalCardProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subtopics, setSubtopics] = useState<StudySubtopic[]>([]);

  useEffect(() => {
    if (user && goal.id) {
        const subtopicsQuery = query(collection(db, 'users', user.uid, 'studySubtopics'), where('goalId', '==', goal.id));
        const unsubscribe = onSnapshot(subtopicsQuery, (snapshot) => {
            setSubtopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySubtopic)));
        });
        return () => unsubscribe();
    }
  }, [user, goal.id]);

  const progressPercentage = useMemo(() => {
    if (subtopics.length === 0) return 0;
    const completedCount = subtopics.filter(m => m.isCompleted).length;
    return (completedCount / subtopics.length) * 100;
  }, [subtopics]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <Link href={`/study-tracker/${goal.id}`} className="group">
        <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="font-headline group-hover:underline flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" />{goal.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">{goal.description}</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={handleDeleteClick} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={handleDeleteClick}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the goal "{goal.title}" and all its chapters and subtopics.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(goal.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-2">
                <Progress value={progressPercentage} aria-label={`${Math.round(progressPercentage)}% complete`} />
                <p className="text-xs text-muted-foreground">{subtopics.filter(m => m.isCompleted).length} of {subtopics.length} subtopics complete.</p>
            </div>
          </CardContent>
          <CardFooter>
             <p className="text-xs text-muted-foreground">Created on {goal.createdAt ? moment(goal.createdAt.toDate()).format('MMM D, YYYY') : 'just now'}</p>
          </CardFooter>
        </Card>
      </Link>
      <AddStudyGoalDialog goal={goal} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
