
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Clock, Flag, PlusSquare, Folder } from 'lucide-react';
import moment from 'moment';

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

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [highPriorityTasks, setHighPriorityTasks] = useState<Task[]>([]);
  const [dueSoonTasks, setDueSoonTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Recent Tasks
      const recentQuery = query(collection(db, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'), limit(5));
      const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
        setRecentTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      });

      // High Priority Tasks
      const priorityQuery = query(collection(db, 'users', user.uid, 'tasks'), where('priority', '==', 'High'), limit(5));
      const unsubscribePriority = onSnapshot(priorityQuery, (snapshot) => {
        setHighPriorityTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      });

      // Due Soon Tasks (e.g., within next 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const dueSoonQuery = query(
        collection(db, 'users', user.uid, 'tasks'), 
        where('dueDate', '>=', new Date()),
        where('dueDate', '<=', sevenDaysFromNow), 
        orderBy('dueDate', 'asc'), 
        limit(5)
      );
      const unsubscribeDueSoon = onSnapshot(dueSoonQuery, (snapshot) => {
        setDueSoonTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      });

      return () => {
        unsubscribeRecent();
        unsubscribePriority();
        unsubscribeDueSoon();
      };
    }
  }, [user]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
        <div className="mb-6">
            <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
            <p className="text-muted-foreground">Here’s a quick overview of your workspace.</p>
        </div>

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
    </div>
  );
}
