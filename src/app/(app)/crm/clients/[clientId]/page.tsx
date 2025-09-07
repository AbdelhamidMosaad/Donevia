
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Mail, Phone, Building, StickyNote } from 'lucide-react';
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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && clientId) {
      const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
      const unsubscribeClient = onSnapshot(clientRef, (doc) => {
        if (doc.exists()) {
          setClient({ id: doc.id, ...doc.data() } as Client);
        } else {
          router.push('/crm');
        }
      });
      
      return () => {
        unsubscribeClient();
      };
    }
  }, [user, clientId, router]);


  if (loading || !user || !client) {
    return <div className="flex items-center justify-center h-full"><p>Loading client...</p></div>;
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
