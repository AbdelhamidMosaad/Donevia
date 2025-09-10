
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StudyGoal, StudyChapter, StudySubtopic } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, PlusCircle, Flag, Share2, Timer, Lightbulb, BookOpen, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddStudyGoalDialog } from '@/components/study-tracker/add-study-goal-dialog';
import { AddStudyChapterDialog } from '@/components/study-tracker/add-study-chapter-dialog';
import { StudyChapterItem } from '@/components/study-tracker/study-chapter-item';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { logStudySession } from '@/lib/study-tracker';
import moment from 'moment';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
  
  const [activeTimer, setActiveTimer] = useState<{subtopicId: string, startTime: number} | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const prevCompletionState = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize previous completion state
    const initialCompletionState: Record<string, boolean> = {};
     chapters.forEach(chapter => {
      const chapterSubtopics = subtopics.filter(s => s.chapterId === chapter.id);
      const isChapterComplete = chapterSubtopics.length > 0 && chapterSubtopics.every(s => s.isCompleted);
      initialCompletionState[chapter.id] = isChapterComplete;
    });
    const isGoalComplete = chapters.length > 0 && chapters.every(c => initialCompletionState[c.id]);
    initialCompletionState['goal'] = isGoalComplete;
    prevCompletionState.current = initialCompletionState;

  }, []); // Run only once on mount


   useEffect(() => {
    if (loading || !user) return;
    
    // Check for chapter completions
    chapters.forEach(chapter => {
        const chapterSubtopics = subtopics.filter(s => s.chapterId === chapter.id);
        if (chapterSubtopics.length === 0) return;

        const isNowComplete = chapterSubtopics.every(s => s.isCompleted);
        const wasPreviouslyComplete = prevCompletionState.current[chapter.id];

        if (isNowComplete && !wasPreviouslyComplete) {
            toast({ title: 'Chapter Complete!', description: `You finished "${chapter.title}"!` });
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000); // Confetti for 5 seconds
        }
        prevCompletionState.current[chapter.id] = isNowComplete;
    });
    
    // Check for overall goal completion
    const allChaptersComplete = chapters.length > 0 && chapters.every(c => {
         const chapterSubtopics = subtopics.filter(s => s.chapterId === c.id);
         return chapterSubtopics.length > 0 && chapterSubtopics.every(s => s.isCompleted);
    });

    if (allChaptersComplete && !prevCompletionState.current['goal']) {
       toast({ title: 'Goal Achieved!', description: `Congratulations on completing "${goal?.title}"!`, duration: 10000 });
       setShowConfetti(true);
       setTimeout(() => setShowConfetti(false), 10000);
    }
    prevCompletionState.current['goal'] = allChaptersComplete;

  }, [subtopics, chapters, goal, loading, user, toast]);


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

      const chaptersQuery = query(collection(db, 'users', user.uid, 'studyChapters'), where('goalId', '==', goalId));
      const unsubscribeChapters = onSnapshot(chaptersQuery, (snapshot) => {
        const chaptersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyChapter));
        setChapters(chaptersData.sort((a,b) => a.order - b.order));
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


  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - activeTimer.startTime);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);
  
  const handleToggleTimer = (subtopicId: string) => {
    if (activeTimer?.subtopicId === subtopicId) {
      // Stop timer
      if (user) {
        logStudySession(user.uid, subtopicId, Math.floor(elapsedTime / 1000));
      }
      setActiveTimer(null);
      setElapsedTime(0);
    } else {
      // Stop any other active timer before starting a new one
      if (activeTimer && user) {
        logStudySession(user.uid, activeTimer.subtopicId, Math.floor(elapsedTime / 1000));
      }
      // Start new timer
      setActiveTimer({ subtopicId, startTime: Date.now() });
      setElapsedTime(0);
    }
  };


  const progressPercentage = useMemo(() => {
    if (subtopics.length === 0) return 0;
    const completedCount = subtopics.filter(m => m.isCompleted).length;
    return (completedCount / subtopics.length) * 100;
  }, [subtopics]);
  
  const flagPosition = `${progressPercentage}%`;
  
  const totalTimeSpent = useMemo(() => {
      return subtopics.reduce((acc, s) => acc + (s.timeSpentSeconds || 0), 0);
  }, [subtopics]);

  const adaptivePlan = useMemo(() => {
    if (!goal?.dueDate) return null;
    
    const remainingSubtopics = subtopics.filter(s => !s.isCompleted).length;
    if (remainingSubtopics === 0) return null;

    const daysRemaining = moment(goal.dueDate.toDate()).diff(moment(), 'days');
    
    if (daysRemaining < 1) {
        return `The deadline has passed! You still have ${remainingSubtopics} subtopics left.`;
    }

    const pace = Math.ceil(remainingSubtopics / daysRemaining);
    return `To finish by ${moment(goal.dueDate.toDate()).format('ll')}, you should aim to complete ~${pace} subtopic${pace > 1 ? 's' : ''} per day.`;

  }, [goal, subtopics]);


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
       {showConfetti && <Confetti width={width} height={height} recycle={false} />}
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
      
       {adaptivePlan && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 flex items-center gap-4">
                <Lightbulb className="h-6 w-6 text-blue-500" />
                <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">{adaptivePlan}</p>
            </CardContent>
        </Card>
      )}

       <Tabs defaultValue="plan" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="plan"><BookOpen className="mr-2 h-4 w-4" /> Study Plan</TabsTrigger>
          <TabsTrigger value="overview"><BarChart3 className="mr-2 h-4 w-4" /> Progress Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="flex-1 mt-4">
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
                                                        activeTimer={activeTimer}
                                                        onToggleTimer={handleToggleTimer}
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
        </TabsContent>
         <TabsContent value="overview" className="flex-1 mt-4">
           <div className="grid md:grid-cols-2 gap-6">
                <Card className="md:col-span-2">
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
                            <span>Total Time Studied</span>
                            <span className="text-2xl font-mono font-bold">{formatTime(totalTimeSpent)}</span>
                        </CardTitle>
                        <CardDescription>Aggregate study time for this goal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground italic text-sm">
                            {activeTimer ? `Timer running for subtopic... ${formatTime(Math.floor(elapsedTime / 1000))}` : "Start a timer on a subtopic to track your time."}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>


       <AddStudyGoalDialog goal={goal} open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen} />
       <AddStudyChapterDialog goalId={goalId} open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen} chaptersCount={chapters.length}/>
    </div>
  );
}
