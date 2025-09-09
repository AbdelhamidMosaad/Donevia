
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
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { StudyGoal } from '@/lib/types';
import { addStudyGoal, updateStudyGoal } from '@/lib/study-tracker';

interface AddStudyGoalDialogProps {
  goal?: StudyGoal | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function AddStudyGoalDialog({
  goal,
  open,
  onOpenChange,
  children
}: AddStudyGoalDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!goal;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && goal) {
        setTitle(goal.title);
        setDescription(goal.description || '');
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
    };

    try {
      if (isEditMode && goal) {
        await updateStudyGoal(user.uid, goal.id, goalData);
        toast({ title: 'Goal Updated', description: `"${title}" has been updated.` });
      } else {
        await addStudyGoal(user.uid, goalData);
        toast({ title: 'Goal Added', description: `"${title}" has been added successfully.` });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving study goal: ", e);
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
          <DialogTitle>{isEditMode ? 'Edit Study Goal' : 'Create New Study Goal'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details of your study goal.' : 'Define your new learning objective.'}</DialogDescription>
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
