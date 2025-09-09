
'use client';

import { useState, useMemo } from 'react';
import type { StudyChapter, StudySubtopic } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { deleteStudyChapter, deleteStudySubtopic } from '@/lib/study-tracker';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2, PlusCircle, GripVertical, ChevronRight, Calendar } from 'lucide-react';
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
import { AddStudySubtopicDialog } from './add-study-subtopic-dialog';
import { useToast } from '@/hooks/use-toast';
import { StudySubtopicItem } from './study-subtopic-item';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import moment from 'moment';
import { Progress } from '../ui/progress';

interface StudyChapterItemProps {
  chapter: StudyChapter;
  subtopics: StudySubtopic[];
  chaptersCount: number;
  activeTimer: { subtopicId: string; startTime: number } | null;
  onToggleTimer: (subtopicId: string) => void;
}

export function StudyChapterItem({ chapter, subtopics, chaptersCount, activeTimer, onToggleTimer }: StudyChapterItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false);
  const [isAddSubtopicOpen, setIsAddSubtopicOpen] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<StudySubtopic | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleDeleteChapter = async () => {
    if (!user) return;
    try {
        await deleteStudyChapter(user.uid, chapter.id);
        toast({ title: "Chapter deleted successfully" });
    } catch(e) {
        toast({ variant: "destructive", title: "Error deleting chapter" });
    }
  }

  const handleDeleteSubtopic = async (subtopicId: string) => {
    if(!user) return;
    try {
        await deleteStudySubtopic(user.uid, subtopicId);
        toast({ title: "Subtopic deleted successfully" });
    } catch (e) {
        toast({ variant: "destructive", title: "Error deleting subtopic" });
    }
  }
  
  const progressPercentage = useMemo(() => {
    if (subtopics.length === 0) return 0;
    const completedCount = subtopics.filter(s => s.isCompleted).length;
    return (completedCount / subtopics.length) * 100;
  }, [subtopics]);

  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed} className="p-4 rounded-lg bg-muted/50 border">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 pl-1 pr-2">
                        <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-90")}/>
                        <h3 className="font-bold text-lg">{chapter.title}</h3>
                    </Button>
                </CollapsibleTrigger>
                 <div className="flex-1 max-w-[200px] hidden md:block">
                     <Progress value={progressPercentage} className="h-2" />
                     <p className="text-xs text-muted-foreground">{subtopics.filter(s => s.isCompleted).length}/{subtopics.length} subtopics</p>
                 </div>
                {chapter.dueDate && (
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {moment(chapter.dueDate.toDate()).format('MMM D')}</span>
                  </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsAddSubtopicOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2"/>
                    Add Subtopic
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
                                    <AlertDialogDescription>Are you sure you want to delete "{chapter.title}" and all its subtopics? This action is permanent.</AlertDialogDescription>
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
            <Droppable droppableId={chapter.id} type="subtopic">
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    className={cn(
                        "space-y-2 pl-4 border-l-2 rounded-md",
                        snapshot.isDraggingOver ? "bg-primary/10 border-primary" : "border-transparent"
                    )}
                >
                    {subtopics.sort((a,b) => a.order - b.order).map((subtopic, index) => (
                        <Draggable key={subtopic.id} draggableId={subtopic.id} index={index}>
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                    <StudySubtopicItem 
                                        subtopic={subtopic}
                                        onDelete={() => handleDeleteSubtopic(subtopic.id)}
                                        onEdit={() => setEditingSubtopic(subtopic)}
                                        isTimerActive={activeTimer?.subtopicId === subtopic.id}
                                        onToggleTimer={() => onToggleTimer(subtopic.id)}
                                    />
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                    {subtopics.length === 0 && <p className="text-sm text-muted-foreground py-2">No subtopics yet.</p>}
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
      
       <AddStudySubtopicDialog
        goalId={chapter.goalId}
        chapterId={chapter.id}
        open={isAddSubtopicOpen}
        onOpenChange={setIsAddSubtopicOpen}
        subtopicsCount={subtopics.length}
      />
      
      {editingSubtopic && (
        <AddStudySubtopicDialog
            goalId={editingSubtopic.goalId}
            chapterId={editingSubtopic.chapterId}
            subtopic={editingSubtopic}
            open={!!editingSubtopic}
            onOpenChange={(isOpen) => !isOpen && setEditingSubtopic(null)}
            subtopicsCount={subtopics.length}
        />
      )}
    </>
  );
}
