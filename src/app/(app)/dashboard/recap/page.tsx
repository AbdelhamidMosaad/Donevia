
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task } from '@/lib/types';
import { Sparkles } from 'lucide-react';
import { RecapGenerator } from '@/components/recap-generator';

export default function RecapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      setDataLoading(false);
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      // Only set data loading to true if we have a user to fetch for
      setDataLoading(true);
      const taskQuery = query(collection(db, 'users', user.uid, 'tasks'));
      const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
        setDataLoading(false);
      }, (error) => {
        console.error("Error fetching tasks:", error);
        setDataLoading(false); // Also stop loading on error
      });

      return () => {
        unsubscribeTasks();
      };
    } else if (!loading && !user) {
      // If there's no user and we're not in a loading state, stop data loading.
      setDataLoading(false);
    }
  }, [user, loading]);

  if (loading || dataLoading) {
    return <div>Loading recap...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <Sparkles className="h-8 w-8 text-primary"/>
        <div>
            <h1 className="text-3xl font-bold font-headline">AI-Powered Recap</h1>
            <p className="text-muted-foreground">Get an AI-generated summary of your activity.</p>
        </div>
      </div>
      
      <RecapGenerator allTasks={tasks} />

    </div>
  );
}
