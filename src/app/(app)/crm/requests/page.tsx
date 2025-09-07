
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ClientRequest, Client } from '@/lib/types';
import { RequestBoard } from '@/components/crm/request-board';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { RequestDialog } from '@/components/crm/request-dialog';

export default function CrmRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      // Fetch Requests
      const reqQuery = query(collection(db, 'users', user.uid, 'clientRequests'));
      const unsubscribeReqs = onSnapshot(reqQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientRequest));
        setRequests(requestsData);
        if(!snapshot.metadata.fromCache) setDataLoading(false);
      });
      
      // Fetch Clients
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
    return <div>Loading requests...</div>;
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Client Requests</h1>
                <p className="text-muted-foreground">Manage your sales and service pipeline.</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Request
            </Button>
        </div>
        
        <div className="flex-1 overflow-x-auto">
            <RequestBoard requests={requests} clients={clients} />
        </div>

        <RequestDialog 
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            clients={clients}
        />
    </div>
  );
}
