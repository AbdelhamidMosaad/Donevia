
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ClientRequest, Client } from '@/lib/types';
import { addRequest, updateRequest } from '@/lib/requests';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { STAGES } from './request-board';

interface RequestDialogProps {
  request?: ClientRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}

export function RequestDialog({
  request,
  isOpen,
  onOpenChange,
  clients
}: RequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!request;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [stage, setStage] = useState('new-request');
  const [invoiceAmount, setInvoiceAmount] = useState<number | ''>('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setClientId('');
    setStage('new-request');
    setInvoiceAmount('');
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && request) {
        setTitle(request.title);
        setDescription(request.description || '');
        setClientId(request.clientId);
        setStage(request.stage);
        setInvoiceAmount(request.invoiceAmount || '');
      } else {
        resetForm();
      }
      setIsSaving(false);
    }
  }, [isOpen, request, isEditMode]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!title || !clientId) {
        toast({ variant: 'destructive', title: 'Request title and client are required.' });
        return;
    }

    setIsSaving(true);
    const requestData = {
      title,
      description,
      clientId,
      stage,
      invoiceAmount: Number(invoiceAmount) || 0,
      lossReason: request?.lossReason || null
    };

    try {
      if (isEditMode && request) {
        await updateRequest(user.uid, request.id, requestData);
        toast({ title: 'Request Updated', description: `"${title}" has been updated.` });
      } else {
        await addRequest(user.uid, requestData);
        toast({ title: 'Request Added', description: `"${title}" has been added successfully.` });
      }
      onOpenChange(false);
    } catch (e) {
      console.error("Error saving request: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save request.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Request' : 'Add New Request'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details for this request.' : 'Fill in the request information below.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clientId" className="text-right">Client</Label>
            <Select onValueChange={setClientId} value={clientId}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                    {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stage" className="text-right">Stage</Label>
            <Select onValueChange={setStage} value={stage}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                    {STAGES.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoiceAmount" className="text-right">Amount</Label>
            <Input id="invoiceAmount" type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(Number(e.target.value))} className="col-span-3" placeholder="e.g., 5000"/>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
