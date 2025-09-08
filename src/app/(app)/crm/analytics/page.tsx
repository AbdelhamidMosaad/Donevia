
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClientRequest } from '@/lib/types';
import { AnalyticsDashboard } from '@/components/crm/analytics-dashboard';
import { BarChart3 } from 'lucide-react';

export default function CrmAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      setDataLoading(true);
      const requestsQuery = query(collection(db, 'users', user.uid, 'clientRequests'));
      const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientRequest));
        setRequests(requestsData);
        setDataLoading(false);
      });

      return () => unsubscribe();
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
            <h1 className="text-3xl font-bold font-headline">Sales Analytics</h1>
            <p className="text-muted-foreground">An overview of your sales pipeline and performance.</p>
        </div>
      </div>
      
      <AnalyticsDashboard requests={requests} />

    </div>
  );
}
