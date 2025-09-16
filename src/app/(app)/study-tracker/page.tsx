
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { StudyGoal, StudySubtopic, StudySession } from '@/lib/types';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AddStudyGoalDialog } from '@/components/study-tracker/add-study-goal-dialog';
import { StudyGoalCard } from '@/components/study-tracker/study-goal-card';
import { deleteStudyGoal } from '@/lib/study-tracker';
import { useToast } from '@/hooks/use-toast';
import { InsightsDashboard } from '@/components/study-tracker/insights-dashboard';
import { GamificationProfile } from '@/components/study-tracker/gamification-profile';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StudyGoalListView } from '@/components/study-tracker/study-goal-list-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudyTrackerIcon } from '@/components/icons/tools/study-tracker-icon';


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
       <div className="flex items-center gap-4">
          <StudyTrackerIcon className="h-10 w-10 text-primary"/>
          <div>
              <h1 className="text-3xl font-bold font-headline">Study Tracker</h1>
              <p className="text-muted-foreground">Track your learning goals, progress, and gamified stats.</p>
          </div>
      </div>
      
       <Tabs defaultValue="goals" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="goals"><StudyTrackerIcon className="mr-2 h-4 w-4"/> Study Goals</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/> Analytics & Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="goals" className="flex-1 flex flex-col min-h-0 mt-4 space-y-4">
                <div className="flex justify-end items-center gap-2">
                    <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="Study Goal view">
                        <ToggleGroupItem value="card" aria-label="Card view">
                            <LayoutGrid />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view">
                            <List />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <PlusCircle />
                        New Study Goal
                    </Button>
                </div>

                {goals.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
                        <StudyTrackerIcon className="h-24 w-24 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold font-headline">No Study Goals Yet</h3>
                        <p className="text-muted-foreground">Click "New Study Goal" to set your first one.</p>
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
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 mt-4">
                 <div className="grid lg:grid-cols-[1fr_350px] gap-6">
                    <InsightsDashboard 
                        goals={goals} 
                        subtopics={subtopics} 
                        sessions={sessions}
                    />
                    <GamificationProfile />
                </div>
            </TabsContent>
        </Tabs>

      <AddStudyGoalDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
