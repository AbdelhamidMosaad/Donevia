
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, Stage, TaskList } from '@/lib/types';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BarChart3 } from 'lucide-react';

export default function DashboardAnalyticsPage() {
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
      const taskQuery = query(collection(db, 'users', user.uid, 'tasks'));
      const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
        if(!snapshot.metadata.fromCache) setDataLoading(false);
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
        // Get unique stages
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
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <BarChart3 className="h-8 w-8 text-primary"/>
        <div>
            <h1 className="text-3xl font-bold font-headline">Task Analytics</h1>
            <p className="text-muted-foreground">An overview of your productivity and task management.</p>
        </div>
      </div>
      
      <AnalyticsDashboard tasks={tasks} stages={stages} />

    </div>
  );
}
