
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, GraduationCap, LayoutGrid, List, PlusSquare, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { StudyGoal, StudySubtopic, StudySession } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddStudyGoalDialog } from '@/components/study-tracker/add-study-goal-dialog';
import { StudyGoalCard } from '@/components/study-tracker/study-goal-card';
import { deleteStudyGoal, addSampleStudyGoal, cleanupFinishedSubtopics } from '@/lib/study-tracker';
import { useToast } from '@/hooks/use-toast';
import { InsightsDashboard } from '@/components/study-tracker/insights-dashboard';
import { GamificationProfile } from '@/components/study-tracker/gamification-profile';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StudyGoalListView } from '@/components/study-tracker/study-goal-list-view';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type View = 'card' | 'list';

export default function StudyTrackerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [subtopics, setSubtopics] = useState<StudySubtopic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [view, setView] = useState<View>('card');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
     if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists() && docSnap.data().studyTrackerView) {
          setView(docSnap.data().studyTrackerView);
        }
      });
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const goalsQuery = query(collection(db, 'users', user.uid, 'studyGoals'), orderBy('createdAt', 'desc'));
      const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
        const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyGoal));
        setGoals(goalsData);
      });

      const subtopicsQuery = query(collection(db, 'users', user.uid, 'studySubtopics'));
      const unsubscribeSubtopics = onSnapshot(subtopicsQuery, (snapshot) => {
        const subtopicsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySubtopic));
        setSubtopics(subtopicsData);
      });
      
      const sessionsQuery = query(collection(db, 'users', user.uid, 'studySessions'));
      const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
        const sessionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
        setSessions(sessionsData);
      });

      return () => {
        unsubscribeGoals();
        unsubscribeSubtopics();
        unsubscribeSessions();
      }
    }
  }, [user]);

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return;
    try {
      await deleteStudyGoal(user.uid, goalId);
      toast({ title: 'Study Goal Deleted', description: 'The study goal and its milestones have been removed.' });
    } catch (e) {
      console.error("Error deleting study goal: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete study goal.' });
    }
  };
  
  const handleAddSample = async () => {
    if(!user) return;
    try {
        await addSampleStudyGoal(user.uid);
        toast({ title: "Sample Goal Added!", description: "A sample study goal has been added to your list."});
    } catch (e) {
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to add sample goal.' });
    }
  };
  
  const handleCleanup = async () => {
    if(!user) return;
     try {
        const count = await cleanupFinishedSubtopics(user.uid);
        toast({ title: "Cleanup Complete!", description: `${count} completed subtopics were deleted.`});
    } catch (e) {
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to clean up subtopics.' });
    }
  }

  const handleViewChange = (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            setDoc(settingsRef, { studyTrackerView: newView }, { merge: true });
        }
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline">Study Tracker</h1>
            <p className="text-muted-foreground">Track your learning goals and progress.</p>
        </div>
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Study Goal view">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
             <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Study Goal
            </Button>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          <InsightsDashboard 
              goals={goals} 
              subtopics={subtopics} 
              sessions={sessions}
          />
          <div className="flex flex-col gap-6">
            <GamificationProfile />
             <Card>
                <CardHeader>
                    <CardTitle>Utilities</CardTitle>
                    <CardDescription>Extra actions for managing your study tracker.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <Button onClick={handleAddSample} variant="outline" className="w-full">
                        <PlusSquare className="mr-2 h-4 w-4" /> Add Sample Goal
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" /> Cleanup Finished Subtopics
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
                                <AlertDialogAction onClick={handleCleanup}>Yes, cleanup</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
          </div>
      </div>

       <div className="mt-6">
         <h2 className="text-2xl font-bold font-headline mb-4">Your Study Goals</h2>
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold font-headline">No Study Goals Yet</h3>
                <p className="text-muted-foreground">Click "New Study Goal" to set your first one, or add a sample goal to see how it works.</p>
            </div>
          ) : view === 'list' ? (
              <StudyGoalListView goals={goals} onDelete={handleDeleteGoal} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map(goal => (
                    <StudyGoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
                ))}
            </div>
          )}
      </div>

      <AddStudyGoalDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
