'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { buildAnswer } from '@/ai/flows/answer-builder-flow';
import type { AnswerBuilderResponse } from '@/lib/types/answer-builder';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  question: z.string().min(10, "Please enter the interview question."),
  situation: z.string().min(10, "Please describe the situation."),
  task: z.string().min(10, "Please describe the task."),
  action: z.string().min(10, "Please describe the action you took."),
  result: z.string().min(10, "Please describe the result."),
});

type AnswerBuilderFormValues = z.infer<typeof formSchema>;

export function AnswerBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AnswerBuilderResponse | null>(null);

  const form = useForm<AnswerBuilderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      situation: "",
      task: "",
      action: "",
      result: "",
    },
  });

  const handleBuildAnswer = async (values: AnswerBuilderFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const generatedResponse = await buildAnswer(values);
      setResponse(generatedResponse);
    } catch (error) {
      console.error("Failed to build answer:", error);
      toast({ variant: 'destructive', title: 'Failed to build answer.', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderResponse = () => {
    if (isLoading) {
       return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold font-headline">Building Your Answer...</h3>
                <p className="text-muted-foreground">The AI is crafting your response.</p>
            </div>
        );
    }

    if (!response) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <p className="text-muted-foreground">Your generated answer and feedback will appear here.</p>
            </div>
        );
    }

    return (
      <ScrollArea className="h-full">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wand2 /> Polished Answer</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{response.builtAnswer}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                        {response.feedback.map((fb, index) => (
                            <li key={index}>{fb}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </ScrollArea>
    )
  }

  return (
     <div className="grid md:grid-cols-2 gap-6 h-full min-h-0">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>STAR Method Answer Builder</CardTitle>
          <CardDescription>
            Deconstruct your experience into the STAR framework. The AI will then synthesize it into a powerful, cohesive story.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBuildAnswer)} className="flex-1 flex flex-col min-h-0">
            <CardContent className="flex-1 overflow-y-auto pr-3 space-y-4">
               <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>The Question You're Answering</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Tell me about a time you had to handle a difficult project." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="situation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situation</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the context and background." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="task"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What was your specific goal or responsibility?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What specific steps did you take?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="result"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Result</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What was the outcome? Quantify if possible." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                {isLoading ? 'Building...' : 'Build My Answer'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
       <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>AI-Generated Result</CardTitle>
                <CardDescription>Your polished answer and constructive feedback.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {renderResponse()}
            </CardContent>
        </Card>
    </div>
  );
}
