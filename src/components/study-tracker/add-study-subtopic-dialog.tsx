
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
import type { StudySubtopic, StudySubtopicResource, StudyDifficulty } from '@/lib/types';
import { addStudySubtopic, updateStudySubtopic } from '@/lib/study-tracker';
import { Textarea } from '../ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
  const [notes, setNotes] = useState('');
  const [resources, setResources] = useState<StudySubtopicResource[]>([]);
  const [difficulty, setDifficulty] = useState<StudyDifficulty>('Medium');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');


  const resetForm = () => {
    setTitle('');
    setNotes('');
    setResources([]);
    setDifficulty('Medium');
    setNewResourceTitle('');
    setNewResourceUrl('');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && subtopic) {
        setTitle(subtopic.title);
        setNotes(subtopic.notes || '');
        setResources(subtopic.resources || []);
        setDifficulty(subtopic.difficulty || 'Medium');
      } else {
        resetForm();
      }
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

    console.log('Attempting to save subtopic:', title);
    setIsSaving(true);
    const subtopicData = {
        goalId,
        chapterId,
        title,
        notes,
        resources,
        difficulty,
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

  const handleAddResource = () => {
      if(!newResourceTitle.trim() || !newResourceUrl.trim()) {
          toast({ variant: 'destructive', title: "Resource title and URL are required."});
          return;
      }
      setResources([...resources, { id: uuidv4(), title: newResourceTitle, url: newResourceUrl }]);
      setNewResourceTitle('');
      setNewResourceUrl('');
  }

  const handleRemoveResource = (resourceId: string) => {
      setResources(resources.filter(r => r.id !== resourceId));
  }
  
  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        const activeEl = document.activeElement;
        // Check if the active element is one of the resource inputs
        if (activeEl?.id === 'new-res-title' || activeEl?.id === 'new-res-url') {
            return; // Don't save the whole dialog, let the resource input handle it
        }
        if (activeEl?.tagName.toLowerCase() !== 'button') {
            e.preventDefault();
            handleSave();
        }
    }
  };

  const handleResourceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddResource();
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Subtopic' : 'Add New Subtopic'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update this subtopic.' : 'Add a new subtopic to this chapter.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
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
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3 min-h-[120px]" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Resources</Label>
                <div className="col-span-3 space-y-4">
                    {resources.map(res => (
                        <div key={res.id} className="flex items-center gap-2">
                           <Input value={res.title} readOnly className="bg-muted/50" />
                           <Input value={res.url} readOnly className="bg-muted/50"/>
                           <Button variant="ghost" size="icon" onClick={() => handleRemoveResource(res.id)}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    ))}
                    <div className="flex items-end gap-2 border-t pt-4">
                        <div className="flex-1">
                            <Label htmlFor="new-res-title" className="text-xs">Resource Title</Label>
                            <Input id="new-res-title" value={newResourceTitle} onChange={(e) => setNewResourceTitle(e.target.value)} placeholder="e.g. YouTube Video" onKeyDown={handleResourceKeyDown} />
                        </div>
                         <div className="flex-1">
                             <Label htmlFor="new-res-url" className="text-xs">Resource URL</Label>
                            <Input id="new-res-url" value={newResourceUrl} onChange={(e) => setNewResourceUrl(e.target.value)} placeholder="https://..." onKeyDown={handleResourceKeyDown} />
                        </div>
                        <Button onClick={handleAddResource}><PlusCircle/></Button>
                    </div>
                </div>
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
