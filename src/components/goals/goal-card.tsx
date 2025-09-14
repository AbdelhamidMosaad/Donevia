
'use client';

import type { Goal } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import moment from 'moment';
import Link from 'next/link';
import { AddGoalDialog } from './add-goal-dialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Milestone } from '@/lib/types';
import { GoalsIcon } from '../icons/tools/goals-icon';

interface GoalCardProps {
  goal: Goal;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, onDelete }: GoalCardProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (user && goal.id) {
        const milestonesQuery = query(collection(db, 'users', user.uid, 'milestones'), where('goalId', '==', goal.id));
        const unsubscribe = onSnapshot(milestonesQuery, (snapshot) => {
            setMilestones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Milestone)));
        });
        return () => unsubscribe();
    }
  }, [user, goal.id]);

  const progressPercentage = useMemo(() => {
    if (milestones.length === 0) return goal.status === 'Completed' ? 100 : 0;
    const completedCount = milestones.filter(m => m.isCompleted).length;
    return (completedCount / milestones.length) * 100;
  }, [milestones, goal.status]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <Link href={`/goals/${goal.id}`} className="group">
        <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="font-headline group-hover:underline flex items-center gap-2">
                <GoalsIcon className="h-6 w-6" />
                {goal.title}
              </CardTitle>
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
                      <AlertDialogDescription>This will permanently delete the goal "{goal.title}" and all its milestones and progress updates.</AlertDialogDescription>
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
                <p className="text-xs text-muted-foreground">{milestones.filter(m => m.isCompleted).length} of {milestones.length} milestones complete.</p>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center text-xs text-muted-foreground gap-2">
                <Calendar className="h-4 w-4"/>
                <span>Target: {moment(goal.targetDate.toDate()).format('MMM D, YYYY')}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>
      <AddGoalDialog goal={goal} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
