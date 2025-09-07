
'use client';

import { useState } from 'react';
import type { Milestone } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { toggleMilestoneCompletion, updateMilestone } from '@/lib/goals';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import moment from 'moment';
import { AddMilestoneDialog } from './add-milestone-dialog';

interface MilestoneItemProps {
  milestone: Milestone;
  onDelete: () => void;
}

export function MilestoneItem({ milestone, onDelete }: MilestoneItemProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleToggle = async () => {
    if (!user) return;
    await toggleMilestoneCompletion(user.uid, milestone.id, !milestone.isCompleted);
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
          <p className="text-sm text-muted-foreground">{milestone.description}</p>
          <p className="text-xs text-muted-foreground mt-1">Due: {moment(milestone.dueDate.toDate()).format('MMM D, YYYY')}</p>
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
                            <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete the milestone "{milestone.title}"?</AlertDialogDescription>
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
      <AddMilestoneDialog goalId={milestone.goalId} milestone={milestone} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
