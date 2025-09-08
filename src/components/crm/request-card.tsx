
'use client';

import { useState } from 'react';
import type { ClientRequest, Client } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Building, DollarSign } from 'lucide-react';
import { RequestDialog } from './request-dialog';

interface RequestCardProps {
  request: ClientRequest;
  clients: Client[];
}

export function RequestCard({ request, clients }: RequestCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const client = clients.find(c => c.id === request.clientId);

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-semibold leading-tight">{request.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-xs text-muted-foreground space-y-1">
            {client && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3"/>
                <span>{client.name}</span>
              </div>
            )}
            {request.value && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3"/>
                <span>${request.value.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <RequestDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        request={request}
        clients={clients}
      />
    </>
  );
}
