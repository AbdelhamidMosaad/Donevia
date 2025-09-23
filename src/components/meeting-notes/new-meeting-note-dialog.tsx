
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { templates, type TemplateId } from '@/lib/meeting-templates';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Loader2 } from 'lucide-react';

interface NewMeetingNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewMeetingNoteDialog({
  open,
  onOpenChange,
}: NewMeetingNoteDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('Untitled Meeting');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('general');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNote = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Title cannot be empty.' });
      return;
    }
    
    setIsCreating(true);
    
    const templateContent = templates[selectedTemplate].content;

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'meetingNotes'), {
        title: title.trim(),
        startDate: Timestamp.now(),
        endDate: null,
        location: '',
        attendees: [],
        agenda: [],
        notes: templateContent,
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast({
        title: '✓ Meeting Note Created',
        description: `Your new note is ready.`,
      });
      onOpenChange(false);
      router.push(`/meeting-notes/${docRef.id}`);
    } catch (e) {
      console.error('Error adding meeting note: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create meeting note. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Meeting Note</DialogTitle>
          <DialogDescription>
            Give your note a title and choose a template to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q3 Project Sync"
            />
          </div>
          <div className="space-y-2">
            <Label>Choose a Template</Label>
            <RadioGroup
              value={selectedTemplate}
              onValueChange={(value: TemplateId) => setSelectedTemplate(value)}
              className="space-y-1"
            >
              {Object.entries(templates).map(([id, { name, description }]) => (
                <Label
                  key={id}
                  htmlFor={id}
                  className="flex items-start space-x-3 space-y-0 cursor-pointer rounded-md border p-3 hover:bg-accent has-[div>input:checked]:border-primary"
                >
                  <RadioGroupItem value={id} id={id} />
                   <div className="flex flex-col">
                    <span className="font-bold">{name}</span>
                    <span className="text-sm text-muted-foreground">{description}</span>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreateNote} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Create Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    