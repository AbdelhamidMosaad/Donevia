
'use client';

import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addProgressUpdate } from '@/lib/goals';

interface AddProgressUpdateProps {
  goalId: string;
  milestoneId?: string;
}

export function AddProgressUpdate({ goalId, milestoneId }: AddProgressUpdateProps) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!text.trim() || !user) return;
    setIsSaving(true);
    try {
      await addProgressUpdate(user.uid, {
        goalId,
        milestoneId: milestoneId || null,
        text: text.trim(),
      });
      setText('');
      toast({ title: 'Progress update saved.' });
    } catch (e) {
      console.error("Error saving progress update:", e);
      toast({ variant: 'destructive', title: 'Error saving update.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="What's your progress?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !text.trim()}>
          {isSaving ? 'Saving...' : 'Save Update'}
        </Button>
      </div>
    </div>
  );
}
