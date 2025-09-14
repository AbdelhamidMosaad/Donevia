
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { WatchlistItem } from '@/lib/types';
import { addWatchlistItem, updateWatchlistItem } from '@/lib/trading-tracker';
import { Timestamp } from 'firebase/firestore';
import moment from 'moment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Save } from 'lucide-react';

interface AddWatchlistItemDialogProps {
  item?: WatchlistItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWatchlistItemDialog({
  item,
  isOpen,
  onOpenChange,
}: AddWatchlistItemDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!item;

  const [symbol, setSymbol] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<WatchlistItem['status']>('Watching');
  const [priority, setPriority] = useState<WatchlistItem['priority']>('Medium');

  const resetForm = () => {
    setSymbol('');
    setNotes('');
    setReminderDate(null);
    setStatus('Watching');
    setPriority('Medium');
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && item) {
        setSymbol(item.symbol);
        setNotes(item.notes || '');
        setReminderDate(item.reminderDate ? item.reminderDate.toDate() : null);
        setStatus(item.status);
        setPriority(item.priority || 'Medium');
      } else {
        resetForm();
      }
    }
  }, [isOpen, item, isEditMode]);

  const handleSave = async () => {
    if (!user || !symbol.trim()) {
      toast({ variant: 'destructive', title: 'Symbol is required.' });
      return;
    }
    
    setIsSaving(true);
    
    const itemData = {
        symbol: symbol.toUpperCase().trim(),
        notes,
        status,
        priority,
        reminderDate: reminderDate ? Timestamp.fromDate(reminderDate) : null,
    };

    try {
      if (isEditMode && item) {
        await updateWatchlistItem(user.uid, item.id, itemData);
        toast({ title: 'Watchlist item updated successfully!' });
      } else {
        await addWatchlistItem(user.uid, itemData);
        toast({ title: 'Item added to watchlist successfully!' });
      }
      onOpenChange(false);
    } catch (e) {
      console.error("Error saving watchlist item: ", e);
      toast({ variant: 'destructive', title: 'Error saving item.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Watchlist Item' : 'Add to Watchlist'}</DialogTitle>
          <DialogDescription>
            Track a new stock or update an existing one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input id="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g., AAPL" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v: WatchlistItem['priority']) => setPriority(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v: WatchlistItem['status']) => setStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="Watching">Watching</SelectItem>
                    <SelectItem value="Entered">Entered</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="e.g., Approaching 52-week high, earnings soon..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderDate">Reminder Date</Label>
            <Input 
                id="reminderDate"
                type="date"
                value={reminderDate ? moment(reminderDate).format('YYYY-MM-DD') : ''}
                onChange={(e) => setReminderDate(e.target.value ? new Date(e.target.value) : null)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
