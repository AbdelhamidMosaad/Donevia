
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  sourceText: z.string().min(50, 'Source text must be at least 50 characters long.'),
  noteStyle: z.enum(['detailed', 'bullet', 'outline', 'summary', 'concise']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

export type InputFormValues = z.infer<typeof formSchema>;

interface InputFormProps {
  onGenerate: (values: InputFormValues) => void;
  isLoading?: boolean;
}

export function InputForm({ onGenerate, isLoading }: InputFormProps) {
  const form = useForm<InputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceText: "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI applications include advanced web search engines (e.g., Google), recommendation systems (used by YouTube, Amazon and Netflix), understanding human speech (such as Siri and Alexa), self-driving cars (e.g., Tesla), automated decision-making and competing at the highest level in strategic game systems (such as chess and Go).",
      noteStyle: 'detailed',
      complexity: 'medium',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGenerate)} className="h-full">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Source Material</CardTitle>
            <CardDescription>Paste the text you want to convert into lecture notes.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            <FormField
              control={form.control}
              name="sourceText"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col">
                  <FormLabel>Text Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste your document, article, or notes here..." className="flex-1 resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
             </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Generating...' : 'Generate Notes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
