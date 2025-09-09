
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
import type { StudySubtopic } from '@/lib/types';
import { addStudySubtopic, updateStudySubtopic } from '@/lib/study-tracker';

interface AddStudySubtopicDialogProps {
  goalId: string;
  chapterId: string;
  subtopic?: StudySubtopic | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  subtopicsCount: number;
}

export function AddStudySubtopicDialog({
  goalId,
  chapterId,
  subtopic,
  open,
  onOpenChange,
  subtopicsCount,
}: AddStudySubtopicDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!subtopic;

  const [title, setTitle] = useState('');

  const resetForm = () => {
    setTitle('');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && subtopic) {
        setTitle(subtopic.title);
      } else {
        resetForm();
      }
      setIsSaving(false);
    }
  }, [open, subtopic, isEditMode]);

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
    const subtopicData = {
        goalId,
        chapterId,
        title,
        isCompleted: subtopic?.isCompleted || false,
        order: subtopic?.order ?? subtopicsCount,
    };

    try {
      if (isEditMode && subtopic) {
        await updateStudySubtopic(user.uid, subtopic.id, subtopicData);
        toast({ title: 'Subtopic Updated' });
      } else {
        await addStudySubtopic(user.uid, subtopicData);
        toast({ title: 'Subtopic Added' });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving subtopic: ", e);
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
          <DialogDescription>{isEditMode ? 'Update this subtopic.' : 'Add a new subtopic to this chapter.'}</DialogDescription>
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
