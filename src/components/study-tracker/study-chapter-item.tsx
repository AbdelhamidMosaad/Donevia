
'use client';

import { useState } from 'react';
import type { StudyChapter, StudySubtopic } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { deleteStudyChapter, deleteStudySubtopic } from '@/lib/study-tracker';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Edit, Trash2, PlusCircle, GripVertical, ChevronRight } from 'lucide-react';
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


interface StudyChapterItemProps {
  chapter: StudyChapter;
  subtopics: StudySubtopic[];
  chaptersCount: number;
}

export function StudyChapterItem({ chapter, subtopics, chaptersCount }: StudyChapterItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditChapterOpen, setIsEditChapterOpen] = useState(false);
  const [isAddSubtopicOpen, setIsAddSubtopicOpen] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<StudySubtopic | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <>
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed} className="p-4 rounded-lg bg-muted/50 border">
        <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 pl-1 pr-2">
                        <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-90")}/>
                        <h3 className="font-bold text-lg">{chapter.title}</h3>
                    </Button>
                </CollapsibleTrigger>
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
