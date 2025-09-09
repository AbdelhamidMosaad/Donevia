
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, Stage, TaskList, RecapResponse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Clock, Flag, PlusSquare, Folder, LayoutDashboard, BarChart3, Sparkles, Trophy, ListTodo, Lightbulb, Activity, Share2 } from 'lucide-react';
import moment from 'moment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { RecapGenerator } from '@/components/recap-generator';


function TaskItem({ task }: { task: Task }) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
        <Link href={`/dashboard/lists/${task.listId}`}>
            <p className="font-medium hover:underline">{task.title}</p>
        </Link>
      <span className="text-sm text-muted-foreground">
        {moment(task.dueDate.toDate()).format('MMM D')}
      </span>
    </div>
  );
}

function OverviewTab({ tasks }: { tasks: Task[] }) {
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);
    const [highPriorityTasks, setHighPriorityTasks] = useState<Task[]>([]);
    const [dueSoonTasks, setDueSoonTasks] = useState<Task[]>([]);
    
    useEffect(() => {
        setRecentTasks(tasks.filter(t => !!t.createdAt).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0, 5));
        setHighPriorityTasks(tasks.filter(t => t.priority === 'High').slice(0, 5));
        
        const sevenDaysFromNow = moment().add(7, 'days').toDate();
        setDueSoonTasks(
            tasks.filter(t => t.dueDate.toDate() >= new Date() && t.dueDate.toDate() <= sevenDaysFromNow)
            .sort((a,b) => a.dueDate.toMillis() - b.dueDate.toMillis())
            .slice(0, 5)
        );

    }, [tasks]);

    return (
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><PlusSquare /> Recently Created</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/lists">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {recentTasks.length > 0 ? recentTasks.map(task => <TaskItem key={task.id} task={task} />) : <p className="text-muted-foreground text-sm">No recent tasks.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Flag /> High Priority</CardTitle>
                     <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/lists">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {highPriorityTasks.length > 0 ? highPriorityTasks.map(task => <TaskItem key={task.id} task={task} />) : <p className="text-muted-foreground text-sm">No high priority tasks.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Clock /> Due Soon</CardTitle>
                     <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/lists">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </CardHeader>
                <CardContent>
                     {dueSoonTasks.length > 0 ? dueSoonTasks.map(task => <TaskItem key={task.id} task={task} />) : <p className="text-muted-foreground text-sm">No tasks due soon.</p>}
                </CardContent>
            </Card>
        </div>
    )
}

const RecapDisplay = ({ recap, period }: { recap: RecapResponse; period: 'daily' | 'weekly' }) => {
    
    const handleShare = () => {
        if (!recap || !navigator.share) {
            return;
        }

        const shareText = `My ${period} recap:\n\n*${recap.title}*\n\n- ✅ Completed: ${recap.quantitativeSummary.tasksCompleted}\n- 🚀 Created: ${recap.quantitativeSummary.tasksCreated}\n- ⚠️ Overdue: ${recap.quantitativeSummary.tasksOverdue}\n\n*Highlights:*\n${recap.accomplishments.map(h => `- ${h}`).join('\n')}\n\n*Insights:*\n${recap.productivityInsights}`;

        navigator.share({
            title: `My ${period} recap`,
            text: shareText,
        }).catch(error => console.error('Error sharing', error));
    }

    return (
        <Card className="border-primary/20 border-2">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">{recap.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-3xl">{recap.quantitativeSummary.tasksCompleted}</CardTitle>
                            <p className="text-sm text-muted-foreground">Tasks Completed</p>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-3xl">{recap.quantitativeSummary.tasksCreated}</CardTitle>
                            <p className="text-sm text-muted-foreground">Tasks Created</p>
                        </CardHeader>
                    </Card>
                     <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-3xl">{recap.quantitativeSummary.tasksOverdue}</CardTitle>
                            <p className="text-sm text-muted-foreground">Tasks Overdue</p>
                        </CardHeader>
                    </Card>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Trophy className="text-yellow-500" /> Key Accomplishments</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                        {recap.accomplishments.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><ListTodo className="text-red-500" /> Challenges & Overdue</h3>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                         {recap.challenges.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Lightbulb className="text-blue-500"/> Productivity Insights</h3>
                    <p className="text-muted-foreground italic">"{recap.productivityInsights}"</p>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Activity className="text-green-500" /> Focus for Next Period</h3>
                    <p className="text-muted-foreground">{recap.nextPeriodFocus}</p>
                </div>

            </CardContent>
             <CardFooter>
                 <Button variant="outline" onClick={handleShare} disabled={!navigator.share}>
                    <Share2 className="mr-2 h-4 w-4" /> Share Recap
                </Button>
             </CardFooter>
        </Card>
    )
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      setDataLoading(true);
      const taskQuery = query(collection(db, 'users', user.uid, 'tasks'));
      const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
        if(dataLoading) setDataLoading(false);
      });

      const listsQuery = query(collection(db, 'users', user.uid, 'taskLists'));
      const unsubscribeLists = onSnapshot(listsQuery, (snapshot) => {
        const allStages: Stage[] = [];
        snapshot.docs.forEach(doc => {
            const list = doc.data() as TaskList;
            if (list.stages) {
                allStages.push(...list.stages);
            }
        });
        const uniqueStages = allStages.filter((stage, index, self) =>
            index === self.findIndex((s) => (
                s.id === stage.id && s.name === stage.name
            ))
        );
        setStages(uniqueStages);
      });

      return () => {
        unsubscribeTasks();
        unsubscribeLists();
      };
    }
  }, [user]);

  if (loading || !user || dataLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
        <div className="flex items-center gap-4">
            <LayoutDashboard className="h-8 w-8 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
                <p className="text-muted-foreground">Your workspace overview, analytics, and AI-powered insights.</p>
            </div>
        </div>
        
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="overview"><LayoutDashboard className="mr-2 h-4 w-4"/> Overview</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/> Analytics</TabsTrigger>
                <TabsTrigger value="recap"><Sparkles className="mr-2 h-4 w-4"/> AI Recap</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="flex-1 mt-4">
                <OverviewTab tasks={tasks} />
            </TabsContent>
            <TabsContent value="analytics" className="flex-1 mt-4">
                <AnalyticsDashboard tasks={tasks} stages={stages} />
            </TabsContent>
            <TabsContent value="recap" className="flex-1 mt-4">
                <RecapGenerator allTasks={tasks} recapDisplay={RecapDisplay} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
