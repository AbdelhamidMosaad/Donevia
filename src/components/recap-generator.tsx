
'use client';

import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import type { Task, RecapRequest, RecapResponse } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Share2, Sparkles } from 'lucide-react';
import moment from 'moment';

interface RecapGeneratorProps {
    allTasks: Task[];
}

export function RecapGenerator({ allTasks }: RecapGeneratorProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
    const [recap, setRecap] = useState<RecapResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const tasksForPeriod = useMemo(() => {
        const now = moment();
        return allTasks.filter(task => {
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
    
    const handleShare = () => {
        if (!recap || !navigator.share) {
            toast({ variant: 'destructive', title: 'Sharing not supported on this browser.' });
            return;
        }

        const shareText = `My ${period} recap:\n\n*${recap.title}*\n\n${recap.summary}\n\nHighlights:\n${recap.highlights.map(h => `- ${h}`).join('\n')}`;

        navigator.share({
            title: `My ${period} recap`,
            text: shareText,
        }).catch(error => console.error('Error sharing', error));
    }

    return (
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
                 {tasksForPeriod.length === 0 && (
                    <p className="text-sm text-muted-foreground">No tasks found for the selected period.</p>
                 )}
            </CardContent>

            {recap && (
                <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
                    <div className="prose dark:prose-invert max-w-none">
                        <h3>{recap.title}</h3>
                        <p>{recap.summary}</p>
                        <h4>Highlights:</h4>
                        <ul>
                            {recap.highlights.map((highlight, index) => (
                                <li key={index}>{highlight}</li>
                            ))}
                        </ul>
                    </div>
                     <Button variant="outline" onClick={handleShare} disabled={!navigator.share}>
                        <Share2 className="mr-2 h-4 w-4" /> Share Recap
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
