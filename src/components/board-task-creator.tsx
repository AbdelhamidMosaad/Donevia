
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addTask } from '@/lib/tasks';
import { Timestamp } from 'firebase/firestore';
import { Textarea } from './ui/textarea';

interface BoardTaskCreatorProps {
    listId: string;
    stageId: string;
}

export function BoardTaskCreator({ listId, stageId }: BoardTaskCreatorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const resetAndClose = () => {
        setTitle('');
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            resetAndClose();
            return;
        }

        if (!user || isSaving) return;
        
        setIsSaving(true);
        try {
            await addTask(user.uid, {
                title: title.trim(),
                listId,
                status: stageId,
                priority: 'Medium',
                dueDate: Timestamp.now(), // Default due date
                tags: [],
            });
            // Immediately reset for the next task
            setTitle('');
            // Keep focus on the input to allow adding another task right away
            document.getElementById(`task-creator-input-${stageId}`)?.focus();
        } catch (error) {
            console.error("Error creating task: ", error);
            toast({ variant: 'destructive', title: 'Failed to create task' });
            resetAndClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Save on Enter, allow Shift+Enter for new lines
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            resetAndClose();
        }
    };
    
    if (!isEditing) {
        return (
            <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground h-auto py-2 px-3"
                onClick={() => setIsEditing(true)}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add a card
            </Button>
        );
    }

    return (
        <div className="space-y-2 p-1">
             <Textarea 
                id={`task-creator-input-${stageId}`}
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                    // Only close on blur if title is empty, otherwise user might be clicking Save
                    if(!title.trim()) {
                       resetAndClose();
                    }
                }}
                placeholder="Enter a title for this card..."
                className="text-sm shadow-sm min-h-[60px] resize-y"
                disabled={isSaving}
            />
            <div className="flex items-center gap-2">
                 <Button onClick={handleSave} disabled={!title.trim() || isSaving} size="sm">
                    {isSaving ? 'Adding...' : 'Add card'}
                 </Button>
                 <Button variant="ghost" size="icon" onClick={resetAndClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cancel</span>
                 </Button>
            </div>
        </div>
    );
}

