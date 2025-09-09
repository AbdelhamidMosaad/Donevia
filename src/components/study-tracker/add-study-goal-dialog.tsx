
'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
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
import { Timestamp } from 'firebase/firestore';
import moment from 'moment';
import { useDebouncedCallback } from 'use-debounce';

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
  const [currentGoal, setCurrentGoal] = useState(goal);
  const isInitialMount = useRef(true);

  const isEditMode = !!currentGoal;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  
  useEffect(() => {
    if (open) {
        if (goal) {
            setCurrentGoal(goal);
            setTitle(goal.title);
            setDescription(goal.description || '');
            setTags(goal.tags?.join(', ') || '');
            setDueDate(goal.dueDate ? goal.dueDate.toDate() : null);
        } else {
            setCurrentGoal(null);
            setTitle('');
            setDescription('');
            setTags('');
            setDueDate(null);
        }
        setIsSaving(false);
        isInitialMount.current = true;
    }
  }, [open, goal]);

  const debouncedSave = useDebouncedCallback(async (dataToSave) => {
    if (!user || !isEditMode || !currentGoal) return;
    
    setIsSaving(true);
    try {
        await updateStudyGoal(user.uid, currentGoal.id, dataToSave);
        toast({ title: '✓ Saved' });
    } catch (e) {
        console.error("Error auto-saving goal:", e);
        toast({ variant: 'destructive', title: 'Error saving goal' });
    } finally {
        setIsSaving(false);
    }
  }, 1500);

  const createAndSetGoal = async (newTitle: string) => {
    if (!user || isEditMode) return;
    
    setIsSaving(true);
    try {
        const newDocRef = await addStudyGoal(user.uid, { title: newTitle });
        const newGoal: StudyGoal = { 
            id: newDocRef.id, 
            title: newTitle, 
            createdAt: Timestamp.now(), 
            updatedAt: Timestamp.now() 
        };
        setCurrentGoal(newGoal);
        toast({ title: 'Goal created!', description: 'You can now edit the other details.' });
    } catch (e) {
        console.error("Error creating goal:", e);
        toast({ variant: 'destructive', title: 'Error creating goal' });
    } finally {
        setIsSaving(false);
    }
  }

  useEffect(() => {
    if (isInitialMount.current && open) {
      isInitialMount.current = false;
      return;
    }
    
    if (open) {
      if (!isEditMode && title.trim()) {
        createAndSetGoal(title);
      } else if (isEditMode) {
        const goalData = {
          title,
          description,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        };
        debouncedSave(goalData);
      }
    }
  }, [title, description, tags, dueDate, open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Study Goal' : 'Create New Study Goal'}</DialogTitle>
          <DialogDescription>
             {isEditMode ? "Changes are saved automatically." : "Start by typing a title to create a new goal."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" disabled={!isEditMode} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right">Tags</Label>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="col-span-3" placeholder="e.g. Math, Programming, History" disabled={!isEditMode} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input id="dueDate" type="date" value={dueDate ? moment(dueDate).format('YYYY-MM-DD') : ''} onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)} className="col-span-3" disabled={!isEditMode} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
