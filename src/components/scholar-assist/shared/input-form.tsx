
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const notesSchema = z.object({
  noteStyle: z.enum(['detailed', 'bullet', 'outline', 'summary', 'concise']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

const quizSchema = z.object({
    numQuestions: z.coerce.number().min(1).max(100),
    questionTypes: z.array(z.string()).refine(value => value.some(item => item), {
        message: "You have to select at least one item.",
    }),
    difficulty: z.enum(['easy', 'medium', 'hard']),
});

const flashcardsSchema = z.object({
    numCards: z.coerce.number().min(1).max(30),
    cardStyle: z.enum(['basic', 'detailed', 'question']),
});

const formSchema = z.object({
  sourceText: z.string().min(50, 'Source text must be at least 50 characters long.'),
}).extend(notesSchema.partial().shape).extend(quizSchema.partial().shape).extend(flashcardsSchema.partial().shape);


export type InputFormValues = z.infer<typeof formSchema>;

interface InputFormProps {
  onGenerate: (values: InputFormValues) => void;
  isLoading?: boolean;
  generationType: 'notes' | 'quiz' | 'flashcards';
}

const questionTypeItems = [
    { id: 'multiple-choice', label: 'Multiple Choice'},
    { id: 'true-false', label: 'True/False'},
    { id: 'short-answer', label: 'Short Answer'},
]

export function InputForm({ onGenerate, isLoading, generationType }: InputFormProps) {
  const form = useForm<InputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceText: "",
      // Notes defaults
      noteStyle: 'detailed',
      complexity: 'medium',
      // Quiz defaults
      numQuestions: 5,
      questionTypes: ['multiple-choice'],
      difficulty: 'medium',
      // Flashcard defaults
      numCards: 10,
      cardStyle: 'basic',
    },
  });
  
  const getButtonText = () => {
    switch (generationType) {
        case 'notes': return 'Generate Notes';
        case 'quiz': return 'Generate Quiz';
        case 'flashcards': return 'Generate Flashcards';
        default: return 'Generate';
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGenerate)} className="h-full">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Source Material</CardTitle>
            <CardDescription>Paste the text you want to convert into study material.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            <FormField
              control={form.control}
              name="sourceText"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel>Text Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste your document, article, or notes here..." className="flex-1 resize-y text-foreground" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid md:grid-cols-2 gap-6">
                {generationType === 'notes' && (
                    <>
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
                                    <SelectItem value="concise">Concise Notes</SelectItem>
                                    <SelectItem value="bullet">Bullet Points</SelectItem>
                                    <SelectItem value="outline">Outline Format</SelectItem>
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
                    </>
                )}
                {generationType === 'quiz' && (
                    <>
                        <FormField
                            control={form.control}
                            name="numQuestions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Questions</FormLabel>
                                    <FormControl><Input type="number" min="1" max="100" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="difficulty"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Difficulty Level</FormLabel>
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
                                <FormItem className="col-span-full">
                                <div className="mb-4">
                                    <FormLabel>Question Types</FormLabel>
                                    <FormDescription>Select one or more question types to include.</FormDescription>
                                </div>
                                {questionTypeItems.map((item) => (
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
                    </>
                )}
                {generationType === 'flashcards' && (
                    <>
                        <FormField
                            control={form.control}
                            name="numCards"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Flashcards</FormLabel>
                                    <FormControl><Input type="number" min="1" max="30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cardStyle"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Card Style</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="basic">Basic (Term / Definition)</SelectItem>
                                        <SelectItem value="detailed">Detailed (Concept / Explanation)</SelectItem>
                                        <SelectItem value="question">Question / Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
             </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2/> : <Wand2/>}
              {isLoading ? 'Generating...' : getButtonText()}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
