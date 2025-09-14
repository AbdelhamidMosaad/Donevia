
'use client';

import { useState, useMemo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import type { Task, Goal, Milestone, RecapRequest, RecapResponse, StudyGoal, StudyChapter, StudySubtopic, StudySession } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from './hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import moment from 'moment';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react';

interface RecapGeneratorProps {
    allTasks: Task[];
    allGoals: Goal[];
    allMilestones: Milestone[];
    allStudyGoals: StudyGoal[];
    allStudyChapters: StudyChapter[];
    allStudySubtopics: StudySubtopic[];
    allStudySessions: StudySession[];
    recapDisplay: (props: { recap: RecapResponse, period: 'daily' | 'weekly' }) => ReactNode;
}

type RecapType = 'tasks_goals' | 'study';

export function RecapGenerator({ 
    allTasks, 
    allGoals, 
    allMilestones,
    allStudyGoals,
    allStudyChapters,
    allStudySubtopics,
    allStudySessions,
    recapDisplay: RecapDisplay 
}: RecapGeneratorProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
    const [recap, setRecap] = useState<RecapResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const dataForPeriod = useMemo(() => {
        const now = moment();
        const filterByPeriod = (item: { createdAt?: any, date?: any }) => {
            const itemDate = moment(item.createdAt?.toDate() || item.date?.toDate());
            if (!itemDate.isValid()) return false;
            if (period === 'daily') return itemDate.isSame(now, 'day');
            return itemDate.isSame(now, 'week');
        };

        const tasks = allTasks.filter(filterByPeriod);
        const goalsWithMilestones = allGoals.map(goal => ({
            ...goal,
            milestones: allMilestones.filter(m => m.goalId === goal.id)
        }));
        
        const studySessions = allStudySessions.filter(filterByPeriod);

        return { 
            tasks, 
            goals: goalsWithMilestones,
            studyData: {
                studyGoals: allStudyGoals,
                studyChapters: allStudyChapters,
                studySubtopics: allStudySubtopics,
                studySessions,
            }
        };
    }, [allTasks, allGoals, allMilestones, allStudyGoals, allStudyChapters, allStudySubtopics, allStudySessions, period]);
    
    const handleGenerateRecap = async (type: RecapType) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            return;
        }

        setIsLoading(true);
        setRecap(null);
        
        let requestPayload: Partial<RecapRequest> = { period };
        
        if (type === 'tasks_goals') {
            requestPayload.tasks = dataForPeriod.tasks;
            requestPayload.goals = dataForPeriod.goals;
        } else if (type === 'study') {
            requestPayload.studyData = dataForPeriod.studyData;
        }

        try {
            const response = await fetch('/api/recap/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${await user.getIdToken()}`,
                },
                body: JSON.stringify(requestPayload),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate recap.');
            }

            const result: RecapResponse = await response.json();
            setRecap(result);
            
        } catch (error) {
            console.error("Recap generation failed:", error);
            toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const hasTaskData = dataForPeriod.tasks.length > 0 || dataForPeriod.goals.length > 0;
    const hasStudyData = dataForPeriod.studyData.studySessions.length > 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Progress Recap</CardTitle>
                    <CardDescription>Select a period and a tool to generate an AI summary of your progress.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <ToggleGroup 
                            type="single"
                            value={period}
                            onValueChange={(value: 'daily' | 'weekly') => value && setPeriod(value)}
                            aria-label="Recap period"
                        >
                            <ToggleGroupItem value="daily" aria-label="Daily recap">
                                Daily
                            </ToggleGroupItem>
                            <ToggleGroupItem value="weekly" aria-label="Weekly recap">
                                Weekly
                            </ToggleGroupItem>
                        </ToggleGroup>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'Generating...' : 'Generate Recap'}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                             <DropdownMenuContent>
                                <DropdownMenuItem 
                                    onSelect={() => handleGenerateRecap('tasks_goals')}
                                    disabled={!hasTaskData}
                                >
                                    For Tasks & Goals
                                </DropdownMenuItem>
                                 <DropdownMenuItem 
                                    onSelect={() => handleGenerateRecap('study')}
                                    disabled={!hasStudyData}
                                >
                                    For Study Tracker
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                         </DropdownMenu>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Generating Your Recap...</h3>
                    <p className="text-muted-foreground">The AI is analyzing your progress. This may take a moment.</p>
                </div>
            )}

            {recap && !isLoading && <RecapDisplay recap={recap} period={period} />}
        </div>
    );
}
