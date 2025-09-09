
'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Timestamp } from 'firebase/firestore';
import moment from 'moment';

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
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const isEditMode = !!goal;

  const resetForm = () => {
      setTitle('');
      setDescription('');
      setTags('');
      setDueDate(null);
  };
  
  useEffect(() => {
    if (open) {
        if (isEditMode && goal) {
            setTitle(goal.title);
            setDescription(goal.description || '');
            setTags(goal.tags?.join(', ') || '');
            setDueDate(goal.dueDate ? goal.dueDate.toDate() : null);
        } else {
            resetForm();
        }
    } else {
        resetForm();
    }
  }, [open, goal, isEditMode]);

  const handleSave = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.'});
        return;
    }
    if (!title.trim()) {
        toast({ variant: 'destructive', title: 'Title is required.' });
        return;
    }

    console.log('Attempting to save study goal:', title);
    setIsSaving(true);

    const goalData = {
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
    };

    try {
        if (isEditMode && goal) {
            await updateStudyGoal(user.uid, goal.id, goalData);
            toast({ title: 'Goal updated!' });
        } else {
            await addStudyGoal(user.uid, goalData);
            toast({ title: 'Goal created!' });
        }
        onOpenChange?.(false);
    } catch(e) {
        console.error("Error saving study goal:", e);
        toast({ variant: 'destructive', title: 'Error creating goal' });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Study Goal' : 'Create New Study Goal'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for your study goal." : "Set a new learning objective."}
          </DialogDescription>
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
            <Label htmlFor="tags" className="text-right">Tags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="col-span-3" placeholder="e.g. Math, Programming, History" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input id="dueDate" type="date" value={dueDate ? moment(dueDate).format('YYYY-MM-DD') : ''} onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)} className="col-span-3" />
          </div>
        </div>
         <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saved' : 'Save Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
