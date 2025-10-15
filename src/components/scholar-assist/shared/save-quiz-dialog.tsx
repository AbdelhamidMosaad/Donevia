
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { saveQuiz } from '@/lib/quizzes';
import type { StudyMaterialResponse } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';

interface SaveQuizDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    quiz: StudyMaterialResponse;
}

export function SaveQuizDialog({
    isOpen,
    onOpenChange,
    quiz,
}: SaveQuizDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [title, setTitle] = useState(quiz.title);
    const [tags, setTags] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Title cannot be empty.' });
            return;
        }
        setIsLoading(true);
        try {
            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            await saveQuiz(user.uid, quiz, title, tagsArray);
            toast({ title: 'Quiz saved successfully!' });
            onOpenChange(false);
        } catch (e) {
            console.error("Error saving quiz:", e);
            toast({ variant: 'destructive', title: 'Failed to save quiz.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Quiz</DialogTitle>
                    <DialogDescription>Save this quiz to retake it later. You can add tags to organize it.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="quiz-title">Quiz Title</Label>
                        <Input
                            id="quiz-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="quiz-tags">Tags (comma-separated)</Label>
                        <Input
                            id="quiz-tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., Biology, Chapter 4, Midterm Prep"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save/>}
                        {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
