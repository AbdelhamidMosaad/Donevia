
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
import type { StudyMilestone } from '@/lib/types';
import { addStudyMilestone, updateStudyMilestone } from '@/lib/study-tracker';

interface AddStudyMilestoneDialogProps {
  goalId: string;
  milestone?: StudyMilestone | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  milestonesCount: number;
}

export function AddStudyMilestoneDialog({
  goalId,
  milestone,
  open,
  onOpenChange,
  milestonesCount,
}: AddStudyMilestoneDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!milestone;

  const [title, setTitle] = useState('');

  const resetForm = () => {
    setTitle('');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && milestone) {
        setTitle(milestone.title);
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
        toast({ variant: 'destructive', title: 'Title is required.' });
        return;
    }

    setIsSaving(true);
    const milestoneData = {
        goalId,
        title,
        isCompleted: milestone?.isCompleted || false,
        order: milestone?.order ?? milestonesCount,
    };

    try {
      if (isEditMode && milestone) {
        await updateStudyMilestone(user.uid, milestone.id, milestoneData);
        toast({ title: 'Subtopic Updated' });
      } else {
        await addStudyMilestone(user.uid, milestoneData);
        toast({ title: 'Subtopic Added' });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving milestone: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save subtopic.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Subtopic' : 'Add New Subtopic'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update this subtopic.' : 'Add a new chapter or subtopic to your study goal.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
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
