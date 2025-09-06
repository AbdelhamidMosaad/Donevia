
'use client';

import type { StickyNote } from '@/lib/types';
import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface StickyNoteCardProps {
  note: StickyNote;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const priorityConfig = {
  High: {
    color: 'bg-red-500',
    label: 'High Priority'
  },
  Medium: {
    color: 'bg-yellow-400',
    label: 'Medium Priority'
  },
  Low: {
    color: 'bg-green-500',
    label: 'Low Priority'
  }
}

export function StickyNoteCard({ note, onClick, style, className }: StickyNoteCardProps) {
  const priorityInfo = priorityConfig[note.priority];

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-lg shadow-md p-4 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-xl w-[250px] h-[250px]",
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
    </div>
  );
}
