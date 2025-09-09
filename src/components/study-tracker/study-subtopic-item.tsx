
'use client';

import type { StudySubtopic } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { toggleStudySubtopicCompletion } from '@/lib/study-tracker';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2, Link, FileText, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface StudySubtopicItemProps {
  subtopic: StudySubtopic;
  onDelete: () => void;
  onEdit: () => void;
}

export function StudySubtopicItem({
  subtopic,
  onDelete,
  onEdit,
}: StudySubtopicItemProps) {
  const { user } = useAuth();

  const handleToggle = async () => {
    if (!user) return;
    await toggleStudySubtopicCompletion(
      user.uid,
      subtopic.id,
      !subtopic.isCompleted
    );
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const hasExtraContent = !!subtopic.notes || (subtopic.resources && subtopic.resources.length > 0);

  return (
    <>
      <Collapsible>
        <div
          className={cn(
            'flex items-start gap-2 p-2 rounded-md transition-colors group',
            subtopic.isCompleted ? '' : 'hover:bg-accent/50'
          )}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
          <Checkbox
            id={`subtopic-${subtopic.id}`}
            checked={subtopic.isCompleted}
            onCheckedChange={handleToggle}
            className="mt-1"
          />
          <div className="flex-1">
            <CollapsibleTrigger asChild disabled={!hasExtraContent}>
                 <label
                    htmlFor={`subtopic-${subtopic.id}`}
                    className={cn(
                      'font-medium cursor-pointer text-sm',
                      subtopic.isCompleted && 'line-through text-muted-foreground',
                      hasExtraContent && "hover:underline"
                    )}
                  >
                    {subtopic.title}
                  </label>
            </CollapsibleTrigger>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={handleActionClick}>
              <DropdownMenuItem onSelect={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={handleActionClick}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Subtopic?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the subtopic "
                      {subtopic.title}"?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
         <CollapsibleContent>
            <div className="pl-12 pr-4 pb-2 space-y-4">
              {subtopic.notes && (
                <div className="mt-2 text-sm text-muted-foreground bg-background p-3 rounded-md border">
                    <p className="font-semibold mb-1 flex items-center gap-2"><FileText className="h-4 w-4"/> Notes</p>
                    <p className="whitespace-pre-wrap">{subtopic.notes}</p>
                </div>
              )}
              {subtopic.resources && subtopic.resources.length > 0 && (
                <div className="mt-2 space-y-2">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2"><Link className="h-4 w-4"/> Resources</p>
                    <ul className="list-none space-y-1">
                        {subtopic.resources.map(res => (
                            <li key={res.id}>
                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                   - {res.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
         </CollapsibleContent>
      </Collapsible>
    </>
  );
}
