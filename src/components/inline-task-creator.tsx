
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

        const handleClickOutside = (event: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
                handleSave();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        if (isSaving) return;

        const trimmedTitle = title.trim();
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
            toast({ title: 'Task created!' });
        } catch (error) {
            console.error("Error creating task: ", error);
            toast({ variant: 'destructive', title: 'Failed to create task' });
        } finally {
            setIsSaving(false);
            onFinish();
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
                className="text-sm"
                disabled={isSaving}
            />
        </div>
    );
}
