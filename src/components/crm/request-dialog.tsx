
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
import type { ClientRequest, Client } from '@/lib/types';
import { updateRequest, deleteRequest } from '@/lib/requests';

interface RequestDialogProps {
  request: ClientRequest;
  clients: Client[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const stages = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];
const lossReasons = ['Price', 'Timing', 'Competition', 'Features', 'Other'];

export function RequestDialog({ request, clients, isOpen, onOpenChange }: RequestDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState(request);

  useEffect(() => {
    setFormData(request);
  }, [request]);

  const handleSave = async () => {
    if (!user) return;
    try {
      // Exclude id from the data being sent to Firestore
      const { id, ...dataToSave } = formData;
      await updateRequest(user.uid, request.id, dataToSave);
      toast({ title: 'Deal updated' });
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error updating deal' });
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteRequest(user.uid, request.id);
      toast({ title: 'Deal deleted' });
      onOpenChange(false);
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error deleting deal' });
    }
  };
  
  const handleChange = (field: keyof ClientRequest, value: any) => {
    setFormData(prev => ({...prev, [field]: value }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>Update the details for this deal.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client" className="text-right">Client</Label>
            <Select value={formData.clientId} onValueChange={(value) => handleChange('clientId', value)}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a client" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">Value ($)</Label>
            <Input id="value" type="number" value={formData.value || ''} onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stage" className="text-right">Stage</Label>
            <Select value={formData.stage} onValueChange={(value) => handleChange('stage', value)}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           {formData.stage === 'lost' && (
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lossReason" className="text-right">Loss Reason</Label>
                <Select value={formData.lossReason || ''} onValueChange={(value) => handleChange('lossReason', value)}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                  <SelectContent>
                    {lossReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
           )}
        </div>
        <DialogFooter className="justify-between">
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          <div>
            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
            <Button onClick={handleSave} className="ml-2">Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
