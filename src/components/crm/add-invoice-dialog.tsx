
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
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Client, Invoice } from '@/lib/types';
import { updateClient } from '@/lib/crm';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import moment from 'moment';

interface AddInvoiceDialogProps {
  clients: Client[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddInvoiceDialog({ clients, open, onOpenChange }: AddInvoiceDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [createdDate, setCreatedDate] = useState<Date>(new Date());
  const [paymentTerms, setPaymentTerms] = useState<number>(30);
  const [dueDate, setDueDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default due date 30 days from now
    return date;
  });
  
  useEffect(() => {
    const newDueDate = moment(createdDate).add(paymentTerms, 'days').toDate();
    setDueDate(newDueDate);
  }, [createdDate, paymentTerms]);

  const resetForm = () => {
    setSelectedClientId('');
    setInvoiceNumber('');
    setAmount(0);
    setCreatedDate(new Date());
    setPaymentTerms(30);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
    setIsSaving(false);
  }, [open]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!selectedClientId || !invoiceNumber || amount <= 0) {
      toast({ variant: 'destructive', title: 'Please fill all required fields.' });
      return;
    }

    const clientToUpdate = clients.find(c => c.id === selectedClientId);
    if (!clientToUpdate) {
        toast({ variant: 'destructive', title: 'Client not found.'});
        return;
    }

    setIsSaving(true);
    
    const newInvoice: Invoice = {
      id: uuidv4(),
      invoiceNumber,
      amount,
      status: 'Draft',
      dueDate: Timestamp.fromDate(dueDate),
      createdAt: Timestamp.fromDate(createdDate),
      attachments: [],
    };
    
    const updatedInvoices = [...(clientToUpdate.invoices || []), newInvoice];

    try {
      await updateClient(user.uid, clientToUpdate.id, { invoices: updatedInvoices });
      toast({ title: 'Invoice Added', description: `Invoice #${invoiceNumber} has been added to ${clientToUpdate.name}.` });
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error adding invoice: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add invoice.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Invoice</DialogTitle>
          <DialogDescription>Fill in the details for the new invoice.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client" className="text-right">Client</Label>
            <Select onValueChange={setSelectedClientId} value={selectedClientId}>
              <SelectTrigger id="client" className="col-span-3"><SelectValue placeholder="Select a client" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoiceNumber" className="text-right">Invoice #</Label>
            <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount ($)</Label>
            <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="createdDate" className="text-right">Created Date</Label>
            <Input id="createdDate" type="date" value={moment(createdDate).format('YYYY-MM-DD')} onChange={(e) => setCreatedDate(new Date(e.target.value))} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentTerms" className="text-right">Payment Terms</Label>
            <Input id="paymentTerms" type="number" placeholder="e.g. 30" value={paymentTerms} onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 0)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input id="dueDate" type="date" value={moment(dueDate).format('YYYY-MM-DD')} className="col-span-3" readOnly />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Add Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
