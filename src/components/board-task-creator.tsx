
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addTask } from '@/lib/tasks';
import { Timestamp } from 'firebase/firestore';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';

interface BoardTaskCreatorProps {
    listId: string;
    stageId: string;
}

const cardColors = [
    '#FFFFFF', // White
    '#FEE2E2', // red-100
    '#FFEDD5', // orange-100
    '#FEF9C3', // yellow-100
    '#ECFCCB', // lime-100
    '#D1FAE5', // emerald-100
    '#CFFAFE', // cyan-100
    '#DBEAFE', // blue-100
    '#E0E7FF', // indigo-100
    '#E5E0FF', // violet-100
    '#F3E8FF', // purple-100
    '#FAE8FF', // fuchsia-100
];

const getRandomColor = () => cardColors[Math.floor(Math.random() * cardColors.length)];

export function BoardTaskCreator({ listId, stageId }: BoardTaskCreatorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();

    const resetAndClose = () => {
        setTitle('');
        setIsEditing(false);
    };

    const handleStartEditing = () => {
        setTitle(''); // Always clear title when starting to edit
        setIsEditing(true);
    }

    const handleSave = async () => {
        if (!title.trim()) {
            resetAndClose();
            return;
        }

        if (!user) return;
        
        try {
            await addTask(user.uid, {
                title: title.trim(),
                listId,
                status: stageId,
                priority: 'Medium',
                dueDate: Timestamp.now(), // Default due date
                tags: [],
                color: getRandomColor(),
            });
            // Immediately reset for the next task
            setTitle('');
            // Keep focus on the input to allow adding another task right away
            document.getElementById(`task-creator-input-${stageId}`)?.focus();
        } catch (error) {
            console.error("Error creating task: ", error);
            toast({ variant: 'destructive', title: 'Failed to create task' });
            resetAndClose();
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
            <Card 
                className="p-3 bg-transparent hover:bg-card-foreground/5 transition-colors duration-200 cursor-pointer"
                onClick={handleStartEditing}
            >
               <div className="flex items-center text-muted-foreground">
                 <Plus className="mr-2 h-4 w-4" />
                 <span>Add a card</span>
               </div>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
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
            />
            <div className="flex items-center gap-2">
                 <Button onClick={handleSave} disabled={!title.trim()} size="sm">
                    Add card
                 </Button>
                 <Button variant="ghost" size="icon" onClick={resetAndClose} className="h-8 w-8">
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Cancel</span>
                 </Button>
            </div>
        </div>
    );
}
