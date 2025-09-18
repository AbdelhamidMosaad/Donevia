
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
import type { StudyChapter, StudyDifficulty } from '@/lib/types';
import { addStudyChapter, updateStudyChapter } from '@/lib/study-tracker';
import { Timestamp } from 'firebase/firestore';
import moment from 'moment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddStudyChapterDialogProps {
  goalId: string;
  chapter?: StudyChapter | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  chaptersCount: number;
}

export function AddStudyChapterDialog({
  goalId,
  chapter,
  open,
  onOpenChange,
  chaptersCount,
}: AddStudyChapterDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!chapter;

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminder, setReminder] = useState<StudyChapter['reminder']>('none');
  const [difficulty, setDifficulty] = useState<StudyDifficulty>('Medium');

  const resetForm = () => {
    setTitle('');
    setDueDate(null);
    setReminder('none');
    setDifficulty('Medium');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && chapter) {
        setTitle(chapter.title);
        setDueDate(chapter.dueDate ? chapter.dueDate.toDate() : null);
        setReminder(chapter.reminder || 'none');
        setDifficulty(chapter.difficulty || 'Medium');
      } else {
        resetForm();
      }
    } else {
        resetForm();
    }
  }, [open, chapter, isEditMode]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!title) {
        toast({ variant: 'destructive', title: 'Title is required.' });
        return;
    }

    console.log('Attempting to save chapter:', title);
    setIsSaving(true);
    const chapterData = {
        goalId,
        title,
        order: chapter?.order ?? chaptersCount,
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        reminder: reminder,
        difficulty: difficulty,
    };

    try {
      if (isEditMode && chapter) {
        await updateStudyChapter(user.uid, chapter.id, chapterData);
        toast({ title: 'Chapter Updated' });
      } else {
        await addStudyChapter(user.uid, chapterData);
        toast({ title: 'Chapter Added' });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving chapter: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save chapter.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update this chapter.' : 'Add a new chapter to your study goal.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input id="dueDate" type="date" value={dueDate ? moment(dueDate).format('YYYY-MM-DD') : ''} onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminder" className="text-right">Reminder</Label>
             <Select onValueChange={(v: StudyChapter['reminder']) => setReminder(v)} value={reminder}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="on-due-date">On due date</SelectItem>
                <SelectItem value="1-day">1 day before</SelectItem>
                <SelectItem value="2-days">2 days before</SelectItem>
                <SelectItem value="1-week">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="difficulty" className="text-right">Difficulty</Label>
             <Select onValueChange={(v: StudyDifficulty) => setDifficulty(v)} value={difficulty}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
