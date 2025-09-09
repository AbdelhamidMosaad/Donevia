
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Goal, Milestone, ProgressUpdate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, PlusCircle, Target } from 'lucide-react';
import moment from 'moment';
import { AddMilestoneDialog } from '@/components/goals/add-milestone-dialog';
import { MilestoneItem } from '@/components/goals/milestone-item';
import { AddProgressUpdate } from '@/components/goals/add-progress-update';
import { ProgressUpdateCard } from '@/components/goals/progress-update-card';
import { deleteMilestone } from '@/lib/goals';
import { useToast } from '@/hooks/use-toast';
import { AddGoalDialog } from '@/components/goals/add-goal-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GoalDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const goalId = params.goalId as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && goalId) {
      // Subscribe to goal document
      const goalRef = doc(db, 'users', user.uid, 'goals', goalId);
      const unsubscribeGoal = onSnapshot(goalRef, (doc) => {
        if (doc.exists()) {
          setGoal({ id: doc.id, ...doc.data() } as Goal);
        } else {
          router.push('/goals');
        }
      });

      // Subscribe to milestones
      const milestonesQuery = query(collection(db, 'users', user.uid, 'milestones'), where('goalId', '==', goalId), orderBy('dueDate', 'asc'));
      const unsubscribeMilestones = onSnapshot(milestonesQuery, (snapshot) => {
        setMilestones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Milestone)));
      });

      // Subscribe to progress updates
      const updatesQuery = query(collection(db, 'users', user.uid, 'progressUpdates'), where('goalId', '==', goalId), orderBy('createdAt', 'desc'));
      const unsubscribeUpdates = onSnapshot(updatesQuery, (snapshot) => {
        setProgressUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgressUpdate)));
      });
      
      return () => {
        unsubscribeGoal();
        unsubscribeMilestones();
        unsubscribeUpdates();
      };
    }
  }, [user, goalId, router]);

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!user) return;
    try {
        await deleteMilestone(user.uid, milestoneId);
        toast({ title: "Milestone deleted successfully." });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error deleting milestone.' });
    }
  }

  const progressPercentage = useMemo(() => {
    if (milestones.length === 0) return 0;
    const completedCount = milestones.filter(m => m.isCompleted).length;
    return (completedCount / milestones.length) * 100;
  }, [milestones]);

  if (loading || !user || !goal) {
    return <div className="flex items-center justify-center h-full"><p>Loading goal...</p></div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/goals')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <h1 className="text-3xl font-bold font-headline">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
            </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditGoalOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Goal</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold text-primary">{goal.status}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Target Date</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{moment(goal.targetDate.toDate()).format('MMMM D, YYYY')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Overall Progress</CardTitle></CardHeader>
          <CardContent>
             <Progress value={progressPercentage} className="mb-2" />
             <p className="text-sm text-muted-foreground">{Math.round(progressPercentage)}% complete ({milestones.filter(m => m.isCompleted).length}/{milestones.length} milestones)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className='flex items-center gap-2'><Target className="h-5 w-5" /><CardTitle>Milestones</CardTitle></div>
              <Button size="sm" variant="outline" onClick={() => setIsAddMilestoneOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                {milestones.length > 0 ? (
                    <div className="space-y-4">
                        {milestones.map(m => (
                            <MilestoneItem key={m.id} milestone={m} onDelete={() => handleDeleteMilestone(m.id)} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No milestones yet. Add one to get started!</p>
                )}
            </CardContent>
        </Card>
         <Card className="flex flex-col">
            <CardHeader><CardTitle>Progress Journal</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-y-auto">
              <AddProgressUpdate goalId={goalId} />
              <ScrollArea className="flex-1 -mr-4 pr-4">
                 {progressUpdates.length > 0 ? (
                    <div className="space-y-4">
                      {progressUpdates.map(p => (
                          <ProgressUpdateCard key={p.id} update={p} />
                      ))}
                    </div>
                 ) : (
                   <p className="text-center text-muted-foreground py-8">Log your progress to keep a record of your journey.</p>
                 )}
              </ScrollArea>
            </CardContent>
        </Card>
      </div>
       <AddMilestoneDialog goalId={goalId} open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen} />
       <AddGoalDialog goal={goal} open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen} />
    </div>
  );
}
