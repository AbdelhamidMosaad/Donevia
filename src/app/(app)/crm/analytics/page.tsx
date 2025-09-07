
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClientRequest, Client } from '@/lib/types';
import { AnalyticsDashboard } from '@/components/crm/analytics-dashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CrmAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      setDataLoading(true);
      const reqQuery = query(collection(db, 'users', user.uid, 'clientRequests'));
      const unsubscribeReqs = onSnapshot(reqQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientRequest));
        setRequests(requestsData);
        setDataLoading(false);
      });

      const clientQuery = query(collection(db, 'users', user.uid, 'clients'));
       const unsubscribeClients = onSnapshot(clientQuery, (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(clientsData);
      });
      
      return () => {
        unsubscribeReqs();
        unsubscribeClients();
      };
    }
  }, [user]);

  if (loading || !user || dataLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/crm')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
            <h1 className="text-3xl font-bold font-headline">CRM Analytics</h1>
            <p className="text-muted-foreground">Insights into your sales and service pipeline.</p>
        </div>
      </div>
      
      <AnalyticsDashboard requests={requests} clients={clients} />

    </div>
  );
}
