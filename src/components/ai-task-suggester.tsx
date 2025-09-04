
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getContextualTaskSuggestions } from '@/ai/flows/contextual-task-suggestions';
import type { ContextualTaskSuggestionsOutput } from '@/ai/flows/contextual-task-suggestions';
import { BotMessageSquare, Sparkles, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AddTaskDialog } from './add-task-dialog';

interface AiTaskSuggesterProps {
  currentTasks: { id: string; title: string }[];
  userGoal: string;
}

export function AiTaskSuggester({ currentTasks, userGoal }: AiTaskSuggesterProps) {
  const [suggestions, setSuggestions] = useState<ContextualTaskSuggestionsOutput['suggestedTasks']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await getContextualTaskSuggestions({
        currentTasks: currentTasks.map(task => task.title).join(', '),
        userGoal,
      });
      setSuggestions(result.suggestedTasks);
    } catch (e) {
      console.error(e);
      setError('Failed to get suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={handleGetSuggestions}>
          <Sparkles className="mr-2 h-4 w-4" />
          Get AI Suggestions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <BotMessageSquare className="text-primary" />
            AI Task Suggestions
          </DialogTitle>
          <DialogDescription>
            Here are some tasks suggested by our AI based on your current goal and workload.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isLoading && !error && suggestions.length > 0 && (
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50">
                  <span className="text-sm">{suggestion}</span>
                  <AddTaskDialog defaultTitle={suggestion}>
                    <Button variant="ghost" size="icon">
                      <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                      <span className="sr-only">Add task</span>
                    </Button>
                  </AddTaskDialog>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && !error && suggestions.length === 0 && (
             <p className="text-sm text-center text-muted-foreground">No suggestions available right now. Try again!</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleGetSuggestions} disabled={isLoading}>
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
