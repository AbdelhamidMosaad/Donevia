'use client';

import { useState, useMemo } from 'react';
import type { StudyChapter, StudyTopic } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { deleteStudyChapter, toggleChapterCompletion } from '@/lib/study-tracker';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2, PlusCircle, GripVertical, ChevronRight, Calendar, Play, Pause } from 'lucide-react';
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
import { AddStudyChapterDialog } from './add-study-chapter-dialog';
import { AddStudyTopicDialog } from './add-study-topic-dialog';
import { useToast } from '@/hooks/use-toast';
import { StudyTopicItem } from './study-topic-item';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import moment from 'moment';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { deleteStudyTopic } from '@/lib/study-tracker';


interface StudyChapterItemProps {
  chapter: StudyChapter;
  topics: StudyTopic[];
  chaptersCount: number;
  activeTimer: { itemId: string, title: string } | null;
  onToggleTimer: (itemId: string, itemTitle: string, itemType: 'topic' | 'chapter') => void;
}

export function StudyChapterItem({ chapter, topics, chaptersCount, activeTimer, onToggleTimer }: StudyChapterItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const handleDeleteChapter = async () => {
    if (!user) return;
    try {
        await deleteStudyChapter(user.uid, chapter.id);
        toast({ title: "Chapter deleted successfully" });
    } catch(e) {
        toast({ variant: "destructive", title: "Error deleting chapter" });
    }
  }

  const handleDeleteTopic = async (topicId: string) => {
    if(!user) return;
    try {
        await deleteStudyTopic(user.uid, topicId);
        toast({ title: "Topic deleted successfully" });
    } catch (e) {
        toast({ variant: "destructive", title: "Error deleting topic" });
    }
  }
  
  const progressPercentage = useMemo(() => {
    if (topics.length === 0) {
        return chapter.isCompleted ? 100 : 0;
    }
    const completedCount = topics.filter(s => s.isCompleted).length;
    return (completedCount / topics.length) * 100;
  }, [topics, chapter.isCompleted]);

  const handleToggleCompletion = async () => {
    if (!user) return;
    try {
        await toggleChapterCompletion(user.uid, chapter.id, !chapter.isCompleted);
    } catch (e) {
        toast({ variant: "destructive", title: "Error updating chapter completion" });
    }
  }

  const isChapterTimerActive = activeTimer?.itemId === chapter.id;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="p-4 rounded-lg bg-muted/50 border">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <Checkbox
                    id={`chapter-${chapter.id}`}
                    checked={chapter.isCompleted}
                    onCheckedChange={handleToggleCompletion}
                    className="mt-1"
                />
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 pl-1 pr-2">
                        <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")}/>
                        <label
                           htmlFor={`chapter-${chapter.id}`}
                           className={cn(
                             'font-bold text-lg cursor-pointer',
                             chapter.isCompleted && 'line-through text-muted-foreground'
                           )}
                        >
                            {chapter.title}
                        </label>
                    </Button>
                </CollapsibleTrigger>
                 <div className="flex-1 max-w-[200px] hidden md:block">
                     <Progress value={progressPercentage} className="h-2" />
                     <p className="text-xs text-muted-foreground">{topics.filter(s => s.isCompleted).length}/{topics.length} topics</p>
                 </div>
                {chapter.dueDate && (
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {moment(chapter.dueDate.toDate()).format('MMM D')}</span>
                  </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onToggleTimer(chapter.id, chapter.title, 'chapter')}>
                    {isChapterTimerActive ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsAddTopicOpen(true)}>
                    <PlusCircle />
                    Add Topic
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setIsEditChapterOpen(true)}>
                            <Edit className="mr-2 h-4 w-4"/>Edit Chapter
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete Chapter</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete "{chapter.title}" and all its topics? This action is permanent.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteChapter}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <CollapsibleContent>
            <Droppable droppableId={chapter.id} type="topic">
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    className={cn(
                        "space-y-2 pl-4 border-l-2 rounded-md",
                        snapshot.isDraggingOver ? "bg-primary/10 border-primary" : "border-transparent"
                    )}
                >
                    {topics.sort((a,b) => a.order - b.order).map((topic, index) => (
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
                    {topics.length === 0 && <p className="text-sm text-muted-foreground py-2">No topics yet.</p>}
                </div>
            )}
            </Droppable>
        </CollapsibleContent>
      </Collapsible>
      
      <AddStudyChapterDialog 
        goalId={chapter.goalId} 
        chapter={chapter} 
        open={isEditChapterOpen} 
        onOpenChange={setIsEditChapterOpen}
        chaptersCount={chaptersCount}
      />
      
       <AddStudyTopicDialog
        goalId={chapter.goalId}
        chapterId={chapter.id}
        open={isAddTopicOpen}
        onOpenChange={setIsAddTopicOpen}
        topicsCount={topics.length}
      />
      
      {editingTopic && (
        <AddStudyTopicDialog
            goalId={editingTopic.goalId}
            chapterId={editingTopic.chapterId}
            topic={editingTopic}
            open={!!editingTopic}
            onOpenChange={(isOpen) => !isOpen && setEditingTopic(null)}
            topicsCount={topics.length}
        />
      )}
    </>
  );
}
