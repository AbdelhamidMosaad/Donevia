
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { ClientRequest, Client, PipelineStage } from '@/lib/types';
import { updateRequest } from '@/lib/requests';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RequestDialogProps {
  request: ClientRequest;
  clients: Client[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const lossReasons = ['Price', 'Timing', 'Competition', 'Features', 'Other'];
const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function RequestDialog({ request, clients, isOpen, onOpenChange }: RequestDialogProps) {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState(request);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  useEffect(() => {
    // This effect runs when the dialog is opened or the request prop changes.
    // It ensures the form data is always in sync with the deal being edited.
    setFormData(request);
    isInitialMount.current = true;
  }, [request]);

   useEffect(() => {
    if (!user) return;
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const settings = docSnap.data();
            if (settings.crmSettings?.pipelineStages) {
                setStages(settings.crmSettings.pipelineStages.sort((a: PipelineStage, b: PipelineStage) => a.order - b.order));
            }
        }
    });
     return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Skip the first render to avoid saving on mount
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    
    // Clear the previous timeout if there's a new change
    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set a new timeout for auto-saving
    debounceTimeoutRef.current = setTimeout(async () => {
        if (!user || !request) return;
        
        // Only save if there's a change
        if (JSON.stringify(formData) === JSON.stringify(request)) return;

        try {
            const { id, ...dataToSave } = formData;
            await updateRequest(user.uid, request.id, dataToSave);
            toast({ title: '✓ Saved', description: 'Your changes have been saved.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error updating deal' });
        }
    }, 1000); // 1-second debounce

    // Cleanup timeout on component unmount
    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, [formData, request, user, toast]);

  const handleChange = (field: keyof Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>, value: any) => {
    setFormData(prev => ({...prev, [field]: value }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>Changes are saved automatically.</DialogDescription>
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
            <Label htmlFor="value" className="text-right">Value ({currencySymbol})</Label>
            <Input id="value" type="number" value={formData.value || ''} onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stage" className="text-right">Stage</Label>
            <Select value={formData.stage} onValueChange={(value) => handleChange('stage', value)}>
              <SelectTrigger className="col-span-3 capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map(s => <SelectItem key={s.id} value={s.id} className="capitalize">{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           {stages.find(s => s.id === formData.stage)?.name.toLowerCase() === 'lost' && (
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
      </DialogContent>
    </Dialog>
  );
}
