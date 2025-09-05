
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
    onFinish: () => void;
}

export function InlineTaskCreator({ listId, stageId, onFinish }: InlineTaskCreatorProps) {
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSave = async () => {
        // Prevent multiple saves
        if (isSaving) return;

        const trimmedTitle = title.trim();
        
        // If the title is empty, just finish without saving.
        if (!trimmedTitle) {
            onFinish();
            return;
        }

        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            onFinish();
            return;
        }
        
        setIsSaving(true);
        try {
            await addTask(user.uid, {
                title: trimmedTitle,
                listId,
                status: stageId,
                priority: 'Medium',
                dueDate: Timestamp.now(),
                tags: [],
            });
            // Don't show toast for inline creation to keep flow smooth
        } catch (error) {
            console.error("Error creating task: ", error);
            toast({ variant: 'destructive', title: 'Failed to create task' });
        } finally {
            setIsSaving(false);
            onFinish(); // Always call onFinish to reset the board's state
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onFinish();
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
                className="text-sm h-9"
                disabled={isSaving}
            />
        </div>
    );
}
