
'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

interface LectureNotesViewProps {
  notes: string;
}

export function LectureNotesView({ notes }: LectureNotesViewProps) {
  return (
    <ScrollArea className="h-[500px]">
        <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: notes.replace(/\n/g, '<br />') }} 
        />
    </ScrollArea>
  );
}
