
'use client';

import type { ClientRequest, Client } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { User, DollarSign } from 'lucide-react';
import { Badge } from '../ui/badge';

interface RequestCardProps {
  request: ClientRequest;
  client?: Client;
  onClick: () => void;
}

export function RequestCard({ request, client, onClick }: RequestCardProps) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="p-3">
        <CardTitle className="text-base font-semibold line-clamp-2">{request.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 text-sm text-muted-foreground space-y-2">
        {client && (
            <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{client.name}</span>
            </div>
        )}
        {request.invoiceAmount && (
            <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="font-semibold text-foreground">${request.invoiceAmount.toLocaleString()}</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
