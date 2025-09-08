
'use client';

import { useState } from 'react';
import type { ClientRequest, Client } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Building, DollarSign, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { RequestDialog } from './request-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface RequestCardProps {
  request: ClientRequest;
  clients: Client[];
  onDelete: () => void;
  onEdit: () => void;
}

export function RequestCard({ request, clients, onDelete, onEdit }: RequestCardProps) {
  const client = clients.find(c => c.id === request.clientId);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-shadow duration-200 cursor-pointer group"
        onClick={onEdit}
      >
        <CardHeader className="p-3 pb-2 flex-row justify-between items-start">
          <CardTitle className="text-sm font-semibold leading-tight">{request.title}</CardTitle>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100" onClick={handleMenuClick}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={handleMenuClick}>
                <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the deal "{request.title}".</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
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
    </>
  );
}
