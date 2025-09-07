
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
import moment from 'moment';
import type { Milestone } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { addMilestone, updateMilestone } from '@/lib/goals';

interface AddMilestoneDialogProps {
  goalId: string;
  milestone?: Milestone | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddMilestoneDialog({
  goalId,
  milestone,
  open,
  onOpenChange,
}: AddMilestoneDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!milestone;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date());
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && milestone) {
        setTitle(milestone.title);
        setDescription(milestone.description || '');
        setDueDate(milestone.dueDate.toDate());
      } else {
        resetForm();
      }
      setIsSaving(false);
    }
  }, [open, milestone, isEditMode]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!title) {
        toast({ variant: 'destructive', title: 'Milestone title is required.' });
        return;
    }

    setIsSaving(true);
    const milestoneData = {
        goalId,
        title,
        description,
        dueDate: Timestamp.fromDate(dueDate),
        isCompleted: milestone?.isCompleted || false
    };

    try {
      if (isEditMode && milestone) {
        await updateMilestone(user.uid, milestone.id, milestoneData);
        toast({ title: 'Milestone Updated' });
      } else {
        await addMilestone(user.uid, milestoneData);
        toast({ title: 'Milestone Added' });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving milestone: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save milestone.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Milestone' : 'Add New Milestone'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update this milestone.' : 'Add a new milestone to your goal.'}</DialogDescription>
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
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input id="dueDate" type="date" value={moment(dueDate).format('YYYY-MM-DD')} onChange={(e) => setDueDate(new Date(e.target.value))} className="col-span-3" />
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
