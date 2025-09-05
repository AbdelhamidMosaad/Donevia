
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addTask } from '@/lib/tasks';
import { Timestamp } from 'firebase/firestore';

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
        if (isSaving || !title.trim()) {
            resetAndClose();
            return;
        }

        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            return;
        }

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
            setTitle(''); // Clear input for next task
            // Don't close editing mode to allow consecutive adds
        } catch (error) {
            console.error("Error creating task: ", error);
            toast({ variant: 'destructive', title: 'Failed to create task' });
            resetAndClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
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
                className="w-full justify-start text-muted-foreground"
                onClick={() => setIsEditing(true)}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add a card
            </Button>
        );
    }

    return (
        <div className="space-y-2">
            <Input 
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave} // Save on blur
                placeholder="Enter a title for this card..."
                className="text-sm h-9"
                disabled={isSaving}
            />
            <div className="flex items-center gap-2">
                 <Button onClick={handleSave} disabled={isSaving} size="sm">
                    {isSaving ? 'Adding...' : 'Add card'}
                 </Button>
                 <Button variant="ghost" size="sm" onClick={resetAndClose}>Cancel</Button>
            </div>
        </div>
    );
}
