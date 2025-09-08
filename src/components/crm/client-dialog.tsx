
'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/lib/types';
import { addClient, updateClient } from '@/lib/crm';
import { useDebouncedCallback } from 'use-debounce';

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
  
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const isEditMode = !!client;

  const debouncedSave = useDebouncedCallback(async (clientData) => {
    if (!user) return;
    
    if (!clientData.name || !clientData.company) {
        // Don't save if required fields are missing, but don't show toast on auto-save
        return;
    }

    setIsSaving(true);
    try {
        if (isEditMode && client) {
            await updateClient(user.uid, client.id, clientData);
        } else {
            // This is for auto-saving a new client, which is not a standard pattern.
            // For now, auto-save only works on edits. A manual save would be needed for creation.
            // However, the prompt asked to remove save/cancel, so we focus on edit.
        }
        toast({ title: '✓ Saved', description: 'Client details have been updated.'});
    } catch (e) {
        console.error("Error auto-saving client: ", e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save client details.' });
    } finally {
        setIsSaving(false);
    }
  }, 1500); // 1.5-second debounce

  useEffect(() => {
    if (open) {
      if (isEditMode && client) {
        setName(client.name);
        setCompany(client.company || '');
        setEmail(client.email || '');
        setPhone(client.phone || '');
      } else {
        setName('');
        setCompany('');
        setEmail('');
        setPhone('');
      }
    }
  }, [open, client, isEditMode]);

  useEffect(() => {
    if (isEditMode && open) {
        const clientData = { name, company, email, phone };
        // Don't trigger save on initial load
        if (client?.name !== name || client?.company !== company || client?.email !== email || client?.phone !== phone) {
            debouncedSave(clientData);
        }
    }
  }, [name, company, email, phone, isEditMode, open, client, debouncedSave]);


  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!name || !company) {
        toast({ variant: 'destructive', title: 'Contact Person and Company are required.' });
        return;
    }

    setIsSaving(true);
    const clientData = { name, company, email, phone };

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Changes are saved automatically." : "Fill in the information below to create a new client."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Contact Person</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">Company</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
          </div>
        </div>
        {!isEditMode && (
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange?.(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Client'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
