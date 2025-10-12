
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, collection, query, where, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StudyGoal, StudyChapter, StudyTopic } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, PlusCircle, Flag, Share2, Timer, Lightbulb, BookOpen, BarChart3, Kanban, List } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useStudyTimer } from '@/hooks/use-study-timer';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StudyChapterBoard } from '@/components/study-tracker/study-chapter-board';

type View = 'list' | 'board';


export default function StudyGoalDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const goalId = params.goalId as string;
  const { activeItem, toggleTimer } = useStudyTimer();

  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const prevCompletionState = useRef<Record<string, boolean>>({});
  const [view, setView] = useState<View>('list');


  useEffect(() => {
    // Initialize previous completion state
    const initialCompletionState: Record<string, boolean> = {};
     chapters.forEach(chapter => {
      const chapterTopics = topics.filter(s => s.chapterId === chapter.id);
      const isChapterComplete = chapterTopics.length > 0 && chapterTopics.every(s => s.isCompleted);
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
        const chapterTopics = topics.filter(s => s.chapterId === chapter.id);
        if (chapterTopics.length === 0) return;

        const isNowComplete = chapterTopics.every(s => s.isCompleted);
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
         const chapterTopics = topics.filter(s => s.chapterId === c.id);
         return chapterTopics.length > 0 && chapterTopics.every(s => s.isCompleted);
    });

    if (allChaptersComplete && !prevCompletionState.current['goal']) {
       toast({ title: 'Goal Achieved!', description: `Congratulations on completing "${goal?.title}"!`, duration: 10000 });
       setShowConfetti(true);
       setTimeout(() => setShowConfetti(false), 10000);
    }
    prevCompletionState.current['goal'] = allChaptersComplete;

  }, [topics, chapters, goal, loading, user, toast]);


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
      
      const topicsQuery = query(collection(db, 'users', user.uid, 'studyTopics'), where('goalId', '==', goalId));
      const unsubscribeTopics = onSnapshot(topicsQuery, (snapshot) => {
        setTopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyTopic)));
      });
      
      return () => {
        unsubscribeGoal();
        unsubscribeChapters();
        unsubscribeTopics();
      };
    }
  }, [user, goalId, router]);


  const handleToggleTimer = (itemId: string, itemTitle: string, itemType: 'topic' | 'chapter') => {
    toggleTimer(itemId, itemTitle, itemType);
  };


  const progressPercentage = useMemo(() => {
    if (topics.length === 0) return 0;
    const completedCount = topics.filter(m => m.isCompleted).length;
    return (completedCount / topics.length) * 100;
  }, [topics]);
  
  const flagPosition = `${progressPercentage}%`;
  
  const totalTimeSpent = useMemo(() => {
    return topics.reduce((acc, t) => acc + (t.timeSpentSeconds || 0), 0);
  }, [topics]);

  const adaptivePlan = useMemo(() => {
    if (!goal?.dueDate) return null;
    
    const remainingTopics = topics.filter(s => !s.isCompleted).length;
    if (remainingTopics === 0) return null;

    const daysRemaining = moment(goal.dueDate.toDate()).diff(moment(), 'days');
    
    if (daysRemaining < 1) {
        return `The deadline has passed! You still have ${remainingTopics} topics left.`;
    }

    const pace = Math.ceil(remainingTopics / daysRemaining);
    return `To finish by ${moment(goal.dueDate.toDate()).format('ll')}, you should aim to complete ~${pace} topic${pace > 1 ? 's' : ''} per day.`;

  }, [goal, topics]);


  const handleShareProgress = () => {
    if (!goal || topics.length === 0) return;
    const completedCount = topics.filter(s => s.isCompleted).length;
    const totalCount = topics.length;
    const percentage = Math.round(progressPercentage);

    let progressText = `My Study Progress for "${goal.title}":\n`;
    progressText += `✅ ${completedCount} of ${totalCount} topics completed (${percentage}%)\n\n`;
    
    chapters.forEach(chapter => {
        progressText += `Chapter: ${chapter.title}\n`;
        topics.filter(s => s.chapterId === chapter.id)
            .sort((a,b) => a.order - b.order)
            .forEach(topic => {
                progressText += `  [${topic.isCompleted ? 'x' : ' '}] ${topic.title}\n`;
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

    if (type === 'topic') {
        const sourceChapterId = source.droppableId;
        const destChapterId = destination.droppableId;
        
        const sourceTopics = topics.filter(s => s.chapterId === sourceChapterId).sort((a,b)=> a.order-b.order);
        const [movedTopic] = sourceTopics.splice(source.index, 1);
        
        const batch = writeBatch(db);
        
        // If moved within the same chapter
        if (sourceChapterId === destChapterId) {
            sourceTopics.splice(destination.index, 0, movedTopic);
            sourceTopics.forEach((topic, index) => {
                const topicRef = doc(db, 'users', user.uid, 'studyTopics', topic.id);
                batch.update(topicRef, { order: index });
            });
        } else {
            // Moved to a different chapter
            const destTopics = topics.filter(s => s.chapterId === destChapterId).sort((a,b)=> a.order-b.order);
            destTopics.splice(destination.index, 0, movedTopic);
            
            // Update order for source chapter
            sourceTopics.forEach((topic, index) => {
                const topicRef = doc(db, 'users', user.uid, 'studyTopics', topic.id);
                batch.update(topicRef, { order: index });
            });
            
            // Update moved item's chapterId and order, and update order for destination chapter
            const movedTopicRef = doc(db, 'users', user.uid, 'studyTopics', movedTopic.id);
            batch.update(movedTopicRef, { chapterId: destChapterId });
             destTopics.forEach((topic, index) => {
                const topicRef = doc(db, 'users', user.uid, 'studyTopics', topic.id);
                batch.update(topicRef, { order: index });
            });
        }
        
        await batch.commit();
        toast({ title: 'Topics reordered.' });
    }
  };
  
  const renderStudyPlanView = () => {
    if (view === 'board') {
      return <StudyChapterBoard chapters={chapters} topics={topics} onToggleTimer={handleToggleTimer} activeTimer={activeItem}/>;
    }
    
    // Default to 'list' view
    return (
       <Card className="flex flex-col flex-1 min-h-0 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Content Breakdown</CardTitle>
                <CardDescription>Organize your study material into chapters and topics.</CardDescription>
            </div>
            <Button onClick={() => setIsAddChapterOpen(true)}><PlusCircle /> Add Chapter</Button>
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
                                                    topics={topics.filter(s => s.chapterId === chapter.id)}
                                                    chaptersCount={chapters.length}
                                                    activeTimer={activeItem}
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
    );
  };


  if (loading || !user || !goal) {
    return <div className="flex items-center justify-center h-full"><p>Loading goal...</p></div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
       {showConfetti && <Confetti width={width} height={height} recycle={false} />}
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
            <Button variant="outline" size="icon" onClick={() => router.push('/study-tracker')}><ArrowLeft /></Button>
            <div>
                <h1 className="text-3xl font-bold font-headline">{goal.title}</h1>
                <p className="text-muted-foreground">{goal.description}</p>
            </div>
        </div>
        <div className='flex items-center gap-2'>
            <Button variant="outline" onClick={handleShareProgress}><Share2 /> Share Progress</Button>
            <Button variant="outline" onClick={() => setIsEditGoalOpen(true)}><Edit /> Edit Goal</Button>
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
        <TabsContent value="plan" className="flex-1 mt-4 flex flex-col min-h-0">
             <div className="flex justify-end items-center gap-2 mb-4">
                <ToggleGroup type="single" value={view} onValueChange={(v: View) => v && setView(v)}>
                    <ToggleGroupItem value="list"><List/></ToggleGroupItem>
                    <ToggleGroupItem value="board"><Kanban/></ToggleGroupItem>
                </ToggleGroup>
            </div>
            {renderStudyPlanView()}
        </TabsContent>
         <TabsContent value="overview" className="flex-1 mt-4">
           <div className="grid md:grid-cols-2 gap-6">
                <Card className="md:col-span-2 bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Progress Track</CardTitle>
                        <CardDescription>{topics.filter(s => s.isCompleted).length} of {topics.length} topics completed</CardDescription>
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
                <Card className="bg-card/60 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Total Time Studied</span>
                            <span className="text-2xl font-mono font-bold">{formatTime(totalTimeSpent)}</span>
                        </CardTitle>
                        <CardDescription>Aggregate study time for this goal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-center text-muted-foreground italic text-sm">
                            {activeItem ? `Timer running...` : "Start a timer on a topic to track your time."}
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

