
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Timestamp } from 'firebase/firestore';
import { Card } from './ui/card';
import { useTasks } from '@/hooks/use-tasks';
import { AddTaskDialog } from './add-task-dialog';
import type { Task } from '@/lib/types';

interface BoardTaskCreatorProps {
    stageId: string;
}

export function BoardTaskCreator({ stageId }: BoardTaskCreatorProps) {
    const { addTask, categories } = useTasks();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const { user } = useAuth();
    const { toast } = useToast();
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

    const resetAndClose = () => {
        setTitle('');
        setIsEditing(false);
        setEditingTask(null);
    };

    const handleStartEditing = () => {
        setTitle('');
        setIsEditing(true);
    }

    const handleSave = async () => {
        if (!title.trim() || !user) {
            resetAndClose();
            return;
        }
        
        const newTask: Partial<Task> = {
            title: title.trim(),
            status: stageId,
            priority: 'Medium',
            dueDate: Timestamp.now(),
            category: 'general',
        };

        setEditingTask(newTask);
        resetAndClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            resetAndClose();
        }
    };
    
    if (!isEditing) {
        return (
            <>
                <Card 
                    className="p-3 bg-transparent hover:bg-card-foreground/5 transition-colors duration-200 cursor-pointer"
                    onClick={handleStartEditing}
                >
                   <div className="flex items-center text-muted-foreground">
                     <Plus className="mr-2 h-4 w-4" />
                     <span>Add a card</span>
                   </div>
                </Card>
                {editingTask && (
                    <AddTaskDialog 
                        task={editingTask as Task}
                        open={!!editingTask}
                        onOpenChange={(open) => { if(!open) setEditingTask(null) }}
                        onTaskAdded={addTask}
                        onTaskUpdated={() => {}} // Not used for new tasks
                        categories={categories}
                    />
                )}
            </>
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
                placeholder="Enter a title for this card..."
                className="text-sm shadow-sm min-h-[60px] resize-y"
            />
            <div className="flex items-center gap-2">
                 <Button onClick={handleSave} disabled={!title.trim()} size="sm">
                    Add card
                 </Button>
                 <Button variant="ghost" size="icon" onClick={resetAndClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Cancel</span>
                 </Button>
            </div>
        </div>
    );
}
