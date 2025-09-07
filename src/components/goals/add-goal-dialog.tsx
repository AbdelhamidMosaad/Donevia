
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
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment';
import type { Goal } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { addGoal, updateGoal } from '@/lib/goals';

interface AddGoalDialogProps {
  goal?: Goal | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function AddGoalDialog({
  goal,
  open,
  onOpenChange,
  children
}: AddGoalDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!goal;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [targetDate, setTargetDate] = useState<Date>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });
  const [status, setStatus] = useState<Goal['status']>('Not Started');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate(new Date());
    setTargetDate(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        return date;
    });
    setStatus('Not Started');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && goal) {
        setTitle(goal.title);
        setDescription(goal.description || '');
        setStartDate(goal.startDate.toDate());
        setTargetDate(goal.targetDate.toDate());
        setStatus(goal.status);
      } else {
        resetForm();
      }
      setIsSaving(false);
    }
  }, [open, goal, isEditMode]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!title) {
        toast({ variant: 'destructive', title: 'Goal title is required.' });
        return;
    }

    setIsSaving(true);
    const goalData = {
        title,
        description,
        startDate: Timestamp.fromDate(startDate),
        targetDate: Timestamp.fromDate(targetDate),
        status,
    };

    try {
      if (isEditMode && goal) {
        await updateGoal(user.uid, goal.id, goalData);
        toast({ title: 'Goal Updated', description: `"${title}" has been updated.` });
      } else {
        await addGoal(user.uid, goalData);
        toast({ title: 'Goal Added', description: `"${title}" has been added successfully.` });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving goal: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save goal.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details of your goal.' : 'Define your new objective.'}</DialogDescription>
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
            <Label htmlFor="startDate" className="text-right">Start Date</Label>
            <Input id="startDate" type="date" value={moment(startDate).format('YYYY-MM-DD')} onChange={(e) => setStartDate(new Date(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="targetDate" className="text-right">Target Date</Label>
            <Input id="targetDate" type="date" value={moment(targetDate).format('YYYY-MM-DD')} onChange={(e) => setTargetDate(new Date(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select onValueChange={(v: Goal['status']) => setStatus(v)} value={status}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                 <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
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
