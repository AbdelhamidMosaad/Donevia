
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  sourceText: z.string().min(50, 'Source text must be at least 50 characters long.'),
  numQuestions: z.number().int().min(1).max(20),
  questionTypes: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one item.",
  }),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  noteStyle: z.enum(['detailed', 'bullet', 'outline', 'summary']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

export type InputFormValues = z.infer<typeof formSchema>;

interface InputFormProps {
  onGenerate: (values: InputFormValues) => void;
  isLoading?: boolean;
  showQuizOptions?: boolean;
  showNoteOptions?: boolean;
}

const questionTypes = [
    { id: 'multiple-choice', label: 'Multiple Choice' },
    { id: 'true-false', label: 'True/False' },
    { id: 'short-answer', label: 'Short Answer' },
];

export function InputForm({ onGenerate, isLoading, showQuizOptions, showNoteOptions }: InputFormProps) {
  const form = useForm<InputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceText: "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI applications include advanced web search engines (e.g., Google), recommendation systems (used by YouTube, Amazon and Netflix), understanding human speech (such as Siri and Alexa), self-driving cars (e.g., Tesla), automated decision-making and competing at the highest level in strategic game systems (such as chess and Go).",
      numQuestions: 5,
      questionTypes: ['multiple-choice'],
      difficulty: 'medium',
      noteStyle: 'detailed',
      complexity: 'medium',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGenerate)}>
        <Card>
          <CardHeader>
            <CardTitle>Source Material</CardTitle>
            <CardDescription>Paste the text you want to use for generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="sourceText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste your document, article, or notes here..." className="min-h-[200px] resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showQuizOptions && (
              <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="numQuestions"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Number of Questions</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="questionTypes"
                    render={() => (
                        <FormItem className="md:col-span-2">
                         <FormLabel>Question Types</FormLabel>
                          {questionTypes.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="questionTypes"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                          <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
            )}
            {showNoteOptions && (
                 <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="noteStyle"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Note Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                <SelectItem value="detailed">Detailed Notes</SelectItem>
                                <SelectItem value="bullet">Bullet Points</SelectItem>
                                <SelectItem value="outline">Outline Format</SelectItem>
                                <SelectItem value="summary">Summary</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="complexity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Complexity Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                <SelectItem value="simple">Simple</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
