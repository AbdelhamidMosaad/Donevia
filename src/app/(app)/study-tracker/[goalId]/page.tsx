
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StudyGoal, StudyChapter, StudySubtopic } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, PlusCircle, Flag, Share2, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddStudyGoalDialog } from '@/components/study-tracker/add-study-goal-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddStudyChapterDialog } from '@/components/study-tracker/add-study-chapter-dialog';
import { StudyChapterItem } from '@/components/study-tracker/study-chapter-item';
import { useDebouncedCallback } from 'use-debounce';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function StudyGoalDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const goalId = params.goalId as string;

  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [subtopics, setSubtopics] = useState<StudySubtopic[]>([]);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user && goalId) {
      const goalRef = doc(db, 'users', user.uid, 'studyGoals', goalId);
      const unsubscribeGoal = onSnapshot(goalRef, (doc) => {
        if (doc.exists()) {
          setGoal({ id: doc.id, ...doc.data() } as StudyGoal);
        } else {
          router.push('/study-tracker');
        }
      });

      const chaptersQuery = query(collection(db, 'users', user.uid, 'studyChapters'), where('goalId', '==', goalId), orderBy('order', 'asc'));
      const unsubscribeChapters = onSnapshot(chaptersQuery, (snapshot) => {
        setChapters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyChapter)));
      });
      
      const subtopicsQuery = query(collection(db, 'users', user.uid, 'studySubtopics'), where('goalId', '==', goalId));
      const unsubscribeSubtopics = onSnapshot(subtopicsQuery, (snapshot) => {
        setSubtopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySubtopic)));
      });
      
      return () => {
        unsubscribeGoal();
        unsubscribeChapters();
        unsubscribeSubtopics();
      };
    }
  }, [user, goalId, router]);

  const saveTime = useDebouncedCallback(async (newTime) => {
    if(!user || !goal) return;
    const goalRef = doc(db, 'users', user.uid, 'studyGoals', goalId);
    await updateDoc(goalRef, { timeSpentSeconds: (goal.timeSpentSeconds || 0) + newTime });
    setTimeElapsed(0);
  }, 5000); // Save every 5 seconds

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if(isTimerActive) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      saveTime(timeElapsed);
    }
    return () => {
        if (interval) clearInterval(interval);
        if (timeElapsed > 0) saveTime(timeElapsed);
    }
  }, [isTimerActive, timeElapsed, saveTime]);

  const progressPercentage = useMemo(() => {
    if (subtopics.length === 0) return 0;
    const completedCount = subtopics.filter(m => m.isCompleted).length;
    return (completedCount / subtopics.length) * 100;
  }, [subtopics]);
  
  const flagPosition = `${progressPercentage}%`;

  const handleShareProgress = () => {
    if (!goal || subtopics.length === 0) return;
    const completedCount = subtopics.filter(s => s.isCompleted).length;
    const totalCount = subtopics.length;
    const percentage = Math.round(progressPercentage);

    let progressText = `My Study Progress for "${goal.title}":\n`;
    progressText += `✅ ${completedCount} of ${totalCount} subtopics completed (${percentage}%)\n\n`;
    
    chapters.forEach(chapter => {
        progressText += `Chapter: ${chapter.title}\n`;
        subtopics.filter(s => s.chapterId === chapter.id)
            .sort((a,b) => a.order - b.order)
            .forEach(subtopic => {
                progressText += `  [${subtopic.isCompleted ? 'x' : ' '}] ${subtopic.title}\n`;
            });
        progressText += '\n';
    });

    navigator.clipboard.writeText(progressText);
    toast({ title: "Progress copied to clipboard!" });
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m ` : ''}${seconds}s`;
  }
  
  const totalTime = (goal?.timeSpentSeconds || 0) + timeElapsed;
  
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination || !user) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
    }

    if (type === 'chapter') {
        const reorderedChapters = Array.from(chapters);
        const [movedItem] = reorderedChapters.splice(source.index, 1);
        reorderedChapters.splice(destination.index, 0, movedItem);
        setChapters(reorderedChapters);

        const batch = writeBatch(db);
        reorderedChapters.forEach((chapter, index) => {
            const chapterRef = doc(db, 'users', user.uid, 'studyChapters', chapter.id);
            batch.update(chapterRef, { order: index });
        });
        await batch.commit();
        toast({ title: 'Chapters reordered.' });
    }

    if (type === 'subtopic') {
        const sourceChapterId = source.droppableId;
        const destChapterId = destination.droppableId;
        
        const sourceSubtopics = subtopics.filter(s => s.chapterId === sourceChapterId).sort((a,b)=> a.order-b.order);
        const [movedSubtopic] = sourceSubtopics.splice(source.index, 1);
        
        const batch = writeBatch(db);
        
        // If moved within the same chapter
        if (sourceChapterId === destChapterId) {
            sourceSubtopics.splice(destination.index, 0, movedSubtopic);
            sourceSubtopics.forEach((subtopic, index) => {
                const subtopicRef = doc(db, 'users', user.uid, 'studySubtopics', subtopic.id);
                batch.update(subtopicRef, { order: index });
            });
        } else {
            // Moved to a different chapter
            const destSubtopics = subtopics.filter(s => s.chapterId === destChapterId).sort((a,b)=> a.order-b.order);
            destSubtopics.splice(destination.index, 0, movedSubtopic);
            
            // Update order for source chapter
            sourceSubtopics.forEach((subtopic, index) => {
                const subtopicRef = doc(db, 'users', user.uid, 'studySubtopics', subtopic.id);
                batch.update(subtopicRef, { order: index });
            });
            
            // Update moved item's chapterId and order, and update order for destination chapter
            const movedSubtopicRef = doc(db, 'users', user.uid, 'studySubtopics', movedSubtopic.id);
            batch.update(movedSubtopicRef, { chapterId: destChapterId });
             destSubtopics.forEach((subtopic, index) => {
                const subtopicRef = doc(db, 'users', user.uid, 'studySubtopics', subtopic.id);
                batch.update(subtopicRef, { order: index });
            });
        }
        
        await batch.commit();
        toast({ title: 'Subtopics reordered.' });
    }
  };

  if (loading || !user || !goal) {
    return <div className="flex items-center justify-center h-full"><p>Loading goal...</p></div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/study-tracker')}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
                <h1 className="text-3xl font-bold font-headline">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
            </div>
        </div>
        <div className='flex items-center gap-2'>
            <Button variant="outline" onClick={handleShareProgress}><Share2 className="mr-2 h-4 w-4" /> Share Progress</Button>
            <Button variant="outline" onClick={() => setIsEditGoalOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Goal</Button>
        </div>
      </div>

       <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Progress Track</CardTitle>
                <CardDescription>{subtopics.filter(s => s.isCompleted).length} of {subtopics.length} subtopics completed</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative h-10">
                    <div className="absolute bottom-2 left-0 right-0 h-2 bg-red-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="absolute top-0 transition-all duration-500 ease-out" style={{ left: `calc(${flagPosition} - 12px)` }}>
                        <Flag className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Study Timer</span>
                    <span className="text-2xl font-mono font-bold">{formatTime(totalTime)}</span>
                </CardTitle>
                <CardDescription>Track your study sessions for this goal.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-4">
                <Button onClick={() => setIsTimerActive(!isTimerActive)} size="lg">
                    {isTimerActive ? <><Pause className="mr-2 h-5 w-5"/>Pause</> : <><Play className="mr-2 h-5 w-5"/>Start</>}
                </Button>
                <Button onClick={() => setTimeElapsed(0)} variant="outline" size="lg" disabled={isTimerActive}>
                    <RotateCcw className="mr-2 h-5 w-5"/>Reset
                </Button>
            </CardContent>
        </Card>
      </div>


        <Card className="flex flex-col flex-1 min-h-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                  <CardTitle>Content Breakdown</CardTitle>
                  <CardDescription>Organize your study material into chapters and subtopics.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsAddChapterOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Chapter</Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                {chapters.length > 0 ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="chapters-droppable" type="chapter">
                           {(provided) => (
                             <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                {chapters.map((chapter, index) => (
                                     <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                <StudyChapterItem 
                                                    chapter={chapter} 
                                                    subtopics={subtopics.filter(s => s.chapterId === chapter.id)}
                                                    chaptersCount={chapters.length}
                                                />
                                            </div>
                                        )}
                                     </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                           )}
                        </Droppable>
                    </DragDropContext>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No chapters yet. Add one to get started!</p>
                )}
            </CardContent>
        </Card>

       <AddStudyGoalDialog goal={goal} open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen} />
       <AddStudyChapterDialog goalId={goalId} open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen} chaptersCount={chapters.length}/>
    </div>
  );
}
