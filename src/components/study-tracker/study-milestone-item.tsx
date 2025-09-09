
'use client';

import { useState } from 'react';
import type { StudyMilestone } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { toggleStudyMilestoneCompletion } from '@/lib/study-tracker';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { AddStudyMilestoneDialog } from './add-study-milestone-dialog';

interface StudyMilestoneItemProps {
  milestone: StudyMilestone;
  onDelete: () => void;
}

export function StudyMilestoneItem({ milestone, onDelete }: StudyMilestoneItemProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleToggle = async () => {
    if (!user) return;
    await toggleStudyMilestoneCompletion(user.uid, milestone.id, !milestone.isCompleted);
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <div className={cn("flex items-start gap-4 p-3 rounded-lg transition-colors", milestone.isCompleted ? "bg-green-500/10" : "bg-muted/50")}>
        <Checkbox
          id={`milestone-${milestone.id}`}
          checked={milestone.isCompleted}
          onCheckedChange={handleToggle}
          className="mt-1"
        />
        <div className="flex-1">
          <label
            htmlFor={`milestone-${milestone.id}`}
            className={cn("font-medium cursor-pointer", milestone.isCompleted && "line-through text-muted-foreground")}
          >
            {milestone.title}
          </label>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={handleDeleteClick}>
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={handleDeleteClick}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subtopic?</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete the subtopic "{milestone.title}"?</AlertDialogDescription>
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
      <AddStudyMilestoneDialog goalId={milestone.goalId} milestone={milestone} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} milestonesCount={0} />
    </>
  );
}
