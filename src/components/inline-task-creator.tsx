
'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addTask } from '@/lib/tasks';
import { Timestamp } from 'firebase/firestore';

interface InlineTaskCreatorProps {
    listId: string;
    stageId: string;
    onCancel: () => void;
    onCreated: (taskId: string) => void;
}

export function InlineTaskCreator({ listId, stageId, onCancel, onCreated }: InlineTaskCreatorProps) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSave = async () => {
        if (isSaving) return;

        if (!title.trim()) {
            onCancel();
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            return;
        }
        
        setIsSaving(true);
        try {
            const docRef = await addTask(user.uid, {
                title: title.trim(),
                listId,
                status: stageId,
                priority: 'Medium',
                dueDate: Timestamp.now(),
                tags: [],
            });
            toast({ title: 'Task created!' });
            onCreated(docRef.id);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to create task' });
            onCancel();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="p-1 mb-4">
            <Input 
                ref={inputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder="New task title..."
                className="text-sm"
                disabled={isSaving}
            />
        </div>
    );
}
