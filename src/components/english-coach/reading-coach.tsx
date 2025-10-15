
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { generateReadingExercise } from '@/ai/flows/reading-comprehension-flow';
import type { ReadingComprehensionExercise } from '@/lib/types/reading-comprehension';

interface ReadingCoachProps {
    result: ReadingComprehensionExercise | null;
    setResult: (result: ReadingComprehensionExercise | null) => void;
}

const topics = ['Daily Life', 'Business', 'Travel', 'Culture', 'Technology', 'Health'];

export function ReadingCoach({ result, setResult }: ReadingCoachProps) {
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [topic, setTopic] = useState('Daily Life');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await generateReadingExercise({ level, topic });
      setResult(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setResult(null);
  };
  
  const renderResults = () => {
    if (!result) return null;

    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Your Custom Exercise</CardTitle>
          <CardDescription>Read the passage and complete the exercises below.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4 -mr-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{result.passageTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-relaxed">{result.readingPassage}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Key Vocabulary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {result.vocabulary.map(v => (
                    <div key={v.word}>
                      <p><strong>{v.word}</strong> ({v.pronunciation}): {v.definition}</p>
                      <p className="text-sm text-muted-foreground italic">e.g., "{v.example}"</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
               <Card>
                <CardHeader><CardTitle>Comprehension Questions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {result.comprehensionQuestions.map((q, i) => (
                        <div key={i}>
                            <p className="font-semibold">{i + 1}. {q.question}</p>
                            {q.type === 'multiple-choice' && (
                                <ul className="list-disc pl-5 mt-1">
                                    {q.options?.map((opt, j) => <li key={j}>{opt}</li>)}
                                </ul>
                            )}
                            <p className="text-sm text-primary mt-1">Correct Answer: {q.answer}</p>
                        </div>
                    ))}
                </CardContent>
              </Card>
               <Card>
                <CardHeader><CardTitle>Summary Exercise</CardTitle></CardHeader>
                <CardContent>
                  <p className="font-semibold">{result.summaryExercise.prompt}</p>
                  <p className="text-sm text-muted-foreground mt-1">Example Answer: "{result.summaryExercise.exampleAnswer}"</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader><CardTitle>Follow-up Practice</CardTitle></CardHeader>
                <CardContent>
                  <p>{result.followUpPractice.prompt}</p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
            <Button onClick={handleReset}>Start New Exercise</Button>
        </CardFooter>
      </Card>
    );
  }

  const renderInitialState = () => (
     <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Reading Exercise Setup</CardTitle>
          <CardDescription>Choose your level and topic to start practicing.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
             <div className="max-w-xs mx-auto space-y-4 w-full">
                 <div className="space-y-1 text-left">
                    <Label htmlFor="level-select">Select Your Level</Label>
                    <Select value={level} onValueChange={(v: any) => setLevel(v)}>
                        <SelectTrigger id="level-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1 text-left">
                    <Label htmlFor="topic-select">Select a Topic</Label>
                    <Select value={topic} onValueChange={(v: any) => setTopic(v)}>
                        <SelectTrigger id="topic-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                    <Sparkles />
                    {isLoading ? 'Generating...' : 'Generate Exercise'}
                </Button>
            </div>
        </CardContent>
      </Card>
  );

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            <span>AI is preparing your reading exercise...</span>
        </div>
    );
  }

  return (
    <div className="h-full min-h-0">
        {result ? renderResults() : renderInitialState()}
    </div>
  );
}
