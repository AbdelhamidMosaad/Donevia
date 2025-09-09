
'use client';

import { useState, useEffect, ReactNode, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Check } from 'lucide-react';

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [currentGoal, setCurrentGoal] = useState(goal);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  
  const isInitialMount = useRef(true);

  const isEditMode = !!currentGoal;

  const resetForm = () => {
      setTitle('');
      setDescription('');
      setTags('');
      setDueDate(null);
      setCurrentGoal(null);
  };
  
  useEffect(() => {
    if (open) {
        setCurrentGoal(goal);
        if (goal) {
            setTitle(goal.title);
            setDescription(goal.description || '');
            setTags(goal.tags?.join(', ') || '');
            setDueDate(goal.dueDate ? goal.dueDate.toDate() : null);
        } else {
            resetForm();
        }
        setSaveStatus('idle');
        isInitialMount.current = true;
    } else {
        resetForm();
    }
  }, [open, goal]);

  const debouncedSave = useDebouncedCallback(async (dataToSave, goalId) => {
    if (!user) return;
    console.log('Auto-saving study goal:', goalId);
    setSaveStatus('saving');
    try {
        await updateStudyGoal(user.uid, goalId, dataToSave);
        setSaveStatus('saved');
    } catch(e) {
        console.error("Error auto-saving study goal:", e);
        setSaveStatus('idle');
        toast({ variant: 'destructive', title: 'Error saving goal' });
    }
  }, 1500);

  const createAndSetGoal = async (newTitle: string) => {
    if (!user || isEditMode) return;
    
    console.log('Attempting to create study goal:', newTitle);
    setSaveStatus('saving');
    try {
        const goalData = {
            title: newTitle,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        };
        const newDocRef = await addStudyGoal(user.uid, goalData);
        const newGoal: StudyGoal = { ...goalData, id: newDocRef.id, createdAt: new Date() as any, updatedAt: new Date() as any };
        setCurrentGoal(newGoal);
        setSaveStatus('saved');
        toast({ title: 'Goal created!', description: 'You can now edit the details.'});
    } catch (e) {
        setSaveStatus('idle');
        console.error("Error creating study goal:", e);
        toast({ variant: 'destructive', title: 'Error creating goal' });
    }
  }

  useEffect(() => {
     if (isInitialMount.current && open) {
        isInitialMount.current = false;
        return;
    }

    if (open) {
        if (!isEditMode) {
            if(title.trim()) {
                createAndSetGoal(title.trim());
            }
        } else if (currentGoal) {
             const goalData = {
                title,
                description,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
            };
            debouncedSave(goalData, currentGoal.id);
        }
    }
  }, [title, description, tags, dueDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader className="flex flex-row items-center justify-between pr-10">
          <div>
            <DialogTitle>{isEditMode ? 'Edit Study Goal' : 'Create New Study Goal'}</DialogTitle>
            <DialogDescription>
                {isEditMode ? "Changes are saved automatically." : "Start by entering a title."}
            </DialogDescription>
          </div>
           {saveStatus === 'saving' && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</div>}
           {saveStatus === 'saved' && <div className="flex items-center gap-2 text-sm text-green-600"><Check className="h-4 w-4" /> Saved</div>}
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
