
'use client';

import { useMemo } from 'react';
import type { StudyChapter, StudyTopic, ChapterStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { StudyChapterBoardCard } from './study-chapter-board-card';

const boardStatuses: ChapterStatus[] = ['Not Started', 'In Progress', 'Done'];

interface StudyChapterBoardProps {
  chapters: StudyChapter[];
  topics: StudyTopic[];
}

export function StudyChapterBoard({ chapters, topics }: StudyChapterBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.' });
        return;
    }

    const chapterRef = doc(db, 'users', user.uid, 'studyChapters', draggableId);
    const newStatus = destination.droppableId as ChapterStatus;
    
    try {
        await updateDoc(chapterRef, { status: newStatus });
        toast({ title: 'Chapter status updated.' });
    } catch (e) {
        console.error("Error updating chapter status: ", e);
        toast({ variant: 'destructive', title: 'Error updating status.' });
    }
  };
  
  const chaptersByStatus = useMemo(() => {
      const initial: Record<ChapterStatus, StudyChapter[]> = {
          'Not Started': [],
          'In Progress': [],
          'Done': [],
      };
      return chapters.reduce((acc, chapter) => {
          const status = chapter.status || 'Not Started';
          if (acc[status]) {
              acc[status].push(chapter);
          }
          return acc;
      }, initial);
  }, [chapters]);

  return (
    <div className="h-full flex flex-col">
        <ScrollArea className="flex-1 -mx-4">
            <div className="px-4 pb-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 items-start">
                        {boardStatuses.map(status => (
                            <div key={status} className="flex flex-col w-80 flex-shrink-0">
                                <h2 className="text-lg font-semibold font-headline p-3">{status}</h2>
                                <Droppable droppableId={status}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex flex-col gap-3 bg-muted/50 rounded-lg p-2 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                                        >
                                           {chaptersByStatus[status].sort((a,b) => a.order - b.order).map((chapter, index) => (
                                               <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                                                    {(provided) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                            <StudyChapterBoardCard chapter={chapter} topics={topics.filter(t => t.chapterId === chapter.id)} />
                                                        </div>
                                                    )}
                                               </Draggable>
                                           ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>
             <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
  );
}
