
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Briefcase, Search, LayoutDashboard, BarChart3, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Client } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClientDialog } from '@/components/crm/client-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteClient } from '@/lib/crm';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CrmPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const debounced = useDebouncedCallback((value) => {
    setSearchQuery(value);
  }, 300);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      let q = query(collection(db, 'users', user.uid, 'clients'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        if (searchQuery) {
            clientsData = clientsData.filter(client => 
                client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.company?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setClients(clientsData);
      });
      return () => unsubscribe();
    }
  }, [user, searchQuery]);

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    try {
      await deleteClient(user.uid, clientId);
      toast({ title: 'Client Deleted', description: 'The client has been removed.' });
    } catch (e) {
      console.error("Error deleting client: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete client.' });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">CRM Dashboard</h1>
            <p className="text-muted-foreground">Manage your clients, requests, and analyze your pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/crm/requests">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Client Requests</CardTitle>
                    <LayoutDashboard className="h-6 w-6 text-primary"/>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">View and manage your sales pipeline using a Kanban board.</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/crm/analytics">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Analytics</CardTitle>
                    <BarChart3 className="h-6 w-6 text-primary"/>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Visualize your pipeline performance and track key metrics.</p>
                </CardContent>
            </Card>
        </Link>
         <Card className="hover:bg-muted/50 transition-colors cursor-default">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Client Management</CardTitle>
                <Users className="h-6 w-6 text-primary"/>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Manage your contacts, quotations, and invoices below.</p>
            </CardContent>
        </Card>
      </div>
      
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold font-headline">Your Clients</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search clients..."
                    className="pl-8"
                    onChange={(e) => debounced(e.target.value)}
                />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Client
            </Button>
        </div>
       </div>
       {clients.length === 0 && !searchQuery ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Clients Yet</h3>
            <p className="text-muted-foreground">Click "New Client" to add your first one.</p>
        </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
                <Link key={client.id} href={`/crm/clients/${client.id}`} className="group">
                    <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
                       <CardHeader>
                           <CardTitle className="group-hover:underline">{client.name}</CardTitle>
                           <CardDescription>{client.company}</CardDescription>
                       </CardHeader>
                       <CardContent>
                           <p className="text-sm text-muted-foreground">{client.email}</p>
                           <p className="text-sm text-muted-foreground">{client.phone}</p>
                           <Badge variant="outline" className="mt-4 capitalize">{client.status}</Badge>
                       </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
      )}

      <ClientDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
