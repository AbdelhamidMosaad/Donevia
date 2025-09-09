
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
import type { StudyChapter } from '@/lib/types';
import { addStudyChapter, updateStudyChapter } from '@/lib/study-tracker';

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

  const resetForm = () => {
    setTitle('');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && chapter) {
        setTitle(chapter.title);
      } else {
        resetForm();
      }
      setIsSaving(false);
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

    setIsSaving(true);
    const chapterData = {
        goalId,
        title,
        order: chapter?.order ?? chaptersCount,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update this chapter.' : 'Add a new chapter to your study goal.'}</DialogDescription>
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
