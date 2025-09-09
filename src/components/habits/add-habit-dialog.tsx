
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
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addHabit } from '@/lib/habits';

interface AddHabitDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddHabitDialog({
  open,
  onOpenChange,
}: AddHabitDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');

  const resetForm = () => {
    setName('');
  };

  useEffect(() => {
    if (open) {
      resetForm();
      setIsSaving(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!name) {
        toast({ variant: 'destructive', title: 'Habit name is required.' });
        return;
    }

    setIsSaving(true);
    
    try {
      await addHabit(user.uid, { name });
      toast({ title: 'Habit Added', description: `"${name}" has been added.` });
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving habit: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save habit.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Habit</DialogTitle>
          <DialogDescription>What new habit do you want to track?</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
