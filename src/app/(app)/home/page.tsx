
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, Stage } from '@/lib/types';
import { Home, BarChart3, GripVertical, Plus, Minus, GripHorizontal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlannerIcon } from '@/components/icons/tools/planner-icon';
import { TasksIcon } from '@/components/icons/tools/tasks-icon';
import { CrmIcon } from '@/components/icons/tools/crm-icon';
import { HabitsIcon } from '@/components/icons/tools/habits-icon';
import { GoalsIcon } from '@/components/icons/tools/goals-icon';
import { StudyTrackerIcon } from '@/components/icons/tools/study-tracker-icon';
import { FlashcardsIcon } from '@/components/icons/tools/flashcards-icon';
import { MeetingNotesIcon } from '@/components/icons/tools/meeting-notes-icon';
import { StickyNotesIcon } from '@/components/icons/tools/sticky-notes-icon';
import { BookmarksIcon } from '@/components/icons/tools/bookmarks-icon';
import { TradingTrackerIcon } from '@/components/icons/tools/trading-tracker-icon';
import { WorkTrackerIcon } from '@/components/icons/tools/work-tracker-icon';
import { EnglishCoachIcon } from '@/components/icons/tools/english-coach-icon';
import { DocsIcon } from '@/components/icons/tools/docs-icon';
import { LearningAssistantIcon } from '@/components/icons/tools/learning-assistant-icon';
import { PomodoroIcon } from '@/components/icons/tools/pomodoro-icon';
import { InterviewPrepIcon } from '@/components/icons/tools/interview-prep-icon';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { JournalIcon } from '@/components/icons/tools/journal-icon';
import { BeCreativeIcon } from '@/components/icons/tools/be-creative-icon';

const toolIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
    planner: PlannerIcon,
    tasks: TasksIcon,
    crm: CrmIcon,
    habits: HabitsIcon,
    goals: GoalsIcon,
    'study-tracker': StudyTrackerIcon,
    flashcards: FlashcardsIcon,
    'meeting-notes': MeetingNotesIcon,
    notes: StickyNotesIcon,
    bookmarks: BookmarksIcon,
    'trading-tracker': TradingTrackerIcon,
    'work-tracker': WorkTrackerIcon,
    'english-coach': EnglishCoachIcon,
    'interview-prep': InterviewPrepIcon,
    'be-creative': BeCreativeIcon,
    docs: DocsIcon,
    'learning-tool': LearningAssistantIcon,
    pomodoro: PomodoroIcon,
    journal: JournalIcon,
};

const allTools = [
    { id: 'planner', href: '/planner', title: 'Planner', description: 'Organize your time, events, and tasks.' },
    { id: 'tasks', href: '/dashboard/lists', title: 'Task Management', description: 'Manage projects with boards, lists, and calendars.' },
    { id: 'crm', href: '/crm', title: 'CRM', description: 'Manage clients, sales pipeline, and invoices.' },
    { id: 'habits', href: '/habits', title: 'Habit Tracker', description: 'Build consistency and track your daily habits.' },
    { id: 'goals', href: '/goals', title: 'Goal Tracker', description: 'Define, track, and achieve your ambitions.' },
    { id: 'study-tracker', href: '/study-tracker', title: 'Study Tracker', description: 'Plan and gamify your learning sessions.' },
    { id: 'flashcards', href: '/flashcards', title: 'Flashcards', description: 'Master any subject with smart flashcards.' },
    { id: 'meeting-notes', href: '/meeting-notes', title: 'Meeting Notes', description: 'Capture and organize meeting minutes.' },
    { id: 'notes', href: '/notes', title: 'Sticky Notes', description: 'A flexible space for quick thoughts & reminders.' },
    { id: 'bookmarks', href: '/bookmarks', title: 'Bookmarks', description: 'Save and organize your favorite websites.' },
    { id: 'trading-tracker', href: '/trading-tracker', title: 'Trading Tracker', description: 'Record and analyze your trading performance.' },
    { id: 'work-tracker', href: '/work-tracker', title: 'Work Tracker', description: 'Log your daily work activities and tasks.' },
    { id: 'english-coach', href: '/english-coach', title: 'English Coach', description: 'Improve your English with AI-powered tools.' },
    { id: 'interview-prep', href: '/interview-prep', title: 'Interview Prep', description: 'Practice for your next job interview.' },
    { id: 'be-creative', href: '/be-creative', title: 'Be Creative', description: 'A suite of tools for brainstorming and creativity.' },
    { id: 'docs', href: '/docs', title: 'Docs', description: 'A powerful, feature-rich document editor.' },
    { id: 'learning-tool', href: '/learning-tool', title: 'Learning Assistant', description: 'Generate study materials with AI.' },
    { id: 'pomodoro', href: '/pomodoro', title: 'Pomodoro', description: 'Improve focus with a time management tool.' },
    { id: 'journal', href: '/journal', title: 'Journal', description: 'Reflect and get insights with an AI-powered journal.' },
];

type CardSize = 'small' | 'medium' | 'large';

export default function HomePage() {
  const { user, loading, settings } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [orderedTools, setOrderedTools] = useState(allTools);
  const [cardSize, setCardSize] = useState<CardSize>(settings.homeCardSize || 'large');

  useEffect(() => {
    if (settings.toolOrder) {
      const savedOrder = settings.toolOrder;
      const newTools = [...allTools].sort((a, b) => {
        const aIndex = savedOrder.indexOf(a.id);
        const bIndex = savedOrder.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      setOrderedTools(newTools);
    }
  }, [settings.toolOrder]);

  useEffect(() => {
    if (user) {
      setDataLoading(true);
      
      const collectionsToFetch = [
        { name: 'tasks', setter: setTasks, queryConstraints: [where('deleted', '!=', true)] },
        { name: 'taskLists', setter: setStages, transform: (docs: any[]) => {
            const allStages: Stage[] = [];
            docs.forEach(doc => { if (doc.stages) allStages.push(...doc.stages) });
            return allStages.filter((stage, index, self) => index === self.findIndex(s => s.id === stage.id && s.name === stage.name));
        }},
      ];

      const unsubscribes = collectionsToFetch.map(({ name, setter, queryConstraints = [], transform }) => {
        const collRef = collection(db, 'users', user.uid, name);
        const q = query(collRef, ...queryConstraints);
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setter(transform ? transform(data) : data);
        });
      });

      setDataLoading(false);

      return () => unsubscribes.forEach(unsub => unsub());
    }
  }, [user]);
  
  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize && user) {
        setCardSize(newSize);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { homeCardSize: newSize }, { merge: true });
    }
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !user) {
      return;
    }

    const items = Array.from(orderedTools);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedTools(items);

    const newOrder = items.map(item => item.id);
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    await setDoc(settingsRef, { toolOrder: newOrder }, { merge: true });
  };

  if (loading || !user || dataLoading) {
    return <div>Loading home...</div>;
  }
  
  const welcomeMessage = `Welcome back, ${user.displayName?.split(' ')[0] || 'User'}!`;

  return (
    <div className="flex flex-col h-full gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Home className="h-8 w-8 text-primary"/>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Home</h1>
                    <p className="text-muted-foreground">{welcomeMessage}</p>
                </div>
            </div>
            <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                <ToggleGroupItem value="small" aria-label="Small cards"><GripHorizontal/></ToggleGroupItem>
                <ToggleGroupItem value="medium" aria-label="Medium cards"><Minus/></ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
            </ToggleGroup>
        </div>
        
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="overview"><Home className="mr-2 h-4 w-4"/> Overview</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/> Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="flex-1 mt-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="tools">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={cn(
                                    "grid gap-6",
                                    cardSize === 'large' && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                                    cardSize === 'medium' && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
                                    cardSize === 'small' && "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
                                )}
                            >
                                {orderedTools.map((tool, index) => {
                                   const Icon = toolIcons[tool.id];
                                   return (
                                    <Draggable key={tool.id} draggableId={tool.id} index={index}>
                                        {(provided) => (
                                           <div ref={provided.innerRef} {...provided.draggableProps}>
                                             <Link href={tool.href} className="group block h-full">
                                                <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                                                    <div {...provided.dragHandleProps} className="absolute top-2 right-2 z-10 p-1 opacity-20 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="p-6 flex flex-col items-center text-center">
                                                        {Icon && <Icon className={cn(
                                                            "mb-4",
                                                            cardSize === 'large' && "h-24 w-24",
                                                            cardSize === 'medium' && "h-16 w-16",
                                                            cardSize === 'small' && "h-12 w-12",
                                                        )} />}
                                                        <h3 className={cn(
                                                            "font-bold font-headline text-foreground",
                                                            cardSize === 'large' && "text-lg",
                                                            cardSize === 'medium' && "text-sm",
                                                            cardSize === 'small' && "text-xs",
                                                        )}>{tool.title}</h3>
                                                        {cardSize === 'large' && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>}
                                                    </div>
                                                </Card>
                                             </Link>
                                           </div>
                                        )}
                                    </Draggable>
                                   )
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </TabsContent>
            <TabsContent value="analytics" className="flex-1 mt-4">
                <AnalyticsDashboard tasks={tasks} stages={stages} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
