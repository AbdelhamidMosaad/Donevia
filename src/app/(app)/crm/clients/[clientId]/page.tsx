
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Building, StickyNote, WifiOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientDialog } from '@/components/crm/client-dialog';
import { CustomFieldsManager } from '@/components/crm/custom-fields';
import { QuoteInvoiceManager } from '@/components/crm/quote-invoice-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';


export default function ClientDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  const fetchClientData = () => {
    if (user && clientId) {
        setDataError(null);
        setClient(null);
      const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
      const unsubscribeClient = onSnapshot(clientRef, (doc) => {
        if (doc.exists()) {
          setClient({ id: doc.id, ...doc.data() } as Client);
        } else {
          router.push('/crm');
        }
      }, (error) => {
        console.error("Error fetching client:", error);
        if(error.code === 'unavailable') {
            setDataError("You are offline. This client's data is not available in the cache.");
        } else {
            setDataError("An error occurred while fetching client data.");
        }
      });
      
      return () => {
        unsubscribeClient();
      };
    }
  };
  
  useEffect(fetchClientData, [user, clientId, router]);


  if (loading || (!client && !dataError)) {
    return <div className="flex items-center justify-center h-full"><p>Loading client...</p></div>;
  }
  
  if (dataError) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <WifiOff className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold font-headline">Could Not Load Client Data</h3>
            <p className="text-muted-foreground mb-6">{dataError}</p>
            <Button onClick={() => window.location.reload()}><RefreshCw className="mr-2 h-4 w-4"/> Retry</Button>
        </div>
    );
  }

  if (!client) {
      return null; // Should be covered by other states, but as a fallback.
  }

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/crm')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold font-headline">{client.name}</h1>
                    <Badge className="capitalize">{client.status}</Badge>
                </div>
                <p className="text-muted-foreground">{client.company}</p>
            </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Client</Button>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                {client.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a></div>}
                {client.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {client.phone}</div>}
                {client.company && <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> {client.company}</div>}
                {client.notes && <div className="flex items-start gap-2 col-span-full"><StickyNote className="h-4 w-4 text-muted-foreground mt-1" /> <p className="whitespace-pre-wrap">{client.notes}</p></div>}
            </CardContent>
       </Card>

      <Tabs defaultValue="quotations" className="flex-1">
        <TabsList>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="custom_fields">Custom Fields</TabsTrigger>
        </TabsList>
        <TabsContent value="quotations" className="mt-4">
            <QuoteInvoiceManager client={client} type="quotations" />
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
            <QuoteInvoiceManager client={client} type="invoices" />
        </TabsContent>
        <TabsContent value="custom_fields" className="mt-4">
            <CustomFieldsManager client={client} />
        </TabsContent>
      </Tabs>
      
      <ClientDialog client={client} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </div>
  );
}
