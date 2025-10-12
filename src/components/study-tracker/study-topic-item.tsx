
'use client';

import type { StudyTopic } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { toggleStudyTopicCompletion } from '@/lib/study-tracker';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2, Link, FileText, GripVertical, Play, Pause, Flag } from 'lucide-react';
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
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface StudyTopicItemProps {
  topic: StudyTopic;
  onDelete: () => void;
  onEdit: () => void;
  onToggleTimer: () => void;
  isTimerActive: boolean;
}

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
        .map(v => v < 10 ? '0' + v : v)
        .filter((v, i) => v !== '00' || i > 0 || (h === 0 && m === 0))
        .join(':');
}

const difficultyConfig = {
  Easy: { color: 'text-green-500', label: 'Easy' },
  Medium: { color: 'text-yellow-500', label: 'Medium' },
  Hard: { color: 'text-red-500', label: 'Hard' },
};


export function StudyTopicItem({
  topic,
  onDelete,
  onEdit,
  onToggleTimer,
  isTimerActive,
}: StudyTopicItemProps) {
  const { user } = useAuth();
  const difficultyInfo = topic.difficulty ? difficultyConfig[topic.difficulty] : null;

  const handleToggle = async () => {
    if (!user) return;
    await toggleStudyTopicCompletion(
      user.uid,
      topic.id,
      !topic.isCompleted
    );
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const hasExtraContent = !!topic.notes || (topic.resources && topic.resources.length > 0);

  return (
    <>
      <Collapsible>
        <div
          className={cn(
            'flex items-start gap-2 p-2 rounded-md transition-colors group',
            topic.isCompleted ? '' : 'hover:bg-accent/50'
          )}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
          <Checkbox
            id={`topic-${topic.id}`}
            checked={topic.isCompleted}
            onCheckedChange={handleToggle}
            className="mt-1"
          />
          <div className="flex-1">
             <div className="flex items-center gap-2">
                {difficultyInfo && (
                   <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Flag className={cn("h-4 w-4", difficultyInfo.color)} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{difficultyInfo.label} Difficulty</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                )}
                <CollapsibleTrigger asChild disabled={!hasExtraContent}>
                     <label
                        htmlFor={`topic-${topic.id}`}
                        className={cn(
                          'font-medium cursor-pointer text-sm',
                          topic.isCompleted && 'line-through text-muted-foreground',
                          hasExtraContent && "hover:underline"
                        )}
                      >
                        {topic.title}
                      </label>
                </CollapsibleTrigger>
            </div>
            {topic.timeSpentSeconds && topic.timeSpentSeconds > 0 ? (
                 <p className="text-xs text-muted-foreground">{formatTime(topic.timeSpentSeconds)} studied</p>
            ) : null}
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onToggleTimer}>
              {isTimerActive ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4" />}
          </Button>

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
                    <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the topic "
                      {topic.title}"?
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
              {topic.notes && (
                <div className="mt-2 text-sm text-muted-foreground bg-background p-3 rounded-md border">
                    <p className="font-semibold mb-1 flex items-center gap-2"><FileText className="h-4 w-4"/> Notes</p>
                    <p className="whitespace-pre-wrap">{topic.notes}</p>
                </div>
              )}
              {topic.resources && topic.resources.length > 0 && (
                <div className="mt-2 space-y-2">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2"><Link className="h-4 w-4"/> Resources</p>
                    <ul className="list-none space-y-1">
                        {topic.resources.map(res => (
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
