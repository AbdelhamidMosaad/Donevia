
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { fetchWithAuth } from '@/lib/client-helpers';
import { Loader2 } from 'lucide-react';

interface GenerateLectureNotesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreated: (noteId: string) => void;
}

export function GenerateLectureNotesDialog({ isOpen, onOpenChange, onNoteCreated }: GenerateLectureNotesDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in' });
      return;
    }
    if (sourceText.trim().length < 100) {
        toast({ variant: 'destructive', title: 'Input Too Short', description: 'Please provide at least 100 characters of text to generate notes.'});
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetchWithAuth('/api/lecture-notes/generate', {
        method: 'POST',
        body: JSON.stringify({ sourceText }),
      });
      const result = await response.json();
      
      if (!result.success) {
          throw new Error(result.error || 'Failed to generate note.');
      }
      
      toast({ title: 'Success!', description: 'Your new lecture note has been created.' });
      onNoteCreated(result.noteId);
      onOpenChange(false);
      setSourceText('');

    } catch (error) {
      console.error('Note generation failed:', error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate New Lecture Notes</DialogTitle>
          <DialogDescription>
            Paste your study material below, and AI will create structured notes for you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Paste your raw text here... (minimum 100 characters)"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="min-h-[300px]"
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading || sourceText.trim().length < 100}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Generating...' : 'Generate Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
