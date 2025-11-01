
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Plus, X } from 'lucide-react';
import { Card } from './ui/card';
import { useTasks } from '@/hooks/use-tasks';
import { AddTaskDialog } from './add-task-dialog';
import type { Task } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface BoardTaskCreatorProps {
    stageId: string;
    onTaskCreated: (newTask: Task) => void;
}

export function BoardTaskCreator({ stageId, onTaskCreated }: BoardTaskCreatorProps) {
    const { addTask, categories } = useTasks();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');

    const reset = () => {
        setTitle('');
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            reset();
            return;
        }

        const newTaskData: Partial<Task> = {
            title: title.trim(),
            status: stageId,
            priority: 'Medium',
            dueDate: Timestamp.now(),
            category: 'general',
        };
        
        const newTask = await addTask(newTaskData as any);
        
        if (newTask) {
            onTaskCreated(newTask);
        }
        
        reset();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            reset();
        }
    };
    
    if (!isEditing) {
        return (
            <Card 
                className="p-3 bg-transparent hover:bg-card-foreground/5 transition-colors duration-200 cursor-pointer"
                onClick={() => setIsEditing(true)}
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
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                placeholder="Enter a title for this card..."
                className="text-sm shadow-sm min-h-[60px] resize-y"
            />
            <div className="flex items-center gap-2">
                 <Button onClick={handleSave} disabled={!title.trim()} size="sm">
                    Add card
                 </Button>
                 <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cancel</span>
                 </Button>
            </div>
        </div>
    );
}
