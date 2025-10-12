
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { StudyChapter, StudyTopic } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { StudyTopicItem } from './study-topic-item';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { deleteStudyTopic } from '@/lib/study-tracker';
import { AddStudyTopicDialog } from './add-study-topic-dialog';

interface StudyChapterBoardProps {
  chapters: StudyChapter[];
  topics: StudyTopic[];
  activeTimer: { itemId: string, title: string } | null;
  onToggleTimer: (itemId: string, itemTitle: string, itemType: 'topic' | 'chapter') => void;
}

export function StudyChapterBoard({ chapters, topics: allTopics, activeTimer, onToggleTimer }: StudyChapterBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.' });
        return;
    }

    const topicRef = doc(db, 'users', user.uid, 'studyTopics', draggableId);

    // If changing chapter (droppableId)
    if (source.droppableId !== destination.droppableId) {
        await updateDoc(topicRef, { chapterId: destination.droppableId });
    }

    const batch = writeBatch(db);
    
    // Reorder logic within the destination list
    const destChapterTopics = allTopics
      .filter(t => t.chapterId === destination.droppableId && t.id !== draggableId)
      .sort((a,b) => a.order - b.order);
      
    destChapterTopics.splice(destination.index, 0, allTopics.find(t => t.id === draggableId)!);
    
    destChapterTopics.forEach((topic, index) => {
      const topicRefForOrder = doc(db, 'users', user.uid, 'studyTopics', topic.id);
      batch.update(topicRefForOrder, { order: index });
    });
    
    // If moved from a different list, reorder the source list as well
    if (source.droppableId !== destination.droppableId) {
        const sourceChapterTopics = allTopics.filter(t => t.chapterId === source.droppableId && t.id !== draggableId).sort((a,b)=>a.order - b.order);
        sourceChapterTopics.forEach((topic, index) => {
            const topicRefForOrder = doc(db, 'users', user.uid, 'studyTopics', topic.id);
            batch.update(topicRefForOrder, { order: index });
        });
    }

    await batch.commit();
    toast({ title: 'Topic moved successfully.' });
  };
  
  const topicsByChapter = useMemo(() => {
    const initial: Record<string, StudyTopic[]> = {};
    chapters.forEach(chapter => initial[chapter.id] = []);
    return allTopics.reduce((acc, topic) => {
        if (acc[topic.chapterId]) {
            acc[topic.chapterId].push(topic);
        }
        return acc;
    }, initial);
  }, [allTopics, chapters]);
  
   const handleDeleteTopic = async (topicId: string) => {
    if(!user) return;
    try {
        await deleteStudyTopic(user.uid, topicId);
        toast({ title: "Topic deleted successfully" });
    } catch (e) {
        toast({ variant: "destructive", title: "Error deleting topic" });
    }
  }


  return (
    <div className="h-full flex flex-col">
        <ScrollArea className="flex-1 -mx-4">
            <div className="px-4 pb-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex gap-6 items-start">
                        {chapters.map(chapter => (
                            <div key={chapter.id} className="flex flex-col w-72 flex-shrink-0">
                                <h2 className="text-lg font-semibold font-headline p-3">{chapter.title}</h2>
                                <Droppable droppableId={chapter.id} type="topic">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex flex-col gap-3 bg-muted/50 rounded-lg p-2 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                                        >
                                            {(topicsByChapter[chapter.id] || []).sort((a,b) => a.order - b.order).map((topic, index) => (
                                                <Draggable key={topic.id} draggableId={topic.id} index={index}>
                                                    {(provided) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                            <StudyTopicItem
                                                                topic={topic}
                                                                onDelete={() => handleDeleteTopic(topic.id)}
                                                                onEdit={() => setEditingTopic(topic)}
                                                                isTimerActive={activeTimer?.itemId === topic.id}
                                                                onToggleTimer={() => onToggleTimer(topic.id, topic.title, 'topic')}
                                                            />
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
        {editingTopic && (
             <AddStudyTopicDialog
                goalId={editingTopic.goalId}
                chapterId={editingTopic.chapterId}
                topic={editingTopic}
                open={!!editingTopic}
                onOpenChange={(isOpen) => !isOpen && setEditingTopic(null)}
                topicsCount={(topicsByChapter[editingTopic.chapterId] || []).length}
            />
        )}
    </div>
  );
}

