
'use client';

import { useState, useMemo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import type { Task, RecapRequest, RecapResponse } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import moment from 'moment';

interface RecapGeneratorProps {
    allTasks: Task[];
    recapDisplay: (props: { recap: RecapResponse, period: 'daily' | 'weekly' }) => ReactNode;
}

export function RecapGenerator({ allTasks, recapDisplay: RecapDisplay }: RecapGeneratorProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
    const [recap, setRecap] = useState<RecapResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const tasksForPeriod = useMemo(() => {
        const now = moment();
        return allTasks.filter(task => {
            if (!task.createdAt) return false; // Add this guard clause
            const taskDate = moment(task.createdAt.toDate());
            if (period === 'daily') {
                return taskDate.isSame(now, 'day');
            } else { // weekly
                return taskDate.isSame(now, 'week');
            }
        });
    }, [allTasks, period]);
    
    const handleGenerateRecap = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            return;
        }

        setIsLoading(true);
        setRecap(null);
        
        try {
            const requestPayload: RecapRequest = {
                tasks: tasksForPeriod,
                period,
            };

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

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Progress Recap</CardTitle>
                    <CardDescription>Select a period and generate an AI summary of your progress.</CardDescription>
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
                         <Button onClick={handleGenerateRecap} disabled={isLoading || tasksForPeriod.length === 0}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Generating...' : 'Generate Recap'}
                         </Button>
                    </div>
                     {tasksForPeriod.length === 0 && !isLoading && (
                        <p className="text-sm text-muted-foreground">No tasks found for the selected period.</p>
                     )}
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
