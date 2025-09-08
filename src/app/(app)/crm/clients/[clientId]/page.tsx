
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, Edit } from 'lucide-react';
import { ClientDialog } from '@/components/crm/client-dialog';
import { CustomFields } from '@/components/crm/custom-fields';
import { QuoteInvoiceManager } from '@/components/crm/quote-invoice-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function ClientDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && clientId) {
      const clientRef = doc(db, 'users', user.uid, 'clients', clientId);
      const unsubscribe = onSnapshot(clientRef, (doc) => {
        if (doc.exists()) {
          setClient({ id: doc.id, ...doc.data() } as Client);
        } else {
          router.push('/crm');
        }
      });
      
      return () => unsubscribe();
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
                <div className="flex items-center gap-2">
                    <Building className="h-7 w-7 text-primary" />
                    <h1 className="text-3xl font-bold font-headline">{client.name}</h1>
                </div>
                <p className="text-muted-foreground">{client.company}</p>
            </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditClientOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Client</Button>
      </div>

       <Tabs defaultValue="quotes" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="quotes">Quotations</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="fields">Custom Fields</TabsTrigger>
        </TabsList>
        <TabsContent value="quotes" className="flex-1 mt-4">
          <QuoteInvoiceManager type="quotation" client={client} />
        </TabsContent>
        <TabsContent value="invoices" className="flex-1 mt-4">
          <QuoteInvoiceManager type="invoice" client={client} />
        </TabsContent>
        <TabsContent value="fields" className="flex-1 mt-4">
          <CustomFields client={client} />
        </TabsContent>
      </Tabs>
      
      <ClientDialog client={client} open={isEditClientOpen} onOpenChange={setIsEditClientOpen} />
    </div>
  );
}
