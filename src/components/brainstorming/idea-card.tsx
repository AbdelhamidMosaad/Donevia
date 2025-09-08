
'use client';

import { useState } from 'react';
import { BrainstormingIdea } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { deleteIdea, updateIdea } from '@/lib/brainstorm';
import { useToast } from '@/hooks/use-toast';
import { GripVertical, Trash2, Edit, Check } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


interface IdeaCardProps {
  idea: BrainstormingIdea;
  dragHandleProps?: any;
}

export function IdeaCard({ idea, dragHandleProps }: IdeaCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(idea.content);

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteIdea(user.uid, idea.id);
      toast({ title: 'Idea Deleted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to delete idea.' });
    }
  };
  
  const handleSave = async () => {
    if (!user || content.trim() === '') return;
    try {
      await updateIdea(user.uid, idea.id, { content });
      setIsEditing(false);
      toast({ title: 'Idea updated' });
    } catch (e) {
       toast({ variant: 'destructive', title: 'Failed to update idea.' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
    } else if (e.key === 'Escape') {
        setIsEditing(false);
        setContent(idea.content);
    }
  };

  return (
    <Card
      className={cn(
        "p-4 relative group h-full flex flex-col",
        "transition-shadow hover:shadow-lg"
      )}
      style={{ backgroundColor: idea.color }}
    >
      <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
         {isEditing ? (
             <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}><Check className="h-4 w-4 text-green-600"/></Button>
         ) : (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4"/></Button>
         )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
              <AlertDialogDescription>This action is permanent and cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <CardContent className="p-0 pt-6 flex-1">
        {isEditing ? (
          <Textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent border-primary resize-none"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{idea.content}</p>
        )}
      </CardContent>
      <div {...dragHandleProps} className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab p-1 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-5 w-5" />
      </div>
    </Card>
  );
}
