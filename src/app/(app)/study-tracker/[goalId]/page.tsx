
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StudyGoal, StudyMilestone } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, PlusCircle, Flag } from 'lucide-react';
import { AddStudyMilestoneDialog } from '@/components/study-tracker/add-study-milestone-dialog';
import { StudyMilestoneItem } from '@/components/study-tracker/study-milestone-item';
import { deleteStudyMilestone } from '@/lib/study-tracker';
import { useToast } from '@/hooks/use-toast';
import { AddStudyGoalDialog } from '@/components/study-tracker/add-study-goal-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function StudyGoalDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const goalId = params.goalId as string;

  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [milestones, setMilestones] = useState<StudyMilestone[]>([]);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && goalId) {
      const goalRef = doc(db, 'users', user.uid, 'studyGoals', goalId);
      const unsubscribeGoal = onSnapshot(goalRef, (doc) => {
        if (doc.exists()) {
          setGoal({ id: doc.id, ...doc.data() } as StudyGoal);
        } else {
          router.push('/study-tracker');
        }
      });

      const milestonesQuery = query(collection(db, 'users', user.uid, 'studyMilestones'), where('goalId', '==', goalId), orderBy('order', 'asc'));
      const unsubscribeMilestones = onSnapshot(milestonesQuery, (snapshot) => {
        setMilestones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMilestone)));
      });
      
      return () => {
        unsubscribeGoal();
        unsubscribeMilestones();
      };
    }
  }, [user, goalId, router]);

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!user) return;
    try {
        await deleteStudyMilestone(user.uid, milestoneId);
        toast({ title: "Subtopic deleted successfully." });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error deleting subtopic.' });
    }
  }

  const progressPercentage = useMemo(() => {
    if (milestones.length === 0) return 0;
    const completedCount = milestones.filter(m => m.isCompleted).length;
    return (completedCount / milestones.length) * 100;
  }, [milestones]);
  
  const flagPosition = `${progressPercentage}%`;

  if (loading || !user || !goal) {
    return <div className="flex items-center justify-center h-full"><p>Loading goal...</p></div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/study-tracker')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <h1 className="text-3xl font-bold font-headline">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
            </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditGoalOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Goal</Button>
      </div>

      <Card>
          <CardHeader><CardTitle>Progress Track</CardTitle></CardHeader>
          <CardContent>
              <div className="relative h-10">
                  <div className="absolute bottom-2 left-0 right-0 h-2 bg-red-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                  <div className="absolute top-0 transition-all duration-500 ease-out" style={{ left: `calc(${flagPosition} - 12px)` }}>
                      <Flag className="h-6 w-6 text-primary" />
                  </div>
              </div>
          </CardContent>
      </Card>


        <Card className="flex flex-col flex-1 min-h-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>Chapters & Subtopics</CardTitle>
                  <CardDescription>{milestones.filter(m => m.isCompleted).length}/{milestones.length} completed</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsAddMilestoneOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Subtopic</Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                {milestones.length > 0 ? (
                    <div className="space-y-4">
                        {milestones.map(m => (
                            <StudyMilestoneItem key={m.id} milestone={m} onDelete={() => handleDeleteMilestone(m.id)} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No subtopics yet. Add one to get started!</p>
                )}
            </CardContent>
        </Card>

       <AddStudyMilestoneDialog goalId={goalId} open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen} milestonesCount={milestones.length}/>
       <AddStudyGoalDialog goal={goal} open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen} />
    </div>
  );
}
