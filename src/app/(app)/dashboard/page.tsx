
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Task, Stage } from '@/lib/types';
import { Home, BarChart3, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { RecapGenerator } from '@/components/recap-generator';
import { ToolCard } from '@/components/home/tool-card';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const allTools = [
    { id: 'planner', href: '/planner', icon: 'CalendarDays', title: 'Planner', description: 'Organize your time, events, and tasks.', color: 'text-green-500' },
    { id: 'tasks', href: '/dashboard/lists', icon: 'Kanban', title: 'Task Management', description: 'Manage projects with boards, lists, and calendars.', color: 'text-purple-500' },
    { id: 'crm', href: '/crm', icon: 'Briefcase', title: 'CRM', description: 'Manage clients, sales pipeline, and invoices.', color: 'text-amber-500' },
    { id: 'habits', href: '/habits', icon: 'Repeat', title: 'Habit Tracker', description: 'Build consistency and track your daily habits.', color: 'text-teal-500' },
    { id: 'goals', href: '/goals', icon: 'Target', title: 'Goal Tracker', description: 'Define, track, and achieve your ambitions.', color: 'text-red-500' },
    { id: 'study-tracker', href: '/study-tracker', icon: 'GraduationCap', title: 'Study Tracker', description: 'Plan and gamify your learning sessions.', color: 'text-lime-500' },
    { id: 'flashcards', href: '/flashcards', icon: 'Layers', title: 'Flashcards', description: 'Master any subject with smart flashcards.', color: 'text-indigo-500' },
    { id: 'meeting-notes', href: '/meeting-notes', icon: 'ClipboardSignature', title: 'Meeting Notes', description: 'Capture and organize meeting minutes.', color: 'text-cyan-500' },
    { id: 'notes', href: '/notes', icon: 'FileText', title: 'Sticky Notes', description: 'A flexible space for quick thoughts & reminders.', color: 'text-orange-500' },
    { id: 'bookmarks', href: '/bookmarks', icon: 'Bookmark', title: 'Bookmarks', description: 'Save and organize your favorite websites.', color: 'text-blue-500' },
    { id: 'trading-tracker', href: '/trading-tracker', icon: 'TrendingUp', title: 'Trading Tracker', description: 'Record and analyze your trading performance.', color: 'text-emerald-500' },
    { id: 'work-tracker', href: '/work-tracker', icon: 'Briefcase', title: 'Work Tracker', description: 'Log your daily work activities and tasks.', color: 'text-amber-500' },
    { id: 'english-coach', href: '/english-coach', icon: 'Languages', title: 'English Coach', description: 'Improve your English with AI-powered tools.', color: 'text-red-500' },
    { id: 'brainstorming', href: '/brainstorming', icon: 'BrainCircuit', title: 'Brainstorming', description: 'Capture ideas on a structured canvas.', color: 'text-violet-500' },
    { id: 'whiteboard', href: '/whiteboard', icon: 'PenSquare', title: 'Whiteboard', description: 'A free-form digital canvas for your ideas.', color: 'text-indigo-500' },
    { id: 'mind-map', href: '/mind-map', icon: 'GitBranch', title: 'Mind Map', description: 'Visually organize your thoughts & plans.', color: 'text-pink-500' },
    { id: 'docs', href: '/docs', icon: 'FileSignature', title: 'Docs', description: 'A powerful, feature-rich document editor.', color: 'text-cyan-500' },
    { id: 'learning-tool', href: '/learning-tool', icon: 'GraduationCap', title: 'Learning Assistant', description: 'Generate study materials with AI.', color: 'text-lime-500' },
    { id: 'pomodoro', href: '/pomodoro', icon: 'Timer', title: 'Pomodoro', description: 'Improve focus with a time management tool.', color: 'text-rose-500' },
];

export default function HomePage() {
  const { user, loading, settings } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [orderedTools, setOrderedTools] = useState(allTools);

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
      const taskQuery = query(collection(db, 'users', user.uid, 'tasks'), where('deleted', '!=', true));
      const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
        if(dataLoading) setDataLoading(false);
      });

      const listsQuery = query(collection(db, 'users', user.uid, 'taskLists'));
      const unsubscribeLists = onSnapshot(listsQuery, (snapshot) => {
        const allStages: Stage[] = [];
        snapshot.docs.forEach(doc => {
            if (doc.data().stages) {
                allStages.push(...doc.data().stages);
            }
        });
        const uniqueStages = allStages.filter((stage, index, self) =>
            index === self.findIndex((s) => (s.id === stage.id && s.name === stage.name))
        );
        setStages(uniqueStages);
      });

      return () => {
        unsubscribeTasks();
        unsubscribeLists();
      };
    }
  }, [user]);
  
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
        <div className="flex items-center gap-4">
            <Home className="h-8 w-8 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Home</h1>
                <p className="text-muted-foreground">{welcomeMessage}</p>
            </div>
        </div>
        
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="overview"><Home className="mr-2 h-4 w-4"/> Overview</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/> Analytics</TabsTrigger>
                <TabsTrigger value="recap"><Sparkles className="mr-2 h-4 w-4"/> AI Recap</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="flex-1 mt-4">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="tools">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                            >
                                {orderedTools.map((tool, index) => (
                                    <Draggable key={tool.id} draggableId={tool.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <ToolCard {...tool} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </TabsContent>
            <TabsContent value="analytics" className="flex-1 mt-4">
                <AnalyticsDashboard tasks={tasks} stages={stages} />
            </TabsContent>
            <TabsContent value="recap" className="flex-1 mt-4">
                <RecapGenerator allTasks={tasks} recapDisplay={(props) => <div>Recap Display</div>} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
