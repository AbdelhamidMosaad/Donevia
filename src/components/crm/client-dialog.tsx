
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/types';
import { addClient, updateClient } from '@/lib/crm';

interface ClientDialogProps {
  client?: Client | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function ClientDialog({
  client,
  open,
  onOpenChange,
  children
}: ClientDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!client;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setAddress('');
    setNotes('');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && client) {
        setName(client.name);
        setEmail(client.email || '');
        setPhone(client.phone || '');
        setCompany(client.company || '');
        setAddress(client.address || '');
        setNotes(client.notes || '');
      } else {
        resetForm();
      }
      setIsSaving(false);
    }
  }, [open, client, isEditMode]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!name) {
        toast({ variant: 'destructive', title: 'Client name is required.' });
        return;
    }

    setIsSaving(true);
    const clientData = {
      name,
      email,
      phone,
      company,
      address,
      notes,
      status: client?.status || 'active',
    };

    try {
      if (isEditMode && client) {
        await updateClient(user.uid, client.id, clientData);
        toast({ title: 'Client Updated', description: `"${name}" has been updated.` });
      } else {
        await addClient(user.uid, clientData);
        toast({ title: 'Client Added', description: `"${name}" has been added successfully.` });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving client: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save client.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details for this client.' : 'Fill in the client information below.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">Company</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Address</Label>
            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
