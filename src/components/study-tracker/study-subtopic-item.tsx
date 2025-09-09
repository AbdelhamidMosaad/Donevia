
'use client';

import type { StudySubtopic } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { toggleStudySubtopicCompletion } from '@/lib/study-tracker';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

interface StudySubtopicItemProps {
  subtopic: StudySubtopic;
  onDelete: () => void;
  onEdit: () => void;
}

export function StudySubtopicItem({ subtopic, onDelete, onEdit }: StudySubtopicItemProps) {
  const { user } = useAuth();

  const handleToggle = async () => {
    if (!user) return;
    await toggleStudySubtopicCompletion(user.uid, subtopic.id, !subtopic.isCompleted);
  };
  
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className={cn("flex items-center gap-4 p-2 rounded-md transition-colors", subtopic.isCompleted ? "" : "hover:bg-accent/50")}>
        <Checkbox
          id={`subtopic-${subtopic.id}`}
          checked={subtopic.isCompleted}
          onCheckedChange={handleToggle}
          className="mt-1"
        />
        <div className="flex-1">
          <label
            htmlFor={`subtopic-${subtopic.id}`}
            className={cn("font-medium cursor-pointer text-sm", subtopic.isCompleted && "line-through text-muted-foreground")}
          >
            {subtopic.title}
          </label>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={handleActionClick}>
                <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={handleActionClick}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subtopic?</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete the subtopic "{subtopic.title}"?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
