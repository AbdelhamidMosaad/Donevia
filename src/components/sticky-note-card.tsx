
'use client';

import type { StickyNote } from '@/lib/types';
import { Flag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';

interface StickyNoteCardProps {
  note: StickyNote;
  onClick: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const priorityConfig = {
  High: {
    color: 'text-red-500',
    label: 'High Priority'
  },
  Medium: {
    color: 'text-yellow-400',
    label: 'Medium Priority'
  },
  Low: {
    color: 'text-green-500',
    label: 'Low Priority'
  }
}

export function StickyNoteCard({ note, onClick, onDelete, style, className }: StickyNoteCardProps) {
  const priorityInfo = priorityConfig[note.priority];
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg shadow-md p-4 transition-all duration-200 cursor-pointer hover:shadow-xl w-full h-auto group",
        className
        )}
      style={{ 
        backgroundColor: note.color,
        color: note.textColor,
        ...style
       }}
      onClick={onClick}
    >
      {priorityInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
                <div className="absolute top-2 right-2">
                    <Flag className={cn("h-4 w-4", priorityInfo.color)} />
                </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{priorityInfo.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <h3
        className="font-bold text-lg mb-2 truncate pr-6"
      >
        {note.title || "Untitled Note"}
      </h3>
      <div
        className="flex-1 text-sm w-full overflow-hidden whitespace-pre-wrap break-words"
      >
        {note.text}
      </div>

       <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 h-7 w-7 text-inherit opacity-0 group-hover:opacity-100 hover:bg-black/10"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this note?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the note titled "{note.title || 'Untitled Note'}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
