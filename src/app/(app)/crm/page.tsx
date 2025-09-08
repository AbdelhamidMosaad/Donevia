
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Briefcase, Users, Kanban, FileText, BarChart3, Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Client, ClientRequest, Invoice } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClientDialog } from '@/components/crm/client-dialog';
import { ClientList } from '@/components/crm/client-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequestBoard } from '@/components/crm/request-board';
import { AnalyticsDashboard } from '@/components/crm/analytics-dashboard';
import { InvoiceList } from '@/components/crm/invoice-list';

export default function CrmPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDataLoading(true);
      const clientsQuery = query(collection(db, 'users', user.uid, 'clients'), orderBy('createdAt', 'desc'));
      const unsubscribeClients = onSnapshot(clientsQuery, (snapshot) => {
        const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        setClients(clientsData);
        
        // Extract all invoices from all clients
        const allInvoices: Invoice[] = [];
        clientsData.forEach(client => {
            if (client.invoices) {
                allInvoices.push(...client.invoices.map(inv => ({...inv, clientName: client.name})));
            }
        });
        setInvoices(allInvoices);
        
        if(dataLoading) setDataLoading(false); // Only set loading to false once after initial load
      });
      
      const requestsQuery = query(collection(db, 'users', user.uid, 'clientRequests'));
      const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientRequest));
        setRequests(requestsData);
      });

      return () => {
        unsubscribeClients();
        unsubscribeRequests();
      };
    }
  }, [user]);

  if (loading || !user || dataLoading) {
    return <div>Loading CRM...</div>;
  }

  return (
    <div className="flex flex-col h-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                <Briefcase className="h-8 w-8 text-primary"/>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Client Relationship Management</h1>
                    <p className="text-muted-foreground">Manage your clients, pipeline, invoices, and analytics.</p>
                </div>
            </div>
        </div>
      
        <Tabs defaultValue="contacts" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="contacts"><Users className="mr-2 h-4 w-4"/> Contacts</TabsTrigger>
                <TabsTrigger value="pipeline"><Kanban className="mr-2 h-4 w-4"/> Pipeline</TabsTrigger>
                <TabsTrigger value="invoices"><Receipt className="mr-2 h-4 w-4"/> Invoices</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/> Sales Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contacts" className="flex-1 mt-4">
                <ClientList clients={clients} />
            </TabsContent>
            <TabsContent value="pipeline" className="flex-1 mt-4 overflow-hidden">
                 <RequestBoard />
            </TabsContent>
            <TabsContent value="invoices" className="flex-1 mt-4">
                <InvoiceList allInvoices={invoices} clients={clients} />
            </TabsContent>
            <TabsContent value="analytics" className="flex-1 mt-4">
                <AnalyticsDashboard requests={requests} />
            </TabsContent>
        </Tabs>
    </div>
  );
}